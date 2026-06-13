-- ============================================================================
-- CONNECT — Secure public select on VPN subscriptions and support messages (0026)
-- ============================================================================

-- Drop old overly-permissive public select policies
DROP POLICY IF EXISTS "Allow public select by token" ON public.vpn_subscriptions;
DROP POLICY IF EXISTS "Allow public select support messages" ON public.support_messages;

-- 1. vpn_subscriptions: Allow public select ONLY when token parameter is provided and matches
CREATE POLICY "Allow public select by token"
  ON public.vpn_subscriptions FOR SELECT TO public
  USING (
    current_setting('request.parameter.token', true) IS NOT NULL AND
    token = replace(current_setting('request.parameter.token', true), 'eq.', '')
  );

-- 2. support_messages: Allow public select ONLY when user_id parameter is provided, matches UUID format, and matches the row's user_id
CREATE POLICY "Allow public select support messages"
  ON public.support_messages FOR SELECT TO public
  USING (
    current_setting('request.parameter.user_id', true) IS NOT NULL AND
    replace(current_setting('request.parameter.user_id', true), 'eq.', '') ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' AND
    user_id = replace(current_setting('request.parameter.user_id', true), 'eq.', '')::uuid
  );
