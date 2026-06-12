-- ============================================================================
-- CONNECT — Allow public select on VPN subscriptions and support messages (0025)
-- ============================================================================

-- Drop old public select policies if they exist (just in case)
DROP POLICY IF EXISTS "Allow public select by token" ON public.vpn_subscriptions;
DROP POLICY IF EXISTS "Allow public select support messages" ON public.support_messages;

-- 1. vpn_subscriptions: Allow public select for users accessing their cabinet
CREATE POLICY "Allow public select by token"
  ON public.vpn_subscriptions FOR SELECT TO public
  USING (true);

-- 2. support_messages: Allow public select for users viewing support chat history
CREATE POLICY "Allow public select support messages"
  ON public.support_messages FOR SELECT TO public
  USING (true);
