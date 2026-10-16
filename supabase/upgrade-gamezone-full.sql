-- Game Zone: activity log + leaderboard
-- Run once in Supabase → SQL Editor

create table if not exists public.game_events (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  game_id text not null check (char_length(game_id) <= 40),
  event text not null check (event in ('start', 'complete')),
  score integer not null default 0 check (score >= 0 and score <= 1000000),
  created_at timestamptz not null default now()
);

create index if not exists game_events_created_idx on public.game_events (created_at desc);
create index if not exists game_events_game_idx on public.game_events (game_id, created_at desc);
create index if not exists game_events_user_idx on public.game_events (user_id, created_at desc);

create table if not exists public.game_scores (
  user_id uuid not null references auth.users(id) on delete cascade,
  game_id text not null check (char_length(game_id) <= 40),
  best_score integer not null default 0 check (best_score >= 0),
  clears integer not null default 0 check (clears >= 0),
  updated_at timestamptz not null default now(),
  primary key (user_id, game_id)
);

alter table public.game_events enable row level security;
alter table public.game_scores enable row level security;

-- Learners: read own rows only (optional UI)
drop policy if exists "own game events" on public.game_events;
create policy "own game events" on public.game_events for select using (auth.uid() = user_id);

drop policy if exists "own game scores" on public.game_scores;
create policy "own game scores" on public.game_scores for select using (auth.uid() = user_id);

-- Admins read everything
drop policy if exists "admin game events" on public.game_events;
create policy "admin game events" on public.game_events for select using (public.is_admin());

drop policy if exists "admin game scores" on public.game_scores;
create policy "admin game scores" on public.game_scores for select using (public.is_admin());

-- No direct client insert; use RPC below
revoke insert, update, delete on public.game_events from anon, authenticated;
revoke insert, update, delete on public.game_scores from anon, authenticated;
grant select on public.game_events to authenticated;
grant select on public.game_scores to authenticated;

-- Report a start/complete from the lab (signed-in users only)
create or replace function public.gamezone_report(p_game text, p_event text, p_score integer default 0)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  gid text := lower(trim(p_game));
  ev text := lower(trim(p_event));
  sc integer := greatest(0, least(coalesce(p_score, 0), 1000000));
begin
  if auth.uid() is null then raise exception 'sign in first'; end if;
  if gid is null or gid = '' or char_length(gid) > 40 then raise exception 'bad game'; end if;
  if ev not in ('start', 'complete') then raise exception 'bad event'; end if;

  insert into public.game_events (user_id, game_id, event, score)
  values (auth.uid(), gid, ev, sc);

  if ev = 'complete' then
    insert into public.game_scores (user_id, game_id, best_score, clears, updated_at)
    values (auth.uid(), gid, sc, 1, now())
    on conflict (user_id, game_id) do update set
      best_score = greatest(public.game_scores.best_score, excluded.best_score),
      clears = public.game_scores.clears + 1,
      updated_at = now();
  end if;
end $$;

grant execute on function public.gamezone_report(text, text, integer) to authenticated;

-- Public leaderboard for one game (top 20 by best score)
create or replace function public.gamezone_leaderboard(p_game text default null)
returns jsonb
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  gid text := nullif(lower(trim(p_game)), '');
  out jsonb;
begin
  select coalesce(jsonb_agg(row_to_json(x)::jsonb), '[]'::jsonb) into out
  from (
    select
      s.game_id,
      s.best_score,
      s.clears,
      s.updated_at,
      coalesce(nullif(p.username, ''), 'player') as username,
      coalesce(p.plan, 'free') as plan
    from public.game_scores s
    join public.profiles p on p.id = s.user_id
    where gid is null or s.game_id = gid
    order by s.best_score desc, s.updated_at asc
    limit 20
  ) x;
  return out;
end $$;

grant execute on function public.gamezone_leaderboard(text) to anon, authenticated;

-- Admin activity feed (last 100 events with usernames)
create or replace function public.gamezone_admin_feed()
returns jsonb
language plpgsql
security definer
set search_path = public
stable
as $$
declare out jsonb;
begin
  if not public.is_admin() then raise exception 'not allowed'; end if;
  select coalesce(jsonb_agg(row_to_json(x)::jsonb), '[]'::jsonb) into out
  from (
    select
      e.id,
      e.game_id,
      e.event,
      e.score,
      e.created_at,
      e.user_id,
      coalesce(nullif(p.username, ''), p.email, 'user') as username,
      coalesce(p.plan, 'free') as plan
    from public.game_events e
    left join public.profiles p on p.id = e.user_id
    order by e.created_at desc
    limit 100
  ) x;
  return out;
