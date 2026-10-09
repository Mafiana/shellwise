-- Shellwise: announcements, discount codes and invite-a-friend. Run once in Supabase > SQL Editor. Safe to run again.
-- Needs schema.sql and admin.sql to have been run first (it uses public.is_admin()).

-- ===== 1. Announcements =====
create table if not exists public.announcements (
  id bigint generated always as identity primary key,
  message text not null check (char_length(message) between 3 and 240),
  tone text not null default 'info' check (tone in ('info','success','warning')),
  active boolean not null default true,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);
alter table public.announcements enable row level security;
drop policy if exists "everyone reads live announcements" on public.announcements;
create policy "everyone reads live announcements" on public.announcements for select to anon, authenticated
  using (active and (expires_at is null or expires_at > now()));
drop policy if exists "admin reads announcements" on public.announcements;
create policy "admin reads announcements" on public.announcements for select to authenticated using (public.is_admin());
drop policy if exists "admin adds announcements" on public.announcements;
create policy "admin adds announcements" on public.announcements for insert to authenticated with check (public.is_admin());
drop policy if exists "admin edits announcements" on public.announcements;
create policy "admin edits announcements" on public.announcements for update to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "admin deletes announcements" on public.announcements;
create policy "admin deletes announcements" on public.announcements for delete to authenticated using (public.is_admin());

-- ===== 2. Discount codes =====
create table if not exists public.coupons (
  code text primary key check (code ~ '^[A-Z0-9_-]{3,24}$'),
  percent integer not null check (percent between 1 and 90),
  max_uses integer check (max_uses is null or max_uses > 0),
  uses integer not null default 0,
  expires_at timestamptz,
  active boolean not null default true,
  owner_id uuid references public.profiles(id) on delete cascade, -- set for personal reward codes
  note text not null default '' check (char_length(note) <= 80),
  created_at timestamptz not null default now()
);
alter table public.coupons enable row level security;
drop policy if exists "admin reads coupons" on public.coupons;
create policy "admin reads coupons" on public.coupons for select to authenticated using (public.is_admin());
drop policy if exists "owner reads own coupons" on public.coupons;
create policy "owner reads own coupons" on public.coupons for select to authenticated using (owner_id = auth.uid());
drop policy if exists "admin adds coupons" on public.coupons;
create policy "admin adds coupons" on public.coupons for insert to authenticated with check (public.is_admin());
drop policy if exists "admin edits coupons" on public.coupons;
create policy "admin edits coupons" on public.coupons for update to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "admin deletes coupons" on public.coupons;
create policy "admin deletes coupons" on public.coupons for delete to authenticated using (public.is_admin());

-- What a payment used: the code (or REFERRAL for the invited-friend discount) and how much it took off, in kobo.
alter table public.payments add column if not exists coupon text;
alter table public.payments add column if not exists discount_kobo integer not null default 0;

-- Checks a code for the signed-in person. Returns {ok:true, percent:15} or {ok:false}.
create or replace function public.check_coupon(c text) returns jsonb
language plpgsql security definer set search_path = public stable as $$
declare r public.coupons;
begin
  if auth.uid() is null then return jsonb_build_object('ok', false); end if;
  select * into r from public.coupons where code = upper(trim(c));
  if not found or not r.active
     or (r.expires_at is not null and r.expires_at < now())
     or (r.max_uses is not null and r.uses >= r.max_uses)
     or (r.owner_id is not null and r.owner_id is distinct from auth.uid()) then
    return jsonb_build_object('ok', false);
  end if;
  if exists (select 1 from public.payments where user_id = auth.uid() and coupon = r.code and status = 'success') then
    return jsonb_build_object('ok', false, 'used', true);
  end if;
  return jsonb_build_object('ok', true, 'percent', r.percent);
end $$;
grant execute on function public.check_coupon(text) to authenticated;

-- Counts one use of a code. Only the Edge Functions (service role) can call it.
create or replace function public.bump_coupon(c text) returns void
language sql security definer set search_path = public as $$
  update public.coupons set uses = uses + 1 where code = c;
$$;
revoke all on function public.bump_coupon(text) from public, anon, authenticated;
grant execute on function public.bump_coupon(text) to service_role;

-- ===== 3. Invite a friend =====
alter table public.profiles add column if not exists ref_code text unique;
alter table public.profiles add column if not exists referred_by uuid references public.profiles(id) on delete set null;
update public.profiles set ref_code = upper(substr(md5(id::text || 'sw'), 1, 7)) where ref_code is null;

-- New accounts get their own invite code, and remember who invited them (the code comes from the sign-up form).
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare rid uuid;
begin
  select id into rid from public.profiles
   where ref_code = upper(left(coalesce(new.raw_user_meta_data->>'ref', ''), 12)) and ref_code is not null limit 1;
  insert into public.profiles (id, username, full_name, email, ref_code, referred_by)
  values (new.id,
          lower(coalesce(new.raw_user_meta_data->>'username', 'user' || substr(replace(new.id::text,'-',''),1,8))),
          left(coalesce(new.raw_user_meta_data->>'full_name',''), 60),
          lower(new.email),
          upper(substr(md5(new.id::text || 'sw'), 1, 7)),
          rid);
  return new;
end $$;

-- What the lab shows under Settings > Invite friends. Keep 15 in step with REF_PERCENT in supabase/functions/_shared/lib.ts.
create or replace function public.my_referral() returns jsonb
language plpgsql security definer set search_path = public stable as $$
begin
  if auth.uid() is null then return null; end if;
  return jsonb_build_object(
    'code',    (select ref_code from public.profiles where id = auth.uid()),
    'percent', 15,
    'invited', (select count(*) from public.profiles where referred_by = auth.uid()),
    'paid',    (select count(*) from public.profiles p where p.referred_by = auth.uid()
                  and exists (select 1 from public.payments y where y.user_id = p.id and y.status = 'success')),
    'rewards', (select coalesce(jsonb_agg(jsonb_build_object('code', code, 'percent', percent, 'used', uses >= coalesce(max_uses, 1)) order by created_at desc), '[]'::jsonb)
                  from public.coupons where owner_id = auth.uid())
  );
end $$;
grant execute on function public.my_referral() to authenticated;
