create extension if not exists "pgcrypto";

create table if not exists public.budget_store (
  key text primary key,
  value jsonb not null default 'null'::jsonb,
  updated_at timestamptz not null default timezone('utc', now())
);

create or replace function public.touch_budget_store_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists set_budget_store_updated_at on public.budget_store;

create trigger set_budget_store_updated_at
before update on public.budget_store
for each row
execute function public.touch_budget_store_updated_at();

alter table public.budget_store enable row level security;

drop policy if exists "Public can read budget_store" on public.budget_store;
create policy "Public can read budget_store"
on public.budget_store
for select
to anon, authenticated
using (true);

drop policy if exists "Public can write budget_store" on public.budget_store;
create policy "Public can write budget_store"
on public.budget_store
for insert
to anon, authenticated
with check (true);

drop policy if exists "Public can update budget_store" on public.budget_store;
create policy "Public can update budget_store"
on public.budget_store
for update
to anon, authenticated
using (true)
with check (true);
