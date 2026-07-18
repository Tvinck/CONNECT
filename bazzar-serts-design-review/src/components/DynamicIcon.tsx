import {
  Crown, ShieldCheck, Shield, Video, Music, Play,
  Download, MessageCircle, Smartphone, Settings, Gift,
  type LucideProps,
} from 'lucide-react'
import type { ComponentType } from 'react'

/* ═══════════════════════════════════════════════════════════
   IconMap — Рендерит Lucide-иконку по строковому имени
   ═══════════════════════════════════════════════════════════ */

const MAP: Record<string, ComponentType<LucideProps>> = {
  Crown, ShieldCheck, Shield, Video, Music, Play,
  Download, MessageCircle, Smartphone, Settings, Gift,
}

interface Props extends LucideProps {
  name: string
}

export function DynamicIcon({ name, ...props }: Props) {
  const Icon = MAP[name]
  if (!Icon) return null
  return <Icon {...props} />
}
