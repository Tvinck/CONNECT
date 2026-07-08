import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'
const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: cors })
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const platform = searchParams.get('platform') || 'all'
  const supabase = getSupabase()

  const { data, error } = await supabase
    .from('quick_replies')
    .select('*')
    .or(`platform.eq.${platform},platform.eq.all`)
    .order('sort_order', { ascending: true })

  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500, headers: cors })
  return NextResponse.json({ success: true, data }, { headers: cors })
}
