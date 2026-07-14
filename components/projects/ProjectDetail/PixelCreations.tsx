'use client'

import { useState, useMemo } from 'react'
import { Search, Eye, Sparkles, X, Download, Film, Image as ImageIcon } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { Modal } from '@/components/ui/Modal'
import { EmptyState } from '@/components/ui/EmptyState'
import { getInitials, colorFor } from '@/lib/utils'

interface PixelCreationsProps {
  initialCreations: any[]
}

export function PixelCreations({ initialCreations }: PixelCreationsProps) {
  const [creations] = useState<any[]>(initialCreations)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<string>('all')
  const [activeMedia, setActiveMedia] = useState<any | null>(null)

  const filteredCreations = useMemo(() => {
    return creations.filter(c => {
      // Type filter
      if (filterType !== 'all') {
        if (filterType === 'video' && c.type !== 'video') return false
        if (filterType === 'image' && c.type !== 'image' && c.type !== 'photo') return false
      }
      
      // Search query
      if (!searchQuery) return true
      const q = searchQuery.toLowerCase()
      const prompt = c.prompt || c.description || ''
      const username = c.user?.username || ''
      return prompt.toLowerCase().includes(q) || username.toLowerCase().includes(q)
    })
  }, [creations, filterType, searchQuery])

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <h3 className="text-[16px] font-semibold">История генераций пользователей</h3>
          <span className="text-[11px] text-mute2 font-mono bg-black/[0.04] px-2 h-5 rounded-lg inline-flex items-center">
            {filteredCreations.length}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
            className="h-8 px-2.5 rounded-lg border border-line bg-bg text-[12.5px] text-mute hover:text-slate-800 transition-all outline-none"
          >
            <option value="all">Все типы</option>
            <option value="image">Фото / Изображения</option>
            <option value="video">Видео</option>
          </select>
          <div className="relative">
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Поиск по промпту/автору..."
              className="h-8 pl-8 pr-3 rounded-lg border border-line bg-bg/50 text-[12px] outline-none w-52 focus:border-accent/60 transition-all"
            />
            <Search size={12} className="absolute left-2.5 top-2.5 text-mute2" />
          </div>
        </div>
      </div>

      {filteredCreations.length === 0 ? (
        <EmptyState icon={Sparkles} title="Генераций не найдено" description="Здесь появятся изображения и видео, сгенерированные пользователями." />

      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filteredCreations.map(c => {
            const isVideo = c.type === 'video' || (c.image_url && c.image_url.match(/\.(mp4|webm|mov)$/i))
            const mediaSrc = c.image_url || c.result_url || ''
            
            return (
              <div
                key={c.id}
                onClick={() => setActiveMedia(c)}
                className="group relative aspect-[3/4] rounded-2xl overflow-hidden border border-line/40 bg-black/40 cursor-pointer transition-all hover:scale-[1.02] hover:shadow-lg hover:border-line2"
              >
                {/* Media element */}
                {isVideo ? (
                  <video
                    src={mediaSrc}
                    className="w-full h-full object-cover"
                    muted
                    loop
                    playsInline
                    autoPlay
                    preload="metadata"
                  />
                ) : (
                  <img
                    src={mediaSrc}
                    alt={c.prompt || 'Generation'}
                    loading="lazy"
                    className="w-full h-full object-cover"
                  />
                )}

                {/* Media type icon badge */}
                <div className="absolute top-2 left-2 p-1.5 rounded-lg bg-black/40 backdrop-blur-md border border-white/5 text-white/90">
                  {isVideo ? <Film size={12} /> : <ImageIcon size={12} />}
                </div>

                {/* Hover overlay details */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-end p-3">
                  <p className="text-[11px] text-white font-medium line-clamp-2 leading-tight mb-2">
                    {c.prompt || 'Без промпта'}
                  </p>
                  <div className="flex items-center gap-1.5 border-t border-white/10 pt-2">
                    <Avatar
                      initials={getInitials(c.user?.username || 'User')}
                      color={colorFor(c.user?.username || c.id)}
                      size={18}
                      src={c.user?.avatar_url}
                    />
                    <span className="text-[10px] text-white/80 truncate">
                      @{c.user?.username || 'user'}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Lightbox Modal */}
      {activeMedia && (
        <Modal
          title="Детали генерации"
          onClose={() => setActiveMedia(null)}
          footer={
            <div className="flex gap-2 w-full justify-between items-center text-[12px] text-mute2">
              <span>
                Создано:{' '}
                {new Date(activeMedia.created_at || activeMedia.completed_at).toLocaleString('ru-RU')}
              </span>
              <a
                href={activeMedia.image_url || activeMedia.result_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-accent hover:text-slate-800 transition-colors py-1 px-3 rounded-lg bg-accent/10 border border-accent/20"
              >
                <Download size={12} /> Скачать файл
              </a>
            </div>
          }
        >
          <div className="space-y-4">
            {/* Main view media */}
            <div className="aspect-[3/4] sm:aspect-video max-h-[420px] bg-black/50 rounded-2xl overflow-hidden border border-line flex items-center justify-center relative">
              {activeMedia.type === 'video' || (activeMedia.image_url && activeMedia.image_url.match(/\.(mp4|webm|mov)$/i)) ? (
                <video
                  src={activeMedia.image_url || activeMedia.result_url}
                  className="w-full h-full object-contain"
                  controls
                  autoPlay
                  loop
                />
              ) : (
                <img
                  src={activeMedia.image_url || activeMedia.result_url}
                  alt={activeMedia.prompt}
                  className="w-full h-full object-contain"
                />
              )}
            </div>

            {/* Prompt information */}
            <div className="rounded-xl bg-bg border border-line p-3.5 space-y-2">
              <div className="text-[10px] text-mute2 uppercase font-bold tracking-wider">Промпт</div>
              <p className="text-[13px] leading-relaxed text-slate-800 font-medium">
                {activeMedia.prompt || 'Без промпта'}
              </p>
              {activeMedia.model_id && (
                <div className="text-[11px] text-mute flex items-center gap-1.5 mt-2">
                  <span className="font-semibold bg-black/[0.04] border border-line px-1.5 py-0.5 rounded text-[10px] uppercase">
                    {activeMedia.model_id}
                  </span>
                  {activeMedia.metadata?.cost && (
                    <span>Стоимость: {activeMedia.metadata.cost} ⚡</span>
                  )}
                </div>
              )}
            </div>

            {/* Author card */}
            <div className="flex items-center gap-3 p-3 rounded-xl border border-line bg-bg">
              <Avatar
                initials={getInitials(activeMedia.user?.username || 'User')}
                color={colorFor(activeMedia.user?.username || activeMedia.id)}
                size={32}
                src={activeMedia.user?.avatar_url}
              />
              <div>
                <div className="text-[13px] font-bold text-slate-800">
                  @{activeMedia.user?.username || 'пользователь'}
                </div>
                <div className="text-[11px] text-mute2">
                  Идентификатор: {activeMedia.user_id}
                </div>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
