-- ============================================================================
-- CONNECT — seed data (Stage 1)
-- Run AFTER 0001_init.sql, in the Supabase SQL Editor.
--
-- Creates 5 team members. Login password for everyone: connect2026
--   artem@bazzar.group  (CEO)      masha@bazzar.group  (дизайн)
--   dima@bazzar.group   (dev)      sonya@bazzar.group  (продажи)
--   ivan@bazzar.group   (поддержка)
--
-- Safe to re-run: skips users that already exist.
-- ============================================================================

-- 1) Auth users (+ identities). Trigger handle_new_user() creates profiles.
do $$
declare
  r record;
  new_id uuid;
begin
  for r in
    select * from (values
      ('artem@bazzar.group', 'Артём Кошелев', 'ceo',     'CEO / Основатель'),
      ('masha@bazzar.group', 'Маша Лебедева', 'design',  'Ведущий дизайнер'),
      ('dima@bazzar.group',  'Дима Орлов',    'dev',     'Fullstack-разработчик'),
      ('sonya@bazzar.group', 'Соня Кирилова', 'sales',   'Менеджер по продажам'),
      ('ivan@bazzar.group',  'Иван Петров',   'support', 'Поддержка / SEO')
    ) as t(email, full_name, role, position)
  loop
    if exists (select 1 from auth.users where email = r.email) then
      continue;
    end if;

    new_id := gen_random_uuid();

    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, created_at, updated_at,
      raw_app_meta_data, raw_user_meta_data,
      confirmation_token, recovery_token, email_change_token_new, email_change
    ) values (
      '00000000-0000-0000-0000-000000000000', new_id,
      'authenticated', 'authenticated', r.email,
      crypt('connect2026', gen_salt('bf')),
      now(), now(), now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object('full_name', r.full_name, 'role', r.role),
      '', '', '', ''
    );

    insert into auth.identities (
      provider_id, user_id, identity_data, provider,
      last_sign_in_at, created_at, updated_at
    ) values (
      r.email, new_id,
      jsonb_build_object('sub', new_id::text, 'email', r.email, 'email_verified', true),
      'email', now(), now(), now()
    );

    -- Trigger already inserted the profile; enrich it.
    update public.users
       set full_name = r.full_name,
           role      = r.role,
           position  = r.position
     where id = new_id;
  end loop;
end $$;

-- 2) Profile stats (points / level / status / avatar color seed)
update public.users set points = 340, level = 4, status = 'online'  where email = 'artem@bazzar.group';
update public.users set points = 280, level = 3, status = 'online'  where email = 'masha@bazzar.group';
update public.users set points = 410, level = 4, status = 'online'  where email = 'dima@bazzar.group';
update public.users set points = 190, level = 2, status = 'offline' where email = 'sonya@bazzar.group';
update public.users set points = 150, level = 2, status = 'online'  where email = 'ivan@bazzar.group';

-- 3) Projects
insert into public.projects (name, slug, emoji, color, status, progress, description) values
  ('ПодариМомент', 'podari', '🎁', '#1472F5', 'active',   80, 'Сервис подарочных эмоций и впечатлений'),
  ('PIXEL',        'pixel',  '✨', '#FF4D9D', 'dev',      35, 'Дизайн-студия и продакшн'),
  ('Veil VPN',     'veil',   '🔒', '#6F4FE8', 'dev',      15, 'Высокоскоростной и безопасный VPN-сервис'),
  ('BAZZAR MARKET','bazzar', '🛒', '#22C55E', 'planning', 12, 'Маркетплейс товаров BAZZAR')
on conflict (slug) do nothing;

-- 4) Channels
insert into public.channels (slug, name, description) values
  ('general', 'общий',      'Всё подряд'),
  ('dev',     'разработка', 'Технические обсуждения'),
  ('sales',   'продажи',    'Лиды, сделки, выручка'),
  ('design',  'дизайн',     'Макеты и ревью'),
  ('support', 'поддержка',  'Вопросы клиентов и SEO')
on conflict (slug) do nothing;

-- 5) Achievements
insert into public.achievements (key, title, description, icon, points) values
  ('ten_streak', 'Десятка',     'Закрыто 10 задач подряд',        '🏆', 25),
  ('first_task', 'Первый шаг',  'Закрыта первая задача',          '✅', 5),
  ('night_owl',  'Сова',        'Задача закрыта после полуночи',  '🌚', 10),
  ('rainmaker',  'Дождь сделок','Закрыто 5 сделок за неделю',     '💰', 30)
on conflict (key) do nothing;

-- 6) Tasks  (users referenced by email, projects by slug)
insert into public.tasks (title, description, assignee_id, creator_id, status, priority, due_date, project_id, points_reward)
select t.title, t.description,
       (select id from public.users where email = t.assignee),
       (select id from public.users where email = t.creator),
       t.status, t.priority, t.due_date,
       (select id from public.projects where slug = t.project),
       t.points
