import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const projectId = url.searchParams.get('projectId');
    if (!projectId) {
      return NextResponse.json({ error: 'projectId не передан' }, { status: 400 });
    }

    const { data: dbData, error: dbError } = await supabase
      .from('factory_generations')
      .select('video_url')
      .eq('prompt', `project_state_${projectId}`)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (dbError || !dbData) {
      return NextResponse.json({ error: 'Проект не найден' }, { status: 404 });
    }

    const state = JSON.parse(dbData.video_url);
    return NextResponse.json(state);
  } catch (error: any) {
    console.error('Queue Status Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
