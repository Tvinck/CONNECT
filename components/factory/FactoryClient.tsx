'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Wand2, Loader2, Copy, Check, Video, Download, Mic, Coins, Clock, Combine, ThumbsUp, ThumbsDown, MessageSquare, Send } from 'lucide-react'

export function FactoryClient() {
  const [topic, setTopic] = useState('')
  const [script, setScript] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  const [videoTaskId, setVideoTaskId] = useState('')
  const [videoStatus, setVideoStatus] = useState('')
  const [videoUrl, setVideoUrl] = useState('')
  const [videoLoading, setVideoLoading] = useState(false)

  const [audioTaskId, setAudioTaskId] = useState('')
  const [audioStatus, setAudioStatus] = useState('')
  const [audioUrl, setAudioUrl] = useState('')

  const [mergedUrl, setMergedUrl] = useState('')
  const [isMerging, setIsMerging] = useState(false)

  const [balance, setBalance] = useState<number | null>(null)
  const [history, setHistory] = useState<any[]>([])
  
  // State for handling dislikes
  const [activeCommentId, setActiveCommentId] = useState<string | null>(null)
  const [commentText, setCommentText] = useState('')

  // Fetch balance & history
  const fetchDashboardData = () => {
    fetch('/api/factory/balance').then(r => r.json()).then(d => {
      if (d.credits !== undefined) setBalance(d.credits)
    }).catch(() => {})
    
    fetch('/api/factory/history').then(r => r.json()).then(d => {
      if (d.jobs) setHistory(d.jobs)
    }).catch(() => {})
  }

  useEffect(() => {
    fetchDashboardData()
  }, [])

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
    } catch (e) {
      console.error(e)
    }
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
    } catch (e) {
      console.error(e)
    }
  }

  // Polling for video status
  useEffect(() => {
    if (!videoTaskId || videoStatus === 'COMPLETED' || videoStatus === 'FAILED') return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/factory/video/status?taskId=${videoTaskId}`)
        const data = await res.json()
        if (res.ok) {
          setVideoStatus(data.status)
          if (data.status === 'COMPLETED' && data.videoUrl) setVideoUrl(data.videoUrl)
        }
      } catch (err) {}
    }, 10000);
    return () => clearInterval(interval)
  }, [videoTaskId, videoStatus]);

  // Polling for audio status
  useEffect(() => {
    if (!audioTaskId || audioStatus === 'COMPLETED' || audioStatus === 'FAILED') return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/factory/video/status?taskId=${audioTaskId}`)
        const data = await res.json()
        if (res.ok) {
          setAudioStatus(data.status)
          if (data.status === 'COMPLETED' && data.videoUrl) setAudioUrl(data.videoUrl)
        }
      } catch (err) {}
    }, 10000);
    return () => clearInterval(interval)
  }, [audioTaskId, audioStatus]);

  // Auto-merge when both are ready
  useEffect(() => {
    if (videoStatus === 'COMPLETED' && audioStatus === 'COMPLETED' && videoUrl && audioUrl && !mergedUrl && !isMerging) {
      setIsMerging(true)
      fetch('/api/factory/merge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoUrl, audioUrl, prompt: script })
      })
      .then(r => r.json())
      .then(data => {
        if (data.mergedUrl) {
           setMergedUrl(data.mergedUrl)
           fetchDashboardData() // Refresh history and balance
           setIsMerging(false)
        } else {
           // Если ошибка при мерже, останавливаем попытки, чтобы не спамить
           console.error("Merge failed:", data.error)
        }
      })
      .catch(err => {
         console.error(err)
      })
    }
  }, [videoStatus, audioStatus, videoUrl, audioUrl, mergedUrl, isMerging])

  const handleGenerateText = async () => {
    if (!topic.trim()) return
    
    setLoading(true)
    setError('')
    setScript('')
    
    try {
      const res = await fetch('/api/factory/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic })
      })
      
      const data = await res.json()
      
      if (!res.ok) throw new Error(data.error || 'Ошибка при генерации')
      
      setScript(data.script)
      // Reset media states
      setVideoTaskId('')
      setVideoStatus('')
      setVideoUrl('')
      setAudioTaskId('')
      setAudioStatus('')
      setAudioUrl('')
      setMergedUrl('')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateMedia = async () => {
    if (!script) return
    setVideoLoading(true)
    setError('')
    
    try {
      const [vidRes, audRes] = await Promise.all([
        fetch('/api/factory/video/generate', { method: 'POST', body: JSON.stringify({ script }) }),
        fetch('/api/factory/audio/generate', { method: 'POST', body: JSON.stringify({ script }) })
      ])
      const vidData = await vidRes.json()
      const audData = await audRes.json()
      
      if (!vidRes.ok) throw new Error(vidData.error || 'Ошибка при генерации видео')
      if (!audRes.ok) throw new Error(audData.error || 'Ошибка при генерации звука')
      
      setVideoTaskId(vidData.taskId)
      setVideoStatus('PENDING')
      setAudioTaskId(audData.taskId)
      setAudioStatus('PENDING')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setVideoLoading(false)
    }
  }

  const handleCopy = () => {
    if (!script) return
    navigator.clipboard.writeText(script)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Общий статус прогресса
  const getOverallProgressText = () => {
    if (mergedUrl) return "Склейка завершена! Видео готово 🎉"
    if (isMerging) return "Синхронизация звука и видео (склейка)..."
    if (videoStatus === 'COMPLETED' && audioStatus === 'COMPLETED') return "Подготовка к склейке..."
    if (videoTaskId || audioTaskId) return "Идёт рендер в облаке Higgsfield (2-4 мин)..."
    return "Ожидание команды..."
  }

  return (
    <div className="space-y-8 relative">
      {/* Баланс */}
      <div className="absolute -top-16 right-0 bg-background/80 backdrop-blur px-5 py-2.5 rounded-full border border-border flex items-center gap-3 shadow-sm z-10">
        <Coins className="w-5 h-5 text-yellow-500" />
        <span className="text-sm font-medium">Баланс Higgsfield:</span>
        <span className="font-bold text-violet-500 text-lg">{balance !== null ? balance : '...'} 🪙</span>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">ИИ Завод</h1>
          <p className="text-muted-foreground mt-2 text-lg">Автоматическое производство хитов с Енотом Чиллом</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Панель сценария */}
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

        {/* Панель результата текста */}
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
                  onClick={handleCopy}
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
              
              {!videoTaskId && !audioTaskId && (
                <button
                  onClick={handleGenerateMedia}
                  disabled={videoLoading || !script}
                  className="mt-6 w-full bg-violet-600 text-white px-6 py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-3 hover:bg-violet-700 disabled:opacity-50 transition-all shadow-lg hover:shadow-violet-500/25"
                >
                  {videoLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : (
                    <div className="flex items-center gap-1">
                      <Video className="w-6 h-6" /> + <Mic className="w-5 h-5" />
                    </div>
                  )}
                  Оживить Енота и озвучить текст
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Media Polling/Result Section */}
      <AnimatePresence>
        {(videoTaskId || audioTaskId) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card border-2 border-violet-500/20 rounded-xl p-8 shadow-lg mt-6"
          >
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold mb-2">Конвейер Енота 🎬</h3>
              <p className="text-violet-500 font-medium bg-violet-500/10 inline-flex items-center gap-2 px-4 py-2 rounded-full">
                {(isMerging || (videoStatus === 'PENDING' || audioStatus === 'PENDING')) && <Loader2 className="w-4 h-4 animate-spin" />}
                {getOverallProgressText()}
              </p>
            </div>

            {/* Финальный результат склейки */}
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full opacity-80">
              {/* Блок Видео */}
              <div className="space-y-4 text-center">
                <h4 className="font-semibold flex items-center justify-center gap-2">
                  <Video className="w-5 h-5 text-violet-500" /> Статус Видео
                </h4>
                {videoUrl ? (
                  <p className="text-green-500 font-medium flex items-center justify-center gap-1"><Check className="w-4 h-4"/> Срендерено</p>
                ) : videoStatus === 'FAILED' ? (
                  <p className="text-red-500 font-medium">Ошибка генерации видео</p>
                ) : (
                  <div className="flex flex-col items-center justify-center p-6 bg-violet-500/5 rounded-xl border border-violet-500/10">
                    <Loader2 className="w-8 h-8 text-violet-500 animate-spin mb-2" />
                    <p className="text-sm text-muted-foreground opacity-70">{videoStatus}</p>
                  </div>
                )}
              </div>

              {/* Блок Аудио */}
              <div className="space-y-4 text-center">
                <h4 className="font-semibold flex items-center justify-center gap-2">
                  <Mic className="w-5 h-5 text-blue-500" /> Статус Озвучки
                </h4>
                {audioUrl ? (
                  <p className="text-green-500 font-medium flex items-center justify-center gap-1"><Check className="w-4 h-4"/> Озвучено</p>
                ) : audioStatus === 'FAILED' ? (
                  <p className="text-red-500 font-medium">Ошибка генерации звука</p>
                ) : (
                  <div className="flex flex-col items-center justify-center p-6 bg-blue-500/5 rounded-xl border border-blue-500/10">
                    <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-2" />
                    <p className="text-sm text-muted-foreground opacity-70">{audioStatus}</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* История */}
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

                  {/* Comment box if disliked */}
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
