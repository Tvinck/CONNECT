-- ============================================================================
-- CONNECT — BazzarSerts 2.0: варианты сертификатов + подписки на приложения (20260718)
-- ============================================================================

-- 1. Варианты товара (сроки/гарантии/цены сертификатов)
create table if not exists public.bazzar_product_variants (
  id uuid default gen_random_uuid() primary key,
  product_id uuid references public.bazzar_products(id) on delete cascade,
  name text not null,                 -- напр. «Гарантия 3 месяца»
  guarantee_months int not null default 0,
  price int not null default 0,
  api_cost int not null default 0,
  active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists bazzar_product_variants_product_idx on public.bazzar_product_variants (product_id);

alter table public.bazzar_product_variants enable row level security;
-- Управление — только авторизованные (dashboard). api_cost чувствителен, anon не даём.
drop policy if exists "variants authenticated all" on public.bazzar_product_variants;
create policy "variants authenticated all" on public.bazzar_product_variants
  for all to authenticated using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- 2. Подписки на приложения
create table if not exists public.bazzar_subscriptions (
  id uuid default gen_random_uuid() primary key,
  udid text not null,                                  -- клиент (bazzar_users.udid)
  app_id uuid references public.bazzar_apps(id) on delete set null,
  app_name text,                                       -- денормализация на случай отсутствия app_id
  plan text not null default '1m',                     -- '1m' | '3m' | '12m' и т.п.
  price int not null default 0,
  status text not null default 'active',               -- 'active' | 'expired' | 'cancelled'
  started_at timestamptz not null default now(),
  expires_at timestamptz,
  auto_renew boolean not null default false,
  created_by uuid references public.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists bazzar_subscriptions_udid_idx on public.bazzar_subscriptions (udid);
create index if not exists bazzar_subscriptions_status_idx on public.bazzar_subscriptions (status);
create index if not exists bazzar_subscriptions_expires_idx on public.bazzar_subscriptions (expires_at);

create or replace function public.bazzar_subscriptions_set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;
drop trigger if exists trg_bazzar_subscriptions_updated_at on public.bazzar_subscriptions;
create trigger trg_bazzar_subscriptions_updated_at
  before update on public.bazzar_subscriptions
  for each row execute function public.bazzar_subscriptions_set_updated_at();

alter table public.bazzar_subscriptions enable row level security;
drop policy if exists "subscriptions authenticated all" on public.bazzar_subscriptions;
create policy "subscriptions authenticated all" on public.bazzar_subscriptions
  for all to authenticated using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
-- Публичное чтение своей подписки по udid (для личного кабинета сайта)
drop policy if exists "subscriptions public by udid" on public.bazzar_subscriptions;
create policy "subscriptions public by udid" on public.bazzar_subscriptions
  for select to anon using (udid = get_query_param('udid'));
