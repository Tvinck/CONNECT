'use client'

/**
 * SkinCard.tsx — визуальная карточка с изображением скина, названием и базовой информацией.
 * Карточка используется в главном экране поиска и в списке результатов.
 */

import Image from 'next/image'
import { getSteamCdnUrl } from '@/lib/skinscan/utils'

interface SkinCardProps {
  name: string
  nameRu?: string
  iconUrl: string // raw icon path from API
  price?: number
  currency?: 'RUB' | 'USD'
  onClick?: () => void
}

export function SkinCard({ name, nameRu, iconUrl, price, currency = 'RUB', onClick }: SkinCardProps) {
  const cdnUrl = getSteamCdnUrl(iconUrl)

  return (
    <div
      onClick={onClick}
      className="cursor-pointer group w-full bg-[#1C1D2A] border border-white/[0.04] rounded-2xl overflow-hidden hover:border-[#1472F5] hover:shadow-[0_8px_30px_rgba(20,114,245,0.15)] transition-all flex flex-col h-full"
    >
      <div className="relative h-44 w-full bg-[#13141C] flex items-center justify-center p-4">
        {/* Image with fallback placeholder */}
        <div className="relative w-4/5 h-4/5">
          <Image
            src={cdnUrl}
            alt={name}
            fill
            className="object-contain opacity-90 group-hover:opacity-100 group-hover:scale-105 transition-all duration-300"
            sizes="(max-width: 640px) 100vw, 250px"
          />
        </div>
      </div>
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="text-white font-semibold text-[14px] truncate" title={nameRu || name}>
            {nameRu || name}
          </h3>
          {nameRu && (
            <p className="text-[#8E92BC] text-[11px] truncate mt-0.5">
              {name}
            </p>
          )}
          {price !== undefined && (
            <div className="mt-2.5 text-[13.5px] font-extrabold text-[#1472F5] group-hover:text-blue-400 transition-colors">
              {currency === 'RUB'
                ? `от ${Math.round(price).toLocaleString('ru-RU')} ₽`
                : `from $${price.toFixed(2)}`
              }
            </div>
          )}
        </div>
        <p className="mt-3 text-[#5A5D7F] group-hover:text-[#1472F5] text-[11.5px] transition-colors font-medium">
          Сравнить цены →
        </p>
      </div>
    </div>
  )
}

