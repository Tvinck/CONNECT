import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_VEIL_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_VEIL_SUPABASE_ANON_KEY!
)

async function test() {
  const { data, error } = await supabase
    .from('support_messages')
    .select('*, profiles(id, username, telegram_username, telegram_chat_id)')
    .order('created_at', { ascending: false })
    .limit(500)

  console.log('DATA:', data)
  console.log('ERROR:', error)
}

test()
