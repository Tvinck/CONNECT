'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function getBazzarProducts() {
  const supabase = createClient();
  const { data, error } = await supabase.from('bazzar_products').select('*').order('created_at', { ascending: false });
  if (error) return { success: false, error: error.message };
  return { success: true, data };
}

export async function toggleProductStatus(id: string, currentStatus: boolean) {
  const supabase = createClient();
  const { error } = await supabase.from('bazzar_products').update({ active: !currentStatus }).eq('id', id);
  if (error) return { success: false, error: error.message };
  revalidatePath('/[slug]');
  return { success: true };
}

export async function getBazzarUsers() {
  const supabase = createClient();
  const { data, error } = await supabase.from('bazzar_users').select('*').order('created_at', { ascending: false });
  if (error) return { success: false, error: error.message };
  return { success: true, data };
}

export async function getBazzarReviews() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('bazzar_reviews')
    .select(`
      *,
      bazzar_products ( title )
    `)
    .order('created_at', { ascending: false });
  if (error) return { success: false, error: error.message };
  
  // Format data
  const formatted = data.map((r: any) => ({
    id: r.id,
    author: r.author,
    product: r.bazzar_products?.title || 'Неизвестный товар',
    rating: r.rating,
    text: r.text,
    date: new Date(r.created_at).toISOString().split('T')[0],
    status: r.status
  }));

  return { success: true, data: formatted };
}

export async function updateReviewStatus(id: string, status: string) {
  const supabase = createClient();
  const { error } = await supabase.from('bazzar_reviews').update({ status }).eq('id', id);
  if (error) return { success: false, error: error.message };
  revalidatePath('/[slug]');
  return { success: true };
}

export async function deleteReview(id: string) {
  const supabase = createClient();
  const { error } = await supabase.from('bazzar_reviews').delete().eq('id', id);
  if (error) return { success: false, error: error.message };
  revalidatePath('/[slug]');
  return { success: true };
}

export async function getBazzarAnalytics() {
  const supabase = createClient();
  const { data, error } = await supabase.from('bazzar_analytics').select('*').order('date', { ascending: true });
  if (error) return { success: false, error: error.message };
  return { success: true, data };
}
