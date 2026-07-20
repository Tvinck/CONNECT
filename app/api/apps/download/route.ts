import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getDownloadUrl } from '@/lib/r2'
import { getShopCorsHeaders } from '@/lib/cors'

export const dynamic = 'force-dynamic'

/**
 * Public endpoint: get a temporary download URL for an IPA file.
 * GET /api/apps/download?id=<app_id>
 * Returns { success, downloadUrl, name, version }
 */
export async function GET(request: Request) {
  const corsHeaders = getShopCorsHeaders(request.headers.get('origin'))
  const { searchParams } = new URL(request.url)
  const appId = searchParams.get('id')

  if (!appId) {
    return NextResponse.json({ success: false, error: 'Missing app id' }, { status: 400, headers: corsHeaders })
  }

  const supabase = createAdminClient()
  const { data: app } = await supabase
    .from('bazzar_apps')
    .select('id, name, version, ipa_url, is_active')
    .eq('id', appId)
    .maybeSingle()

  if (!app || !app.is_active) {
    return NextResponse.json({ success: false, error: 'App not found' }, { status: 404, headers: corsHeaders })
  }

  if (!app.ipa_url) {
    return NextResponse.json({ success: false, error: 'IPA not available' }, { status: 404, headers: corsHeaders })
  }

  try {
    const downloadUrl = await getDownloadUrl(app.ipa_url, 7200) // 2 hours
    return NextResponse.json({
      success: true,
      downloadUrl,
      name: app.name,
      version: app.version,
    }, { headers: corsHeaders })
  } catch (err: any) {
    console.error('[apps/download] R2 error:', err.message)
    return NextResponse.json({ success: false, error: 'Download error' }, { status: 500, headers: corsHeaders })
  }
}

export async function OPTIONS(request: Request) {
  return new NextResponse(null, { headers: getShopCorsHeaders(null) })
}
