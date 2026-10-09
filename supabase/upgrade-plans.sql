-- Run ONCE on a database created with an older schema.sql (it still had the Team plan and the old prices).
-- Moves any Team accounts to Pro, removes Team, and sets the new prices: Learner N1,300, Pro N2,800.
update public.profiles set plan = 'pro' where plan = 'team';
update public.subscriptions set plan = 'pro' where plan = 'team';
update public.payments set plan = 'pro' where plan = 'team';
alter table public.profiles drop constraint if exists profiles_plan_check;
alter table public.profiles add constraint profiles_plan_check check (plan in ('free','learner','pro'));
delete from public.plans where id = 'team';
alter table public.plans drop constraint if exists plans_id_check;
alter table public.plans add constraint plans_id_check check (id in ('free','learner','pro'));
update public.plans set monthly_kobo = 130000, yearly_kobo = 1320000 where id = 'learner';
update public.plans set monthly_kobo = 280000, yearly_kobo = 2880000 where id = 'pro';
