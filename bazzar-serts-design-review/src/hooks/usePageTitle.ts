import { useEffect } from 'react'
import { useI18n } from './useI18n'

/* ═══════════════════════════════════════════════════════════
   usePageTitle — Динамический заголовок страницы в браузере
   ═══════════════════════════════════════════════════════════ */

const BASE_TITLE = 'Bazzar Certs'

export function usePageTitle(title?: string) {
  const { t, lang } = useI18n()

  useEffect(() => {
    document.title = title
      ? `${title} — ${BASE_TITLE}`
      : `${BASE_TITLE} — ${t('meta.tagline')}`
  }, [title, lang])
}
