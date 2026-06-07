-- ============================================================================
-- CONNECT — add Veil VPN administration tables (0018)
-- ============================================================================

-- Create vpn_servers table for Connect
create table if not exists public.vpn_servers (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  country_code text not null,
  ip_address text,
  ping_ms integer default 0,
  status text default 'online' check (status in ('online', 'offline')),
  load_percentage integer default 0 check (load_percentage between 0 and 100),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create vpn_subscriptions table for Connect
create table if not exists public.vpn_subscriptions (
  id uuid default gen_random_uuid() primary key,
  username text not null,
  status text default 'active' check (status in ('active', 'expired', 'paused')),
  expires_at timestamp with time zone,
  traffic_limit bigint default null,
  traffic_used bigint default 0,
  subscription_key text unique not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create vpn_orders table for Connect
create table if not exists public.vpn_orders (
  id uuid default gen_random_uuid() primary key,
  username text not null,
  amount numeric not null,
  currency text default 'RUB' not null,
  status text default 'pending' check (status in ('pending', 'paid', 'failed')),
  tariff_months integer not null check (tariff_months in (1, 3, 12)),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.vpn_servers enable row level security;
alter table public.vpn_subscriptions enable row level security;
alter table public.vpn_orders enable row level security;

-- Policies for Connect employees (allow read/write for authenticated users)
create policy "Allow read/write on VPN servers for connect users" on public.vpn_servers
  for all using (auth.role() = 'authenticated');

create policy "Allow read/write on VPN subscriptions for connect users" on public.vpn_subscriptions
  for all using (auth.role() = 'authenticated');

create policy "Allow read/write on VPN orders for connect users" on public.vpn_orders
  for all using (auth.role() = 'authenticated');

-- Seed mock data
insert into public.vpn_servers (name, country_code, ip_address, ping_ms, load_percentage)
values 
  ('Германия (Frankfurt)', 'DE', '45.138.74.12', 9, 34),
  ('Финляндия (Helsinki)', 'FI', '95.175.99.88', 15, 12),
  ('США (New York)', 'US', '104.22.45.67', 72, 58),
  ('Нидерланды (Amsterdam)', 'NL', '185.112.144.15', 12, 22),
  ('Турция (Istanbul)', 'TR', '88.250.33.102', 45, 68)
on conflict do nothing;

insert into public.vpn_subscriptions (username, status, expires_at, traffic_limit, traffic_used, subscription_key)
values 
  ('User6941', 'active', now() + interval '30 days', null, 15086821212, 'vless://a8b9-c1d2-e3f4-g5h6j7k8l9-user6941@sub.veilvpn.net:443?security=reality&sni=yahoo.com'),
  ('misha_k', 'active', now() + interval '60 days', null, 85899345920, 'vless://misha-k-key-VLESS-REALITY@sub.veilvpn.net:443'),
  ('alex_cyber', 'active', now() + interval '12 days', null, 42949672960, 'vless://alex-cyber-key-VLESS-REALITY@sub.veilvpn.net:443'),
  ('dmitry_v', 'expired', now() - interval '2 days', null, 12884901888, 'vless://dmitry-v-key-VLESS-REALITY@sub.veilvpn.net:443')
on conflict do nothing;

insert into public.vpn_orders (username, amount, currency, status, tariff_months)
values 
  ('User6941', 299, 'RUB', 'paid', 1),
  ('misha_k', 839, 'RUB', 'paid', 3),
  ('alex_cyber', 299, 'RUB', 'paid', 1),
  ('dmitry_v', 11, 'RUB', 'failed', 1),
  ('sergey_n', 2999, 'RUB', 'pending', 12)
on conflict do nothing;
