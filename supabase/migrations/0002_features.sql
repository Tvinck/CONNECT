-- ============================================================================
-- 0002_features.sql — replies in chat + indexes
-- Run this in Supabase SQL Editor after 0001_init.sql
-- ============================================================================

-- Reply-to support for messages (a message can quote another message)
alter table public.messages
  add column if not exists reply_to uuid references public.messages(id) on delete set null;

create index if not exists idx_messages_reply on public.messages(reply_to);

-- Allow CEO to update any user's profile is already covered; ensure clients
-- manager defaults work. Nothing else required — channels/clients/knowledge
-- already have open CRUD policies for authenticated users.
