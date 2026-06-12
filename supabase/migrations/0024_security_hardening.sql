-- ============================================================================
-- CONNECT — Security hardening RLS policies (0024)
-- ============================================================================

-- 1. vpn_subscriptions: drop old overly-permissive policies and restrict to CEO/Co-owner
DROP POLICY IF EXISTS "public_select_vpn" ON public.vpn_subscriptions;
DROP POLICY IF EXISTS "auth_all_vpn" ON public.vpn_subscriptions;
DROP POLICY IF EXISTS "Allow read/write on VPN subscriptions for connect users" ON public.vpn_subscriptions;

CREATE POLICY "CEO or Co-owner can manage vpn_subscriptions"
  ON public.vpn_subscriptions FOR ALL
  USING (public.is_ceo_or_coowner())
  WITH CHECK (public.is_ceo_or_coowner());

-- 2. vpn_servers: drop old overly-permissive policies and restrict to CEO/Co-owner
DROP POLICY IF EXISTS "auth_all_servers" ON public.vpn_servers;
DROP POLICY IF EXISTS "Allow read/write on VPN servers for connect users" ON public.vpn_servers;

CREATE POLICY "CEO or Co-owner can manage vpn_servers"
  ON public.vpn_servers FOR ALL
  USING (public.is_ceo_or_coowner())
  WITH CHECK (public.is_ceo_or_coowner());

-- 3. vpn_orders: drop old overly-permissive policies and restrict to CEO/Co-owner
DROP POLICY IF EXISTS "auth_all_orders" ON public.vpn_orders;
DROP POLICY IF EXISTS "Allow read/write on VPN orders for connect users" ON public.vpn_orders;

CREATE POLICY "CEO or Co-owner can manage vpn_orders"
  ON public.vpn_orders FOR ALL
  USING (public.is_ceo_or_coowner())
  WITH CHECK (public.is_ceo_or_coowner());

-- 4. support_messages: restrict read/write to CEO/Co-owner, while allowing public INSERT for the bot
DROP POLICY IF EXISTS "auth_all_support" ON public.support_messages;
DROP POLICY IF EXISTS "public_insert_support" ON public.support_messages;

CREATE POLICY "Anyone can insert support messages"
  ON public.support_messages FOR INSERT
  WITH CHECK (true);

CREATE POLICY "CEO or Co-owner can manage support messages"
  ON public.support_messages FOR ALL
  USING (public.is_ceo_or_coowner())
  WITH CHECK (public.is_ceo_or_coowner());

-- 5. projects: restrict write access to CEO/Co-owner, while allowing authenticated users to read
DROP POLICY IF EXISTS "projects_rw" ON public.projects;

CREATE POLICY "Authenticated users can select projects"
  ON public.projects FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "CEO or Co-owner can manage projects"
  ON public.projects FOR ALL
  USING (public.is_ceo_or_coowner())
  WITH CHECK (public.is_ceo_or_coowner());

-- 6. clients: restrict write access to CEO/Co-owner, while allowing authenticated users to read
DROP POLICY IF EXISTS "clients_rw" ON public.clients;

CREATE POLICY "Authenticated users can select clients"
  ON public.clients FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "CEO or Co-owner can manage clients"
  ON public.clients FOR ALL
  USING (public.is_ceo_or_coowner())
  WITH CHECK (public.is_ceo_or_coowner());
