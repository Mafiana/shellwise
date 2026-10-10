alter table public.payments
  alter column user_id drop not null;

do $$
declare fk_name text;
begin
  select tc.constraint_name into fk_name
  from information_schema.table_constraints tc
  join information_schema.key_column_usage kcu
    on tc.constraint_name = kcu.constraint_name and tc.table_schema = kcu.table_schema
  where tc.table_schema = 'public' and tc.table_name = 'payments'
    and tc.constraint_type = 'FOREIGN KEY' and kcu.column_name = 'user_id'
  limit 1;
  if fk_name is not null then
    execute format('alter table public.payments drop constraint %I', fk_name);
  end if;
end $$;

alter table public.payments
  add constraint payments_user_id_fkey
  foreign key (user_id) references auth.users(id) on delete set null;