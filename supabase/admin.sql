-- Shellwise admin panel. Run in Supabase > SQL Editor AFTER schema.sql. Safe to run more than once.
--
-- 1. Run this file.
-- 2. Make yourself the admin (replace the email):
--      update public.profiles set is_admin = true where id = (select id from auth.users where email = 'you@example.com');
--
-- What it adds: email, last_seen, suspended and is_admin columns on profiles; read access to everything for admins only;
-- a heartbeat function for "who is online"; and an overview function for the dashboard.
-- Users can NOT change is_admin, suspended, plan or last_seen themselves: the existing column-level grant only lets
-- them update full_name, progress and avatar. last_seen is changed only through touch_seen() below.

alter table public.profiles add column if not exists email text;
alter table public.profiles add column if not exists last_seen timestamptz;
alter table public.profiles add column if not exists suspended boolean not null default false;
alter table public.profiles add column if not exists is_admin boolean not null default false;
update public.profiles p set email = lower(u.email) from auth.users u where u.id = p.id and p.email is null;
create index if not exists profiles_last_seen_idx on public.profiles (last_seen desc);
create index if not exists profiles_created_idx on public.profiles (created_at desc);

-- Keep the email on new profiles.
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, username, full_name, email)
  values (new.id,
          lower(coalesce(new.raw_user_meta_data->>'username', 'user' || substr(replace(new.id::text,'-',''),1,8))),
          left(coalesce(new.raw_user_meta_data->>'full_name',''), 60),
          lower(new.email));
  return new;
end $$;

-- True when the signed-in user is an admin. security definer, so it can read profiles without recursion.
create or replace function public.is_admin() returns boolean
language sql security definer set search_path = public stable as $$
  select coalesce((select is_admin from public.profiles where id = auth.uid()), false);
$$;
grant execute on function public.is_admin() to authenticated;

-- Admin-only read access.
drop policy if exists "admin reads profiles" on public.profiles;
create policy "admin reads profiles" on public.profiles for select using (public.is_admin());
drop policy if exists "admin reads payments" on public.payments;
create policy "admin reads payments" on public.payments for select using (public.is_admin());
drop policy if exists "admin reads subscriptions" on public.subscriptions;
create policy "admin reads subscriptions" on public.subscriptions for select using (public.is_admin());
drop policy if exists "admin reads messages" on public.contact_messages;
create policy "admin reads messages" on public.contact_messages for select using (public.is_admin());

-- Heartbeat: the app calls this about once a minute while someone has the site open.
create or replace function public.touch_seen() returns void
language sql security definer set search_path = public as $$
  update public.profiles set last_seen = now() where id = auth.uid();
$$;
grant execute on function public.touch_seen() to authenticated;

-- Dashboard numbers in one call. Raises an error for anyone who is not an admin.
create or replace function public.admin_overview() returns jsonb
language plpgsql security definer set search_path = public stable as $$
declare out jsonb;
begin
  if not public.is_admin() then raise exception 'not allowed'; end if;
  select jsonb_build_object(
    'total',      (select count(*) from profiles),
    'online',     (select count(*) from profiles where last_seen > now() - interval '2 minutes'),
    'today',      (select count(*) from profiles where last_seen > now() - interval '24 hours'),
    'new7',       (select count(*) from profiles where created_at > now() - interval '7 days'),
    'suspended',  (select count(*) from profiles where suspended),
    'byPlan',     (select coalesce(jsonb_object_agg(plan, n), '{}'::jsonb) from (select plan, count(*) n from profiles group by plan) x),
    'revenueMonth', (select coalesce(sum(amount_kobo), 0) from payments where status = 'success' and paid_at >= date_trunc('month', now())),
    'revenueTotal', (select coalesce(sum(amount_kobo), 0) from payments where status = 'success'),
    'signups',    (select coalesce(jsonb_agg(jsonb_build_object('d', d::date, 'n', (select count(*) from profiles where created_at::date = d::date)) order by d), '[]'::jsonb)
                   from generate_series(current_date - 13, current_date, interval '1 day') d)
  ) into out;
  return out;
end $$;
grant execute on function public.admin_overview() to authenticated;
