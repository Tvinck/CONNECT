-- ============================================================================
-- CONNECT — pm_promos: persistent promo code storage for ПодариМомент
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.pm_promos (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  code       text        NOT NULL UNIQUE,
  discount   smallint    NOT NULL CHECK (discount BETWEEN 1 AND 99),
  uses       integer     NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.pm_promos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pm_promos read"
  ON public.pm_promos FOR SELECT TO authenticated USING (true);

CREATE POLICY "pm_promos write"
  ON public.pm_promos FOR ALL TO authenticated
  USING  (public.is_ceo())
  WITH CHECK (public.is_ceo());

-- Seed demo codes (idempotent)
INSERT INTO public.pm_promos (code, discount, uses) VALUES
  ('АВИТО15',   15, 3),
  ('ПИКСЕЛЬ10', 10, 7)
ON CONFLICT (code) DO NOTHING;
