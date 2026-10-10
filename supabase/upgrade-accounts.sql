-- Shellwise: (1) keep the email on payments so a deleted learner's payments can still be told apart and re-linked,
--            (2) let a new Google account use the username picked on the sign-up form.
-- Run once in Supabase > SQL Editor. Safe to run again.

-- ===== 1. Payments remember the email =====
alter table public.payments add column if not exists email text;
update public.payments p set email = lower(pr.email) from public.profiles pr where pr.id = p.user_id and p.email is null;

create or replace function public.payments_fill_email() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.email is null and new.user_id is not null then
    select lower(email) into new.email from public.profiles where id = new.user_id;
  end if;
  return new;
end $$;
drop trigger if exists payments_fill_email on public.payments;
create trigger payments_fill_email before insert on public.payments for each row execute function public.payments_fill_email();

-- When someone who deleted their account signs up again with the same email, their earlier payments are attached to the new account.
create or replace function public.relink_payments() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.email is not null then
    update public.payments set user_id = new.id where user_id is null and email = lower(new.email);
  end if;
  return new;
end $$;
drop trigger if exists profiles_relink_payments on public.profiles;
create trigger profiles_relink_payments after insert on public.profiles for each row execute function public.relink_payments();

-- ===== 2. Username chosen before Google sign-up =====
-- Only works on a brand-new account (made in the last 30 minutes) and only for a free, valid username.
create or replace function public.claim_username(p_name text) returns boolean
language plpgsql security definer set search_path = public as $$
declare u text := lower(btrim(coalesce(p_name, '')));
begin
  if auth.uid() is null then return false; end if;
  if u !~ '^[a-z][a-z0-9_]{2,19}$' then return false; end if;
  if exists (select 1 from public.profiles where username = u and id <> auth.uid()) then return false; end if;
  update public.profiles set username = u where id = auth.uid() and created_at > now() - interval '30 minutes' and username <> u;
  return found;
end $$;
revoke all on function public.claim_username(text) from public, anon;
grant execute on function public.claim_username(text) to authenticated;
