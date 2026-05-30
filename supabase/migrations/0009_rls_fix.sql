-- ============================================================================
-- CONNECT — tighten RLS policies for transactions and project_members/links
-- ============================================================================
-- The original blanket "authenticated can ALL" policies allowed any logged-in
-- user to delete or modify records they didn't create.  These policies replace
-- them with granular rules: only the record creator or a CEO-role user may
-- mutate data they don't own.
-- ============================================================================

-- ── helpers ──────────────────────────────────────────────────────────────────

-- Returns TRUE when the calling auth user has role = 'ceo' in the users table.
CREATE OR REPLACE FUNCTION public.is_ceo()
  RETURNS boolean
  LANGUAGE sql STABLE SECURITY DEFINER
  SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'ceo'
  );
$$;

-- ── transactions ─────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Authenticated users can manage transactions" ON public.transactions;

-- INSERT: any authenticated user may create a transaction (they become created_by).
CREATE POLICY "Authenticated users can insert transactions"
  ON public.transactions FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- UPDATE / DELETE: only the creator or CEO.
CREATE POLICY "Creator or CEO can update transactions"
  ON public.transactions FOR UPDATE
  USING  (auth.uid() = created_by OR public.is_ceo())
  WITH CHECK (auth.uid() = created_by OR public.is_ceo());

CREATE POLICY "Creator or CEO can delete transactions"
  ON public.transactions FOR DELETE
  USING  (auth.uid() = created_by OR public.is_ceo());

-- ── project_members ───────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Authenticated users can manage project members" ON public.project_members;

-- INSERT: any authenticated user may add members (e.g., project lead workflow).
CREATE POLICY "Authenticated users can insert project members"
  ON public.project_members FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- DELETE: only CEO may remove members (project-lead check would need a subquery;
-- keeping it CEO-only matches the intent of the application permission model).
CREATE POLICY "CEO can delete project members"
  ON public.project_members FOR DELETE
  USING (public.is_ceo());

-- ── project_links ─────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Authenticated users can manage project links" ON public.project_links;

CREATE POLICY "Authenticated users can insert project links"
  ON public.project_links FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "CEO can delete project links"
  ON public.project_links FOR DELETE
  USING (public.is_ceo());
