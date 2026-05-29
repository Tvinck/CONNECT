-- ============================================================================
-- CONNECT — message reactions + service connections
-- ============================================================================

-- ---------------------------------------------------------------------------
-- message_reactions: stores emoji reactions on chat messages.
-- UNIQUE(message_id, user_id, emoji) prevents duplicate reactions.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.message_reactions (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid        NOT NULL REFERENCES public.messages(id)  ON DELETE CASCADE,
  user_id    uuid        NOT NULL REFERENCES public.users(id)     ON DELETE CASCADE,
  emoji      text        NOT NULL CHECK (char_length(emoji) BETWEEN 1 AND 8),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (message_id, user_id, emoji)
);

ALTER TABLE public.message_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read reactions"
  ON public.message_reactions FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Users can add their own reactions"
  ON public.message_reactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their own reactions"
  ON public.message_reactions FOR DELETE
  USING (auth.uid() = user_id);

-- Optimise the common query: "all reactions for a set of message IDs"
CREATE INDEX IF NOT EXISTS idx_reactions_message_id
  ON public.message_reactions (message_id);


-- ---------------------------------------------------------------------------
-- service_connections: tracks which external tools are "connected".
-- Keyed by slug so the list in the UI can be extended without a new migration.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.service_connections (
  slug         text        PRIMARY KEY,
  is_connected boolean     NOT NULL DEFAULT false,
  updated_by   uuid        REFERENCES public.users(id) ON DELETE SET NULL,
  updated_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.service_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read service connections"
  ON public.service_connections FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "CEO can manage service connections"
  ON public.service_connections FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'ceo')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'ceo')
  );

-- Seed initial state from the hardcoded list in services/page.tsx
INSERT INTO public.service_connections (slug, is_connected) VALUES
  ('yandex-search',  true),
  ('figma',          true),
  ('github',         true),
  ('supabase',       true),
  ('yukassa',        true),
  ('suno-api',       true),
  ('heygen',         true),
  ('chatgpt',        true),
  ('yandex-metrika', true),
  ('sentry',         false),
  ('vps-panel',      false),
  ('site-audit',     false)
ON CONFLICT (slug) DO NOTHING;
