import { NextRequest, NextResponse } from 'next/server';
import { getShopCorsHeaders } from '@/lib/cors';
import { createAdminClient } from '@/lib/supabase/admin';
import { uploadFile } from '@/lib/r2';

export const dynamic = 'force-dynamic'

// Vercel body size limit — increase for IPA uploads
// Note: on Vercel Hobby plan, max is 4.5MB. On Pro, set in vercel.json.
export const maxDuration = 60 // seconds

/**
 * POST /api/apps/upload?appId=<uuid>
 * Receives an IPA file via form-data and uploads it to R2 server-side.
 * This avoids browser→R2 direct connection (SSL issues with R2 S3 endpoint).
 */
export async function POST(request: Request) {
  const corsHeaders = getShopCorsHeaders(request.headers.get('origin'))

  try {
    const { searchParams } = new URL(request.url)
    const appId = searchParams.get('appId')
    if (!appId) {
      return NextResponse.json({ success: false, error: 'Missing appId' }, { status: 400, headers: corsHeaders })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    if (!file) {
      return NextResponse.json({ success: false, error: 'No file' }, { status: 400, headers: corsHeaders })
    }

    // Sanitize filename
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    const key = `ipa/${appId}/${safeName}`

    // Upload to R2 server-side
    const buffer = Buffer.from(await file.arrayBuffer())
    await uploadFile(key, buffer, 'application/octet-stream')

    // Update DB
    const supabase = createAdminClient()
    const { error } = await supabase
      .from('bazzar_apps')
      .update({ ipa_url: key, size_bytes: file.size, updated_at: new Date().toISOString() })
      .eq('id', appId)
    
    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500, headers: corsHeaders })
    }

    return NextResponse.json({ success: true, key, size: file.size }, { headers: corsHeaders })
  } catch (err: any) {
    console.error('[apps/upload] Error:', err.message)
    return NextResponse.json({ success: false, error: err.message || 'Upload failed' }, { status: 500, headers: corsHeaders })
  }
}

export async function OPTIONS(request: Request) {
  return new NextResponse(null, { headers: getShopCorsHeaders(null) })
}
