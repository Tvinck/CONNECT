-- ============================================================================
-- CONNECT — Fix apple_certificates public read (price/margin leak) (20260718)
-- ============================================================================
-- Раньше: политика "Allow public read" с USING (true) — любой аноним мог
-- выгрузить ВСЕ строки, включая api_cost / sale_price (себестоимость и маржу).
-- Теперь: аноним видит серт ТОЛЬКО указав конкретный udid (?udid=eq.<udid>),
-- как это делает личный кабинет (useProfile: .eq('udid', ...)). Операторы —
-- через существующую политику для authenticated. Тот же паттерн get_query_param,
-- что уже применён к support_messages / vpn_subscriptions.
-- ============================================================================

drop policy if exists "Allow public read" on public.apple_certificates;

create policy "Public select cert by udid"
  on public.apple_certificates for select to anon
  using (
    get_query_param('udid') is not null
    and udid = get_query_param('udid')
  );
