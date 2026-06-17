-- ============================================================================
-- CONNECT — add vpn_ggsel_logs table for webhook reliability (0030)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.vpn_ggsel_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unique_code TEXT NOT NULL,
  email TEXT,
  product_id TEXT,
  amount NUMERIC,
  status TEXT NOT NULL DEFAULT 'received', -- 'received', 'processed', 'failed'
  error_message TEXT,
  raw_response JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.vpn_ggsel_logs ENABLE ROW LEVEL SECURITY;

-- Allow read/write only to service_role (server-side operations)
CREATE POLICY "Allow service_role full access on vpn_ggsel_logs" ON public.vpn_ggsel_logs
  FOR ALL TO service_role USING (true);
