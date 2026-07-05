import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
// Use a service role key if available, otherwise anon key (might need to bypass RLS)
const serviceKey = process.env.PIXEL_SUPABASE_SERVICE_ROLE_KEY || supabaseKey;
const supabase = createClient(supabaseUrl, serviceKey);

const PUSH_KEY = 'web_push_subscriptions';

export interface PushSub {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export async function getSubscriptions(): Promise<PushSub[]> {
  const { data } = await supabase
    .from('factory_generations')
    .select('video_url')
    .eq('prompt', PUSH_KEY)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (!data) return [];
  try {
    return JSON.parse(data.video_url);
  } catch {
    return [];
  }
}

export async function addSubscription(sub: PushSub): Promise<void> {
  const current = await getSubscriptions();
  // Filter out existing by endpoint
  const filtered = current.filter(s => s.endpoint !== sub.endpoint);
  filtered.push(sub);
  
  await supabase.from('factory_generations').insert({
    prompt: PUSH_KEY,
    video_url: JSON.stringify(filtered)
  });
}
