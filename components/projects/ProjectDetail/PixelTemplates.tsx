'use client'

import { useState, useMemo } from 'react'
import { Plus, Search, LayoutGrid, LayoutList, Eye, EyeOff, Edit, ArrowUpDown } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { PixelEditTemplateModal } from './PixelEditTemplateModal'
import { useAuthStore } from '@/store/auth'

interface PixelTemplatesProps {
  initialTemplates: any[]
  categories: any[]
  stars: any[]
}

export function PixelTemplates({ initialTemplates, categories, stars }: PixelTemplatesProps) {
  const [templates, setTemplates] = useState<any[]>(initialTemplates)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<any | null>(null)

  const role = useAuthStore(s => s.role)
  const canEdit = role === 'ceo' || role === 'coowner'

  const activeCategoryList = useMemo(() => {
    if (categories && categories.length > 0) return categories
    return [
      { slug: 'trends', label: 'Тренды' },
      { slug: 'dances', label: 'Танцы' },
      { slug: 'photo', label: 'Фото' },
      { slug: 'video', label: 'Видео' },
      { slug: 'pets', label: 'Питомцы' },
      { slug: 'cars', label: 'Авто' },
      { slug: 'effects', label: 'Эффекты' }
    ]
  }, [categories])

  const filteredTemplates = useMemo(() => {
    return templates.filter(t => {
      // Category filter
      if (selectedCategory !== 'all' && t.category !== selectedCategory) return false

      // Search query
      if (!searchQuery) return true
      const q = searchQuery.toLowerCase()
      const title = t.title || ''
      const prompt = t.prompt || t.generation_prompt || ''
      return title.toLowerCase().includes(q) || prompt.toLowerCase().includes(q)
    })
  }, [templates, selectedCategory, searchQuery])

  const handleOpenAdd = () => {
    setEditingTemplate({
      id: `tpl_${Math.random().toString(36).substring(2, 11)}`,
      title: '',
      description: '',
      src: '',
      prompt: '',
      generation_prompt: '',
      model_id: 'kie-face-swap',
      category: activeCategoryList[0]?.slug || 'trends',
      sort_order: templates.length + 10,
      is_active: true,
      media_type: 'image',
      required_files_count: 1,
      generation_cost: 1,
      is_new: true // marker for insert vs update
    })
    setShowEditModal(true)
  }

  const handleOpenEdit = (tpl: any) => {
    setEditingTemplate({ ...tpl, is_new: false })
    setShowEditModal(true)
  }

  const handleSaved = (savedTpl: any, isNew: boolean) => {
    if (isNew) {
      setTemplates(prev => [...prev, savedTpl].sort((a, b) => (a.sort_order || 999) - (b.sort_order || 999)))
    } else {
      setTemplates(prev =>
        prev
          .map(t => (t.id === savedTpl.id ? savedTpl : t))
          .sort((a, b) => (a.sort_order || 999) - (b.sort_order || 999))
      )
    }
    setShowEditModal(false)
    setEditingTemplate(null)
  }

  const handleDeleted = (deletedId: string) => {
    setTemplates(prev => prev.filter(t => t.id !== deletedId))
    setShowEditModal(false)
    setEditingTemplate(null)
  }

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <h3 className="text-[16px] font-semibold">Галерея шаблонов Pixel AI</h3>
          <span className="text-[11px] text-mute2 font-mono bg-white/[0.04] px-2 h-5 rounded-md inline-flex items-center">
            {filteredTemplates.length}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Поиск по названию/промпту..."
              className="h-8 pl-8 pr-3 rounded-lg border border-line bg-bg/50 text-[12px] outline-none w-52 focus:border-accent/60 transition-all"
            />
            <Search size={12} className="absolute left-2.5 top-2.5 text-mute2" />
          </div>
          {canEdit && (
            <Button size="sm" onClick={handleOpenAdd} className="bg-accent text-white">
              <Plus size={13} /> Шаблон
            </Button>
          )}
        </div>
      </div>

      {/* Category filter bar */}
      <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-3 mb-4 border-b border-line/50">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`h-8 px-3.5 rounded-full text-[12px] font-semibold whitespace-nowrap transition-all ${
            selectedCategory === 'all'
              ? 'bg-white text-bg-sidebar shadow'
              : 'hover:bg-white/[0.04] text-mute'
          }`}
        >
          Все категории
        </button>
        {activeCategoryList.map(c => (
          <button
            key={c.slug}
            onClick={() => setSelectedCategory(c.slug)}
            className={`h-8 px-3.5 rounded-full text-[12px] font-semibold whitespace-nowrap transition-all ${
              selectedCategory === c.slug
                ? 'bg-white text-bg-sidebar shadow'
                : 'hover:bg-white/[0.04] text-mute'
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Templates Grid */}
      {filteredTemplates.length === 0 ? (
        <div className="text-center py-12 text-mute text-[13px]">
          В этой категории шаблонов не найдено
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filteredTemplates.map(t => {
            const isVideo = t.media_type === 'video' || (t.src && t.src.match(/\.(mp4|webm|mov)$/i))
            const activeCategory = activeCategoryList.find(c => c.slug === t.category)
            
            return (
              <div
                key={t.id}
                onClick={() => handleOpenEdit(t)}
                className="group relative aspect-[9/16] rounded-2xl overflow-hidden border border-line/40 bg-black/40 cursor-pointer transition-all hover:scale-[1.02] hover:shadow-lg hover:border-line2 flex flex-col justify-end"
              >
                {/* Visual preview */}
                {t.src ? (
                  isVideo ? (
                    <video
                      src={`${t.src}#t=0.1`}
                      className="absolute inset-0 w-full h-full object-cover"
                      muted
                      preload="metadata"
                      playsInline
                    />
                  ) : (
                    <img
                      src={t.src}
                      alt={t.title}
                      className="absolute inset-0 w-full h-full object-cover"
                      loading="lazy"
                    />
                  )
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-white/[0.02] text-mute2 text-[12px]">
                    Нет превью
                  </div>
                )}

                {/* Badges */}
                <div className="absolute top-2 left-2 flex gap-1 flex-wrap">
                  {!t.is_active && (
                    <span className="text-[9px] font-bold bg-err/10 text-err border border-err/20 px-1.5 py-0.5 rounded-md flex items-center gap-1">
                      <EyeOff size={9} /> Выкл
                    </span>
                  )}
                  {t.generation_cost > 1 && (
                    <span className="text-[9px] font-bold bg-accent/20 text-accent px-1.5 py-0.5 rounded-md">
                      {t.generation_cost} ⚡
                    </span>
                  )}
                </div>

                <div className="absolute top-2 right-2 text-[10px] bg-black/50 backdrop-blur-md px-1.5 py-0.5 rounded-md text-white font-mono font-medium">
                  {t.sort_order}
                </div>

                {/* Edit hint overlay */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="p-2.5 rounded-full bg-white/10 backdrop-blur-md text-white">
                    {canEdit ? <Edit size={16} /> : <Eye size={16} />}
                  </span>
                </div>

                {/* Metadata details */}
                <div className="relative z-10 p-3 bg-gradient-to-t from-black/95 via-black/40 to-transparent w-full">
                  <h4 className="text-[12.5px] font-bold leading-snug text-white line-clamp-1">
                    {t.title || 'Без названия'}
                  </h4>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-[9.5px] text-white/50 bg-white/5 px-1.5 py-0.5 rounded uppercase tracking-wider">
                      {activeCategory?.label || t.category}
                    </span>
                    <span className="text-[9.5px] text-mute2 truncate max-w-[80px]">
                      {t.model_id}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Edit/Add Modal */}
      {showEditModal && editingTemplate && (
        <PixelEditTemplateModal
          template={editingTemplate}
          categories={activeCategoryList}
          onClose={() => {
            setShowEditModal(false)
            setEditingTemplate(null)
          }}
          onSaved={handleSaved}
          onDeleted={handleDeleted}
        />
      )}
    </div>
  )
}
