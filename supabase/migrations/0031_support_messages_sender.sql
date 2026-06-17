-- ============================================================================
-- CONNECT — add sender_email to support_messages (0031)
-- ============================================================================

ALTER TABLE public.support_messages ADD COLUMN IF NOT EXISTS sender_email TEXT;
