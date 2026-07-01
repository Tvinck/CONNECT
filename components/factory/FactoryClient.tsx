'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Wand2, Loader2, Copy, Check, Video, Download, Mic, Coins, Clock, ThumbsUp, ThumbsDown, MessageSquare, Send, Users, Cpu, FileText, LayoutTemplate, Palette, Sparkles, Volume2, Film, RefreshCw } from 'lucide-react'

interface ChunkState {
  id: number;
  text: string;
  isMascot: boolean;
  prompt: string;
  imageTaskId?: string;
  imageStatus?: string;
  imageUrl?: string;
  videoTaskId?: string;
  videoStatus?: string;
  videoUrl?: string;
  audioTaskId?: string;
  audioStatus?: string;
  audioUrl?: string;
}

interface AgentState {
  id: string;
  name: string;
  role: string;
  icon: any;
  status: 'idle' | 'active' | 'completed' | 'failed';
}

export function FactoryClient() {
  const [topic, setTopic] = useState('')
  const [script, setScript] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  // V5 Pipeline States
  const [isPlanning, setIsPlanning] = useState(false)
  const [chunks, setChunks] = useState<ChunkState[]>([])
  const [currentActiveIndex, setCurrentActiveIndex] = useState<number | null>(null)
  
  // Music State
  const [musicTaskId, setMusicTaskId] = useState('')
  const [musicStatus, setMusicStatus] = useState('')
  const [musicUrl, setMusicUrl] = useState('')

  const [mergedUrl, setMergedUrl] = useState('')
  const [isMerging, setIsMerging] = useState(false)

  // AI Team States
  const [agents, setAgents] = useState<AgentState[]>([
    { id: 'writer', name: 'ИИ Сценарист', role: 'Пишет вирусный сценарий', icon: FileText, status: 'idle' },
    { id: 'director', name: 'ИИ Режиссер', role: 'Планирует сцены и промпты', icon: LayoutTemplate, status: 'idle' },
    { id: 'artist', name: 'ИИ Художник', role: 'Генерирует первый кадр во Flux', icon: Palette, status: 'idle' },
    { id: 'actor', name: 'ИИ Актер', role: 'Анимирует маскота в Kling 3.0', icon: Sparkles, status: 'idle' },
    { id: 'voice', name: 'ИИ Диктор', role: 'Озвучивает текст сцен', icon: Volume2, status: 'idle' },
    { id: 'editor', name: 'ИИ Монтажер', role: 'Сводит музыку, сабы и склеивает', icon: Film, status: 'idle' }
  ])

  const [balance, setBalance] = useState<number | null>(null)
  const [history, setHistory] = useState<any[]>([])
  
  const [activeCommentId, setActiveCommentId] = useState<string | null>(null)
  const [commentText, setCommentText] = useState('')

  const updateAgentStatus = (id: string, status: 'idle' | 'active' | 'completed' | 'failed') => {
    setAgents(prev => prev.map(a => a.id === id ? { ...a, status } : a))
  }

  // Load / Save Session Cache
  useEffect(() => {
    const cachedScript = localStorage.getItem('raccoon_factory_script')
    const cachedChunks = localStorage.getItem('raccoon_factory_chunks')
    const cachedMusicUrl = localStorage.getItem('raccoon_factory_music_url')
    const cachedMergedUrl = localStorage.getItem('raccoon_factory_merged_url')

    if (cachedScript) setScript(cachedScript)
    if (cachedChunks) {
      try {
        setChunks(JSON.parse(cachedChunks))
      } catch (e) {}
    }
    if (cachedMusicUrl) setMusicUrl(cachedMusicUrl)
    if (cachedMergedUrl) setMergedUrl(cachedMergedUrl)

    fetchDashboardData()
  }, [])

  useEffect(() => {
    if (script) localStorage.setItem('raccoon_factory_script', script)
    else localStorage.removeItem('raccoon_factory_script')
  }, [script])

  useEffect(() => {
    if (chunks.length > 0) localStorage.setItem('raccoon_factory_chunks', JSON.stringify(chunks))
    else localStorage.removeItem('raccoon_factory_chunks')
  }, [chunks])

  useEffect(() => {
    if (musicUrl) localStorage.setItem('raccoon_factory_music_url', musicUrl)
    else localStorage.removeItem('raccoon_factory_music_url')
  }, [musicUrl])

  useEffect(() => {
    if (mergedUrl) localStorage.setItem('raccoon_factory_merged_url', mergedUrl)
    else localStorage.removeItem('raccoon_factory_merged_url')
  }, [mergedUrl])

  const fetchDashboardData = () => {
    fetch('/api/factory/balance').then(r => r.json()).then(d => {
      if (d.credits !== undefined) setBalance(d.credits)
    }).catch(() => {})
    
    fetch('/api/factory/history').then(r => r.json()).then(d => {
      if (d.jobs) setHistory(d.jobs)
    }).catch(() => {})
  }

  const handleFeedback = async (id: string, feedback: 'LIKE' | 'DISLIKE') => {
    try {
      setHistory(prev => prev.map(job => job.id === id ? { ...job, feedback } : job))
      await fetch('/api/factory/history/feedback', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, feedback })
      })
      if (feedback === 'DISLIKE') {
        setActiveCommentId(id)
        setCommentText('')
      } else {
        setActiveCommentId(null)
      }
    } catch (e) {}
  }

  const submitComment = async (id: string) => {
    if (!commentText.trim()) return
    try {
      setHistory(prev => prev.map(job => job.id === id ? { ...job, feedback_comment: commentText } : job))
      await fetch('/api/factory/history/feedback', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, feedback: 'DISLIKE', feedback_comment: commentText })
      })
      setActiveCommentId(null)
      setCommentText('')
    } catch (e) {}
  }

  const handleGenerateText = async () => {
    if (!topic.trim()) return
    setLoading(true)
    setError('')
    setScript('')
    setChunks([])
    setMergedUrl('')
    setMusicUrl('')
    localStorage.clear()
    
    setAgents(prev => prev.map(a => ({ ...a, status: 'idle' })))
    updateAgentStatus('writer', 'active')
    
    try {
      const res = await fetch('/api/factory/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Ошибка при генерации')
      setScript(data.script)
      updateAgentStatus('writer', 'completed')
    } catch (err: any) {
      setError(err.message)
      updateAgentStatus('writer', 'failed')
    } finally {
      setLoading(false)
    }
  }

  // Запуск фонового генератора музыки
  const startMusicGeneration = async (duration: number) => {
    try {
      setMusicStatus('PENDING')
      const res = await fetch('/api/factory/music/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: 'cinematic lofi beat, soft background music, minimal synth, 85bpm', duration })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setMusicTaskId(data.taskId)
    } catch (e) {
      console.error('Music trigger failed:', e)
    }
  }

  // Поллинг музыки
  useEffect(() => {
    if (!musicTaskId || musicStatus === 'COMPLETED' || musicStatus === 'FAILED') return;
    const interval = setInterval(() => {
      fetch(`/api/factory/video/status?taskId=${musicTaskId}`)
        .then(r => r.json())
        .then(data => {
          if (data.status === 'COMPLETED' && data.videoUrl) {
            setMusicUrl(data.videoUrl)
            setMusicStatus('COMPLETED')
          } else if (data.status === 'FAILED') {
            setMusicStatus('FAILED')
          }
        }).catch(() => {})
    }, 10000)
    return () => clearInterval(interval)
  }, [musicTaskId, musicStatus])

  const handleGenerateMedia = async () => {
    if (!script) return
    setIsPlanning(true)
    setError('')
    setChunks([])
    setMergedUrl('')
    setMusicUrl('')
    setCurrentActiveIndex(null)
    
    setAgents(prev => prev.map(a => a.id === 'writer' ? { ...a, status: 'completed' } : { ...a, status: 'idle' }))
    updateAgentStatus('director', 'active')
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000);
    
    try {
      const planRes = await fetch('/api/factory/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ script }),
        signal: controller.signal
      })
      clearTimeout(timeoutId)
      const planData = await planRes.json()
      if (!planRes.ok) throw new Error(planData.error || 'Ошибка планирования')
      
      const scenes = planData.scenes;
      let newChunks: ChunkState[] = scenes.map((s: any, idx: number) => ({
        id: idx,
        text: s.text,
        isMascot: s.isMascot,
        prompt: s.prompt,
        videoStatus: 'QUEUED',
        audioStatus: 'QUEUED'
      }))
      
      setChunks(newChunks)
      setIsPlanning(false)
      updateAgentStatus('director', 'completed')
      
      // Запускаем фоновую музыку
      startMusicGeneration(newChunks.length * 5)
      
      // Начинаем пошаговую сборку
      await processSceneQueue(newChunks)
      
    } catch (err: any) {
      clearTimeout(timeoutId)
      setIsPlanning(false)
      setCurrentActiveIndex(null)
      setAgents(prev => prev.map(a => a.status === 'active' ? { ...a, status: 'failed' } : a))
      setError(err.message)
    }
  }

  // Очередь последовательного процессинга сцен
  const processSceneQueue = async (currentChunks: ChunkState[]) => {
    setError('')
    
    for (let i = 0; i < currentChunks.length; i++) {
      const chunk = currentChunks[i]
      if (chunk.videoStatus === 'COMPLETED' && chunk.audioStatus === 'COMPLETED') continue;

      setCurrentActiveIndex(i)
      setChunks(prev => prev.map(c => c.id === i ? { ...c, videoStatus: 'SUBMITTING', audioStatus: 'SUBMITTING' } : c))

      try {
        let startingImage = '';

        if (chunk.isMascot) {
          // Маскот - берем готовое изображение
          startingImage = '1b2ef010-50b6-4a19-8db6-8707d03013b9';
          updateAgentStatus('actor', 'active')
        } else {
          // B-Roll: Сначала генерируем первый кадр на Flux.2 для кристальной четкости
          updateAgentStatus('artist', 'active')
          setChunks(prev => prev.map(c => c.id === i ? { ...c, imageStatus: 'PENDING' } : c))
          
          const imgRes = await fetch('/api/factory/image/generate', {
            method: 'POST',
            body: JSON.stringify({ prompt: chunk.prompt })
          })
          const imgData = await imgRes.json()
          if (!imgRes.ok) throw new Error(imgData.error || 'Сбой ИИ Художника (Flux)')

          // Ожидаем готовности Flux-изображения
          let imageUrl = ''
          while (!imageUrl) {
            await new Promise(r => setTimeout(r, 4000))
            const statusRes = await fetch(`/api/factory/video/status?taskId=${imgData.taskId}`)
            const statusData = await statusRes.json()
            if (statusData.status === 'COMPLETED') {
              imageUrl = statusData.videoUrl
              setChunks(prev => prev.map(c => c.id === i ? { ...c, imageStatus: 'COMPLETED', imageUrl } : c))
            } else if (statusData.status === 'FAILED') {
              throw new Error('Сбой отрисовки первого кадра во Flux')
            }
          }
          startingImage = imageUrl;
          updateAgentStatus('artist', 'completed')
          updateAgentStatus('actor', 'active') // Передаем ИИ Актеру на анимацию
        }

        updateAgentStatus('voice', 'active')

        // Шаг 2: Запускаем видео-анимацию в Kling 3.0 и озвучку диктора
        const [vidRes, audRes] = await Promise.all([
          fetch('/api/factory/video/generate', { 
            method: 'POST', 
            body: JSON.stringify({ script: chunk.text, prompt: chunk.prompt, start_image: startingImage }) 
          }),
          fetch('/api/factory/audio/generate', { 
            method: 'POST', 
            body: JSON.stringify({ script: chunk.text }) 
          })
        ])

        const vidData = await vidRes.json()
        const audData = await audRes.json()

        if (!vidRes.ok) throw new Error(vidData.error || 'Ошибка Kling')
        if (!audRes.ok) throw new Error(audData.error || 'Ошибка Speech')

        setChunks(prev => prev.map(c => c.id === i ? { 
          ...c, 
          videoTaskId: vidData.taskId, 
          videoStatus: 'PENDING',
          audioTaskId: audData.taskId,
          audioStatus: 'PENDING'
        } : c))

        // Поллинг сцены
        let videoUrl = ''
        let audioUrl = ''

        while (!videoUrl || !audioUrl) {
          await new Promise(resolve => setTimeout(resolve, 5000))

          if (!videoUrl) {
            const statusRes = await fetch(`/api/factory/video/status?taskId=${vidData.taskId}`)
            const statusData = await statusRes.json()
            if (statusData.status === 'COMPLETED') {
              videoUrl = statusData.videoUrl
              setChunks(prev => prev.map(c => c.id === i ? { ...c, videoStatus: 'COMPLETED', videoUrl } : c))
            } else if (statusData.status === 'FAILED') {
              throw new Error(`Сбой анимации в сцене ${i + 1}`)
            }
          }

          if (!audioUrl) {
            const statusRes = await fetch(`/api/factory/video/status?taskId=${audData.taskId}`)
            const statusData = await statusRes.json()
            if (statusData.status === 'COMPLETED') {
              audioUrl = statusData.videoUrl
              setChunks(prev => prev.map(c => c.id === i ? { ...c, audioStatus: 'COMPLETED', audioUrl } : c))
            } else if (statusData.status === 'FAILED') {
              throw new Error(`Сбой озвучки в сцене ${i + 1}`)
            }
          }
        }

        updateAgentStatus('actor', 'completed')
        updateAgentStatus('voice', 'completed')

      } catch (chunkErr: any) {
        setChunks(prev => prev.map(c => c.id === i ? { ...c, videoStatus: 'FAILED', audioStatus: 'FAILED' } : c))
        setAgents(prev => prev.map(a => a.status === 'active' ? { ...a, status: 'failed' } : a))
        setError(chunkErr.message)
        setCurrentActiveIndex(null)
        return; // Останавливаем цикл при сбое
      }
    }

    setCurrentActiveIndex(null)
  }

  // Ручной перезапуск конкретной упавшей сцены
  const retryChunk = async (chunkId: number) => {
    const freshChunks = chunks.map(c => c.id === chunkId ? {
      ...c,
      imageStatus: 'QUEUED',
      videoStatus: 'QUEUED',
      audioStatus: 'QUEUED',
      imageUrl: undefined,
      videoUrl: undefined,
      audioUrl: undefined
    } : c)
    
    setChunks(freshChunks)
    await processSceneQueue(freshChunks)
  }

  // Auto-merge when ALL chunks are COMPLETED
  useEffect(() => {
    if (chunks.length === 0 || mergedUrl || isMerging) return;
    
    const allCompleted = chunks.every(c => c.videoStatus === 'COMPLETED' && c.audioStatus === 'COMPLETED' && c.videoUrl && c.audioUrl);
    
    if (allCompleted) {
      setIsMerging(true)
      updateAgentStatus('editor', 'active')
      const mergePayload = chunks.map(c => ({
        videoUrl: c.videoUrl,
        audioUrl: c.audioUrl,
        text: c.text
      }))
      
      fetch('/api/factory/merge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chunks: mergePayload, prompt: script, musicUrl: musicUrl || undefined })
      })
      .then(r => r.json())
      .then(data => {
        if (data.mergedUrl) {
           setMergedUrl(data.mergedUrl)
           updateAgentStatus('editor', 'completed')
           fetchDashboardData()
        } else {
           updateAgentStatus('editor', 'failed')
        }
        setIsMerging(false)
      })
      .catch(() => {
        setIsMerging(false)
        updateAgentStatus('editor', 'failed')
      })
    }
  }, [chunks, mergedUrl, isMerging, script, musicUrl])

  const getOverallProgressText = () => {
    if (mergedUrl) return "Склейка завершена! Видео готово 🎉"
    if (isMerging) return "Финальная склейка сцен, наложение музыки и субтитров..."
    if (isPlanning) return "ИИ Режиссер планирует сцены..."
    
    if (chunks.length > 0 && currentActiveIndex !== null) {
      return `Генерация сцены ${currentActiveIndex + 1} из ${chunks.length}...`
    }
    if (chunks.length > 0) {
      return "Сцены подготовлены, запуск сборщика..."
    }
    return "Ожидание команды..."
  }

  return (
    <div className="space-y-8 relative">
      <div className="absolute -top-16 right-0 bg-background/80 backdrop-blur px-5 py-2.5 rounded-full border border-border flex items-center gap-3 shadow-sm z-10">
        <Coins className="w-5 h-5 text-yellow-500" />
        <span className="text-sm font-medium">Баланс Higgsfield:</span>
        <span className="font-bold text-violet-500 text-lg">{balance !== null ? balance : '...'} 🪙</span>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">ИИ Завод v5</h1>
          <p className="text-muted-foreground mt-2 text-lg">Нейросетевая студия видеопроизводства полного цикла</p>
        </div>
      </div>

      {/* AI Agents Team Panel */}
      <div className="bg-card border rounded-2xl p-6 shadow-sm">
        <h3 className="text-lg font-bold flex items-center gap-2 mb-6">
          <Users className="w-5 h-5 text-violet-500" />
          Сотрудничество ИИ-Агентов
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {agents.map(agent => {
            const Icon = agent.icon
            const statusColors = {
              idle: 'bg-muted border-border text-muted-foreground opacity-60',
              active: 'bg-violet-500/10 border-violet-500 text-violet-500 animate-pulse ring-2 ring-violet-500/20',
              completed: 'bg-green-500/10 border-green-500 text-green-500',
              failed: 'bg-red-500/10 border-red-500 text-red-500'
            }
            return (
              <div key={agent.id} className={`flex flex-col items-center justify-center p-4 border rounded-xl text-center transition-all ${statusColors[agent.status]}`}>
                <div className={`p-2.5 rounded-lg mb-2 ${agent.status === 'active' ? 'bg-violet-500 text-white' : 'bg-secondary'}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className="font-bold text-xs">{agent.name}</span>
                <span className="text-[10px] opacity-70 mt-1 line-clamp-1">{agent.role}</span>
              </div>
            )
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-card border rounded-xl p-8 shadow-sm">
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2 flex items-center gap-2">
              <Wand2 className="w-4 h-4 text-primary" />
              Тема для Shorts/TikTok
            </label>
            <textarea
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Например: Как хакеры взламывают домофоны? или Почему в кино всегда идет дождь?"
              className="w-full min-h-[120px] p-4 bg-background border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 text-base leading-relaxed"
            />
          </div>

          <button
            onClick={handleGenerateText}
            disabled={loading || !topic.trim()}
            className="w-full bg-primary text-primary-foreground px-4 py-3.5 rounded-xl font-medium flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50 transition-all text-base shadow-sm"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Wand2 className="w-5 h-5" />}
            Написать мощный сценарий
          </button>
        </div>

        <AnimatePresence mode="wait">
          {script && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card border rounded-xl p-8 shadow-sm relative group"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold flex items-center gap-2 text-lg">
                  <Check className="w-5 h-5 text-green-500" />
                  Готовый сценарий
                </h3>
                <button
                  onClick={() => { navigator.clipboard.writeText(script); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
                  className="p-2.5 hover:bg-black/5 dark:hover:bg-white/10 rounded-lg transition-colors flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
                >
                  {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                  {copied ? 'Скопировано!' : 'Копировать'}
                </button>
              </div>
              
              <textarea
                value={script}
                onChange={(e) => setScript(e.target.value)}
                className="w-full h-[250px] p-4 bg-background border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 text-base leading-relaxed"
              />

              {error && (
                <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg text-sm">
                  {error}
                </div>
              )}
              
              {chunks.length === 0 && (
                <button
                  onClick={handleGenerateMedia}
                  disabled={isPlanning || !script}
                  className="mt-6 w-full bg-violet-600 text-white px-6 py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-3 hover:bg-violet-700 disabled:opacity-50 transition-all shadow-lg hover:shadow-violet-500/25"
                >
                  {isPlanning ? <Loader2 className="w-6 h-6 animate-spin" /> : (
                    <div className="flex items-center gap-1">
                      <Video className="w-6 h-6" /> + <Mic className="w-5 h-5" />
                    </div>
                  )}
                  Запустить студию ИИ и собрать Shorts
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {(chunks.length > 0) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card border-2 border-violet-500/20 rounded-xl p-8 shadow-lg mt-6"
          >
            <div className="text-center mb-8 flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-bold mb-2">Конвейер Рендера v5 🎬</h3>
                <p className="text-violet-500 font-medium bg-violet-500/10 inline-flex items-center gap-2 px-4 py-2 rounded-full">
                  {(isMerging || isPlanning || currentActiveIndex !== null) && <Loader2 className="w-4 h-4 animate-spin" />}
                  {getOverallProgressText()}
                </p>
              </div>
              <button 
                onClick={() => { localStorage.clear(); setChunks([]); setMergedUrl(''); setMusicUrl(''); }} 
                className="text-xs bg-muted hover:bg-muted/80 text-muted-foreground px-3 py-2 rounded-lg border flex items-center gap-1"
              >
                Сбросить сессию
              </button>
            </div>

            {mergedUrl && (
              <div className="flex flex-col items-center mb-10 pb-10 border-b border-border">
                <div className="w-full max-w-[320px] overflow-hidden rounded-2xl border-4 border-violet-500/30 bg-black shadow-2xl mb-6 relative">
                  <video src={mergedUrl} controls className="w-full h-auto aspect-[9/16] object-cover" />
                </div>
                <a href={mergedUrl} download="Raccoon_Final_Master.mp4" target="_blank" rel="noreferrer" className="w-full max-w-[320px] flex justify-center items-center gap-2 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:opacity-90 transition-all shadow-xl hover:shadow-violet-500/40">
                  <Download className="w-6 h-6" /> Скачать Готовый Shorts
                </a>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 w-full">
              {chunks.map((chunk, idx) => {
                const isActive = currentActiveIndex === idx;
                const isFailed = chunk.videoStatus === 'FAILED' || chunk.audioStatus === 'FAILED';
                
                return (
                  <div key={idx} className={`rounded-xl p-4 border text-sm flex flex-col gap-2 transition-all ${isActive ? 'bg-violet-500/10 border-violet-500 scale-[1.02] shadow-md animate-pulse' : isFailed ? 'bg-red-500/5 border-red-500/30' : 'bg-secondary/50 border-border opacity-70'}`}>
                    <span className="font-bold flex items-center justify-between">
                      <span>Сцена {idx + 1} {chunk.isMascot ? '🦝' : '🎥'}</span>
                      {isActive && <span className="text-[10px] bg-violet-500 text-white px-2 py-0.5 rounded-full">Обработка</span>}
                      {isFailed && (
                        <button 
                          onClick={() => retryChunk(chunk.id)}
                          className="text-[10px] bg-red-500 hover:bg-red-600 text-white px-2 py-0.5 rounded-full flex items-center gap-0.5 font-bold"
                          title="Перегенерировать только эту сцену"
                        >
                          <RefreshCw className="w-2.5 h-2.5" /> Повторить
                        </button>
                      )}
                    </span>
                    <p className="line-clamp-2 text-muted-foreground italic">"{chunk.text}"</p>
                    
                    <div className="mt-auto flex justify-between items-center border-t border-border pt-2 text-xs">
                      {!chunk.isMascot && (
                        <div className="flex items-center gap-1">
                          <Palette className="w-3 h-3 text-violet-400" />
                          <span className={chunk.imageStatus === 'COMPLETED' ? 'text-green-500 font-bold' : chunk.imageStatus === 'PENDING' ? 'text-yellow-500' : 'text-muted-foreground'}>
                            Flux
                          </span>
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <Video className="w-3 h-3" />
                        <span className={chunk.videoStatus === 'COMPLETED' ? 'text-green-500 font-bold' : chunk.videoStatus === 'FAILED' ? 'text-red-500 font-bold' : chunk.videoStatus === 'SUBMITTING' ? 'text-yellow-500' : 'text-muted-foreground'}>
                          {chunk.videoStatus === 'COMPLETED' ? 'ОК' : chunk.videoStatus === 'FAILED' ? 'ERR' : chunk.videoStatus === 'PENDING' ? 'Kling...' : chunk.videoStatus === 'SUBMITTING' ? 'Запуск...' : 'Очередь'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Mic className="w-3 h-3" />
                        <span className={chunk.audioStatus === 'COMPLETED' ? 'text-green-500 font-bold' : chunk.audioStatus === 'FAILED' ? 'text-red-500 font-bold' : chunk.audioStatus === 'SUBMITTING' ? 'text-yellow-500' : 'text-muted-foreground'}>
                          {chunk.audioStatus === 'COMPLETED' ? 'ОК' : chunk.audioStatus === 'FAILED' ? 'ERR' : chunk.audioStatus === 'PENDING' ? 'Звук...' : chunk.audioStatus === 'SUBMITTING' ? 'Запуск...' : 'Очередь'}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {history.length > 0 && (
        <div className="mt-16 pt-8 border-t border-border">
          <h3 className="text-2xl font-bold flex items-center gap-3 mb-8">
            <Clock className="w-6 h-6 text-primary" />
            История работ
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            {history.map(job => (
              <div key={job.id} className="flex flex-col bg-card border rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all">
                <div className="w-full bg-black relative flex items-center justify-center">
                  <video src={job.video_url} controls className="w-full max-h-[300px] object-contain" />
                </div>
                
                <div className="p-5 flex flex-col flex-1">
                  <p className="text-sm font-medium mb-4 line-clamp-3 leading-relaxed text-foreground/90">
                    {job.prompt || 'Генерация без описания'}
                  </p>
                  
                  <div className="mt-auto flex items-center justify-between gap-3">
                    <a href={job.video_url} download target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm font-medium bg-primary/10 hover:bg-primary/20 text-primary px-4 py-2 rounded-lg transition-colors">
                      <Download className="w-4 h-4" /> Скачать
                    </a>
                    
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => handleFeedback(job.id, 'LIKE')}
                        className={`p-2 rounded-lg transition-colors ${job.feedback === 'LIKE' ? 'bg-green-500/20 text-green-500' : 'bg-secondary hover:bg-secondary/80 text-muted-foreground'}`}
                        title="Всё отлично!"
                      >
                        <ThumbsUp className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleFeedback(job.id, 'DISLIKE')}
                        className={`p-2 rounded-lg transition-colors ${job.feedback === 'DISLIKE' ? 'bg-red-500/20 text-red-500' : 'bg-secondary hover:bg-secondary/80 text-muted-foreground'}`}
                        title="Есть ошибки"
                      >
                        <ThumbsDown className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <AnimatePresence>
                    {(job.feedback === 'DISLIKE' && !job.feedback_comment && activeCommentId === job.id) && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }} 
                        animate={{ opacity: 1, height: 'auto' }} 
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-4 pt-4 border-t border-border overflow-hidden"
                      >
                        <p className="text-xs font-medium text-red-400 mb-2 flex items-center gap-1">
                          <MessageSquare className="w-3 h-3" /> Что пошло не так?
                        </p>
                        <div className="flex gap-2">
                          <input 
                            type="text" 
                            value={commentText}
                            onChange={e => setCommentText(e.target.value)}
                            placeholder="Например: плохой звук, артефакты..."
                            className="flex-1 bg-background text-sm border rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-red-500/50"
                            onKeyDown={e => e.key === 'Enter' && submitComment(job.id)}
                          />
                          <button 
                            onClick={() => submitComment(job.id)}
                            className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-lg transition-colors"
                          >
                            <Send className="w-4 h-4" />
                          </button>
                        </div>
                      </motion.div>
                    )}
                    {job.feedback_comment && (
                       <motion.div 
                         initial={{ opacity: 0 }} 
                         animate={{ opacity: 1 }} 
                         className="mt-4 pt-4 border-t border-border"
                       >
                         <p className="text-xs text-muted-foreground bg-red-500/5 p-3 rounded-lg border border-red-500/10 italic">
                           "{job.feedback_comment}"
                         </p>
                       </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
