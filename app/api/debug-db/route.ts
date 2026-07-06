import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export async function GET() {
  const supabase = createAdminClient()

  try {
    // 1. Попробуем вставить тестовую запись с фейковым UUID
    const testUuid = '00000000-0000-0000-0000-000000000001'
    
    // Сначала удалим ее, если она есть
    await supabase.from('support_messages').delete().eq('user_id', testUuid)

    const { data, error } = await supabase
      .from('support_messages')
      .insert({
        user_id: testUuid,
        message: 'TEST_DEBUG_DB_INSERT',
        is_from_user: true,
        project: 'DEBUG_GGSEL_TEST'
      })
      .select()

    if (error) {
      return NextResponse.json({ 
        success: false, 
        message: 'Insert failed', 
        error: error 
      })
    }

    // Удалим тестовую запись после успеха
    await supabase.from('support_messages').delete().eq('user_id', testUuid)

    return NextResponse.json({ 
      success: true, 
      message: 'Insert succeeded! No foreign key constraint blocking fake UUIDs.',
      insertedData: data
    })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message, stack: err.stack })
  }
}
