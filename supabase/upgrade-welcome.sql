-- Shellwise: welcome message in every new learner's Inbox. Run once in Supabase > SQL Editor. Safe to run again.
-- Needs upgrade-growth2.sql (the user_messages table) to have been run first.

create or replace function public.send_welcome() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.user_messages (user_id, subject, body)
  values (new.id, 'Welcome to Shellwise',
    'Welcome aboard! Open a module, explore the lab, try the terminal, and build real skills at your own pace. We’re glad you’re here. If you ever need help, open Customer support in the lab sidebar and message us.');
  return new;
end $$;

drop trigger if exists on_profile_welcome on public.profiles;
create trigger on_profile_welcome after insert on public.profiles
  for each row execute function public.send_welcome();

-- OPTIONAL: also send it once to learners who already have an account (remove the two dashes at the start of the lines to use).
-- insert into public.user_messages (user_id, subject, body)
-- select p.id, 'Welcome to Shellwise', 'Welcome aboard! Open a module, explore the lab, try the terminal, and build real skills at your own pace. We’re glad you’re here. If you ever need help, open Customer support in the lab sidebar and message us.'
-- from public.profiles p where not exists (select 1 from public.user_messages m where m.user_id = p.id and m.subject = 'Welcome to Shellwise');
