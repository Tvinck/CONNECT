-- ============================================================================
-- CONNECT — avatar storage policy + promo UTM tracking
-- ============================================================================

-- ── Supabase Storage: avatars bucket ─────────────────────────────────────────
-- The bucket itself must be created in the Supabase dashboard or via CLI:
--   supabase storage create avatars --public
-- The policies below apply once the bucket exists.

INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Authenticated upload own avatar"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = 'avatars'
  );

CREATE POLICY "Authenticated update own avatar"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'avatars'
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Public read avatars"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

-- ── Promo UTM / source tracking ───────────────────────────────────────────────
ALTER TABLE public.pm_promos
  ADD COLUMN IF NOT EXISTS source text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS utm_medium text DEFAULT NULL;

COMMENT ON COLUMN public.pm_promos.source     IS 'Traffic source label, e.g. "avito", "vk", "telegram"';
COMMENT ON COLUMN public.pm_promos.utm_medium IS 'UTM medium for the promo campaign';
