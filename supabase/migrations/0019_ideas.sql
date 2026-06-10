-- ============================================================================
-- CONNECT — Ideas Portal (Stage 5)
-- ============================================================================

-- CREATE TABLES
CREATE TABLE IF NOT EXISTS public.ideas (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title        text NOT NULL,
  description  text NOT NULL,
  status       text NOT NULL DEFAULT 'new'
               CHECK (status IN ('new', 'planned', 'rejected', 'implemented')),
  views        integer NOT NULL DEFAULT 0,
  project_id   uuid REFERENCES public.projects(id) ON DELETE SET NULL,
  author_id    uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  attachments  text[] NOT NULL DEFAULT '{}'::text[],
  links        text[] NOT NULL DEFAULT '{}'::text[],
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.idea_votes (
  idea_id uuid NOT NULL REFERENCES public.ideas(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  value   int NOT NULL CHECK (value IN (-1, 1)),
  PRIMARY KEY (idea_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.idea_comments (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  idea_id     uuid NOT NULL REFERENCES public.ideas(id) ON DELETE CASCADE,
  author_id   uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  content     text NOT NULL,
  attachments text[] NOT NULL DEFAULT '{}'::text[],
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.tags (
  id   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS public.idea_tags (
  idea_id uuid NOT NULL REFERENCES public.ideas(id) ON DELETE CASCADE,
  tag_id  uuid NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  PRIMARY KEY (idea_id, tag_id)
);

-- CREATE INDEXES
CREATE INDEX IF NOT EXISTS idx_ideas_author ON public.ideas(author_id);
CREATE INDEX IF NOT EXISTS idx_ideas_project ON public.ideas(project_id);
CREATE INDEX IF NOT EXISTS idx_ideas_status ON public.ideas(status);
CREATE INDEX IF NOT EXISTS idx_idea_votes_idea ON public.idea_votes(idea_id);
CREATE INDEX IF NOT EXISTS idx_idea_comments_idea ON public.idea_comments(idea_id, created_at);
CREATE INDEX IF NOT EXISTS idx_idea_tags_tag ON public.idea_tags(tag_id);

-- SEED ROLE PERMISSIONS FOR THE NEW SECTION
INSERT INTO public.role_permissions (role, section, level) VALUES
  ('Дизайн',     'Идеи', 2),
  ('Разработка', 'Идеи', 2),
  ('Продажи',    'Идеи', 2),
  ('Чат/SEO',    'Идеи', 2)
ON CONFLICT (role, section) DO NOTHING;

-- SEED DEFAULT TAGS
INSERT INTO public.tags (name) VALUES
  ('разработка'),
  ('дизайн'),
  ('новый проект'),
  ('маркетинг'),
  ('безопасность'),
  ('баги'),
  ('улучшения')
ON CONFLICT (name) DO NOTHING;

-- ROW LEVEL SECURITY (RLS)
ALTER TABLE public.ideas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.idea_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.idea_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.idea_tags ENABLE ROW LEVEL SECURITY;

-- CRUD POLICIES (Open collaboration for team members)
DROP POLICY IF EXISTS ideas_rw ON public.ideas;
CREATE POLICY ideas_rw ON public.ideas FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS idea_votes_rw ON public.idea_votes;
CREATE POLICY idea_votes_rw ON public.idea_votes FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS idea_comments_rw ON public.idea_comments;
CREATE POLICY idea_comments_rw ON public.idea_comments FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS tags_rw ON public.tags;
CREATE POLICY tags_rw ON public.tags FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS idea_tags_rw ON public.idea_tags;
CREATE POLICY idea_tags_rw ON public.idea_tags FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- STORAGE BUCKET FOR IDEA ATTACHMENTS
INSERT INTO storage.buckets (id, name, public)
VALUES ('idea-attachments', 'idea-attachments', true)
ON CONFLICT (id) DO NOTHING;

-- STORAGE POLICIES
DROP POLICY IF EXISTS "Upload idea attachments" ON storage.objects;
CREATE POLICY "Upload idea attachments"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'idea-attachments'
    AND auth.role() = 'authenticated'
  );

DROP POLICY IF EXISTS "Public read idea attachments" ON storage.objects;
CREATE POLICY "Public read idea attachments"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'idea-attachments');
