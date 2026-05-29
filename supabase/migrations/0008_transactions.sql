-- ============================================================================
-- CONNECT — financial transactions
-- ============================================================================
-- Tracks income and expense records for the company and per project.
-- project_id NULL = company-wide transaction not tied to a specific project.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.transactions (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  uuid        REFERENCES public.projects(id) ON DELETE SET NULL,
  type        text        NOT NULL CHECK (type IN ('income', 'expense')),
  amount      numeric(14,2) NOT NULL CHECK (amount > 0),
  description text        NOT NULL,
  category    text        NOT NULL DEFAULT 'other'
              CHECK (category IN ('revenue','client_payment','salary','marketing','development','infrastructure','other')),
  date        date        NOT NULL DEFAULT CURRENT_DATE,
  created_by  uuid        REFERENCES public.users(id) ON DELETE SET NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read transactions"
  ON public.transactions FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage transactions"
  ON public.transactions FOR ALL
  USING  (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE INDEX IF NOT EXISTS idx_tx_project    ON public.transactions (project_id);
CREATE INDEX IF NOT EXISTS idx_tx_date       ON public.transactions (date DESC);
CREATE INDEX IF NOT EXISTS idx_tx_created_at ON public.transactions (created_at DESC);