end $$;

grant execute on function public.gamezone_admin_feed() to authenticated;


-- ===== WEEKLY =====
-- Weekly Game Zone leaderboard (ISO week)
-- Run after upgrade-gamezone.sql

-- Track weekly best scores
create table if not exists public.game_scores_week (
  user_id uuid not null references auth.users(id) on delete cascade,
  game_id text not null,
  year_week text not null, -- e.g. 2026-W42
  best_score int not null default 0,
  clears int not null default 0,
  updated_at timestamptz not null default now(),
  primary key (user_id, game_id, year_week)
);

create index if not exists game_scores_week_rank
  on public.game_scores_week (year_week, best_score desc);

alter table public.game_scores_week enable row level security;

-- report: also upsert weekly
create or replace function public.gamezone_report(p_game text, p_event text, p_score int default 0)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  yw text := to_char(now() at time zone 'utc', 'IYYY') || '-W' || to_char(now() at time zone 'utc', 'IW');
begin
  if uid is null then return; end if;
  if p_game is null or length(p_game) < 2 or length(p_game) > 40 then return; end if;
  if p_event not in ('start', 'complete') then return; end if;

  insert into public.game_events (user_id, game_id, event, score)
  values (uid, p_game, p_event, greatest(0, least(1000000, coalesce(p_score, 0))));

  if p_event = 'complete' then
    insert into public.game_scores (user_id, game_id, best_score, clears, updated_at)
    values (uid, p_game, greatest(0, coalesce(p_score, 0)), 1, now())
    on conflict (user_id, game_id) do update set
      best_score = greatest(public.game_scores.best_score, excluded.best_score),
      clears = public.game_scores.clears + 1,
      updated_at = now();

    insert into public.game_scores_week (user_id, game_id, year_week, best_score, clears, updated_at)
    values (uid, p_game, yw, greatest(0, coalesce(p_score, 0)), 1, now())
    on conflict (user_id, game_id, year_week) do update set
      best_score = greatest(public.game_scores_week.best_score, excluded.best_score),
      clears = public.game_scores_week.clears + 1,
      updated_at = now();
  end if;
end $$;

-- Weekly top 10
create or replace function public.gamezone_leaderboard_week(p_game text default null)
returns jsonb
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  gid text := nullif(trim(p_game), '');
  yw text := to_char(now() at time zone 'utc', 'IYYY') || '-W' || to_char(now() at time zone 'utc', 'IW');
  out jsonb;
begin
  select coalesce(jsonb_agg(row_to_json(x)::jsonb), '[]'::jsonb) into out
  from (
    select
      s.game_id,
      s.best_score,
      s.clears,
      s.updated_at,
      s.year_week,
      coalesce(nullif(p.username, ''), 'player') as username,
      coalesce(p.plan, 'free') as plan,
      case when row_number() over (order by s.best_score desc, s.updated_at asc) = 1 then true else false end as is_first
    from public.game_scores_week s
    join public.profiles p on p.id = s.user_id
    where s.year_week = yw
      and (gid is null or s.game_id = gid)
    order by s.best_score desc, s.updated_at asc
    limit 10
  ) x;
  return out;
end $$;

grant execute on function public.gamezone_leaderboard_week(text) to anon, authenticated;


-- ===== STATS =====
-- Optional: admin overview stats for Game Zone
-- Run after upgrade-gamezone.sql

create or replace function public.gamezone_admin_stats()
returns jsonb
language plpgsql
security definer
set search_path = public
stable
as $$
declare out jsonb;
begin
  if not public.is_admin() then raise exception 'not allowed'; end if;
  select jsonb_build_object(
    'plays_24h', (select count(*) from public.game_events where created_at > now() - interval '24 hours'),
    'completes_24h', (select count(*) from public.game_events where event = 'complete' and created_at > now() - interval '24 hours'),
    'unique_players', (select count(distinct user_id) from public.game_scores),
    'total_clears', (select coalesce(sum(clears),0) from public.game_scores)
  ) into out;
  return out;
end $$;

grant execute on function public.gamezone_admin_stats() to authenticated;
