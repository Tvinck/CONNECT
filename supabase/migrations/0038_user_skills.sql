-- ============================================================================
-- CONNECT — Add skills to users
-- ============================================================================

ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS skills text[] DEFAULT '{}'::text[];
