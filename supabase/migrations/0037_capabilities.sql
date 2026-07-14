-- ============================================================================
-- CONNECT — action-level capabilities ("скиллы")
-- ============================================================================
-- Layered ON TOP of the section matrix (role_permissions, 0006). Section
-- permissions answer "can this role see the page"; capabilities answer
-- "can this person perform action X" (approve certs, export CRM, ...).
--
-- Hybrid model: a user HAS a capability if it is granted to their ROLE
-- (role_capabilities) OR granted to them PERSONALLY (user_capabilities).
-- CEO / co-owner implicitly have every capability (handled in code).
--
-- Capability keys are free-form strings, e.g. 'apple_certs.approve'.
-- New capabilities need no schema change — just insert rows / call can().
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.role_capabilities (
  role       text NOT NULL,          -- system role: dev | design | sales | support | ...
  capability text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (role, capability)
);

CREATE TABLE IF NOT EXISTS public.user_capabilities (
  user_id    uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  capability text NOT NULL,
  granted_by uuid REFERENCES public.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, capability)
);

ALTER TABLE public.role_capabilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_capabilities ENABLE ROW LEVEL SECURITY;

-- Any authenticated user may READ capabilities (needed to render/gate the UI).
CREATE POLICY "read role capabilities"
  ON public.role_capabilities FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "read user capabilities"
  ON public.user_capabilities FOR SELECT
  USING (auth.role() = 'authenticated');

-- Only the CEO may grant/revoke capabilities.
CREATE POLICY "ceo manage role capabilities"
  ON public.role_capabilities FOR ALL
  USING  (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'ceo'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'ceo'));

CREATE POLICY "ceo manage user capabilities"
  ON public.user_capabilities FOR ALL
  USING  (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'ceo'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'ceo'));

-- Preserve current behaviour: the existing Apple-cert approver keeps the right
-- to approve on day one. Everything else is unchanged until edited in the UI.
INSERT INTO public.user_capabilities (user_id, capability) VALUES
  ('99fc4e1a-e44c-40e1-b2ef-cddb6ec94bf6', 'apple_certs.approve')
ON CONFLICT DO NOTHING;
