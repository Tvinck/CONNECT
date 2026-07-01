'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Wand2, Loader2, Copy, Check } from 'lucide-react'

export function FactoryClient() {
  const [topic, setTopic] = useState('')
  const [script, setScript] = useState('')
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')

  const handleGenerate = async () => {
    if (!topic.trim()) return
    
    setLoading(true)
    setError('')
    
    try {
      const res = await fetch('/api/factory/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic })
      })
      
      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.error || 'Ошибка при генерации')
      }
      
      setScript(data.script)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = () => {
    if (!script) return
    navigator.clipboard.writeText(script)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-6">
      {/* Input section */}
      <div className="bg-card border rounded-xl p-6 shadow-sm">
        <label className="block text-sm font-medium mb-2">
          О чем будет видео? (Тема)
        </label>
        <div className="flex gap-3">
          <input 
            type="text"
            value={topic}
            onChange={e => setTopic(e.target.value)}
            placeholder="Например: Как построили пирамиды или секреты Титаника..."
            className="flex-1 px-4 py-3 bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
            onKeyDown={e => e.key === 'Enter' && handleGenerate()}
          />
          <button
            onClick={handleGenerate}
            disabled={loading || !topic.trim()}
            className="bg-primary text-primary-foreground px-6 py-3 rounded-lg font-medium flex items-center gap-2 hover:opacity-90 disabled:opacity-50 transition-all"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Wand2 className="w-5 h-5" />}
            Сгенерировать
          </button>
        </div>
        {error && <div className="text-red-500 mt-3 text-sm">{error}</div>}
      </div>

      {/* Result section */}
      {script && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }} 
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border rounded-xl p-6 shadow-sm"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              📝 Готовый сценарий (140-160 слов)
            </h2>
            <button 
              onClick={handleCopy}
              className="text-sm flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Скопировано!' : 'Копировать'}
            </button>
          </div>
          
          <textarea 
            value={script}
            onChange={e => setScript(e.target.value)}
            className="w-full h-[400px] p-4 bg-background border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 text-base leading-relaxed"
          />
          
          <div className="mt-4 p-4 bg-blue-500/10 text-blue-500 rounded-lg text-sm border border-blue-500/20">
            <strong>Следующий шаг:</strong> Скопируйте этот текст и вставьте его в Higgsfield AI для генерации озвучки и видео с Енотом Чиллом.
          </div>
        </motion.div>
      )}
    </div>
  )
}
