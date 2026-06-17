-- ============================================================================
-- CONNECT — add vpn_settings table (0032)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.vpn_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.vpn_settings ENABLE ROW LEVEL SECURITY;

-- Allow read/write only to service_role (server-side operations)
CREATE POLICY "Allow service_role full access on vpn_settings" ON public.vpn_settings
  FOR ALL TO service_role USING (true);
