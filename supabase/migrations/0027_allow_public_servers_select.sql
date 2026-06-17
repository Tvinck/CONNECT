-- ============================================================================
-- CONNECT — Allow public select on VPN servers (0027)
-- ============================================================================

-- Drop old policy if exists
DROP POLICY IF EXISTS "Allow public select on VPN servers" ON public.vpn_servers;

-- Allow public select for anonymous users to fetch server list in API sub
CREATE POLICY "Allow public select on VPN servers"
  ON public.vpn_servers FOR SELECT TO public
  USING (true);
