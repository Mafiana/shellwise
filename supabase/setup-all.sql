-- ONE-FILE SETUP. Paste this whole file into Supabase > SQL Editor > Run (safe to re-run).
-- Part 1: tables, security rules, sign-up trigger, username check, plans, contact form
-- Shellwise database. Run once in Supabase: SQL Editor > New query > paste > Run.
-- Safe rules: users can read their own rows; only the server (service role, used by the Edge Functions) can change plans or payments.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique check (username ~ '^[a-z][a-z0-9_]{2,19}$'),
  full_name text not null default '' check (char_length(full_name) <= 60),
  plan text not null default 'free' check (plan in ('free','learner','pro')),
  progress jsonb not null default '{}'::jsonb,
  avatar text check (avatar is null or (char_length(avatar) < 80000 and avatar like 'data:image/jpeg;base64,%')),
  location text not null default '' check (char_length(location) <= 60),
  bio text not null default '' check (char_length(bio) <= 200),
  created_at timestamptz not null default now()
);

-- Prices are in kobo (1 naira = 100 kobo). The browser never sends an amount; the server reads it from here.
-- If you already ran an older version of this file, also run:
--   alter table public.profiles add column if not exists avatar text check (avatar is null or (char_length(avatar) < 80000 and avatar like 'data:image/jpeg;base64,%'));
--   alter table public.profiles add column if not exists location text not null default '' check (char_length(location) <= 60), add column if not exists bio text not null default '' check (char_length(bio) <= 200);
--   grant update (full_name, progress, avatar, location, bio) on public.profiles to authenticated;

create table if not exists public.plans (
  id text primary key check (id in ('free','learner','pro')),
  name text not null,
  monthly_kobo integer not null default 0 check (monthly_kobo >= 0),
  yearly_kobo integer not null default 0 check (yearly_kobo >= 0),
  paystack_monthly_code text,  -- optional: Paystack plan code (PLN_xxx) for auto-renewing subscriptions
  paystack_yearly_code text
);

create table if not exists public.payments (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  reference text not null unique,
  plan text not null references public.plans(id),
  interval text not null check (interval in ('monthly','yearly')),
  amount_kobo integer not null,
  status text not null default 'pending' check (status in ('pending','success','failed')),
  created_at timestamptz not null default now(),
  paid_at timestamptz
);

create table if not exists public.subscriptions (
  user_id uuid primary key references auth.users(id) on delete cascade,
  plan text not null references public.plans(id),
  interval text not null check (interval in ('monthly','yearly')),
  status text not null default 'active' check (status in ('active','cancelled','past_due')),
  paystack_code text,
  paystack_email text,
  current_period_end timestamptz,
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.plans enable row level security;
alter table public.payments enable row level security;
alter table public.subscriptions enable row level security;

create policy "own profile read" on public.profiles for select using (auth.uid() = id);
create policy "own profile update" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);
create policy "plans are public" on public.plans for select using (true);
create policy "own payments read" on public.payments for select using (auth.uid() = user_id);
create policy "own subscription read" on public.subscriptions for select using (auth.uid() = user_id);
-- No insert/update/delete policies on payments or subscriptions: only the service role can write them.

-- Users may change only their name and progress. They can NOT change plan, username or id.
revoke update on public.profiles from anon, authenticated;
grant update (full_name, progress, avatar, location, bio) on public.profiles to authenticated;

-- Create the profile when someone signs up (values come from the sign-up form).
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, username, full_name)
  values (new.id,
          lower(coalesce(new.raw_user_meta_data->>'username', 'user' || substr(replace(new.id::text,'-',''),1,8))),
          left(coalesce(new.raw_user_meta_data->>'full_name',''), 60));
  return new;
end $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

-- Lets the sign-up form check a username before creating the account.
create or replace function public.username_available(u text) returns boolean
language sql security definer set search_path = public stable as $$
  select not exists (select 1 from public.profiles where username = lower(u));
$$;
grant execute on function public.username_available(text) to anon, authenticated;

-- Prices in kobo: Learner N1,300, Pro N2,800 per month. Keep src/data/plans.js in step.
-- Yearly = 12 x the yearly per-month price: Learner N1,100/month (N13,200), Pro N2,400/month (N28,800).
insert into public.plans (id, name, monthly_kobo, yearly_kobo) values
  ('free','Free',0,0),
  ('learner','Learner',130000,1320000),
  ('pro','Pro',280000,2880000)
on conflict (id) do update set name = excluded.name, monthly_kobo = excluded.monthly_kobo, yearly_kobo = excluded.yearly_kobo;

-- Contact form messages. Anyone can send one; nobody can read them from the website. Read them in the Supabase Table Editor.
create table if not exists public.contact_messages (
  id bigint generated always as identity primary key,
  name text not null check (char_length(name) between 1 and 80),
  email text not null check (char_length(email) between 5 and 254),
  topic text not null check (topic in ('general','billing','bug','feedback','partnership')),
  message text not null check (char_length(message) between 10 and 1500),
  created_at timestamptz not null default now()
);
alter table public.contact_messages enable row level security;
create policy "anyone can send a message" on public.contact_messages for insert to anon, authenticated with check (true);

-- Part 2: admin panel
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
