'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Loader2, RefreshCw, Music, Play, Pause, Download, Trash2,
  AlertCircle, CheckCircle, Mic, MicOff, Sparkles, Copy, Check as CheckIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Modal }  from '@/components/ui/Modal'
import { createClient } from '@/lib/supabase/client'
import { useUIStore } from '@/store/ui'
import { timeAgo } from '@/lib/utils'

// ─── types ────────────────────────────────────────────────────────────────────

type KieTask = {
  id: string
  task_id: string | null
  type: 'music' | 'video'
  status: 'pending' | 'processing' | 'done' | 'failed'
  model: string
  title: string | null
  prompt: string | null
  style: string | null
  instrumental: boolean
  audio_url: string | null
  stream_url: string | null
  image_url: string | null
  duration: number | null
  credits_used: number | null
  order_id: string | null
  error_msg: string | null
  created_at: string
  updated_at: string
}

// ─── constants ────────────────────────────────────────────────────────────────

const MODELS = [
  { id: 'V4',     label: 'Suno V4',      desc: 'Стандарт · 3000 симв.' },
  { id: 'V4_5',   label: 'Suno V4.5',    desc: 'Улучшенный · 5000 симв.' },
  { id: 'V4_5PLUS', label: 'Suno V4.5+', desc: 'Максимум качества' },
]

const STYLE_PRESETS = [
  'pop', 'rock', 'jazz', 'classical', 'hip-hop', 'electronic',
  'folk', 'r&b', 'country', 'ambient', 'cinematic',
]

const STATUS_COLOR: Record<KieTask['status'], string> = {
  pending:    '#8B92B4',
  processing: '#00C2FF',
  done:       '#22C55E',
  failed:     '#EF4444',
}
const STATUS_LABEL: Record<KieTask['status'], string> = {
  pending:    'Ожидание',
  processing: 'Генерация',
  done:       'Готово',
  failed:     'Ошибка',
}

// ─── mini audio player ────────────────────────────────────────────────────────

