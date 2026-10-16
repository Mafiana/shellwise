-- Admin: clear Game Zone activity history (and optional leaderboard reset)
-- Run once in Supabase SQL Editor

create or replace function public.admin_gamezone_clear_history(p_scores boolean default false)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  n_events bigint := 0;
  n_scores bigint := 0;
  n_week bigint := 0;
begin
  if not public.is_admin() then
    raise exception 'not allowed';
  end if;

  delete from public.game_events;
  get diagnostics n_events = row_count;

  if p_scores then
    delete from public.game_scores;
    get diagnostics n_scores = row_count;
    begin
      delete from public.game_scores_week;
      get diagnostics n_week = row_count;
    exception when undefined_table then
      n_week := 0;
    end;
  end if;

  return jsonb_build_object(
    'events_deleted', n_events,
    'scores_deleted', n_scores,
    'week_deleted', n_week
  );
end $$;

grant execute on function public.admin_gamezone_clear_history(boolean) to authenticated;
