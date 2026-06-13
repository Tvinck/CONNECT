import { NextResponse } from 'next/server'
import { SKIN_DATABASE } from '@/lib/skinscan/skinDatabase'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q') || ''

  if (q.length < 2) {
    return NextResponse.json([])
  }

  const query = q.toLowerCase()
  const filtered = SKIN_DATABASE.filter(skin =>
    skin.name.toLowerCase().includes(query) ||
    skin.nameRu.toLowerCase().includes(query)
  ).slice(0, 15)

  return NextResponse.json(filtered)
}
