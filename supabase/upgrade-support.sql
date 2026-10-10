-- Shellwise: learner support chat (tickets). Run once in Supabase > SQL Editor AFTER admin.sql and upgrade-growth2.sql. Safe to run again.

create table if not exists public.support_tickets (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  subject text not null default '' check (char_length(subject) <= 80),
  status text not null default 'open' check (status in ('open','closed')),
  unread_admin boolean not null default true,
  unread_user boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  closed_at timestamptz
);
create table if not exists public.support_messages (
  id bigint generated always as identity primary key,
  ticket_id bigint not null references public.support_tickets(id) on delete cascade,
  sender text not null check (sender in ('user','admin')),
  body text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now()
);
create index if not exists support_tickets_user_idx on public.support_tickets (user_id, created_at desc);
create index if not exists support_tickets_upd_idx on public.support_tickets (updated_at desc);
create index if not exists support_messages_t_idx on public.support_messages (ticket_id, created_at);

alter table public.support_tickets enable row level security;
alter table public.support_messages enable row level security;
drop policy if exists "read own or admin tickets" on public.support_tickets;
create policy "read own or admin tickets" on public.support_tickets for select to authenticated using (user_id = auth.uid() or public.is_admin());
drop policy if exists "read own or admin support messages" on public.support_messages;
create policy "read own or admin support messages" on public.support_messages for select to authenticated
  using (exists (select 1 from public.support_tickets t where t.id = ticket_id and (t.user_id = auth.uid() or public.is_admin())));
-- No insert/update policies on purpose: everything below goes through these checked functions.

-- Learner: send a message. Uses their open ticket, or opens a new one.
create or replace function public.support_send(p_body text) returns bigint
language plpgsql security definer set search_path = public as $$
declare b text := left(btrim(coalesce(p_body,'')), 2000); tid bigint;
begin
  if auth.uid() is null then raise exception 'not signed in'; end if;
  if char_length(b) < 1 then raise exception 'empty message'; end if;
  if (select count(*) from public.support_messages m join public.support_tickets t on t.id = m.ticket_id
      where t.user_id = auth.uid() and m.sender = 'user' and m.created_at > now() - interval '1 minute') >= 8
  then raise exception 'slow down'; end if;
  select id into tid from public.support_tickets where user_id = auth.uid() and status = 'open' order by id desc limit 1;
  if tid is null then
    insert into public.support_tickets (user_id, subject) values (auth.uid(), left(replace(b, E'\n', ' '), 80)) returning id into tid;
  end if;
  insert into public.support_messages (ticket_id, sender, body) values (tid, 'user', b);
  update public.support_tickets set unread_admin = true, updated_at = now() where id = tid;
  return tid;
end $$;

-- Learner: my conversation (latest 100 messages) and whether a ticket is open. p_mark = true marks admin replies as seen.
create or replace function public.support_my(p_mark boolean default false) returns jsonb
language plpgsql security definer set search_path = public as $$
declare r jsonb;
begin
  if auth.uid() is null then return null; end if;
  if p_mark then update public.support_tickets set unread_user = false where user_id = auth.uid() and unread_user; end if;
  select jsonb_build_object(
    'open', exists (select 1 from public.support_tickets where user_id = auth.uid() and status = 'open'),
    'unread', (select count(*) from public.support_tickets where user_id = auth.uid() and unread_user),
    'messages', coalesce((select jsonb_agg(x order by x.id) from (
        select m.id, m.sender, m.body, m.created_at, t.status
        from public.support_messages m join public.support_tickets t on t.id = m.ticket_id
        where t.user_id = auth.uid() order by m.id desc limit 100) x), '[]'::jsonb)
  ) into r;
  return r;
end $$;

-- Admin: reply, close, reopen, mark read.
create or replace function public.support_reply(p_ticket bigint, p_body text) returns void
language plpgsql security definer set search_path = public as $$
declare b text := left(btrim(coalesce(p_body,'')), 2000);
begin
  if not public.is_admin() then raise exception 'not allowed'; end if;
  if char_length(b) < 1 then raise exception 'empty message'; end if;
  insert into public.support_messages (ticket_id, sender, body) values (p_ticket, 'admin', b);
  update public.support_tickets set unread_user = true, unread_admin = false, status = 'open', closed_at = null, updated_at = now() where id = p_ticket;
end $$;

create or replace function public.support_set_status(p_ticket bigint, p_open boolean) returns void
language plpgsql security definer set search_path = public as $$
declare t public.support_tickets; who text;
begin
  if not public.is_admin() then raise exception 'not allowed'; end if;
  select * into t from public.support_tickets where id = p_ticket;
  if not found then raise exception 'ticket not found'; end if;
  select coalesce(username,'admin') into who from public.profiles where id = auth.uid();
  if p_open then
    update public.support_tickets set status = 'open', closed_at = null, updated_at = now() where id = p_ticket;
  else
    update public.support_tickets set status = 'closed', closed_at = now(), unread_admin = false, unread_user = true, updated_at = now() where id = p_ticket;
    insert into public.support_messages (ticket_id, sender, body) values (p_ticket, 'admin', 'This ticket has been closed. If you still need help, send a new message and we will open another one.');
  end if;
  insert into public.audit_log (actor_id, actor_name, action, target_id, target_name, detail)
  select auth.uid(), who, case when p_open then 'ticket_reopened' else 'ticket_closed' end, t.user_id, coalesce((select username from public.profiles where id = t.user_id),''), 'Support ticket #' || p_ticket;
end $$;

create or replace function public.support_admin_seen(p_ticket bigint) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'not allowed'; end if;
  update public.support_tickets set unread_admin = false where id = p_ticket and unread_admin;
end $$;

revoke all on function public.support_send(text), public.support_my(boolean), public.support_reply(bigint,text), public.support_set_status(bigint,boolean), public.support_admin_seen(bigint) from public, anon;
grant execute on function public.support_send(text), public.support_my(boolean), public.support_reply(bigint,text), public.support_set_status(bigint,boolean), public.support_admin_seen(bigint) to authenticated;
