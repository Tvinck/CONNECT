/**
 * components/layout/nav-config.ts — Single source of truth for primary navigation.
 *
 * Shared by the Sidebar and the Command Palette (Ctrl/Cmd+K) so both stay in
 * sync. Keep the shape identical to what Sidebar relied on when this lived
 * inline: each item has key/label/href/icon, some carry `ceoOnly`.
 */

import {
  Home, CheckSquare, Folder, BookOpen, Users, User, LayoutGrid,
  MessageSquare, Shield, Settings, ShoppingBag, Wallet, Lightbulb,
  Newspaper, Search, Activity, Wand2, HeadphonesIcon,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export interface NavItem {
  key: string
  label: string
  href: string
  icon: LucideIcon
  ceoOnly?: boolean
  /**
   * Permission-matrix section name this item is gated by, exactly as stored in
   * the `role_permissions` DB table and enforced by `verifyPagePermission`.
   * When set, the item is only shown to users whose permission level for this
   * section is > 0. Items without a `section` are ungated (always visible,
   * unless `ceoOnly`). Keep these names identical to lib/permissions.ts.
   */
  section?: string
}

export interface NavGroup {
  label: string
  items: readonly NavItem[]
}

export const NAV_GROUPS: readonly NavGroup[] = [
  {
    label: 'Работа',
    items: [
      { key: 'dashboard', label: 'Главная',     href: '/dashboard', icon: Home,       section: 'Дашборд' },
      { key: 'news',      label: 'Новости',     href: '/news',      icon: Newspaper },
      { key: 'tasks',     label: 'Задачи',      href: '/tasks',     icon: CheckSquare, section: 'Задачи' },
      { key: 'projects',  label: 'Проекты',     href: '/projects',  icon: Folder,     section: 'Проекты' },
      { key: 'knowledge', label: 'База знаний', href: '/knowledge', icon: BookOpen,   section: 'База знаний' },
      { key: 'ideas',     label: 'Идеи',        href: '/ideas',     icon: Lightbulb,  section: 'Идеи' },
      { key: 'skinscan',  label: 'СкинСкан (Beta)', href: '/skinscan', icon: Search },
    ],
  },
  {
    label: 'Бизнес',
    items: [
      { key: 'finances', label: 'Финансы',   href: '/finances', icon: Wallet,        section: 'Финансы' },
      { key: 'crm',      label: 'CRM',       href: '/crm',      icon: Users,         section: 'CRM' },
      { key: 'services', label: 'Сервисы',   href: '/services', icon: LayoutGrid,    section: 'Сервисы' },
      { key: 'shop',     label: 'Магазин',   href: '/shop',     icon: ShoppingBag,   section: 'Заказы' },
      { key: 'factory',  label: 'ИИ Завод',  href: '/factory',  icon: Wand2 },
      { key: 'support',  label: 'Поддержка', href: '/support',  icon: HeadphonesIcon },
    ],
  },
  {
    label: 'Команда',
    items: [
      { key: 'employees', label: 'Сотрудники', href: '/employees', icon: User },
      { key: 'chats',     label: 'Чаты',       href: '/chats',     icon: MessageSquare, section: 'Чаты' },
    ],
  },
  {
    label: 'Управление',
    items: [
      { key: 'monitoring', label: 'Мониторинг', href: '/monitoring', icon: Activity, ceoOnly: true },
      { key: 'profile',    label: 'Профиль',    href: '/profile',    icon: Settings },
    ],
  },
]

/** Flattened list of every nav item, with its group label attached. */
export const NAV_ITEMS: readonly (NavItem & { group: string })[] = NAV_GROUPS.flatMap(
  (g) => g.items.map((item) => ({ ...item, group: g.label }))
)
