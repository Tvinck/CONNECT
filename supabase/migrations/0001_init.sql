-- ============================================================================
-- CONNECT — initial schema (Stage 1)
-- BAZZAR Group internal platform
-- Run this in: Supabase Dashboard -> SQL Editor -> New query -> Run
-- ============================================================================

create extension if not exists pgcrypto;

-- ============================================================================
-- TABLES
-- ============================================================================

-- Team members. id matches auth.users.id 1:1.
create table if not exists public.users (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text unique not null,
  full_name   text not null,
  avatar_url  text,
  role        text not null default 'dev'
              check (role in ('ceo','design','dev','sales','support')),
  position    text,
  points      int  not null default 0,
  level       int  not null default 1,
  is_active   boolean not null default true,
  status      text not null default 'offline'
              check (status in ('online','offline','busy')),
  created_at  timestamptz not null default now()
);

create table if not exists public.projects (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text unique not null,
  emoji       text,
  color       text not null default '#1472F5',
  status      text not null default 'planning'
              check (status in ('active','dev','planning')),
  progress    int  not null default 0 check (progress between 0 and 100),
  description text,
  created_at  timestamptz not null default now()
);

create table if not exists public.tasks (
  id            uuid primary key default gen_random_uuid(),
  title         text not null,
  description   text,
  assignee_id   uuid references public.users(id)    on delete set null,
  creator_id    uuid references public.users(id)    on delete set null,
  status        text not null default 'todo'
                check (status in ('todo','in_progress','review','done')),
  priority      text not null default 'medium'
                check (priority in ('low','medium','high','urgent')),
  due_date      timestamptz,
  project_id    uuid references public.projects(id) on delete set null,
  points_reward int  not null default 10,
  created_at    timestamptz not null default now()
);

create table if not exists public.clients (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  email       text,
  phone       text,
  source      text,
  status      text not null default 'lead'
              check (status in ('lead','active','vip','churned')),
  manager_id  uuid references public.users(id) on delete set null,
  total_spent numeric not null default 0,
  created_at  timestamptz not null default now()
);

create table if not exists public.channels (
  id          uuid primary key default gen_random_uuid(),
  slug        text unique not null,
  name        text not null,
  description text,
  is_private  boolean not null default false,
  created_at  timestamptz not null default now()
);

create table if not exists public.messages (
  id          uuid primary key default gen_random_uuid(),
  channel_id  uuid not null references public.channels(id) on delete cascade,
  sender_id   uuid references public.users(id) on delete set null,
  content     text not null,
  is_pinned   boolean not null default false,
  created_at  timestamptz not null default now()
);

create table if not exists public.knowledge_articles (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  content     text not null default '',
  category    text not null default 'Общее',
  author_id   uuid references public.users(id) on delete set null,
  views       int  not null default 0,
  read_time   int  not null default 3,
  created_at  timestamptz not null default now()
);

create table if not exists public.notifications (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.users(id) on delete cascade,
  type        text not null default 'info',
  title       text not null,
  body        text,
  is_read     boolean not null default false,
  link        text,
  created_at  timestamptz not null default now()
);

create table if not exists public.achievements (
  id          uuid primary key default gen_random_uuid(),
  key         text unique not null,
  title       text not null,
  description text,
  icon        text,
  points      int not null default 0
);

create table if not exists public.user_achievements (
  user_id        uuid not null references public.users(id) on delete cascade,
  achievement_id uuid not null references public.achievements(id) on delete cascade,
  earned_at      timestamptz not null default now(),
  primary key (user_id, achievement_id)
);

-- Indexes on foreign keys / hot paths
create index if not exists idx_tasks_assignee   on public.tasks(assignee_id);
create index if not exists idx_tasks_project    on public.tasks(project_id);
create index if not exists idx_tasks_status     on public.tasks(status);
create index if not exists idx_messages_channel on public.messages(channel_id, created_at);
create index if not exists idx_notif_user       on public.notifications(user_id, is_read);
create index if not exists idx_clients_manager  on public.clients(manager_id);

-- ============================================================================
-- HELPERS  (SECURITY DEFINER bypasses RLS -> no policy recursion)
-- ============================================================================

create or replace function public.auth_role()
returns text
language sql stable security definer set search_path = public
as $$ select role from public.users where id = auth.uid() $$;

