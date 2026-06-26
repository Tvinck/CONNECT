-- ============================================================================
-- CONNECT — add Apple Certificates table (0033)
-- ============================================================================

create table if not exists public.apple_certificates (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  udid text not null,
  plan_id text not null,
  api_cost numeric(10, 2) not null default 0,
  sale_price numeric(10, 2) not null default 0,
  source text not null, -- 'avito', 'ggsel', 'plati', 'site', 'bot', 'manual'
  bot1_cert_id text,
  status text not null default 'active', -- 'active', 'revoked', 'expired'
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.apple_certificates enable row level security;

-- Policies for Connect employees (allow read/write for authenticated users)
create policy "Allow read/write on apple_certificates for connect users" on public.apple_certificates
  for all using (auth.role() = 'authenticated');
