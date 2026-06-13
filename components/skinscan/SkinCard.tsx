'use client'

/**
 * SkinCard.tsx — визуальная карточка с изображением скина, названием и базовой информацией.
 * Карточка используется в главном экране поиска и в списке результатов.
 */

import Image from 'next/image'
import { getSteamCdnUrl } from '@/lib/skinscan/pricempire'

interface SkinCardProps {
  name: string
  iconUrl: string // raw icon path from API (may be relative)
  onClick?: () => void
}

export function SkinCard({ name, iconUrl, onClick }: SkinCardProps) {
  const cdnUrl = getSteamCdnUrl(iconUrl)

  return (
    <div
      onClick={onClick}
      className="cursor-pointer group w-full max-w-sm bg-[#1C1D2A] border border-white/[0.04] rounded-2xl overflow-hidden hover:border-[#BFF128] transition-all"
    >
      <div className="relative h-48 w-full bg-[#13141C]">
        {/* Image with fallback placeholder */}
        <Image
          src={cdnUrl}
          alt={name}
          fill
          className="object-cover opacity-90 group-hover:opacity-100 transition-opacity"
          sizes="(max-width: 640px) 100vw, 200px"
        />
      </div>
      <div className="p-4">
        <h3 className="text-white font-semibold text-[14px] truncate" title={name}>
          {name}
        </h3>
        <p className="mt-1 text-[#8E92BC] text-[12px]">Кликните, чтобы увидеть детали и сравнение цен</p>
      </div>
    </div>
  )
}
