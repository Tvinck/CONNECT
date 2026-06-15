import { NextRequest, NextResponse } from 'next/server'
import { createPixelClient } from '@/lib/supabase/pixel'
import { getCurrentProfile } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    // 1. Authorize user session & verify privileges
    const profile = await getCurrentProfile()
    if (!profile) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }
    if (profile.role !== 'ceo' && profile.role !== 'coowner') {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 })
    }

    // 2. Parse form data
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    if (!file) {
      return NextResponse.json({ error: 'Файл не загружен' }, { status: 400 })
    }

    const pixelSupabase = createPixelClient()
    const fileExt = file.name.split('.').pop() || 'jpg'
    const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`
    
    // Convert File to Buffer
    const buffer = Buffer.from(await file.arrayBuffer())
    
    // Upload to 'templates' bucket on remote Supabase Storage
    let bucketName = 'templates'
    const { error: uploadErr } = await pixelSupabase.storage
      .from(bucketName)
      .upload(fileName, buffer, {
        contentType: file.type,
        duplex: 'half'
      })

    if (uploadErr) {
      console.warn(`Uploading to '${bucketName}' failed, trying 'public' bucket...`, uploadErr.message)
      bucketName = 'public'
      const { error: err2 } = await pixelSupabase.storage
        .from(bucketName)
        .upload(fileName, buffer, {
          contentType: file.type,
          duplex: 'half'
        })
      if (err2) {
        throw new Error(`Ошибка загрузки в хранилище Supabase: ${err2.message}`)
      }
    }

    const { data: { publicUrl } } = pixelSupabase.storage
      .from(bucketName)
      .getPublicUrl(fileName)

    return NextResponse.json({
      success: true,
      url: publicUrl,
      media_type: file.type.startsWith('video/') ? 'video' : 'image'
    })
  } catch (error: any) {
    console.error('File upload to Pixel storage failed:', error)
    return NextResponse.json({ error: error.message || 'Ошибка загрузки файла' }, { status: 500 })
  }
}
