import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const webhookUrl = process.env.PACHCA_WEBHOOK_URL;
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://connect.tvinck.ru';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl!, supabaseKey!);

export async function GET(req: Request) {
  const secret =
    req.headers.get('x-cron-secret') ??
    new URL(req.url).searchParams.get('secret') ??
    req.headers.get('authorization')?.replace('Bearer ', '')
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!webhookUrl) {
    return NextResponse.json({ error: 'PACHCA_WEBHOOK_URL not configured' }, { status: 500 });
  }

  try {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const { data: tasks, error } = await supabase
      .from('tasks')
      .select('title, status, users!tasks_assignee_id_fkey(full_name)')
      .gte('created_at', yesterday.toISOString());

    if (error) {
      console.error('Ошибка получения задач для сводки:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    let summaryText = '';
    if (!tasks || tasks.length === 0) {
      summaryText = `📊 **Итоги дня: Задачи**\n\nЗа прошедшие сутки новых задач не поступало. Отличная работа! 🎉`;
    } else {
      summaryText = `📊 **Итоги дня: Новые задачи за сутки**\n\nВсего новых задач: **${tasks.length}**\n\n`;
      tasks.forEach((task: any, idx: number) => {
        const assignee = task.users?.full_name || 'Не назначена';
        summaryText += `${idx + 1}. **${task.title}** (Статус: ${task.status}, Исполнитель: ${assignee})\n`;
      });
      summaryText += `\n[📋 Открыть доску задач](${SITE_URL}/tasks)`;
    }

    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: summaryText })
    });

    return NextResponse.json({ success: true, count: tasks ? tasks.length : 0 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
