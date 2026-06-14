'use server'

import { createPixelClient } from '@/lib/supabase/pixel'
import { getCurrentProfile } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

/**
 * Checks if the current user session is authenticated and has admin privileges in Connect.
 */
async function requireAdmin() {
  const profile = await getCurrentProfile()
  if (!profile) {
    throw new Error('Не авторизован')
  }
  // Check if role is admin. If role checks are looser, we can allow members, but admin is safest for DB writes.
  if (profile.role !== 'ceo' && profile.role !== 'coowner') {
    throw new Error('Доступ запрещен: требуется роль Руководителя (CEO) или Совладельца')
  }
  return profile
}

/**
 * Updates a user's credit balance in the remote Pixel database.
 */
export async function updatePixelUserBalance(userId: string, balance: number) {
  await requireAdmin()
  
  const pixelClient = createPixelClient()
  const { data, error } = await pixelClient
    .from('user_stats')
    .update({ current_balance: balance })
    .eq('user_id', userId)
    .select()
  
  if (error) {
    console.error('Error updating Pixel user balance:', error)
    throw new Error(`Ошибка обновления баланса: ${error.message}`)
  }
  
  revalidatePath('/projects/pixel')
  return { success: true, data }
}

/**
 * Saves (inserts or updates) a template's metadata in the remote Pixel database.
 */
export async function savePixelTemplate(template: any) {
  await requireAdmin()
  
  const pixelClient = createPixelClient()
  
  // Format template payload to match DB columns
  const payload = {
    id: template.id,
    title: template.title,
    description: template.description || '',
    src: template.src,
    prompt: template.prompt || '',
    generation_prompt: template.generation_prompt || '',
    model_id: template.model_id,
    category: template.category,
    sort_order: parseInt(template.sort_order || '0', 10),
    is_active: template.is_active !== false,
    media_type: template.media_type || 'image',
    required_files_count: parseInt(template.required_files_count || '1', 10),
    generation_cost: parseInt(template.generation_cost || '1', 10)
  }
  
  const { data, error } = await pixelClient
    .from('templates')
    .upsert(payload)
    .select()
    
  if (error) {
    console.error('Error saving Pixel template:', error)
    throw new Error(`Ошибка сохранения шаблона: ${error.message}`)
  }
  
  revalidatePath('/projects/pixel')
  return { success: true, data }
}

/**
 * Deletes a template from the remote Pixel database.
 */
export async function deletePixelTemplate(templateId: string) {
  await requireAdmin()
  
  const pixelClient = createPixelClient()
  const { error } = await pixelClient
    .from('templates')
    .delete()
    .eq('id', templateId)
    
  if (error) {
    console.error('Error deleting Pixel template:', error)
    throw new Error(`Ошибка удаления шаблона: ${error.message}`)
  }
  
  revalidatePath('/projects/pixel')
  return { success: true }
}
