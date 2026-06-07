-- ============================================================================
-- CONNECT — add Veil VPN project (0017)
-- ============================================================================

insert into public.projects (name, slug, emoji, color, status, progress, description)
values ('Veil VPN', 'veil', '🔒', '#6F4FE8', 'dev', 15, 'Высокоскоростной и безопасный VPN-сервис')
on conflict (slug) do nothing;