create or replace function public.is_ceo()
returns boolean
language sql stable security definer set search_path = public
as $$ select coalesce((select role = 'ceo' from public.users where id = auth.uid()), false) $$;

-- Auto-create a profile row whenever an auth user is created.
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  insert into public.users (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'role', 'dev')
  )
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================================
-- ROW LEVEL SECURITY
-- Internal trusted team: everyone authenticated can read everything.
-- Writes are open to authenticated members, with a few owner/CEO guards.
-- ============================================================================

alter table public.users              enable row level security;
alter table public.projects           enable row level security;
alter table public.tasks              enable row level security;
alter table public.clients            enable row level security;
alter table public.channels           enable row level security;
alter table public.messages           enable row level security;
alter table public.knowledge_articles enable row level security;
alter table public.notifications      enable row level security;
alter table public.achievements       enable row level security;
alter table public.user_achievements  enable row level security;

-- users -----------------------------------------------------------------
drop policy if exists users_select      on public.users;
drop policy if exists users_update_self on public.users;
drop policy if exists users_ceo_write   on public.users;
create policy users_select      on public.users for select to authenticated using (true);
create policy users_update_self on public.users for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());
create policy users_ceo_write   on public.users for all to authenticated
  using (public.is_ceo()) with check (public.is_ceo());

-- Anti-fraud: a regular user may edit their own profile, but NOT the
-- privileged columns (role / points / level / is_active). Only the CEO or a
-- server-side context (service_role / SQL editor, where auth.uid() is null)
-- can change those. This makes the gamification points tamper-proof.
create or replace function public.lock_privileged_user_columns()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  if auth.uid() is null or public.is_ceo() then
    return new;                       -- server / admin / CEO: allow anything
  end if;
  new.role      := old.role;          -- self-update: freeze privileged fields
  new.points    := old.points;
  new.level     := old.level;
  new.is_active := old.is_active;
  return new;
end $$;

drop trigger if exists lock_user_privileges on public.users;
create trigger lock_user_privileges
  before update on public.users
  for each row execute function public.lock_privileged_user_columns();

-- projects / tasks / clients / channels / knowledge: open CRUD for the team
do $$
declare t text;
begin
  foreach t in array array['projects','tasks','clients','channels','knowledge_articles']
  loop
    execute format('drop policy if exists %I_rw on public.%I', t, t);
    execute format(
      'create policy %I_rw on public.%I for all to authenticated using (true) with check (true)',
      t, t);
  end loop;
end $$;

-- messages: read all; write only your own (CEO can delete any) -----------
drop policy if exists messages_select      on public.messages;
drop policy if exists messages_insert_own  on public.messages;
drop policy if exists messages_update_own  on public.messages;
drop policy if exists messages_delete_own  on public.messages;
create policy messages_select     on public.messages for select to authenticated using (true);
create policy messages_insert_own on public.messages for insert to authenticated
  with check (sender_id = auth.uid());
create policy messages_update_own on public.messages for update to authenticated
  using (sender_id = auth.uid());
create policy messages_delete_own on public.messages for delete to authenticated
  using (sender_id = auth.uid() or public.is_ceo());

-- notifications: only your own ------------------------------------------
drop policy if exists notif_select_own on public.notifications;
drop policy if exists notif_update_own on public.notifications;
drop policy if exists notif_insert     on public.notifications;
create policy notif_select_own on public.notifications for select to authenticated
  using (user_id = auth.uid());
create policy notif_update_own on public.notifications for update to authenticated
  using (user_id = auth.uid());
create policy notif_insert     on public.notifications for insert to authenticated
  with check (true);

-- achievements: read-only for clients (seeded/awarded server-side) -------
drop policy if exists ach_select  on public.achievements;
drop policy if exists uach_select on public.user_achievements;
create policy ach_select  on public.achievements      for select to authenticated using (true);
create policy uach_select on public.user_achievements for select to authenticated using (true);

-- ============================================================================
-- REALTIME (used in Stage 4 for chats / live updates)
-- ============================================================================
do $$
begin
  alter publication supabase_realtime add table public.messages;
exception when duplicate_object then null; end $$;
do $$
begin
  alter publication supabase_realtime add table public.tasks;
exception when duplicate_object then null; end $$;
do $$
begin
  alter publication supabase_realtime add table public.notifications;
exception when duplicate_object then null; end $$;
