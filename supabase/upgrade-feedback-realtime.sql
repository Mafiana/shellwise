-- Lets the admin bell ring the moment feedback arrives (without it the bell still updates every 30 seconds).
do $$ begin
  alter publication supabase_realtime add table public.feedback;
exception when duplicate_object then null; when undefined_object then null; end $$;
