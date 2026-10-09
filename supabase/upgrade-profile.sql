-- Run once if you set up the database before the Edit profile feature (adds location and bio).
alter table public.profiles
  add column if not exists location text not null default '' check (char_length(location) <= 60),
  add column if not exists bio text not null default '' check (char_length(bio) <= 200);
grant update (full_name, progress, avatar, location, bio) on public.profiles to authenticated;
