import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // В SDK v2 для Developer API нет эндпоинта массовой истории.
    // Возвращаем пустой массив.
    return NextResponse.json({ jobs: [] });
  } catch (error: any) {
    console.error('History Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