from (values
  ('Доделать оплату Suno API',  'Подключить и протестировать оплату',          'dima@bazzar.group',  'artem@bazzar.group', 'in_progress', 'urgent', now() + interval '6 hours',  'podari', 20),
  ('Дизайн карточки заказа',    'Состояния hover и пустое',                    'masha@bazzar.group', 'masha@bazzar.group', 'in_progress', 'high',   now() + interval '1 day',    'podari', 15),
  ('Согласовать тариф PIXEL',   'Финальная сетка тарифов',                     'sonya@bazzar.group', 'artem@bazzar.group', 'todo',        'medium', now() + interval '3 days',   'pixel',  10),
  ('Подготовить пост в TG',     'Анонс запуска',                               'ivan@bazzar.group',  'artem@bazzar.group', 'todo',        'low',    now() + interval '7 days',   'bazzar', 5),
  ('Интеграция Stripe',         'Платёжный шлюз для подписок',                 'dima@bazzar.group',  'dima@bazzar.group',  'done',        'high',   now() - interval '1 day',    'podari', 20),
  ('Аналитика воронки',         'Дашборд конверсий',                           'dima@bazzar.group',  'dima@bazzar.group',  'review',      'medium', now() + interval '2 days',   'pixel',  15)
) as t(title, description, assignee, creator, status, priority, due_date, project, points)
where not exists (select 1 from public.tasks x where x.title = t.title);

-- 7) Clients
insert into public.clients (name, email, phone, source, status, manager_id, total_spent)
select c.name, c.email, c.phone, c.source, c.status,
       (select id from public.users where email = c.manager), c.total_spent
from (values
  ('ООО «Светлый путь»', 'info@svetly.ru',   '+7 900 111-22-33', 'Сайт',     'vip',     'sonya@bazzar.group', 480000),
  ('Анна Морозова',      'anna@mail.ru',     '+7 900 222-33-44', 'Инстаграм','active',  'sonya@bazzar.group', 95000),
  ('Tech Solutions',     'hello@techsol.io', '+7 900 333-44-55', 'Реклама',  'lead',    'sonya@bazzar.group', 0),
  ('Дмитрий Волков',     'volkov@gmail.com', '+7 900 444-55-66', 'Рекомендация','active','ivan@bazzar.group',  210000)
) as c(name, email, phone, source, status, manager, total_spent)
where not exists (select 1 from public.clients x where x.name = c.name);

-- 8) Messages (channel "общий")
insert into public.messages (channel_id, sender_id, content, created_at)
select (select id from public.channels where slug = 'general'),
       (select id from public.users where email = m.email),
       m.content, now() - (m.mins || ' minutes')::interval
from (values
  ('artem@bazzar.group', 'Глянь новый макет карточки заказа — обновил состояния hover и пустое.', 30),
  ('masha@bazzar.group', 'Огонь 🔥 только отступы на нижнем блоке поправь — 24 везде, у тебя 16.', 27),
  ('artem@bazzar.group', 'Принял, сейчас поправлю и закину обновлённую версию.', 24),
  ('dima@bazzar.group',  'Я тогда подожду с версткой до финала — чтобы дважды не переделывать.', 18),
  ('masha@bazzar.group', 'Договорились. Постараюсь закрыть к концу дня 🌚', 16)
) as m(email, content, mins)
where not exists (
  select 1 from public.messages x
  where x.content = m.content
    and x.channel_id = (select id from public.channels where slug = 'general')
);

-- 9) Knowledge base
insert into public.knowledge_articles (title, content, category, author_id, views, read_time)
select k.title, k.content, k.category,
       (select id from public.users where email = k.author), k.views, k.read_time
from (values
  ('Как мы запускаем проект',     'Этапы от идеи до релиза…',          'Процессы', 'artem@bazzar.group', 124, 6),
  ('Гайд по дизайн-системе',      'Токены, отступы, компоненты…',      'Дизайн',   'masha@bazzar.group', 89,  8),
  ('Деплой и окружения',          'Как катим в прод без боли…',        'Разработка','dima@bazzar.group',  56,  5),
  ('Скрипты продаж BAZZAR',       'Как ведём клиента по воронке…',     'Продажи',  'sonya@bazzar.group', 73,  4)
) as k(title, content, category, author, views, read_time)
where not exists (select 1 from public.knowledge_articles x where x.title = k.title);

-- 10) Notifications for the CEO
insert into public.notifications (user_id, type, title, body, link)
select (select id from public.users where email = 'artem@bazzar.group'),
       n.type, n.title, n.body, n.link
from (values
  ('task',  'Новая задача от Маши',      'Дизайн карточки заказа · ПодариМомент', '/tasks'),
  ('ach',   'Получена ачивка «Десятка»', 'Закрыто 10 задач подряд · +25 баллов',  '/profile'),
  ('alert', 'Срочно: оплата Suno API',   'Дедлайн сегодня в 18:00',               '/tasks')
) as n(type, title, body, link)
where not exists (select 1 from public.notifications x
  where x.title = n.title
    and x.user_id = (select id from public.users where email = 'artem@bazzar.group'));

-- 11) Award the «Десятка» achievement to the CEO
insert into public.user_achievements (user_id, achievement_id)
select (select id from public.users where email = 'artem@bazzar.group'),
       (select id from public.achievements where key = 'ten_streak')
on conflict do nothing;
