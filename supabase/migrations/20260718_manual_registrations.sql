-- ============================================================================
-- CONNECT — Manual registrations (Avito) — заявки на ручную регистрацию (20260718)
-- ============================================================================
-- Оператор создаёт заявку в Connect Mobile; клиент по спец-ссылке отдаёт UDID
-- и оплачивает через Т-Банк. После оплаты создаётся apple_certificates.
-- ============================================================================

create table if not exists public.manual_registrations (
  id uuid default gen_random_uuid() primary key,
  code text not null unique,                       -- короткий код для ссылки /r/<code>
  created_by uuid references public.users(id),     -- сотрудник-создатель
  created_by_name text,                            -- денормализованное имя (логин/ФИО)
  platform text not null default 'avito',          -- 'avito' | 'telegram' | 'other'
  guarantee_months int not null,                   -- срок гарантии тарифа
  price int not null,                              -- цена тарифа (руб), с учётом комиссий
  extra_info text,                                 -- доп. информация (напр. «нужен Scarlet»)
  approver_id uuid references public.users(id),    -- согласующий (по умолчанию Артём)
  status text not null default 'thinking',         -- 'thinking'|'awaiting_payment'|'paid'|'refused'
  udid text,                                        -- заполняется после шага UDID
  device_model text,
  payment_id text,                                  -- id платежа Т-Банк
  paid_at timestamptz,
  cert_id uuid references public.apple_certificates(id), -- созданный серт (после оплаты)
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists manual_registrations_code_idx on public.manual_registrations (code);
create index if not exists manual_registrations_created_by_idx on public.manual_registrations (created_by);
create index if not exists manual_registrations_status_idx on public.manual_registrations (status);

-- updated_at автообновление
create or replace function public.manual_registrations_set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_manual_registrations_updated_at on public.manual_registrations;
create trigger trg_manual_registrations_updated_at
  before update on public.manual_registrations
  for each row execute function public.manual_registrations_set_updated_at();

-- ── RLS ─────────────────────────────────────────────────────────────────────
alter table public.manual_registrations enable row level security;

-- Операторы (авторизованные сотрудники) — полный доступ через дашборд/мобилку.
drop policy if exists "manual_registrations authenticated all" on public.manual_registrations;
create policy "manual_registrations authenticated all"
  on public.manual_registrations for all to authenticated
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- Публичное чтение по коду (для страницы-ссылки без логина) — только точное совпадение
-- кода, никаких выгрузок. Клиентский запрос делает .eq('code', X) → ?code=eq.X.
-- Безопасный субсет полей всё равно отдаёт Connect API (service role); эта политика —
-- запасной путь и защита от выгрузки всех заявок.
drop policy if exists "manual_registrations public select by code" on public.manual_registrations;
create policy "manual_registrations public select by code"
  on public.manual_registrations for select to anon
  using (code = get_query_param('code'));
