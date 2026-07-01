import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  // Normally GGSel will POST data like id_order, amount, date, etc.
  try {
    const data = await request.text()
    console.log('GGSel Webhook received:', data)
    
    // TODO: Verify GGSel signature using secret key
    
    // Simulated successful processing
    return NextResponse.json({ success: true, message: 'Webhook processed' })
  } catch (err) {
    console.error('Webhook error:', err)
    return NextResponse.json({ success: false }, { status: 500 })
  }
}
