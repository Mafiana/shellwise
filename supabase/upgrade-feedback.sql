-- Shellwise: learner feedback (star rating, feature ideas, bug reports). Run once in Supabase > SQL Editor. Safe to run again.

create table if not exists public.feedback (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users(id) on delete set null,
  user_name text not null default '',
  user_email text not null default '',
  kind text not null default 'feedback' check (kind in ('feedback','feature','bug')),
  stars smallint check (stars between 1 and 5),
  message text not null default '' check (char_length(message) <= 1500),
  status text not null default 'new' check (status in ('new','done')),
  created_at timestamptz not null default now(),
  check (stars is not null or char_length(btrim(message)) >= 3)
);
create index if not exists feedback_created_idx on public.feedback (created_at desc);
create index if not exists feedback_user_idx on public.feedback (user_id, created_at desc);

alter table public.feedback enable row level security;
drop policy if exists "admins read feedback" on public.feedback;
create policy "admins read feedback" on public.feedback for select to authenticated using (public.is_admin());
drop policy if exists "users read own feedback" on public.feedback;
create policy "users read own feedback" on public.feedback for select to authenticated using (user_id = auth.uid());
-- No insert/update policies on purpose: everything goes through the checked functions below.

-- Learner: send feedback. At most 5 per day.
create or replace function public.feedback_send(p_stars int, p_kind text, p_message text) returns bigint
language plpgsql security definer set search_path = public as $$
declare m text := left(btrim(coalesce(p_message,'')), 1500); k text := coalesce(nullif(p_kind,''), 'feedback'); s int := p_stars; p record; fid bigint;
begin
  if auth.uid() is null then raise exception 'not signed in'; end if;
  if k not in ('feedback','feature','bug') then raise exception 'bad kind'; end if;
  if s is not null and (s < 1 or s > 5) then s := null; end if;
  if s is null and char_length(m) < 3 then raise exception 'empty feedback'; end if;
  if (select count(*) from public.feedback where user_id = auth.uid() and created_at > now() - interval '1 day') >= 5 then raise exception 'slow down'; end if;
  select coalesce(nullif(full_name,''), username, '') as n, coalesce(email,'') as e into p from public.profiles where id = auth.uid();
  insert into public.feedback (user_id, user_name, user_email, kind, stars, message)
  values (auth.uid(), coalesce(p.n,''), coalesce(p.e,''), k, s, m) returning id into fid;
  return fid;
end $$;

-- Learner: have I already given feedback? (used so the pop-up is not shown again on another device)
create or replace function public.feedback_my() returns jsonb
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then return null; end if;
  return jsonb_build_object('count', (select count(*) from public.feedback where user_id = auth.uid()),
                            'last', (select max(created_at) from public.feedback where user_id = auth.uid()));
end $$;

-- Admin: mark one item done / new again.
create or replace function public.feedback_set_status(p_id bigint, p_status text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'forbidden'; end if;
  if p_status not in ('new','done') then raise exception 'bad status'; end if;
  update public.feedback set status = p_status where id = p_id;
end $$;

revoke all on function public.feedback_send(int, text, text) from public, anon;
revoke all on function public.feedback_my() from public, anon;
revoke all on function public.feedback_set_status(bigint, text) from public, anon;
grant execute on function public.feedback_send(int, text, text) to authenticated;
grant execute on function public.feedback_my() to authenticated;
grant execute on function public.feedback_set_status(bigint, text) to authenticated;
