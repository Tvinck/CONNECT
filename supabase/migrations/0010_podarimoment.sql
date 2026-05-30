-- ============================================================================
-- CONNECT — ПодариМомент admin tables
-- ============================================================================
-- Tracks orders, clients, products and API logs for the PodariMoment service.
-- The site itself writes to these tables; CONNECT reads them for admin work.
-- ============================================================================

-- ── products ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.pm_products (
  id          text        PRIMARY KEY,
  name        text        NOT NULL,
  emoji       text        NOT NULL DEFAULT '🎁',
  description text,
  price       numeric(10,2) NOT NULL,
  cost        numeric(10,2) NOT NULL DEFAULT 0,
  is_active   boolean     NOT NULL DEFAULT true,
  sort_order  smallint    NOT NULL DEFAULT 0,
  updated_at  timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.pm_products (id, name, emoji, description, price, cost, sort_order) VALUES
  ('song',      'ИИ-песня',               '🎵', 'Персональная ИИ-песня (Suno + Claude)', 299,  2,   1),
  ('video',     'Видео из фото',           '🎬', 'Слайдшоу с музыкой из ваших фото',      499,  5,   2),
  ('celebrity', 'Видео от знаменитости',   '🎭', 'Видеопоздравление от ИИ-персонажа',     799,  150, 3)
ON CONFLICT (id) DO NOTHING;

-- ── orders ───────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.pm_orders (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id      text        REFERENCES public.pm_products(id),
  client_email    text        NOT NULL,
  client_name     text,
  amount          numeric(10,2) NOT NULL,
  -- Form data (what the client filled in)
  recipient       text,
  occasion        text,
  message         text,
  -- Payment (ЮКасса)
  payment_status  text        NOT NULL DEFAULT 'pending'
                  CHECK (payment_status IN ('pending','paid','refunded','failed')),
  payment_id      text,
  paid_at         timestamptz,
  -- Generation pipeline
  gen_status      text        NOT NULL DEFAULT 'pending'
                  CHECK (gen_status IN ('pending','processing','done','failed','manual')),
  file_url        text,
  gen_started_at  timestamptz,
  gen_done_at     timestamptz,
  -- Delivery
  sent_at         timestamptz,
  -- Admin fields
  admin_notes     text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pm_orders_email   ON public.pm_orders (client_email);
CREATE INDEX IF NOT EXISTS idx_pm_orders_pay     ON public.pm_orders (payment_status);
CREATE INDEX IF NOT EXISTS idx_pm_orders_gen     ON public.pm_orders (gen_status);
CREATE INDEX IF NOT EXISTS idx_pm_orders_created ON public.pm_orders (created_at DESC);

-- ── clients ───────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.pm_clients (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  email         text        UNIQUE NOT NULL,
  name          text,
  source        text        NOT NULL DEFAULT 'new'
                CHECK (source IN ('pixel', 'new')),
  total_spent   numeric(12,2) NOT NULL DEFAULT 0,
  order_count   integer     NOT NULL DEFAULT 0,
  last_order_at timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- ── API logs ──────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.pm_api_logs (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  service    text        NOT NULL,
  level      text        NOT NULL DEFAULT 'error'
             CHECK (level IN ('info','warn','error')),
  message    text        NOT NULL,
  order_id   uuid        REFERENCES public.pm_orders(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pm_api_logs_service ON public.pm_api_logs (service);
CREATE INDEX IF NOT EXISTS idx_pm_api_logs_created ON public.pm_api_logs (created_at DESC);

-- ── RLS ──────────────────────────────────────────────────────────────────────

ALTER TABLE public.pm_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pm_orders   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pm_clients  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pm_api_logs ENABLE ROW LEVEL SECURITY;

-- Products: anyone can read; only CEO can write
CREATE POLICY "pm_products select" ON public.pm_products FOR SELECT USING (true);
CREATE POLICY "pm_products write"  ON public.pm_products FOR ALL
  USING  (public.is_ceo()) WITH CHECK (public.is_ceo());

-- Orders: authenticated can read + insert; CEO/system can update
CREATE POLICY "pm_orders select" ON public.pm_orders FOR SELECT
  USING (auth.role() = 'authenticated');
CREATE POLICY "pm_orders insert" ON public.pm_orders FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "pm_orders update" ON public.pm_orders FOR UPDATE
  USING (public.is_ceo()) WITH CHECK (public.is_ceo());

-- Clients: authenticated can read + insert; CEO can update
CREATE POLICY "pm_clients select" ON public.pm_clients FOR SELECT
  USING (auth.role() = 'authenticated');
CREATE POLICY "pm_clients insert" ON public.pm_clients FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "pm_clients update" ON public.pm_clients FOR UPDATE
  USING (public.is_ceo()) WITH CHECK (public.is_ceo());

-- API logs: authenticated can read + insert; CEO can delete
CREATE POLICY "pm_api_logs select" ON public.pm_api_logs FOR SELECT
  USING (auth.role() = 'authenticated');
CREATE POLICY "pm_api_logs insert" ON public.pm_api_logs FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "pm_api_logs delete" ON public.pm_api_logs FOR DELETE
  USING (public.is_ceo());

-- ── Demo seed data ────────────────────────────────────────────────────────────

INSERT INTO public.pm_clients (email, name, source, total_spent, order_count, last_order_at) VALUES
  ('anna.sokolova@gmail.com',  'Анна Соколова',  'pixel', 798,  2, now() - interval '2 days'),
  ('ivan.petrov@yandex.ru',   'Иван Петров',    'pixel', 299,  1, now() - interval '8 days'),
  ('m.ivanova@mail.ru',       'Мария Иванова',  'new',   799,  1, now() - interval '1 day'),
  ('sergei.k@gmail.com',      'Сергей К.',      'pixel', 499,  1, now() - interval '14 days'),
  ('test.order@example.com',  NULL,             'new',   499,  1, now() - interval '2 hours')
ON CONFLICT (email) DO NOTHING;

INSERT INTO public.pm_orders (
  product_id, client_email, client_name, amount,
  recipient, occasion, message,
  payment_status, payment_id, paid_at,
  gen_status, file_url, gen_started_at, gen_done_at, sent_at
) VALUES
  -- ✅ Successful song
  ('song', 'anna.sokolova@gmail.com', 'Анна', 299,
   'Маме', 'День рождения', 'Мамочка, ты лучшая! 60 лет — и ты прекрасна!',
   'paid', 'yookassa_111', now()-interval '2 days 3 hours',
   'sent', 'https://files.podarimoment.ru/song_001.mp3',
   now()-interval '2 days 3 hours'+interval '10 seconds',
   now()-interval '2 days 3 hours'+interval '2 minutes',
   now()-interval '2 days 3 hours'+interval '3 minutes'),

  -- ✅ Successful video
  ('video', 'anna.sokolova@gmail.com', 'Анна', 499,
   'Папе', 'Юбилей', 'Папуля, 65 лет! Лучший отец на свете!',
   'paid', 'yookassa_112', now()-interval '2 days',
   'sent', 'https://files.podarimoment.ru/video_002.mp4',
   now()-interval '2 days'+interval '15 seconds',
   now()-interval '2 days'+interval '5 minutes',
   now()-interval '2 days'+interval '6 minutes'),

  -- ✅ Successful celebrity
  ('celebrity', 'm.ivanova@mail.ru', 'Мария', 799,
   'Антону', 'День рождения', 'Антоха, 30 лет! Ты крутой!',
   'paid', 'yookassa_113', now()-interval '1 day',
   'sent', 'https://files.podarimoment.ru/celeb_003.mp4',
   now()-interval '1 day'+interval '30 seconds',
   now()-interval '1 day'+interval '8 minutes',
   now()-interval '1 day'+interval '9 minutes'),

  -- ⚠️ STUCK — paid, generation failed
  ('video', 'test.order@example.com', NULL, 499,
   'Сестре', 'Новый год', 'Сестрёнка, с Новым годом!',
   'paid', 'yookassa_114', now()-interval '2 hours',
   'failed', NULL,
   now()-interval '2 hours'+interval '5 seconds',
   NULL, NULL),

  -- ⚠️ STUCK — paid, still pending gen (old)
  ('song', 'ivan.petrov@yandex.ru', 'Иван', 299,
   'Другу', 'День рождения', 'Дружище, с ДР! 10 лет дружбы!',
   'paid', 'yookassa_110', now()-interval '8 days',
   'done', 'https://files.podarimoment.ru/song_010.mp3',
   now()-interval '8 days'+interval '10 seconds',
   now()-interval '8 days'+interval '2 minutes',
   NULL),

  -- ⏳ Pending payment
  ('celebrity', 'new.user@example.com', NULL, 799,
   'Коллеге', 'Повышение', 'Поздравляю с новой должностью!',
   'pending', NULL, NULL,
   'pending', NULL, NULL, NULL, NULL);

INSERT INTO public.pm_api_logs (service, level, message, order_id) VALUES
  ('suno',    'error', 'Rate limit exceeded: 429 Too Many Requests', NULL),
  ('heygen',  'error', 'Insufficient credits: balance 0.00 USD',    NULL),
  ('resend',  'warn',  'Email delivery delayed: retry 2/3',          NULL),
  ('suno',    'info',  'Generation completed in 118s',               NULL);
