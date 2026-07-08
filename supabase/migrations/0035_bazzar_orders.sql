-- ============================================================================
-- CONNECT — Bazzar Apple Certificates orders from GGSel (0035)
-- ============================================================================
-- Tracks orders coming from GGSel marketplace for the Bazzar Apple Certs flow.
-- Flow: customer buys on GGSel → calls /api/shop/ggsel/verify (saves order)
--       → customer provides UDID → calls /api/shop/ggsel/link (links order)
-- ============================================================================

DROP TABLE IF EXISTS public.bazzar_orders CASCADE;

CREATE TABLE IF NOT EXISTS public.bazzar_orders (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  uniquecode   text        NOT NULL UNIQUE,      -- GGSel unique purchase code
  item_name    text        NOT NULL DEFAULT '',  -- product name from GGSel
  amount       numeric(10, 2) NOT NULL DEFAULT 0, -- purchase amount in RUB
  email        text        NOT NULL DEFAULT '',  -- buyer email from GGSel
  status       text        NOT NULL DEFAULT 'pending_udid'
                           CHECK (status IN ('pending_udid', 'linked', 'failed', 'refunded')),
  udid         text,                             -- filled after /link call
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.bazzar_orders ENABLE ROW LEVEL SECURITY;

-- Only server-side (service_role) and authenticated Connect employees can access
CREATE POLICY "bazzar_orders: service_role full access"
  ON public.bazzar_orders FOR ALL
  TO service_role USING (true);

CREATE POLICY "bazzar_orders: authenticated read"
  ON public.bazzar_orders FOR SELECT
  TO authenticated USING (true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_bazzar_orders_uniquecode  ON public.bazzar_orders (uniquecode);
CREATE INDEX IF NOT EXISTS idx_bazzar_orders_status      ON public.bazzar_orders (status);
CREATE INDEX IF NOT EXISTS idx_bazzar_orders_created_at  ON public.bazzar_orders (created_at DESC);

-- Auto-update updated_at on row change
CREATE OR REPLACE FUNCTION public.update_bazzar_orders_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS bazzar_orders_updated_at ON public.bazzar_orders;
CREATE TRIGGER bazzar_orders_updated_at
  BEFORE UPDATE ON public.bazzar_orders
  FOR EACH ROW EXECUTE FUNCTION public.update_bazzar_orders_updated_at();
