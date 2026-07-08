import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export async function GET() {
  const supabase = createAdminClient()

  try {
    const testUuid = '00000000-0000-0000-0000-000000000001'
    
    // Сначала удалим тестовые данные, если они остались
    await supabase.from('support_messages').delete().eq('user_id', testUuid)
    await supabase.from('vpn_subscriptions').delete().eq('id', testUuid)

    // 1. Попробуем создать фейковую подписку
    const { data: subData, error: subError } = await supabase
      .from('vpn_subscriptions')
      .insert({
        id: testUuid,
        username: 'ggsel_test_user',
        token: 'testtoken' + Date.now().toString(),
        subscription_key: 'testkey' + Date.now().toString(),
        status: 'active', // 'active' passes vpn_subscriptions_status_check
        traffic_limit: 0
      })
      .select()
      .single()

    if (subError) {
      return NextResponse.json({ 
        success: false, 
        message: 'Dummy vpn_subscriptions insert failed', 
        error: subError 
      })
    }

    // 2. Попробуем вставить сообщение
    const { data: msgData, error: msgError } = await supabase
      .from('support_messages')
      .insert({
        user_id: testUuid,
        message: 'TEST_DEBUG_DB_INSERT_WITH_SUB',
        is_from_user: true,
        project: 'DEBUG_GGSEL_TEST'
      })
      .select()

    if (msgError) {
      return NextResponse.json({ 
        success: false, 
        message: 'support_messages insert failed after creating sub', 
        error: msgError 
      })
    }

    // Удалим тестовые данные после успеха
    await supabase.from('support_messages').delete().eq('user_id', testUuid)
    await supabase.from('vpn_subscriptions').delete().eq('id', testUuid)

    return NextResponse.json({ 
      success: true, 
      message: 'Both inserts succeeded! Creating a dummy sub works.',
      subData,
      msgData
    })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message, stack: err.stack })
  }
}
