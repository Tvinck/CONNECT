'use server'

import { getUploadUrl, getDownloadUrl, listFiles, deleteFile } from '@/lib/r2'
import { createServiceClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

/** Get a presigned URL for uploading an IPA to R2. */
export async function getIpaUploadUrl(appId: string, filename: string) {
  const key = `ipa/${appId}/${filename}`
  const url = await getUploadUrl(key, 'application/octet-stream', 3600)
  return { success: true, uploadUrl: url, key }
}

/** Confirm upload: save the R2 key to bazzar_apps. */
export async function confirmIpaUpload(appId: string, key: string, sizeBytes: number) {
  const supabase = createServiceClient()
  const { error } = await supabase
    .from('bazzar_apps')
    .update({ ipa_url: key, size_bytes: sizeBytes, updated_at: new Date().toISOString() })
    .eq('id', appId)
  if (error) return { success: false, error: error.message }
  revalidatePath('/b2/catalog')
  return { success: true }
}

/** Get a presigned download URL for an IPA. */
export async function getIpaDownloadUrl(appId: string) {
  const supabase = createServiceClient()
  const { data: app } = await supabase
    .from('bazzar_apps')
    .select('ipa_url, name')
    .eq('id', appId)
    .maybeSingle()
  
  if (!app?.ipa_url) return { success: false, error: 'IPA не найден' }
  
  const url = await getDownloadUrl(app.ipa_url, 7200) // 2 hours
  return { success: true, downloadUrl: url, name: app.name }
}

/** List all IPA files in R2. */
export async function listIpaFiles() {
  const files = await listFiles('ipa/', 200)
  return { success: true, files }
}

/** Delete an IPA from R2 and clear the reference in DB. */
export async function deleteIpa(appId: string) {
  const supabase = createServiceClient()
  const { data: app } = await supabase
    .from('bazzar_apps')
    .select('ipa_url')
    .eq('id', appId)
    .maybeSingle()
  
  if (app?.ipa_url) {
    await deleteFile(app.ipa_url)
  }

  await supabase
    .from('bazzar_apps')
    .update({ ipa_url: null, size_bytes: null })
    .eq('id', appId)
  
  revalidatePath('/b2/catalog')
  return { success: true }
}
