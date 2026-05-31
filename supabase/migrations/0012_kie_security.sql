-- ============================================================================
-- CONNECT — Security hardening: add created_by to kie tasks, tighten RLS
-- ============================================================================

-- Add ownership field (after-the-fact migration)
ALTER TABLE public.pm_kie_tasks
  ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES public.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_pm_kie_creator ON public.pm_kie_tasks (created_by);

-- Drop the overly-permissive UPDATE policy and replace with ownership check
DROP POLICY IF EXISTS "pm_kie_tasks update" ON public.pm_kie_tasks;

CREATE POLICY "pm_kie_tasks update"
  ON public.pm_kie_tasks FOR UPDATE
  -- owner or CEO can update their own tasks
  USING  (created_by = auth.uid() OR public.is_ceo())
  WITH CHECK (created_by = auth.uid() OR public.is_ceo());

-- Delete: restrict to owner or CEO
DROP POLICY IF EXISTS "pm_kie_tasks delete" ON public.pm_kie_tasks;

CREATE POLICY "pm_kie_tasks delete"
  ON public.pm_kie_tasks FOR DELETE
  USING (created_by = auth.uid() OR public.is_ceo());
