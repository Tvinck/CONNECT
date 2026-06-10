'use client'

import { useState, useMemo, useEffect } from 'react'
import {
  Lightbulb, Wrench, Ban, CheckCircle, List,
  MessageSquare, ChevronUp, ChevronDown, Search,
  Plus, Clock, Heart, Eye, ArrowRight
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'
import { createClient } from '@/lib/supabase/client'
import { getInitials, colorFor, timeAgo } from '@/lib/utils'
import { CreateIdeaModal } from './CreateIdeaModal'
import { IdeaDetailsModal } from './IdeaDetailsModal'

export type IdeaVote = {
  user_id: string
  value: number
}

export type Idea = {
  id: string
  title: string
  description: string
  status: 'new' | 'planned' | 'rejected' | 'implemented'
  views: number
  project_id: string | null
  author_id: string
  attachments: string[]
  links: string[]
  created_at: string
  project: { id: string; name: string; color: string; emoji: string | null } | null
  author: { id: string; full_name: string } | null
  idea_tags: { tag: { id: string; name: string } }[]
  comments: { id: string }[]
  votes: IdeaVote[]
}

type ProjectOption = { id: string; name: string; color: string; emoji: string | null }
type TagOption = { id: string; name: string }

interface Props {
  initialIdeas: Idea[]
  projects: ProjectOption[]
  allTags: TagOption[]
  currentUser: { id: string; full_name: string; role: string | null }
}

export const CATEGORY_META = {
  all:         { label: 'Все',           emoji: '⚡', color: '#8E92BC', icon: List },
  new:         { label: 'Новые идеи',     emoji: '💡', color: '#F59E0B', icon: Lightbulb },
  planned:     { label: 'Запланировано',  emoji: '🛠️', color: '#1472F5', icon: Wrench },
  rejected:    { label: 'Отклонено',      emoji: '🚫', color: '#EF4444', icon: Ban },
  implemented: { label: 'Реализовано',    emoji: '✅', color: '#22C55E', icon: CheckCircle },
} as const

export function IdeasClient({ initialIdeas, projects, allTags, currentUser }: Props) {
  const supabase = createClient()
  const [ideas, setIdeas] = useState<Idea[]>(initialIdeas)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState<keyof typeof CATEGORY_META>('all')
  const [selectedTag, setSelectedTag] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<'newest' | 'votes' | 'oldest'>('newest')

  const [showCreate, setShowCreate] = useState(false)
  const [viewingIdea, setViewingIdea] = useState<Idea | null>(null)

  // Recalculate tag list dynamically based on ideas tag counts
  const tagsWithCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    ideas.forEach(idea => {
      idea.idea_tags?.forEach(it => {
        if (it.tag) {
          counts[it.tag.name] = (counts[it.tag.name] ?? 0) + 1
        }
      })
    })

    // Combine with allTags to make sure we show them
    return allTags.map(t => ({
      ...t,
      count: counts[t.name] ?? 0
    })).sort((a, b) => b.count - a.count)
  }, [ideas, allTags])

  // Count items per category
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: ideas.length, new: 0, planned: 0, rejected: 0, implemented: 0 }
    ideas.forEach(idea => {
      if (idea.status in counts) {
        counts[idea.status]++
      }
    })
    return counts
  }, [ideas])

  // Voting handler with optimistic UI updates
  const handleVote = async (ideaId: string, type: 'up' | 'down') => {
    const idea = ideas.find(i => i.id === ideaId)
    if (!idea) return

    const originalVotes = idea.votes
    const existingVote = originalVotes.find(v => v.user_id === currentUser.id)
    const targetValue = type === 'up' ? 1 : -1

    let nextVotes = [...originalVotes]
    if (existingVote) {
      if (existingVote.value === targetValue) {
        // Toggle vote off
        nextVotes = nextVotes.filter(v => v.user_id !== currentUser.id)
      } else {
        // Switch vote type
        nextVotes = nextVotes.map(v => v.user_id === currentUser.id ? { ...v, value: targetValue } : v)
      }
    } else {
      // Add new vote
      nextVotes.push({ user_id: currentUser.id, value: targetValue })
    }

    // Optimistically update local state
    setIdeas(prev => prev.map(i => i.id === ideaId ? { ...i, votes: nextVotes } : i))

    // If modal is open for this idea, update it as well
    if (viewingIdea && viewingIdea.id === ideaId) {
      setViewingIdea(prev => prev ? { ...prev, votes: nextVotes } : null)
    }

    try {
      if (existingVote && existingVote.value === targetValue) {
        // Delete vote
        await supabase.from('idea_votes').delete().eq('idea_id', ideaId).eq('user_id', currentUser.id)
      } else {
        // Upsert vote
        await supabase.from('idea_votes').upsert({ idea_id: ideaId, user_id: currentUser.id, value: targetValue })
      }
    } catch {
      // Rollback on database failure
      setIdeas(prev => prev.map(i => i.id === ideaId ? { ...i, votes: originalVotes } : i))
      if (viewingIdea && viewingIdea.id === ideaId) {
        setViewingIdea(prev => prev ? { ...prev, votes: originalVotes } : null)
      }
    }
  }

  // Filter & Sort ideas
  const filteredIdeas = useMemo(() => {
    return ideas
      .filter(idea => {
        // Category filter
        if (activeCategory !== 'all' && idea.status !== activeCategory) return false

        // Tag filter
        if (selectedTag) {
          const hasTag = idea.idea_tags?.some(it => it.tag?.name === selectedTag)
          if (!hasTag) return false
        }

        // Search query filter
        if (searchQuery.trim()) {
          const query = searchQuery.toLowerCase().trim()
          const matchesTitle = idea.title.toLowerCase().includes(query)
          const matchesDesc = idea.description.toLowerCase().includes(query)
          const matchesProject = idea.project?.name.toLowerCase().includes(query)
          if (!matchesTitle && !matchesDesc && !matchesProject) return false
        }

        return true
      })
      .sort((a, b) => {
        if (sortBy === 'newest') {
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        }
        if (sortBy === 'oldest') {
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        }
        if (sortBy === 'votes') {
          const scoreA = a.votes.reduce((sum, v) => sum + v.value, 0)
          const scoreB = b.votes.reduce((sum, v) => sum + v.value, 0)
          if (scoreA !== scoreB) return scoreB - scoreA
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        }
        return 0
      })
  }, [ideas, searchQuery, activeCategory, selectedTag, sortBy])

  return (
    <div className="bg-[#0b0c15] text-white rounded-[24px] border border-white/[0.04] p-6 lg:p-8 min-h-[85vh] relative overflow-hidden shadow-2xl">
      {/* Decorative Blur Blobs */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-violet-600/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-600/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/[0.06] relative z-10">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-violet-600/15 border border-violet-500/30 flex items-center justify-center text-violet-400 shadow-[0_0_15px_rgba(124,58,237,0.15)]">
            <Lightbulb size={24} className="animate-pulse" />
          </div>
          <div>
            <h1 className="text-[22px] font-bold tracking-tight text-white font-sans">У вас есть идея?</h1>
            <p className="text-[13px] text-[#8E92BC] mt-0.5">Предлагайте свои идеи по улучшению BAZZAR Group</p>
          </div>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 hover:shadow-[0_0_15px_rgba(79,70,229,0.3)] text-white font-semibold text-[13.5px] px-5 h-11 rounded-xl transition-all flex items-center justify-center gap-2 shrink-0 self-start sm:self-center"
        >
          <Plus size={16} />
          Предложить идею
        </button>
      </div>

      {/* Search and Sort row */}
      <div className="flex flex-col md:flex-row md:items-center gap-4 mt-6 relative z-10">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Поиск по идеям…"
            className="w-full h-11 pl-10 pr-4 bg-[#141622]/60 border border-white/[0.05] rounded-xl text-[13.5px] text-white placeholder-slate-500 focus:border-indigo-500/60 focus:bg-[#181b2a]/80 outline-none transition-all"
          />
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mt-6 relative z-10">
        {/* Left Column: Ideas List */}
        <div className="lg:col-span-3 space-y-4">
          {filteredIdeas.length === 0 ? (
            <div className="bg-[#141622]/30 border border-white/[0.03] rounded-2xl p-12 text-center flex flex-col items-center justify-center">
              <Lightbulb size={40} className="text-slate-600 mb-3" />
              <div className="text-slate-400 font-medium text-[14px]">Идей пока нет</div>
              <p className="text-slate-600 text-[12px] mt-1 max-w-xs">
                Похоже, по заданным фильтрам ничего не найдено. Напишите вашу идею первой!
              </p>
            </div>
          ) : (
            filteredIdeas.map(idea => {
              const score = idea.votes.reduce((sum, v) => sum + v.value, 0)
              const userVote = idea.votes.find(v => v.user_id === currentUser.id)?.value
              const project = idea.project
              const statusMeta = CATEGORY_META[idea.status]
              const StatusIcon = statusMeta?.icon || Lightbulb

              return (
                <div
                  key={idea.id}
                  onClick={() => setViewingIdea(idea)}
                  className="bg-[#141622]/40 border border-white/[0.04] hover:border-white/[0.09] hover:bg-[#181a28]/50 transition-all duration-200 rounded-2xl p-5 flex gap-4 items-start relative group cursor-pointer"
                >
                  {/* Left block: Vote widget */}
                  <div
                    onClick={e => e.stopPropagation()}
                    className="flex flex-col items-center justify-center bg-[#1c1e2e]/80 border border-white/[0.05] rounded-xl py-1.5 w-12 shrink-0 select-none shadow-sm"
                  >
                    <button
                      onClick={() => handleVote(idea.id, 'up')}
                      className={`p-1 rounded-md transition-all hover:bg-white/[0.05] ${
                        userVote === 1 ? 'text-violet-400 scale-110' : 'text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      <ChevronUp size={20} />
                    </button>
                    <span className="text-[14px] font-bold font-mono text-white tracking-tight leading-none my-1">
                      {score}
                    </span>
                    <button
                      onClick={() => handleVote(idea.id, 'down')}
                      className={`p-1 rounded-md transition-all hover:bg-white/[0.05] ${
                        userVote === -1 ? 'text-amber-500 scale-110' : 'text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      <ChevronDown size={20} />
                    </button>
                  </div>

                  {/* Right block: Information */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-[15.5px] font-bold text-white tracking-tight leading-snug group-hover:text-violet-400 transition-colors duration-150">
                      {idea.title}
                    </h3>
                    <p className="text-[12.5px] text-[#8E92BC]/85 mt-1.5 line-clamp-2 leading-relaxed">
                      {idea.description}
                    </p>

                    {/* Footer tags & details */}
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-2 mt-4 text-[11px] text-[#8E92BC]">
                      {/* Comments Badge */}
                      <span className="flex items-center gap-1 hover:text-white transition-colors">
                        <MessageSquare size={13} />
                        {idea.comments?.length ?? 0}
                      </span>

                      <span className="text-white/10">|</span>

                      {/* Status Badge */}
                      <span
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-semibold"
                        style={{
                          backgroundColor: `${statusMeta.color}15`,
                          color: statusMeta.color
                        }}
                      >
                        <StatusIcon size={11} />
                        {statusMeta.label}
                      </span>

                      {/* Project Link */}
                      {project && (
                        <>
                          <span className="text-white/10">|</span>
                          <span
                            className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md font-semibold text-[10.5px]"
                            style={{ backgroundColor: `${project.color}15`, color: project.color }}
                          >
                            <span>{project.emoji ?? '📁'}</span>
                            <span className="truncate max-w-[100px]">{project.name}</span>
                          </span>
                        </>
                      )}

                      {/* Idea Tags */}
                      {idea.idea_tags?.length > 0 && (
                        <>
                          <span className="text-white/10">|</span>
                          <div className="flex items-center gap-1">
                            {idea.idea_tags.map(it => it.tag && (
                              <span
                                key={it.tag.id}
                                className="px-1.5 py-0.5 bg-white/[0.04] border border-white/[0.02] rounded-md text-[10px] hover:text-white transition-colors"
                              >
                                {it.tag.name}
                              </span>
                            ))}
                          </div>
                        </>
                      )}

                      {/* Author */}
                      {idea.author && (
                        <div className="ml-auto flex items-center gap-1.5 text-[#8E92BC] text-[11px]">
                          <Avatar
                            initials={getInitials(idea.author.full_name)}
                            color={colorFor(idea.author.full_name)}
                            size={18}
                          />
                          <span className="truncate max-w-[80px] text-slate-300 font-medium">
                            {idea.author.full_name.split(' ')[0]}
                          </span>
                          <span>·</span>
                          <span>{timeAgo(idea.created_at)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Right Column: Sidebar Filters */}
        <div className="space-y-5">
          {/* Sorting Box */}
          <div className="bg-[#141622]/40 border border-white/[0.04] rounded-2xl p-4">
            <label className="block text-[10px] uppercase tracking-[0.12em] text-[#8E92BC] font-semibold mb-2">
              Сортировка
            </label>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              className="w-full h-9 px-3 rounded-xl bg-[#1c1e2e] border border-white/[0.05] focus:border-indigo-500 outline-none text-[12px] text-white transition-all cursor-pointer"
            >
              <option value="newest">Сначала новые</option>
              <option value="votes">По популярности</option>
              <option value="oldest">Сначала старые</option>
            </select>
          </div>

          {/* Categories/Statuses filter */}
          <div className="bg-[#141622]/40 border border-white/[0.04] rounded-2xl p-4">
            <h3 className="text-[10px] uppercase tracking-[0.12em] text-[#8E92BC] font-semibold mb-3">
              Статус
            </h3>
            <div className="space-y-1">
              {(Object.keys(CATEGORY_META) as Array<keyof typeof CATEGORY_META>).map(catKey => {
                const meta = CATEGORY_META[catKey]
                const Icon = meta.icon
                const isActive = activeCategory === catKey
                const count = categoryCounts[catKey] ?? 0

                return (
                  <button
                    key={catKey}
                    onClick={() => setActiveCategory(catKey)}
                    className={`w-full flex items-center justify-between px-3 h-9 rounded-xl text-[12.5px] font-medium transition-all ${
                      isActive
                        ? 'bg-indigo-600/15 text-indigo-400 border border-indigo-500/25'
                        : 'text-[#8E92BC] hover:text-white hover:bg-white/[0.03] border border-transparent'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <Icon size={14} style={{ color: isActive ? undefined : meta.color }} />
                      {meta.label}
                    </span>
                    <span className="text-[11px] font-bold font-mono px-1.5 py-0.5 rounded bg-white/[0.04]">
                      {count}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Tags list filter */}
          <div className="bg-[#141622]/40 border border-white/[0.04] rounded-2xl p-4">
            <h3 className="text-[10px] uppercase tracking-[0.12em] text-[#8E92BC] font-semibold mb-3">
              Популярные теги
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {tagsWithCounts.map(tag => {
                const isActive = selectedTag === tag.name
                return (
                  <button
                    key={tag.id}
                    onClick={() => setSelectedTag(isActive ? null : tag.name)}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-all ${
                      isActive
                        ? 'bg-violet-600/25 border-violet-500/40 text-violet-400 font-bold'
                        : 'bg-white/[0.02] border-white/[0.04] text-[#8E92BC] hover:text-white hover:border-white/[0.1] hover:bg-white/[0.04]'
                    }`}
                  >
                    #{tag.name}
                    <span className="text-[9.5px] font-bold font-mono opacity-60">
                      {tag.count}
                    </span>
                  </button>
                )
              })}
            </div>
            {selectedTag && (
              <button
                onClick={() => setSelectedTag(null)}
                className="w-full text-center mt-3 text-[11px] text-violet-400 hover:text-violet-300 font-semibold"
              >
                Сбросить тег
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Creation Modal */}
      {showCreate && (
        <CreateIdeaModal
          projects={projects}
          allTags={allTags}
          currentUser={currentUser}
          onClose={() => setShowCreate(false)}
          onCreated={newIdea => {
            setIdeas(prev => [newIdea, ...prev])
            setShowCreate(false)
          }}
        />
      )}

      {/* Details Modal */}
      {viewingIdea && (
        <IdeaDetailsModal
          idea={viewingIdea}
          projects={projects}
          currentUser={currentUser}
          onClose={() => setViewingIdea(null)}
          onVote={type => handleVote(viewingIdea.id, type)}
          onDelete={deletedId => {
            setIdeas(prev => prev.filter(i => i.id !== deletedId))
            setViewingIdea(null)
          }}
          onUpdate={updatedIdea => {
            setIdeas(prev => prev.map(i => i.id === updatedIdea.id ? updatedIdea : i))
            setViewingIdea(updatedIdea)
          }}
        />
      )}
    </div>
  )
}
