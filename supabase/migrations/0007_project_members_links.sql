-- ============================================================================
-- CONNECT — project members and project links
-- ============================================================================

-- project_members: ties team members to projects with an optional lead/member role.
-- PRIMARY KEY (project_id, user_id) prevents duplicate rows at the DB level.
CREATE TABLE IF NOT EXISTS public.project_members (
  project_id  uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id     uuid NOT NULL REFERENCES public.users(id)    ON DELETE CASCADE,
  role        text NOT NULL DEFAULT 'member'
              CHECK (role IN ('lead', 'member')),
  added_at    timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (project_id, user_id)
);

ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read project members"
  ON public.project_members FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage project members"
  ON public.project_members FOR ALL
  USING  (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE INDEX IF NOT EXISTS idx_pm_project ON public.project_members (project_id);
CREATE INDEX IF NOT EXISTS idx_pm_user    ON public.project_members (user_id);


-- project_links: arbitrary named URLs attached to a project (GitHub, Figma, live URL, etc.)
-- Icon is derived client-side from the URL hostname — no icon column needed.
CREATE TABLE IF NOT EXISTS public.project_links (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  label       text NOT NULL,
  url         text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.project_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read project links"
  ON public.project_links FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage project links"
  ON public.project_links FOR ALL
  USING  (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE INDEX IF NOT EXISTS idx_pl_project ON public.project_links (project_id);
