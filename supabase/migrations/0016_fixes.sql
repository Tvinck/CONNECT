-- ============================================================================
-- CONNECT — database fixes (0016)
--
-- 1. Sets default user_id = auth.uid() for audit logs.
-- 2. Restricts INSERT policy for audit logs to verify user_id = auth.uid() to prevent spoofing.
-- 3. Enables full replica identity for message reactions to ensure message_id,
--    user_id, and emoji are sent in DELETE realtime payloads.
-- ============================================================================

-- 1. Set default user_id to auth.uid() for audit logs
ALTER TABLE public.audit_logs ALTER COLUMN user_id SET DEFAULT auth.uid();

-- 2. Tighten RLS for audit logs
DROP POLICY IF EXISTS "Authenticated users can insert audit logs" ON public.audit_logs;
CREATE POLICY "Authenticated users can insert audit logs"
  ON public.audit_logs FOR INSERT
  WITH CHECK (auth.role() = 'authenticated' AND user_id = auth.uid());

-- 3. Set replica identity to full for message reactions to enable complete DELETE payloads in realtime
ALTER TABLE public.message_reactions REPLICA IDENTITY FULL;