function AudioPlayer({ url, title }: { url: string; title?: string | null }) {
  const audioRef    = useRef<HTMLAudioElement>(null)
  const lastTickRef = useRef(0)
  const [playing,  setPlaying]  = useState(false)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)

  const toggle = () => {
    const a = audioRef.current
    if (!a) return
    if (playing) a.pause()
    else a.play()
    setPlaying(!playing)
  }

  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`

  return (
    <div className="flex items-center gap-3 px-3 py-2 bg-white/[0.03] rounded-xl border border-line">
      <button
        onClick={toggle}
        className="w-8 h-8 rounded-full bg-accent flex items-center justify-center shrink-0 hover:bg-accent/80 transition-colors"
      >
        {playing ? <Pause size={13} fill="white" className="text-white" /> : <Play size={13} fill="white" className="text-white ml-0.5" />}
      </button>
      <div className="flex-1 min-w-0">
        {title && <div className="text-[12px] font-medium truncate mb-1">{title}</div>}
        <div className="flex items-center gap-2">
          <div
            className="flex-1 h-1 bg-white/[0.08] rounded-full cursor-pointer"
            onClick={e => {
              const rect = e.currentTarget.getBoundingClientRect()
              const pct  = (e.clientX - rect.left) / rect.width
              if (audioRef.current) { audioRef.current.currentTime = pct * duration }
            }}
          >
            <div className="h-full bg-accent rounded-full" style={{ width: `${duration ? (progress / duration) * 100 : 0}%` }} />
          </div>
          <span className="text-[10px] text-mute shrink-0 tabular-nums">{fmt(progress)}/{fmt(duration)}</span>
        </div>
      </div>
      <a href={url} download className="text-mute hover:text-white transition-colors">
        <Download size={14} />
      </a>
      <audio
        ref={audioRef}
        src={url}
        onTimeUpdate={() => {
          const now = Date.now()
          if (now - lastTickRef.current < 100) return
          lastTickRef.current = now
          setProgress(audioRef.current?.currentTime ?? 0)
        }}
        onLoadedMetadata={() => setDuration(audioRef.current?.duration ?? 0)}
        onEnded={() => setPlaying(false)}
      />
    </div>
  )
}

// ─── generate form modal ──────────────────────────────────────────────────────

function GenerateModal({ onClose, onStarted }: { onClose: () => void; onStarted: (task: KieTask) => void }) {
  const addToast = useUIStore(s => s.addToast)
  const supabase = createClient()

  const [prompt,       setPrompt]       = useState('')
  const [title,        setTitle]        = useState('')
  const [style,        setStyle]        = useState('')
  const [model,        setModel]        = useState('V4_5')
  const [instrumental, setInstrumental] = useState(false)
  const [loading,      setLoading]      = useState(false)
  const [error,        setError]        = useState('')

  const maxChars = model === 'V4' ? 3000 : 5000

  const generate = async () => {
    if (!prompt.trim()) { setError('Введите текст/тематику песни'); return }
    setLoading(true); setError('')

    const res = await fetch('/api/kie/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, title, style, model, instrumental }),
    })
    const json = await res.json()
    setLoading(false)

    if (!res.ok) { setError(json.error ?? 'Ошибка генерации'); return }

    const taskId = json.data?.taskId as string
    // Fetch the local DB record we just created in the API route.
    const { data } = await supabase
      .from('pm_kie_tasks')
      .select('*')
      .eq('task_id', taskId)
      .single()

    if (data) onStarted(data as KieTask)
    addToast('Запущено', `Генерация начата · task ${taskId.slice(0, 8)}…`, 'accent')
    onClose()
  }

  const FIELD  = 'w-full h-10 px-3.5 rounded-xl bg-white/[0.03] border border-line focus:border-accent/60 outline-none text-[13.5px] placeholder:text-mute2 transition-all'
  const LABEL  = 'block text-[11.5px] uppercase tracking-[0.1em] text-mute2 font-semibold mb-2'

  return (
    <Modal
      title="Создать ИИ-песню · Kie.ai"
      onClose={onClose}
      maxWidth="max-w-[560px]"
      footer={
        <>
          <Button variant="ghost" className="flex-1" onClick={onClose} disabled={loading}>Отмена</Button>
          <Button className="flex-1" onClick={generate} disabled={loading || !prompt.trim()}>
            {loading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
            Сгенерировать
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {/* Model */}
        <div>
          <label className={LABEL}>Модель</label>
          <div className="grid grid-cols-3 gap-2">
            {MODELS.map(m => (
              <button
                key={m.id}
                onClick={() => setModel(m.id)}
                className={`px-3 py-2.5 rounded-xl border text-left transition-colors
                  ${model === m.id
                    ? 'border-accent/60 bg-accent/10 text-accent'
                    : 'border-line bg-white/[0.02] text-mute hover:border-line2'}`}
              >
                <div className="text-[12.5px] font-semibold">{m.label}</div>
                <div className="text-[10.5px] opacity-70">{m.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Instrumental toggle */}
        <label className="flex items-center justify-between px-4 py-3 rounded-xl bg-white/[0.025] border border-line cursor-pointer hover:bg-white/[0.03] transition-colors">
          <div className="flex items-center gap-2">
            {instrumental ? <MicOff size={15} className="text-mute2" /> : <Mic size={15} className="text-accent" />}
            <div>
              <div className="text-[13px] font-medium">{instrumental ? 'Без вокала (инструментал)' : 'С вокалом'}</div>
              <div className="text-[11px] text-mute">
                {instrumental ? 'Только музыка, без пения' : 'ИИ споёт текст песни'}
              </div>
            </div>
          </div>
          <div className={`w-10 h-5.5 rounded-full transition-colors relative ${instrumental ? 'bg-accent' : 'bg-white/[0.08]'}`}>
            <div className={`absolute top-0.5 w-4.5 h-4.5 rounded-full bg-white transition-transform shadow-sm ${instrumental ? 'translate-x-4.5' : 'translate-x-0.5'}`} />
          </div>
          <input type="checkbox" checked={instrumental} onChange={e => setInstrumental(e.target.checked)} className="sr-only" />
        </label>

        {/* Title */}
        <div>
          <label className={LABEL}>Название песни (необязательно)</label>
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="День рождения мамы"
            className={FIELD}
          />
        </div>

        {/* Style */}
        <div>
          <label className={LABEL}>Жанр / стиль</label>
          <input
            value={style}
            onChange={e => setStyle(e.target.value)}
            placeholder="pop, upbeat, happy"
            className={FIELD}
          />
          <div className="flex flex-wrap gap-1.5 mt-2">
            {STYLE_PRESETS.map(s => (
              <button
                key={s}
                onClick={() => setStyle(prev => {
                  const parts = prev.split(',').map(x => x.trim()).filter(Boolean)
                  return parts.includes(s) ? parts.filter(x => x !== s).join(', ') : [...parts, s].join(', ')
                })}
                className={`h-6 px-2.5 rounded-lg text-[11px] font-medium border transition-colors
                  ${style.split(',').map(x => x.trim()).includes(s)
                    ? 'border-accent/50 bg-accent/15 text-accent'
                    : 'border-line text-mute hover:border-line2 hover:text-white'}`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Prompt */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className={LABEL}>Текст / тематика</label>
            <span className={`text-[11px] tabular-nums ${prompt.length > maxChars * 0.9 ? 'text-warn' : 'text-mute2'}`}>
              {prompt.length}/{maxChars}
            </span>
          </div>
          <textarea
            value={prompt}
            onChange={e => setPrompt(e.target.value.slice(0, maxChars))}
            rows={5}
            placeholder={instrumental
              ? 'Опиши настроение и тематику музыки...\nПример: Весёлая, праздничная, для дня рождения, с оркестром'
              : 'Напиши текст песни или опиши тематику...\nПример:\n[Verse]\nСегодня день рождения мамы\nОна любит цветы и улыбки\n[Chorus]\nС днём рождения, мамочка!'}
            className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.03] border border-line focus:border-accent/60 outline-none text-[13px] placeholder:text-mute2 transition-all resize-none font-mono"
          />
          <div className="text-[11px] text-mute2 mt-1.5">
            Используй [Verse], [Chorus], [Bridge] для структуры или просто опиши тематику — ИИ сам напишет слова.
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 px-3 py-2.5 bg-err/10 border border-err/20 rounded-xl text-err text-[12.5px]">
            <AlertCircle size={14} />
            {error}
          </div>
        )}
      </div>
    </Modal>
  )
}

// ─── copy id chip ─────────────────────────────────────────────────────────────

function CopyId({ id }: { id: string }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard.writeText(id).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }
  return (
    <button
      onClick={copy}
      className="mt-1.5 flex items-center gap-1 text-[10px] text-mute2 font-mono hover:text-white transition-colors group"
    >
      <span className="group-hover:underline">ID: {id}</span>
      {copied
        ? <CheckIcon size={10} className="text-ok shrink-0" />
        : <Copy size={10} className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />}
    </button>
  )
}

// ─── task card ────────────────────────────────────────────────────────────────

function TaskCard({
  task,
  onPoll,
  onDelete,
}: {
  task: KieTask
  onPoll: (taskId: string) => void
  onDelete: (id: string) => void
}) {
  const isActive = task.status === 'pending' || task.status === 'processing'

  return (
    <div className={`rounded-xl border p-4 transition-colors ${
      task.status === 'done'   ? 'border-ok/30 bg-ok/5'  :
      task.status === 'failed' ? 'border-err/30 bg-err/5' :
      isActive                 ? 'border-accent/30 bg-accent/5' :
      'border-line bg-white/[0.02]'
    }`}>
      <div className="flex items-start gap-3">
        {/* Cover art — external Kie.ai URL, next/image not applicable */}
        {task.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={task.image_url} alt={task.title ?? ''} className="w-12 h-12 rounded-xl object-cover shrink-0" />
        ) : (
          <div className="w-12 h-12 rounded-xl bg-white/[0.06] flex items-center justify-center shrink-0">
            <Music size={18} className="text-mute2" />
          </div>
        )}

        <div className="flex-1 min-w-0">
          {/* Title + status */}
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-[13.5px] font-semibold truncate">
              {task.title || task.prompt?.slice(0, 40) || 'Без названия'}
            </span>
            <span
              className="shrink-0 text-[10px] font-bold px-2 h-4.5 rounded-full inline-flex items-center"
              style={{ background: `${STATUS_COLOR[task.status]}22`, color: STATUS_COLOR[task.status] }}
            >
              {isActive && <Loader2 size={9} className="animate-spin mr-1" />}
              {STATUS_LABEL[task.status]}
            </span>
          </div>

          {/* Meta */}
          <div className="text-[11.5px] text-mute space-x-2">
            <span className="font-mono bg-white/[0.04] px-1.5 py-0.5 rounded text-[10.5px]">{task.model}</span>
            {task.style && <span>· {task.style}</span>}
            {task.instrumental && <span>· инструментал</span>}
            {task.duration && <span>· {task.duration}с</span>}
            <span>· {timeAgo(task.created_at)}</span>
          </div>

          {/* Prompt snippet */}
          {task.prompt && (
            <div className="mt-1.5 text-[11.5px] text-mute2 line-clamp-2">{task.prompt}</div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          {isActive && (
            <button
              onClick={() => task.task_id && onPoll(task.task_id)}
              title="Обновить статус"
              className="w-7 h-7 rounded-lg border border-line flex items-center justify-center text-mute hover:text-white hover:border-line2 transition-colors"
            >
              <RefreshCw size={12} />
            </button>
          )}
          <button
            onClick={() => onDelete(task.id)}
            title="Удалить"
            className="w-7 h-7 rounded-lg border border-line flex items-center justify-center text-mute hover:text-err hover:border-err/30 transition-colors"
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>

      {/* Audio player */}
      {task.audio_url && (
        <div className="mt-3">
          <AudioPlayer url={task.audio_url} title={task.title} />
        </div>
      )}

      {/* Error message */}
      {task.status === 'failed' && task.error_msg && (
        <div className="mt-2 text-[12px] text-err/80 bg-err/5 border border-err/15 rounded-lg px-3 py-2">
          {task.error_msg}
        </div>
      )}

      {/* Task ID */}
      {task.task_id && (
        <CopyId id={task.task_id} />
      )}
    </div>
  )
}

// ─── main component ────────────────────────────────────────────────────────────

interface Props {
  initialTasks: KieTask[]
}

export function KieTab({ initialTasks }: Props) {
  const supabase = createClient()
  const addToast = useUIStore(s => s.addToast)

  const [tasks,       setTasks]       = useState<KieTask[]>(initialTasks)
  const [credits,     setCredits]     = useState<number | null>(null)
  const [creditsLoad, setCreditsLoad] = useState(false)
  const [creditsErr,  setCreditsErr]  = useState('')
  const [showGenerate, setShowGenerate] = useState(false)
  const [filterStatus, setFilterStatus] = useState<KieTask['status'] | 'all'>('all')

  // Poll active tasks every 8 seconds
  const pollTask = useCallback(async (taskId: string) => {
    const res = await fetch(`/api/kie/task?taskId=${taskId}`)
    if (!res.ok) return
    const { data } = await supabase.from('pm_kie_tasks').select('*').eq('task_id', taskId).single()
    if (data) setTasks(prev => prev.map(t => t.task_id === taskId ? (data as KieTask) : t))
  }, [supabase])

  useEffect(() => {
    const pending = tasks.filter(t => t.status === 'pending' || t.status === 'processing')
    if (pending.length === 0) return
    const interval = setInterval(() => {
      pending.forEach(t => { if (t.task_id) pollTask(t.task_id) })
    }, 8000)
    return () => clearInterval(interval)
  }, [tasks, pollTask])

  const fetchCredits = useCallback(async () => {
    setCreditsLoad(true); setCreditsErr('')
    const res = await fetch('/api/kie/credits')
    const json = await res.json()
    setCreditsLoad(false)
    if (!res.ok) { setCreditsErr(json.error ?? 'Ошибка'); return }
    setCredits(json.data?.credit ?? json.credit ?? 0)
  }, [])

  useEffect(() => { fetchCredits() }, [fetchCredits])

  const handleTaskStarted = (task: KieTask) => {
    setTasks(prev => [task, ...prev])
  }

  const handleDelete = async (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id))
    const { error } = await supabase.from('pm_kie_tasks').delete().eq('id', id)
    if (error) addToast('Ошибка', error.message, 'err')
  }

  const activeTasks  = tasks.filter(t => t.status === 'pending' || t.status === 'processing').length
  const doneTasks    = tasks.filter(t => t.status === 'done').length
  const failedTasks  = tasks.filter(t => t.status === 'failed').length

  const visible = filterStatus === 'all' ? tasks : tasks.filter(t => t.status === filterStatus)

  // Estimated credits per song (~20 for V4)
  const estSongsLeft = credits != null ? Math.floor(credits / 20) : null

  return (
    <div className="space-y-5">
      {/* Balance + stats bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Credits */}
        <div className="card p-4 col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between mb-2">
            <div className="text-[11px] text-mute2 uppercase tracking-wider font-semibold">Баланс Kie.ai</div>
            <button onClick={fetchCredits} className="text-mute hover:text-white transition-colors" title="Обновить">
              {creditsLoad ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
            </button>
          </div>
          {creditsErr ? (
            <div className="flex items-center gap-1.5 text-err text-[12px]">
              <AlertCircle size={13} /> {creditsErr}
            </div>
          ) : credits === null ? (
            <div className="h-7 w-20 bg-white/[0.04] rounded animate-pulse" />
          ) : (
            <>
              <div className="flex items-end gap-1.5">
                <span className={`text-[28px] font-bold tabular-nums ${credits < 50 ? 'text-err' : credits < 200 ? 'text-warn' : 'text-ok'}`}>
                  {credits.toLocaleString('ru-RU')}
                </span>
                <span className="text-[12px] text-mute mb-1">кредитов</span>
              </div>
              {estSongsLeft !== null && (
                <div className="text-[11.5px] text-mute mt-0.5">
                  ≈ {estSongsLeft} песен осталось
                </div>
              )}
              {credits < 50 && (
                <div className="flex items-center gap-1 text-err text-[11px] mt-1">
                  <AlertCircle size={11} /> Пополните баланс!
                </div>
              )}
            </>
          )}
        </div>

        {/* Task stats */}
        <div className="card p-4 flex flex-col justify-between">
          <div className="text-[11px] text-mute2 uppercase tracking-wider font-semibold">Активных</div>
          <div className="flex items-end gap-1.5">
            <span className="text-[24px] font-bold text-accent tabular-nums">{activeTasks}</span>
            {activeTasks > 0 && <Loader2 size={14} className="animate-spin text-accent mb-1" />}
          </div>
        </div>
        <div className="card p-4 flex flex-col justify-between">
          <div className="text-[11px] text-mute2 uppercase tracking-wider font-semibold">Готово</div>
          <div className="flex items-end gap-1.5">
            <span className="text-[24px] font-bold text-ok tabular-nums">{doneTasks}</span>
            <CheckCircle size={14} className="text-ok mb-1" />
          </div>
        </div>
        <div className="card p-4 flex flex-col justify-between">
          <div className="text-[11px] text-mute2 uppercase tracking-wider font-semibold">Ошибок</div>
          <div className="text-[24px] font-bold tabular-nums" style={{ color: failedTasks > 0 ? '#EF4444' : '#8B92B4' }}>
            {failedTasks}
          </div>
        </div>
      </div>

      {/* Actions + filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <Button onClick={() => setShowGenerate(true)} className="shrink-0">
          <Sparkles size={14} /> Сгенерировать песню
        </Button>

        <div className="flex items-center gap-1.5 ml-auto flex-wrap">
          {(['all', 'pending', 'processing', 'done', 'failed'] as const).map(s => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`h-7 px-3 rounded-lg text-[11.5px] font-medium border transition-colors
                ${filterStatus === s
                  ? 'bg-accent/20 border-accent/40 text-accent'
                  : 'border-line text-mute hover:text-white'}`}
            >
              {s === 'all' ? `Все (${tasks.length})`
               : s === 'pending'    ? `Ожидание (${tasks.filter(t => t.status === 'pending').length})`
               : s === 'processing' ? `Генерация (${tasks.filter(t => t.status === 'processing').length})`
               : s === 'done'       ? `Готово (${doneTasks})`
               : `Ошибки (${failedTasks})`}
            </button>
          ))}
        </div>
      </div>

      {/* How-it-works hint (only when empty) */}
      {tasks.length === 0 && (
        <div className="card p-6 text-center">
          <div className="text-[32px] mb-3">🎵</div>
          <div className="text-[15px] font-semibold mb-2">Генерация ИИ-музыки через Kie.ai</div>
          <div className="text-[13px] text-mute max-w-md mx-auto mb-4">
            Kie.ai — доступный прокси к Suno. Генерация песни стоит ~20 кредитов (~2 ₽).
            Добавь ключ <code className="bg-white/[0.06] px-1.5 py-0.5 rounded text-accent">KIE_AI_KEY</code> в .env.local, затем нажми «Сгенерировать песню».
          </div>
          <div className="flex items-start gap-6 justify-center text-left text-[12.5px]">
            {[
              { n: '1', t: 'Введи тематику или слова', d: 'Текст, жанр, настроение' },
              { n: '2', t: 'Kie.ai создаёт песню',    d: 'Suno API в фоне' },
              { n: '3', t: 'Слушай и скачивай',        d: 'mp3 прямо в CONNECT' },
            ].map(step => (
              <div key={step.n} className="flex items-start gap-2">
                <div className="w-5 h-5 rounded-full bg-accent flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">{step.n}</div>
                <div>
                  <div className="font-medium">{step.t}</div>
                  <div className="text-mute">{step.d}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Task list */}
      {visible.length > 0 && (
        <div className="space-y-3">
          {visible.map(task => (
            <TaskCard
              key={task.id}
              task={task}
              onPoll={pollTask}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Generate modal */}
      {showGenerate && (
        <GenerateModal
          onClose={() => setShowGenerate(false)}
          onStarted={handleTaskStarted}
        />
      )}
    </div>
  )
}
