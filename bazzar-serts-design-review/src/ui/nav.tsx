import { createContext, useContext, type ReactNode, type MouseEvent, type CSSProperties, type AnchorHTMLAttributes } from 'react'

/**
 * Роутер-независимая навигация для библиотеки компонентов BAZZAR.
 *
 * Зачем: компоненты дизайн-системы (Header/Footer/ProductCard и т.п.) НЕ должны
 * зависеть от react-router напрямую — иначе их нельзя переиспользовать вне
 * приложения (например, в claude.ai/design или в другом проекте), и они падают
 * без <BrowserRouter>. Здесь они получают навигацию через контекст, а по
 * умолчанию (без провайдера) деградируют до обычной ссылки <a> — то есть
 * рендерятся и работают где угодно.
 */

type NavFn = (to: string) => void

const NavContext = createContext<NavFn | null>(null)

/** Оборачивает приложение и отдаёт компонентам SPA-навигацию (напр. из react-router). */
export function NavProvider({ navigate, children }: { navigate: NavFn; children: ReactNode }) {
  return <NavContext.Provider value={navigate}>{children}</NavContext.Provider>
}

/** Возвращает функцию навигации: SPA из провайдера, иначе — переход по адресу. */
export function useNav(): NavFn {
  const ctx = useContext(NavContext)
  return ctx ?? ((to: string) => { if (typeof window !== 'undefined') window.location.assign(to) })
}

type LinkProps = {
  to: string
  children?: ReactNode
  className?: string
  style?: CSSProperties
  onClick?: (e: MouseEvent<HTMLAnchorElement>) => void
} & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href' | 'onClick' | 'style' | 'className'>

/**
 * Ссылка дизайн-системы. Рендерит семантический <a href>, а обычный левый клик
 * (без модификаторов) перехватывает в SPA-навигацию, если есть провайдер.
 * Без провайдера ведёт себя как нативная ссылка — поэтому работает автономно.
 */
export function Link({ to, children, className, style, onClick, ...rest }: LinkProps) {
  const nav = useNav()
  return (
    <a
      href={to}
      className={className}
      style={style}
      onClick={(e) => {
        onClick?.(e)
        if (!e.defaultPrevented && e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey) {
          e.preventDefault()
          nav(to)
        }
      }}
      {...rest}
    >
      {children}
    </a>
  )
}
