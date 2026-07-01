import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: Request) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mock.supabase.co',
    process.env.SUPABASE_SERVICE_ROLE_KEY || 'mock-key'
  )
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  }

  try {
    const { uniquecode, udid } = await request.json()

    if (!uniquecode || !udid) {
      return NextResponse.json({ success: false, error: 'Missing data' }, { status: 400, headers })
    }

    // Placeholder: In a real integration, we'd check if uniquecode is valid and not already linked
    // and then update bazzar_users / apple_certificates in DB

    await supabase.from('bazzar_users').upsert({
      udid: udid,
      status: 'bought',
      last_purchase: new Date().toISOString(),
      plan: 'Сертификат GGSel'
    }, { onConflict: 'udid' })

    return NextResponse.json({ success: true }, { headers })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500, headers })
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { headers: {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  } })
}
