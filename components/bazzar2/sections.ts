import {
  LayoutDashboard,
  TrendingUp,
  BadgeCheck,
  Package,
  Repeat,
  Users,
  MessageSquareWarning,
  Wallet,
  BarChart3,
  Users2,
  History,
  Newspaper,
  type LucideIcon,
} from 'lucide-react'

// Разделы командного центра BazzarSerts 2.0 (верхняя навигация, без сайдбара).
export interface B2Section {
  key: string
  label: string
  icon: LucideIcon
  primary: boolean // primary — в основном ряду, иначе в overflow «Ещё»
}

export const B2_SECTIONS: B2Section[] = [
  { key: 'overview', label: 'Обзор', icon: LayoutDashboard, primary: true },
  { key: 'sales', label: 'Продажи', icon: TrendingUp, primary: true },
  { key: 'registrations', label: 'Регистрации', icon: BadgeCheck, primary: true },
  { key: 'catalog', label: 'Каталог', icon: Package, primary: true },
  { key: 'subscriptions', label: 'Подписки', icon: Repeat, primary: true },
  { key: 'users', label: 'Пользователи', icon: Users, primary: true },
  { key: 'reputation', label: 'Репутация', icon: MessageSquareWarning, primary: true },
  { key: 'finance', label: 'Финансы', icon: Wallet, primary: true },
  { key: 'analytics', label: 'Аналитика', icon: BarChart3, primary: false },
  { key: 'blog', label: 'Блог', icon: Newspaper, primary: false },
  { key: 'team', label: 'Команда и задачи', icon: Users2, primary: false },
  { key: 'activity', label: 'Активность', icon: History, primary: false },
]

export const B2_SECTION_KEYS = B2_SECTIONS.map((s) => s.key)

export function b2Section(key: string): B2Section | undefined {
  return B2_SECTIONS.find((s) => s.key === key)
}

export function b2Label(key: string): string {
  return b2Section(key)?.label ?? key
}
