-- Admin-editable plan prices (NGN stored as kobo)
-- Run in Supabase SQL Editor once.
-- Checkout (paystack-init) already reads public.plans — new payments use these amounts.
-- Existing subscribers keep their paid period; only new checkouts change.

create or replace function public.admin_set_plan_price(
  p_id text,
  p_monthly_kobo integer,
  p_yearly_kobo integer
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'not allowed';
  end if;
  if p_id not in ('learner', 'pro') then
    raise exception 'only learner and pro prices can be changed';
  end if;
  if p_monthly_kobo is null or p_monthly_kobo < 0 or p_monthly_kobo > 500000000 then
    raise exception 'invalid monthly amount';
  end if;
  if p_yearly_kobo is null or p_yearly_kobo < 0 or p_yearly_kobo > 500000000 then
    raise exception 'invalid yearly amount';
  end if;
  update public.plans
  set monthly_kobo = p_monthly_kobo,
      yearly_kobo = p_yearly_kobo
  where id = p_id;
  if not found then
    insert into public.plans (id, name, monthly_kobo, yearly_kobo)
    values (p_id, initcap(p_id), p_monthly_kobo, p_yearly_kobo);
  end if;
end $$;

grant execute on function public.admin_set_plan_price(text, integer, integer) to authenticated;

-- Expiring plans within N days (admin notifications)
create or replace function public.admin_plans_expiring(p_days integer default 7)
returns jsonb
language plpgsql
security definer
set search_path = public
stable
as $$
declare out jsonb;
begin
  if not public.is_admin() then raise exception 'not allowed'; end if;
  if p_days is null or p_days < 1 or p_days > 90 then p_days := 7; end if;
  select coalesce(jsonb_agg(row_to_json(x)::jsonb order by x.ends_at), '[]'::jsonb) into out
  from (
    select
      s.user_id,
      coalesce(nullif(p.username, ''), 'user') as username,
      coalesce(p.email, '') as email,
      s.plan,
      s.interval,
      s.status,
      s.current_period_end as ends_at,
      greatest(0, ceil(extract(epoch from (s.current_period_end - now())) / 86400.0))::int as days_left
    from public.subscriptions s
    join public.profiles p on p.id = s.user_id
    where s.plan in ('learner', 'pro')
      and s.status in ('active', 'cancelled', 'past_due')
      and s.current_period_end is not null
      and s.current_period_end >= now()
      and s.current_period_end <= now() + make_interval(days => p_days)
    order by s.current_period_end asc
    limit 100
  ) x;
  return out;
end $$;

grant execute on function public.admin_plans_expiring(integer) to authenticated;
