-- ============================================================================
-- CONNECT — add Veil VPN referral tracking table (0028)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.vpn_referrals (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_username text NOT NULL,
  referred_username text NOT NULL,
  status text DEFAULT 'active' CHECK (status IN ('active', 'pending')),
  bonus_days integer DEFAULT 30 NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.vpn_referrals ENABLE ROW LEVEL SECURITY;

-- Policy for Connect employees (allow full access)
CREATE POLICY "Allow read/write on VPN referrals for connect users" ON public.vpn_referrals
  FOR ALL TO authenticated USING (true);

-- Policy for public cabinet view (only allow selecting own referrals)
CREATE POLICY "Allow public select by referrer_username"
  ON public.vpn_referrals FOR SELECT TO public
  USING (
    current_setting('request.parameter.referrer_username', true) IS NOT NULL AND
    referrer_username = replace(current_setting('request.parameter.referrer_username', true), 'eq.', '')
  );
