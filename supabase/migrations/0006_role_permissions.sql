-- ============================================================================
-- CONNECT — role permissions matrix
-- ============================================================================
-- Stores per-role access levels for each dashboard section.
-- level: 0 = none, 1 = view-only, 2 = full access.
-- Keyed by (role, section) so new roles/sections can be added without a
-- schema change — just insert new rows.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.role_permissions (
  role       text     NOT NULL,
  section    text     NOT NULL,
  level      smallint NOT NULL DEFAULT 0 CHECK (level BETWEEN 0 AND 2),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (role, section)
);

ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read permissions"
  ON public.role_permissions FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "CEO can manage permissions"
  ON public.role_permissions FOR ALL
  USING  (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'ceo'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'ceo'));

-- Seed defaults matching DEFAULT_PERMS in ManagementPanel.tsx.
-- Sections order: Дашборд(0) Задачи(1) Проекты(2) База знаний(3) CRM(4) Заказы(5) Финансы(6) Чаты(7) Сервисы(8)
INSERT INTO public.role_permissions (role, section, level) VALUES
  ('Дизайн',     'Дашборд',     2),
  ('Дизайн',     'Задачи',      2),
  ('Дизайн',     'Проекты',     2),
  ('Дизайн',     'База знаний', 2),
  ('Дизайн',     'CRM',         0),
  ('Дизайн',     'Заказы',      1),
  ('Дизайн',     'Финансы',     0),
  ('Дизайн',     'Чаты',        2),
  ('Дизайн',     'Сервисы',     1),

  ('Разработка', 'Дашборд',     2),
  ('Разработка', 'Задачи',      2),
  ('Разработка', 'Проекты',     2),
  ('Разработка', 'База знаний', 2),
  ('Разработка', 'CRM',         0),
  ('Разработка', 'Заказы',      1),
  ('Разработка', 'Финансы',     0),
  ('Разработка', 'Чаты',        2),
  ('Разработка', 'Сервисы',     2),

  ('Продажи',    'Дашборд',     2),
  ('Продажи',    'Задачи',      2),
  ('Продажи',    'Проекты',     1),
  ('Продажи',    'База знаний', 1),
  ('Продажи',    'CRM',         2),
  ('Продажи',    'Заказы',      2),
  ('Продажи',    'Финансы',     1),
  ('Продажи',    'Чаты',        2),
  ('Продажи',    'Сервисы',     1),

  ('Чат/SEO',    'Дашборд',     2),
  ('Чат/SEO',    'Задачи',      2),
  ('Чат/SEO',    'Проекты',     1),
  ('Чат/SEO',    'База знаний', 2),
  ('Чат/SEO',    'CRM',         1),
  ('Чат/SEO',    'Заказы',      1),
  ('Чат/SEO',    'Финансы',     0),
  ('Чат/SEO',    'Чаты',        2),
  ('Чат/SEO',    'Сервисы',     2)
ON CONFLICT (role, section) DO NOTHING;
