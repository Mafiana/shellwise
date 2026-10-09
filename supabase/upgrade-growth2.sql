-- Shellwise: announcement snooze, private messages, coupon redeem, plan expiry, audit log, payment channel.
-- Run once in Supabase > SQL Editor AFTER upgrade-growth.sql. Safe to run again.

-- ===== 1. Announcements: how often a learner sees it again after closing it =====
-- snooze_hours: 0 = never show again once closed, 3 / 7 / 24 = show again after that many hours.
alter table public.announcements add column if not exists snooze_hours integer not null default 0 check (snooze_hours between 0 and 168);

-- ===== 2. Private messages from the admin to one learner =====
create table if not exists public.user_messages (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  subject text not null default '' check (char_length(subject) <= 80),
  body text not null check (char_length(body) between 1 and 1000),
  read boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists user_messages_user_idx on public.user_messages (user_id, created_at desc);
alter table public.user_messages enable row level security;
drop policy if exists "read own messages" on public.user_messages;
create policy "read own messages" on public.user_messages for select to authenticated using (user_id = auth.uid() or public.is_admin());
drop policy if exists "admin sends messages" on public.user_messages;
create policy "admin sends messages" on public.user_messages for insert to authenticated with check (public.is_admin());
drop policy if exists "admin deletes messages" on public.user_messages;
create policy "admin deletes messages" on public.user_messages for delete to authenticated using (public.is_admin());
-- A learner can only mark their own messages as read, nothing else.
revoke update on public.user_messages from anon, authenticated;
grant update (read) on public.user_messages to authenticated;
drop policy if exists "mark own read" on public.user_messages;
create policy "mark own read" on public.user_messages for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ===== 3. Payments: how the learner paid =====
alter table public.payments add column if not exists channel text;

-- ===== 4. Audit log: who did what, and when =====
create table if not exists public.audit_log (
  id bigint generated always as identity primary key,
  actor_id uuid references auth.users(id) on delete set null,
  actor_name text not null default '',
  action text not null,
  target_id uuid,
  target_name text not null default '',
  detail text not null default '',
  created_at timestamptz not null default now()
);
create index if not exists audit_log_created_idx on public.audit_log (created_at desc);
alter table public.audit_log enable row level security;
drop policy if exists "admin reads audit" on public.audit_log;
create policy "admin reads audit" on public.audit_log for select to authenticated using (public.is_admin());
-- No insert/update/delete policy: only the Edge Functions (service role) write to it, so nobody can edit the history.

-- ===== 5. Plan expiry: put learners back on Free when their paid period ends =====
-- Works on every call, so it needs no scheduler. The app calls it when someone opens the lab, and the admin panel calls it too.
create or replace function public.expire_plans() returns integer
language plpgsql security definer set search_path = public as $$
declare n integer;
begin
  -- Only learners who HAVE a subscription record whose paid period has ended. Plans an admin set by hand (no record) are left alone.
  with dropped as (
    update public.profiles p set plan = 'free'
    from (select id, plan as old_plan from public.profiles) o
    where o.id = p.id and p.plan <> 'free' and not p.is_admin
      and exists (select 1 from public.subscriptions s where s.user_id = p.id and s.current_period_end < now())
      and not exists (select 1 from public.subscriptions s where s.user_id = p.id and s.current_period_end >= now())
    returning p.id, p.username, o.old_plan
  ), logged as (
    insert into public.audit_log (actor_name, action, target_id, target_name, detail)
    select 'system', 'plan_expired', id, username, 'Plan ' || old_plan || ' ended, moved to free' from dropped
    returning 1
  )
  select count(*) into n from dropped;
  update public.subscriptions set status = 'cancelled', updated_at = now()
    where current_period_end < now() and status <> 'cancelled';
  return n;
end $$;
revoke all on function public.expire_plans() from public, anon;
grant execute on function public.expire_plans() to authenticated, service_role;

-- ===== 6. Redeem a reward coupon =====
-- Lists the signed-in learner's own unused reward codes and how many are ready. Used by the Redeem button in the lab profile.
create or replace function public.my_rewards() returns jsonb
language plpgsql security definer set search_path = public stable as $$
begin
  if auth.uid() is null then return '[]'::jsonb; end if;
  return coalesce((select jsonb_agg(jsonb_build_object('code', code, 'percent', percent) order by created_at)
    from public.coupons
    where owner_id = auth.uid() and active and (expires_at is null or expires_at > now()) and uses < coalesce(max_uses, 1)), '[]'::jsonb);
end $$;
grant execute on function public.my_rewards() to authenticated;

-- ===== 7. Inbox numbers for the lab profile icon =====
-- Unread private messages plus whether a live announcement exists. One call, no private data beyond the learner's own.
create or replace function public.my_inbox_count() returns jsonb
language plpgsql security definer set search_path = public stable as $$
begin
  if auth.uid() is null then return null; end if;
  return jsonb_build_object(
    'unread', (select count(*) from public.user_messages where user_id = auth.uid() and not read),
    'ann',    (select count(*) from public.announcements where active and (expires_at is null or expires_at > now()))
  );
end $$;
grant execute on function public.my_inbox_count() to authenticated;
