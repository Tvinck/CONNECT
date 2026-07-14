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
import { EmptyState } from '@/components/ui/EmptyState'

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
  users: { id: string; full_name: string }[]
  currentUser: { id: string; full_name: string; role: string | null }
}

export const CATEGORY_META = {
  all:         { label: 'Все',           emoji: '⚡', color: '#8E92BC', icon: List },
  new:         { label: 'Новые идеи',     emoji: '💡', color: '#F59E0B', icon: Lightbulb },
  planned:     { label: 'Запланировано',  emoji: '🛠️', color: '#1472F5', icon: Wrench },
  rejected:    { label: 'Отклонено',      emoji: '🚫', color: '#EF4444', icon: Ban },
  implemented: { label: 'Реализовано',    emoji: '✅', color: '#22C55E', icon: CheckCircle },
} as const

import { useSearchParams, useRouter } from 'next/navigation'

export function IdeasClient({ initialIdeas, projects, allTags, users, currentUser }: Props) {
  const supabase = createClient()
  const searchParams = useSearchParams()
  const router = useRouter()
  
  const [ideas, setIdeas] = useState<Idea[]>(initialIdeas)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState<keyof typeof CATEGORY_META>('all')
  const [selectedTag, setSelectedTag] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<'newest' | 'votes' | 'oldest'>('newest')

  const [showCreate, setShowCreate] = useState(false)
  const [viewingIdea, setViewingIdea] = useState<Idea | null>(null)

  // Handle deep link ?idea=ID
  useEffect(() => {
    const ideaId = searchParams.get('idea')
    if (ideaId && !viewingIdea) {
      const idea = ideas.find(i => i.id === ideaId)
      if (idea) {
        setViewingIdea(idea)
        const url = new URL(window.location.href)
        url.searchParams.delete('idea')
        window.history.replaceState({}, '', url)
      } else {
        // Fetch dynamically if not in initial list
        supabase
          .from('ideas')
          .select(`
            *,
            project:projects(id, name, color, emoji),
            author:users!author_id(id, full_name),
            idea_tags(tag:tags(id, name)),
            comments:idea_comments(id),
            votes:idea_votes(user_id, value)
          `)
          .eq('id', ideaId)
          .single()
          .then(({ data }) => {
            if (data) {
              setViewingIdea(data as any)
              const url = new URL(window.location.href)
              url.searchParams.delete('idea')
              window.history.replaceState({}, '', url)
            }
          })
      }
    }
  }, [searchParams, ideas, viewingIdea, supabase])

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
    <div className="bg-card text-[#171821] rounded-card border border-line p-6 lg:p-8 min-h-[85vh] relative overflow-hidden shadow-2xl">
      {/* Decorative Blur Blobs */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-accent/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-cyan/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-line relative z-10">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent shadow-glow-sm">
            <Lightbulb size={24} className="animate-pulse" />
          </div>
          <div>
            <h1 className="text-[22px] font-bold tracking-tight text-[#171821] font-sans">У вас есть идея?</h1>
            <p className="text-[13px] text-mute mt-0.5">Предлагайте свои идеи по улучшению BAZZAR Group</p>
          </div>
        </div>
        <Button
          onClick={() => setShowCreate(true)}
          className="shadow-glow-sm shrink-0 self-start sm:self-center"
        >
          <Plus size={16} />
          Предложить идею
        </Button>
      </div>

      {/* Search and Sort row */}
      <div className="flex flex-col md:flex-row md:items-center gap-4 mt-6 relative z-10">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-mute2" />
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Поиск по идеям…"
            className="w-full h-11 pl-10 pr-4 bg-bg border border-line rounded-xl text-[13.5px] text-[#171821] placeholder:text-mute2 focus:border-accent focus:bg-black/[0.02] outline-none transition-all"
          />
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mt-6 relative z-10">
        {/* Left Column: Ideas List */}
        <div className="lg:col-span-3 space-y-4">
          {filteredIdeas.length === 0 ? (
            <EmptyState
              className="bg-bg border border-line rounded-2xl"
              icon={Lightbulb}
              title="Идей пока нет"
              description="По заданным фильтрам ничего не найдено. Напишите свою идею первой!"
            />
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
                  className="card p-5 flex gap-4 items-start relative group cursor-pointer lift"
                >
                  {/* Left block: Vote widget */}
                  <div
                    onClick={e => e.stopPropagation()}
                    className="flex flex-col items-center justify-center bg-bg border border-line rounded-xl py-1.5 w-12 shrink-0 select-none shadow-sm"
                  >
                    <button
                      onClick={() => handleVote(idea.id, 'up')}
                      className={`p-1 rounded-lg transition-all hover:bg-black/[0.05] ${
                        userVote === 1 ? 'text-accent scale-110' : 'text-mute2 hover:text-mute'
                      }`}
                    >
                      <ChevronUp size={20} />
                    </button>
                    <span className="text-[14px] font-bold font-mono text-[#171821] tracking-tight leading-none my-1">
                      {score}
                    </span>
                    <button
                      onClick={() => handleVote(idea.id, 'down')}
                      className={`p-1 rounded-lg transition-all hover:bg-black/[0.05] ${
                        userVote === -1 ? 'text-warn scale-110' : 'text-mute2 hover:text-mute'
                      }`}
                    >
                      <ChevronDown size={20} />
                    </button>
                  </div>

                  {/* Right block: Information */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-[15.5px] font-bold text-[#171821] tracking-tight leading-snug group-hover:text-accent transition-colors duration-150">
                      {idea.title}
                    </h3>
                    <p className="text-[12.5px] text-mute mt-1.5 line-clamp-2 leading-relaxed">
                      {idea.description}
                    </p>

                    {/* Footer tags & details */}
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-2 mt-4 text-[11px] text-mute">
                      {/* Comments Badge */}
                      <span className="flex items-center gap-1 hover:text-[#171821] transition-colors">
                        <MessageSquare size={13} />
                        {idea.comments?.length ?? 0}
                      </span>

                      <span className="text-line2">|</span>

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
                          <span className="text-line2">|</span>
                          <span
                            className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg font-semibold text-[10.5px]"
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
                          <span className="text-line2">|</span>
                          <div className="flex items-center gap-1">
                            {idea.idea_tags.map(it => it.tag && (
                              <span
                                key={it.tag.id}
                                className="px-1.5 py-0.5 bg-bg border border-line rounded-lg text-[10px] text-mute hover:text-[#171821] hover:border-line2 transition-colors"
                              >
                                {it.tag.name}
                              </span>
                            ))}
                          </div>
                        </>
                      )}

                      {/* Author */}
                      {idea.author && (
                        <div className="ml-auto flex items-center gap-1.5 text-mute text-[11px]">
                          <Avatar
                            initials={getInitials(idea.author.full_name)}
                            color={colorFor(idea.author.full_name)}
                            size={18}
                          />
                          <span className="truncate max-w-[80px] text-[#171821] font-medium">
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
          <div className="border border-line rounded-2xl p-4 bg-bg/25">
            <label className="block text-[10px] uppercase tracking-[0.12em] text-mute font-semibold mb-2">
              Сортировка
            </label>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              className="w-full h-9 px-3 rounded-xl bg-card border border-line focus:border-accent outline-none text-[12px] text-[#171821] transition-all cursor-pointer"
            >
              <option value="newest">Сначала новые</option>
              <option value="votes">По популярности</option>
              <option value="oldest">Сначала старые</option>
            </select>
          </div>

          {/* Categories/Statuses filter */}
          <div className="border border-line rounded-2xl p-4 bg-bg/25">
            <h3 className="text-[10px] uppercase tracking-[0.12em] text-mute font-semibold mb-3">
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
                        ? 'bg-accent/10 text-accent border border-accent/25 font-bold'
                        : 'text-mute hover:text-[#171821] hover:bg-black/[0.04] border border-transparent'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <Icon size={14} style={{ color: isActive ? undefined : meta.color }} />
                      {meta.label}
                    </span>
                    <span className="text-[11px] font-bold font-mono px-1.5 py-0.5 rounded bg-bg">
                      {count}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Tags list filter */}
          <div className="border border-line rounded-2xl p-4 bg-bg/25">
            <h3 className="text-[10px] uppercase tracking-[0.12em] text-mute font-semibold mb-3">
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
                        ? 'bg-accent/15 border-accent/30 text-accent font-bold'
                        : 'bg-card border border-line text-mute hover:text-[#171821] hover:border-line2 hover:bg-card-hover'
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
                className="w-full text-center mt-3 text-[11px] text-accent hover:text-accent/80 font-semibold"
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

      {viewingIdea && (
        <IdeaDetailsModal
          idea={viewingIdea}
          projects={projects}
          users={users}
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
