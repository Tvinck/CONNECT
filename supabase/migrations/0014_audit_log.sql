-- ============================================================================
-- CONNECT — audit log
-- ============================================================================
-- Immutable log of all significant actions in the system.
-- Only CEO can read; any authenticated user can insert.
-- No UPDATE / DELETE allowed — the log is append-only.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid        REFERENCES public.users(id) ON DELETE SET NULL,
  action      text        NOT NULL,          -- e.g. 'task.create', 'order.refund'
  entity_type text,                          -- e.g. 'task', 'order', 'user'
  entity_id   text,                          -- string so it works for any PK type
  meta        jsonb,                         -- extra context (old/new values, etc.)
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Any authenticated user can write a log entry
CREATE POLICY "Authenticated users can insert audit logs"
  ON public.audit_logs FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Only CEO can read
CREATE POLICY "CEO can read audit logs"
  ON public.audit_logs FOR SELECT
  USING (public.is_ceo());

CREATE INDEX IF NOT EXISTS idx_audit_user       ON public.audit_logs (user_id);
CREATE INDEX IF NOT EXISTS idx_audit_created_at ON public.audit_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_action     ON public.audit_logs (action);
CREATE INDEX IF NOT EXISTS idx_audit_entity     ON public.audit_logs (entity_type, entity_id);
