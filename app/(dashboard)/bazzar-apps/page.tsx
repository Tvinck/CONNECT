"use client"

import { useState, useEffect } from "react"
import { createClient } from "@supabase/supabase-js"
import { Plus, Trash2, Eye, EyeOff, UploadCloud, RefreshCw } from "lucide-react"
import { Header } from "@/components/layout/Header"

// Supabase client initialization
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

type BazzarApp = {
  id: string
  name: string
  version: string
  description: string
  icon_url: string
  ipa_url: string
  bundle_id: string
  size_bytes: number
  is_active: boolean
  created_at: string
}

export default function BazzarAppsPage() {
  const [apps, setApps] = useState<BazzarApp[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingApp, setEditingApp] = useState<BazzarApp | null>(null)

  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadStatusText, setUploadStatusText] = useState("")

  // Form state
  const [name, setName] = useState("")
  const [version, setVersion] = useState("")
  const [description, setDescription] = useState("")
  const [bundleId, setBundleId] = useState("")
  const [iconFile, setIconFile] = useState<File | null>(null)
  const [ipaFile, setIpaFile] = useState<File | null>(null)

  useEffect(() => {
    fetchApps()
  }, [])

  async function fetchApps() {
    setIsLoading(true)
    const { data, error } = await supabase
      .from("bazzar_apps")
      .select("*")
      .order("created_at", { ascending: false })
    
    if (data) {
      setApps(data)
    } else {
      console.error("Error fetching apps:", error)
    }
    setIsLoading(false)
  }

  function formatBytes(bytes: number) {
    if (!bytes || bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  // ── Robust Upload Handler for R2 ──
  async function uploadIpaToR2(file: File, appId: string): Promise<string> {
    const R2_BASE = 'https://bazzar-r2.artyomkoshelev-04.workers.dev'
    const R2_TOKEN = process.env.NEXT_PUBLIC_R2_UPLOAD_TOKEN || 'bazzar-r2-upload-2024-secret'

    const cleanFileName = file.name.replace(/[^\w\.\-]/g, '_')
    const ipaKey = `ipa/${appId}/${cleanFileName}`
    const CHUNK_SIZE = 5 * 1024 * 1024 // 5MB chunks for maximum stability
    const DIRECT_LIMIT = 5 * 1024 * 1024 // <= 5MB -> direct PUT

    // Helper for retry fetch on network issues
    const fetchWithRetry = async (url: string, init: RequestInit, maxAttempts = 5): Promise<Response> => {
      let lastErr: unknown
      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
          const res = await fetch(url, init)
          if (res.ok || res.status < 500) return res
          lastErr = new Error(`HTTP ${res.status}`)
        } catch (e) {
          lastErr = e
        }
        if (attempt < maxAttempts) {
          await new Promise(r => setTimeout(r, 1000 * attempt))
        }
      }
      throw lastErr instanceof Error ? lastErr : new Error('Ошибка сети при загрузке')
    }

    if (file.size <= DIRECT_LIMIT) {
      setUploadStatusText('Прямая загрузка IPA файла...')
      const res = await fetchWithRetry(`${R2_BASE}/${ipaKey}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/octet-stream', 'X-Upload-Token': R2_TOKEN },
        body: file,
      })
      if (!res.ok) throw new Error(`Прямая загрузка завершилась с ошибкой ${res.status}`)
      return `${R2_BASE}/${ipaKey}`
    }

    // Multipart upload for large files
    setUploadStatusText('Инициализация многопоточной загрузки (Multipart)...')
    const createRes = await fetchWithRetry(`${R2_BASE}/multipart/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Upload-Token': R2_TOKEN },
      body: JSON.stringify({ key: ipaKey }),
    })
    if (!createRes.ok) throw new Error('Не удалось запустить Multipart сессию')
    const { uploadId } = await createRes.json()

    const totalParts = Math.ceil(file.size / CHUNK_SIZE)
    const parts: { partNumber: number; etag: string }[] = []

    const abortUpload = () =>
      fetch(`${R2_BASE}/multipart/abort`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Upload-Token': R2_TOKEN },
        body: JSON.stringify({ uploadId, key: ipaKey }),
      }).catch(() => {})

    try {
      for (let i = 0; i < totalParts; i++) {
        const partNumber = i + 1
        const start = i * CHUNK_SIZE
        const end = Math.min(start + CHUNK_SIZE, file.size)
        const chunk = file.slice(start, end)

        const uploadedMB = (end / (1024 * 1024)).toFixed(1)
        const totalMB = (file.size / (1024 * 1024)).toFixed(1)
        setUploadStatusText(`Загрузка IPA: ${uploadedMB} MB из ${totalMB} MB (чанк ${partNumber} из ${totalParts})...`)

        const partRes = await fetchWithRetry(
          `${R2_BASE}/multipart/part?uploadId=${encodeURIComponent(uploadId)}&partNumber=${partNumber}&key=${encodeURIComponent(ipaKey)}`,
          {
            method: 'PUT',
            headers: { 'X-Upload-Token': R2_TOKEN, 'Content-Type': 'application/octet-stream' },
            body: chunk,
          }
        )

        if (!partRes.ok) {
          throw new Error(`Ошибка загрузки части ${partNumber} (${partRes.status})`)
        }

        const partData = await partRes.json()
        parts.push({ partNumber: partData.partNumber, etag: partData.etag })
        
        // Progress from 20% to 90%
        setUploadProgress(20 + Math.round((partNumber / totalParts) * 70))
      }

      setUploadStatusText('Завершение сборки файла на сервере R2...')
      const completeRes = await fetchWithRetry(`${R2_BASE}/multipart/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Upload-Token': R2_TOKEN },
        body: JSON.stringify({ uploadId, key: ipaKey, parts }),
      })

      if (!completeRes.ok) {
        throw new Error('Не удалось собрать файл после загрузки частей')
      }

      return `${R2_BASE}/${ipaKey}`
    } catch (err) {
      await abortUpload()
      throw err
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!editingApp && (!name || !version || !iconFile || !ipaFile)) {
      alert("Заполните все обязательные поля!")
      return
    }

    setIsUploading(true)
    setUploadProgress(5)

    try {
      const appId = editingApp ? editingApp.id : crypto.randomUUID()
      let iconPublicUrl = editingApp?.icon_url || ''
      let ipaPublicUrl = editingApp?.ipa_url || ''
      let fileSize = editingApp?.size_bytes || 0

      // 1. Upload Icon if changed
      if (iconFile) {
        setUploadStatusText('Загрузка иконки...')
        const iconExt = iconFile.name.split('.').pop() || 'png'
        const iconPath = `icons/${appId}_${Date.now()}.${iconExt}`
        const { error: iconError } = await supabase.storage
          .from('bazzar-apps')
          .upload(iconPath, iconFile, { upsert: true })

        if (iconError) throw iconError
        const { data: iconData } = supabase.storage.from('bazzar-apps').getPublicUrl(iconPath)
        iconPublicUrl = iconData.publicUrl
      }
      setUploadProgress(15)

      // 2. Upload IPA if changed
      if (ipaFile) {
        fileSize = ipaFile.size
        ipaPublicUrl = await uploadIpaToR2(ipaFile, appId)
      }

      setUploadProgress(95)
      setUploadStatusText('Сохранение информации в базу данных...')

      if (editingApp) {
        const { error: dbError } = await supabase
          .from("bazzar_apps")
          .update({
            name,
            version,
            description,
            bundle_id: bundleId,
            icon_url: iconPublicUrl,
            ipa_url: ipaPublicUrl,
            size_bytes: fileSize,
          })
          .eq("id", editingApp.id)

        if (dbError) throw dbError
      } else {
        const { error: dbError } = await supabase
          .from("bazzar_apps")
          .insert({
            id: appId,
            name,
            version,
            description,
            bundle_id: bundleId,
            icon_url: iconPublicUrl,
            ipa_url: ipaPublicUrl,
            size_bytes: fileSize,
            is_active: true
          })

        if (dbError) throw dbError
      }

      setUploadProgress(100)
      setUploadStatusText('Готово!')
      setIsModalOpen(false)
      resetForm()
      fetchApps()
    } catch (err: any) {
      console.error("Upload error:", err)
      alert("Ошибка при сохранении: " + (err.message || err))
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
      setUploadStatusText("")
    }
  }

  function handleOpenCreate() {
    setEditingApp(null)
    resetForm()
    setIsModalOpen(true)
  }

  function handleOpenEdit(app: BazzarApp) {
    setEditingApp(app)
    setName(app.name)
    setVersion(app.version)
    setDescription(app.description || "")
    setBundleId(app.bundle_id || "")
    setIconFile(null)
    setIpaFile(null)
    setIsModalOpen(true)
  }

  function resetForm() {
    setName("")
    setVersion("")
    setDescription("")
    setBundleId("")
    setIconFile(null)
    setIpaFile(null)
    setEditingApp(null)
  }

  async function toggleActive(app: BazzarApp) {
    await supabase.from("bazzar_apps").update({ is_active: !app.is_active }).eq("id", app.id)
    fetchApps()
  }

  async function deleteApp(id: string) {
    if (!confirm("Удалить приложение навсегда?")) return
    await supabase.from("bazzar_apps").delete().eq("id", id)
    fetchApps()
  }

  return (
    <div className="p-6">
      <Header
        title="Bazzar Apps"
        subtitle="Публикация и автоматическое управление IPA-приложениями"
      />
      <div className="flex justify-end mb-6">
        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-4 py-2 bg-brand hover:bg-brand-hover text-[#171821] rounded-lg font-medium transition shadow-sm"
        >
          <Plus className="w-5 h-5" />
          Добавить приложение
        </button>
      </div>

      {isLoading ? (
        <div className="text-slate-500 py-12 text-center">Загрузка приложений...</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {apps.map(app => (
            <div key={app.id} className={`p-4 border rounded-xl flex items-start gap-4 transition ${app.is_active ? 'bg-white' : 'bg-slate-50 opacity-70'}`}>
              {app.icon_url ? (
                <img src={app.icon_url} alt="icon" className="w-16 h-16 rounded-2xl object-cover border" />
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-slate-200 flex items-center justify-center text-slate-400 font-bold">IPA</div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start">
                  <div className="truncate">
                    <h3 className="font-semibold text-slate-800 truncate">{app.name} <span className="text-xs font-normal text-slate-500">v{app.version}</span></h3>
                    <p className="text-xs text-slate-400 font-mono mt-0.5 truncate">{app.bundle_id || 'no.bundle.id'}</p>
                  </div>
                  <div className="flex gap-2 shrink-0 ml-2">
                    <button onClick={() => handleOpenEdit(app)} className="text-slate-400 hover:text-slate-700" title="Редактировать / Обновить IPA">
                      <RefreshCw className="w-4 h-4" />
                    </button>
                    <button onClick={() => toggleActive(app)} className="text-slate-400 hover:text-accent" title={app.is_active ? 'Скрыть' : 'Опубликовать'}>
                      {app.is_active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>
                    <button onClick={() => deleteApp(app.id)} className="text-slate-400 hover:text-red-600" title="Удалить">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <p className="text-sm text-slate-600 mt-2 line-clamp-2">{app.description || 'Без описания'}</p>
                <div className="text-xs text-slate-400 mt-3 flex justify-between">
                  <span>{formatBytes(app.size_bytes)}</span>
                  <span>{new Date(app.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          ))}
          {apps.length === 0 && (
            <div className="col-span-full py-12 text-center text-slate-500 bg-white border rounded-xl">
              Приложений пока нет. Добавьте первое!
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-xl font-semibold text-slate-800">
                {editingApp ? `Редактирование: ${editingApp.name}` : "Новое приложение"}
              </h2>
              <button onClick={() => !isUploading && setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-2xl leading-none">&times;</button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Название *</label>
                  <input required value={name} onChange={e => setName(e.target.value)} type="text" className="w-full border rounded-lg px-3 py-2 outline-none focus:border-accent" placeholder="Persona Pro" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Версия *</label>
                  <input required value={version} onChange={e => setVersion(e.target.value)} type="text" className="w-full border rounded-lg px-3 py-2 outline-none focus:border-accent" placeholder="1.0.0" />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Bundle ID</label>
                <input value={bundleId} onChange={e => setBundleId(e.target.value)} type="text" className="w-full border rounded-lg px-3 py-2 outline-none focus:border-accent" placeholder="com.persona.app" />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Описание</label>
                <textarea value={description} onChange={e => setDescription(e.target.value)} className="w-full border rounded-lg px-3 py-2 outline-none focus:border-accent h-24" placeholder="Описание приложения..." />
              </div>

              <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Иконка (PNG/JPG) {editingApp ? '(необязательно)' : '*'}
                  </label>
                  <input required={!editingApp} type="file" accept="image/*" onChange={e => setIconFile(e.target.files?.[0] || null)} className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-accent/10 file:text-accent hover:file:bg-accent/20" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    IPA файл {editingApp ? '(необязательно)' : '*'}
                  </label>
                  <input required={!editingApp} type="file" accept=".ipa" onChange={e => setIpaFile(e.target.files?.[0] || null)} className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-accent/10 file:text-accent hover:file:bg-accent/20" />
                </div>
              </div>

              {isUploading && (
                <div className="mt-4 p-3 bg-slate-50 border rounded-xl space-y-2">
                  <div className="flex justify-between text-xs font-medium text-slate-700">
                    <span className="truncate pr-2">{uploadStatusText}</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                    <div className="bg-brand h-2 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} disabled={isUploading} className="px-4 py-2 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition disabled:opacity-50">
                  Отмена
                </button>
                <button type="submit" disabled={isUploading} className="px-4 py-2 text-[#171821] bg-brand hover:bg-brand-hover rounded-lg transition flex items-center gap-2 font-medium disabled:opacity-50">
                  {isUploading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-slate-800" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Загрузка...
                    </>
                  ) : (
                    <>
                      <UploadCloud className="w-5 h-5" />
                      {editingApp ? "Сохранить изменения" : "Загрузить приложение"}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
