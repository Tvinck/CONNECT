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

-- Users can only upload/overwrite their OWN avatar: path must be avatars/{uid}.{ext}
-- storage.filename() returns the filename part (e.g. "abc-123.jpg")
-- We verify it starts with the caller's uid so User A can't overwrite User B's file.
CREATE POLICY "Upload own avatar"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars'
    AND auth.role() = 'authenticated'
    AND storage.filename(name) LIKE (auth.uid()::text || '.%')
  );

CREATE POLICY "Update own avatar"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'avatars'
    AND auth.role() = 'authenticated'
    AND storage.filename(name) LIKE (auth.uid()::text || '.%')
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
