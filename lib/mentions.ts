import { createClient } from '@/lib/supabase/client'

/**
 * Processes text for @mentions and creates notifications for the tagged users.
 * 
 * @param text The text to scan for mentions (e.g. "Hello @art.koshelev")
 * @param senderId The user ID of the person who sent the message/comment
 * @param link The link to the resource where the mention occurred (e.g. "/tasks?task=uuid")
 * @param context Optional context text, e.g. "в новости" or "в комментарии"
 */
export async function processMentions(text: string, senderId: string, link: string, context?: string) {
  const supabase = createClient()
  
  // Extract all mentions starting with @ followed by word characters or dots
  // e.g. @art.koshelev, @b.boss
  const mentionRegex = /@([a-zA-Z0-9_.]+)/g
  const matches = Array.from(text.matchAll(mentionRegex))
  
  if (matches.length === 0) return

  const tags = matches.map(m => m[1])
  
  // Find users with these mention tags
  const { data: users, error: usersErr } = await supabase
    .from('users')
    .select('id, mention_tag, full_name')
    .in('mention_tag', tags)

  if (usersErr || !users) return

  // Create notifications for each matched user
  const notifications = users
    .map(u => ({
      user_id: u.id,
      type: 'info',
      title: `Новое упоминание`,
      body: `Вас упомянули ${context || 'в комментарии к задаче'}`,
      link: link
    }))

  if (notifications.length > 0) {
    const { error } = await supabase.from('notifications').insert(notifications)
    if (error) console.error('Error inserting mentions:', error)
  }
}
