-- Shellwise: contact message status (New / Replied / Closed) and in-panel email replies.
-- Run once in Supabase > SQL Editor AFTER admin.sql and upgrade-growth2.sql. Safe to run again.

alter table public.contact_messages
  add column if not exists status text not null default 'new',
  add column if not exists replied_at timestamptz,
  add column if not exists closed_at timestamptz;
alter table public.contact_messages drop constraint if exists contact_messages_status_check;
alter table public.contact_messages add constraint contact_messages_status_check check (status in ('new','replied','closed'));

create table if not exists public.contact_replies (
  id bigint generated always as identity primary key,
  message_id bigint not null references public.contact_messages(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 4000),
  sent_by uuid references auth.users(id) on delete set null,
  sent_by_name text not null default '',
  to_email text not null default '',
  created_at timestamptz not null default now()
);
create index if not exists contact_replies_msg_idx on public.contact_replies (message_id, created_at);
alter table public.contact_replies enable row level security;
drop policy if exists "admin reads replies" on public.contact_replies;
create policy "admin reads replies" on public.contact_replies for select to authenticated using (public.is_admin());
-- Replies are only written by the message-reply Edge Function (service role).

-- Admin: mark a message New, Replied or Closed.
create or replace function public.message_set_status(p_id bigint, p_status text) returns void
language plpgsql security definer set search_path = public as $$
declare who text; mail text;
begin
  if not public.is_admin() then raise exception 'not allowed'; end if;
  if p_status not in ('new','replied','closed') then raise exception 'bad status'; end if;
  select email into mail from public.contact_messages where id = p_id;
  if not found then raise exception 'message not found'; end if;
  update public.contact_messages
     set status = p_status,
         closed_at = case when p_status = 'closed' then now() else null end
   where id = p_id;
  select coalesce(username, 'admin') into who from public.profiles where id = auth.uid();
  insert into public.audit_log (actor_id, actor_name, action, target_id, target_name, detail)
  values (auth.uid(), who, 'message_' || p_status, null, mail, 'Contact message #' || p_id || ' marked ' || p_status);
end $$;
revoke all on function public.message_set_status(bigint, text) from public, anon;
grant execute on function public.message_set_status(bigint, text) to authenticated;
