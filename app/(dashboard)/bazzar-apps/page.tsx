"use client"

import { useState, useEffect } from "react"
import { createClient } from "@supabase/supabase-js"
import { Plus, Trash2, Eye, EyeOff, UploadCloud } from "lucide-react"

// Use environment variables for Supabase
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
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

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
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  async function handleAddApp(e: React.FormEvent) {
    e.preventDefault()
    if (!name || !version || !iconFile || !ipaFile) {
      alert("Заполните все обязательные поля!")
      return
    }

    setIsUploading(true)
    setUploadProgress(10)

    try {
      // 1. Upload Icon
      const iconExt = iconFile.name.split('.').pop()
      const iconPath = `icons/${Date.now()}_${Math.random().toString(36).substring(7)}.${iconExt}`
      const { error: iconError } = await supabase.storage
        .from('bazzar-apps')
        .upload(iconPath, iconFile)

      if (iconError) throw iconError
      setUploadProgress(30)

      // 2. Upload IPA
      const ipaExt = ipaFile.name.split('.').pop()
      const ipaPath = `ipas/${Date.now()}_${Math.random().toString(36).substring(7)}.${ipaExt}`
      const { error: ipaError } = await supabase.storage
        .from('bazzar-apps')
        .upload(ipaPath, ipaFile)

      if (ipaError) throw ipaError
      setUploadProgress(80)

      // Get public URLs
      const { data: iconData } = supabase.storage.from('bazzar-apps').getPublicUrl(iconPath)
      const { data: ipaData } = supabase.storage.from('bazzar-apps').getPublicUrl(ipaPath)

      // 3. Insert into DB
      const { error: dbError } = await supabase
        .from("bazzar_apps")
        .insert({
          name,
          version,
          description,
          bundle_id: bundleId,
          icon_url: iconData.publicUrl,
          ipa_url: ipaData.publicUrl,
          size_bytes: ipaFile.size,
          is_active: true
        })

      if (dbError) throw dbError

      setUploadProgress(100)
      setIsModalOpen(false)
      resetForm()
      fetchApps()
    } catch (err: any) {
      console.error("Upload error:", err)
      alert("Ошибка при загрузке: " + err.message)
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  function resetForm() {
    setName("")
    setVersion("")
    setDescription("")
    setBundleId("")
    setIconFile(null)
    setIpaFile(null)
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
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-slate-800">Bazzar Apps</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
        >
          <Plus className="w-5 h-5" />
          Добавить приложение
        </button>
      </div>

      {isLoading ? (
        <div className="text-slate-500">Загрузка...</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {apps.map(app => (
            <div key={app.id} className={`p-4 border rounded-xl flex items-start gap-4 transition ${app.is_active ? 'bg-white' : 'bg-slate-50 opacity-70'}`}>
              {app.icon_url ? (
                <img src={app.icon_url} alt="icon" className="w-16 h-16 rounded-2xl object-cover" />
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-slate-200"></div>
              )}
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-slate-800">{app.name} <span className="text-sm font-normal text-slate-500">v{app.version}</span></h3>
                    <p className="text-xs text-slate-400 font-mono mt-0.5">{app.bundle_id}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => toggleActive(app)} className="text-slate-400 hover:text-indigo-600" title={app.is_active ? 'Скрыть' : 'Опубликовать'}>
                      {app.is_active ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                    </button>
                    <button onClick={() => deleteApp(app.id)} className="text-slate-400 hover:text-red-600" title="Удалить">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                <p className="text-sm text-slate-600 mt-2 line-clamp-2">{app.description}</p>
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
              <h2 className="text-xl font-semibold text-slate-800">Новое приложение</h2>
              <button onClick={() => !isUploading && setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-2xl leading-none">&times;</button>
            </div>
            
            <form onSubmit={handleAddApp} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Название *</label>
                  <input required value={name} onChange={e => setName(e.target.value)} type="text" className="w-full border rounded-lg px-3 py-2 outline-none focus:border-indigo-500" placeholder="ВТБ" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Версия *</label>
                  <input required value={version} onChange={e => setVersion(e.target.value)} type="text" className="w-full border rounded-lg px-3 py-2 outline-none focus:border-indigo-500" placeholder="2.0.1" />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Bundle ID</label>
                <input value={bundleId} onChange={e => setBundleId(e.target.value)} type="text" className="w-full border rounded-lg px-3 py-2 outline-none focus:border-indigo-500" placeholder="ru.vtb.invest" />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Описание</label>
                <textarea value={description} onChange={e => setDescription(e.target.value)} className="w-full border rounded-lg px-3 py-2 outline-none focus:border-indigo-500 h-24" placeholder="Краткое описание функционала..." />
              </div>

              <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Иконка (PNG/JPG) *</label>
                  <input required type="file" accept="image/*" onChange={e => setIconFile(e.target.files?.[0] || null)} className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">IPA файл *</label>
                  <input required type="file" accept=".ipa" onChange={e => setIpaFile(e.target.files?.[0] || null)} className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100" />
                </div>
              </div>

              {isUploading && (
                <div className="mt-4">
                  <div className="flex justify-between text-xs text-slate-500 mb-1">
                    <span>Загрузка файлов...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div className="bg-indigo-600 h-2 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} disabled={isUploading} className="px-4 py-2 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition disabled:opacity-50">
                  Отмена
                </button>
                <button type="submit" disabled={isUploading} className="px-4 py-2 text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition flex items-center gap-2 disabled:opacity-50">
                  {isUploading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Сохранение...
                    </>
                  ) : (
                    <>
                      <UploadCloud className="w-5 h-5" />
                      Загрузить
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
