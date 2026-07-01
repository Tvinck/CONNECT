import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // В SDK v2 для Developer API (с ключом f9f0e5bb...) нет публичного эндпоинта для баланса.
    // Возвращаем моковые данные или можно скрыть это из UI.
    return NextResponse.json({ credits: 9999 });
  } catch (error: any) {
    console.error('Balance Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
