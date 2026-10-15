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
