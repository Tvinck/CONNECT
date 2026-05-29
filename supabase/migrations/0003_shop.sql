-- Shop tables

create table if not exists public.shop_items (
  id          uuid        primary key default gen_random_uuid(),
  title       text        not null,
  description text,
  price       integer     not null check (price > 0),
  icon        text        default '🎁',
  category    text        default 'general',
  stock       integer,                         -- null = unlimited
  is_active   boolean     not null default true,
  created_at  timestamptz not null default now()
);

create table if not exists public.shop_purchases (
  id           uuid        primary key default gen_random_uuid(),
  user_id      uuid        not null references public.users(id)       on delete cascade,
  item_id      uuid        not null references public.shop_items(id)  on delete cascade,
  points_spent integer     not null,
  status       text        not null default 'pending'
                           check (status in ('pending', 'approved', 'rejected')),
  created_at   timestamptz not null default now()
);

-- RLS
alter table public.shop_items      enable row level security;
alter table public.shop_purchases  enable row level security;

create policy "Active items are visible to all authenticated users"
  on public.shop_items for select
  using (is_active = true and auth.role() = 'authenticated');

create policy "Users can view their own purchases"
  on public.shop_purchases for select
  using (auth.uid() = user_id);

-- Seed shop items
insert into public.shop_items (title, description, price, icon, category) values
  ('День отдыха',      'Один дополнительный выходной день по согласованию с руководством', 500, '🌴', 'benefit'),
  ('Пицца на команду', 'Угостить всю команду пиццей в офисе',                              300, '🍕', 'team'),
  ('Кастомный тайтл',  'Уникальный статус в профиле на целый месяц',                       150, '🏷️', 'personal'),
  ('Мерч BAZZAR',      'Фирменный мерч на выбор: футболка или кружка',                     400, '👕', 'merch'),
  ('Кофе на месяц',    'Кофе каждый рабочий день в офисе в течение месяца',                200, '☕', 'benefit'),
  ('Обед с CEO',       'Личный обед с CEO для обсуждения идей и карьеры',                  800, '🍽️', 'special')
on conflict do nothing;
