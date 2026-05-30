-- ============================================================================
-- CONNECT — Kie.ai generation tasks tracking
-- ============================================================================
-- Stores a local record of every generation task sent to kie.ai
-- (Kie.ai has no API to list history, so we keep it ourselves).
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.pm_kie_tasks (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id     text        UNIQUE,                           -- kie.ai task ID
  type        text        NOT NULL DEFAULT 'music'
              CHECK (type IN ('music', 'video')),
  status      text        NOT NULL DEFAULT 'pending'
              CHECK (status IN ('pending', 'processing', 'done', 'failed')),
  model       text        NOT NULL DEFAULT 'V4',
  title       text,
  prompt      text,
  style       text,
  instrumental boolean    NOT NULL DEFAULT false,
  audio_url   text,
  stream_url  text,
  image_url   text,
  duration    numeric(6,1),
  credits_used integer,
  order_id    uuid        REFERENCES public.pm_orders(id) ON DELETE SET NULL,
  error_msg   text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pm_kie_status  ON public.pm_kie_tasks (status);
CREATE INDEX IF NOT EXISTS idx_pm_kie_created ON public.pm_kie_tasks (created_at DESC);

ALTER TABLE public.pm_kie_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pm_kie_tasks select" ON public.pm_kie_tasks
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "pm_kie_tasks insert" ON public.pm_kie_tasks
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "pm_kie_tasks update" ON public.pm_kie_tasks
  FOR UPDATE USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "pm_kie_tasks delete" ON public.pm_kie_tasks
  FOR DELETE USING (public.is_ceo());
