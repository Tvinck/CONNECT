import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://fhwrdhebhgywhvoeqpxj.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZod3JkaGViaGd5d2h2b2VxcHhqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk5Mjk0MjcsImV4cCI6MjA5NTUwNTQyN30.1odxq5Ull4GDI_zoThLfwjbYE6IaDI0_yDGv-_lzDHM'
)

async function run() {
  const { data, error } = await supabase.from('vpn_servers').insert({
    name: 'Финляндия (FI)',
    country_code: 'FI',
    ip_address: '185.142.99.185',
    ping_ms: 12,
    load_percentage: 24,
    status: 'online'
  })
  
  if (error) {
    console.error('Error inserting:', error)
  } else {
    console.log('Inserted successfully:', data)
  }
}

run()
