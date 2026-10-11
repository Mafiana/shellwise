-- Messages: add a "read" status and a "mark all as read" action. Run once in the Supabase SQL editor.
alter table public.contact_messages drop constraint if exists contact_messages_status_check;
alter table public.contact_messages add constraint contact_messages_status_check check (status in ('new','read','replied','closed'));

create or replace function public.message_set_status(p_id bigint, p_status text) returns void
language plpgsql security definer set search_path = public as $$
declare who text; mail text;
begin
  if not public.is_admin() then raise exception 'not allowed'; end if;
  if p_status not in ('new','read','replied','closed') then raise exception 'bad status'; end if;
  select email into mail from public.contact_messages where id = p_id;
  if not found then raise exception 'message not found'; end if;
  update public.contact_messages
     set status = p_status,
         closed_at = case when p_status = 'closed' then now() else null end
   where id = p_id;
  -- opening a message is routine, so only real changes are written to the audit log
  if p_status <> 'read' then
    select coalesce(username, 'admin') into who from public.profiles where id = auth.uid();
    insert into public.audit_log (actor_id, actor_name, action, target_id, target_name, detail)
    values (auth.uid(), who, 'message_' || p_status, null, mail, 'Contact message #' || p_id || ' marked ' || p_status);
  end if;
end $$;
revoke all on function public.message_set_status(bigint, text) from public, anon;
grant execute on function public.message_set_status(bigint, text) to authenticated;

-- Admin: every New message becomes Read (returns how many).
create or replace function public.message_mark_all_read() returns integer
language plpgsql security definer set search_path = public as $$
declare n integer; who text;
begin
  if not public.is_admin() then raise exception 'not allowed'; end if;
  update public.contact_messages set status = 'read' where status = 'new';
  get diagnostics n = row_count;
  if n > 0 then
    select coalesce(username, 'admin') into who from public.profiles where id = auth.uid();
    insert into public.audit_log (actor_id, actor_name, action, target_id, target_name, detail)
    values (auth.uid(), who, 'message_read_all', null, '', n || ' contact messages marked read');
  end if;
  return n;
end $$;
revoke all on function public.message_mark_all_read() from public, anon;
grant execute on function public.message_mark_all_read() to authenticated;
