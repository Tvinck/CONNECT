import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function PATCH(req: Request) {
  try {
    const { id, feedback, feedback_comment } = await req.json();

    if (!id) {
      return NextResponse.json({ error: 'Требуется ID' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('factory_generations')
      .update({ feedback, feedback_comment })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Feedback Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
