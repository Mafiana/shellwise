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
