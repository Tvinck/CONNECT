import { NextResponse } from 'next/server'

const POPULAR_SKINS = [
  "AK-47 | Redline",
  "AK-47 | Asiimov",
  "AK-47 | Vulcan",
  "AK-47 | Frontside Misty",
  "AK-47 | Case Hardened",
  "AK-47 | Empress",
  "AK-47 | Neon Rider",
  "AK-47 | Fuel Injector",
  "AWP | Dragon Lore",
  "AWP | Asiimov",
  "AWP | Redline",
  "AWP | Hyper Beast",
  "AWP | Neo-Noir",
  "AWP | Graphite",
  "M4A4 | Howl",
  "M4A4 | Asiimov",
  "M4A4 | Neo-Noir",
  "M4A4 | Emperor",
  "M4A4 | Hellfire",
  "M4A1-S | Hyper Beast",
  "M4A1-S | Decimator",
  "M4A1-S | Printstream",
  "M4A1-S | Golden Coil",
  "M4A1-S | Chantico's Fire",
  "USP-S | Kill Confirmed",
  "USP-S | Neo-Noir",
  "USP-S | Cyrex",
  "USP-S | Orion",
  "Glock-18 | Fade",
  "Glock-18 | Water Elemental",
  "Glock-18 | Neo-Noir",
  "Glock-18 | Bullet Queen",
  "Knife | Karambit | Fade",
  "Knife | M9 Bayonet | Doppler",
  "Knife | Butterfly Knife | Crimson Web",
  "Knife | Talon Knife | Marble Fade",
  "Gloves | Sport Gloves | Pandora's Box",
  "Gloves | Specialist Gloves | Crimson Kimono",
]

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q') || ''

  if (q.length < 2) {
    return NextResponse.json([])
  }

  const filtered = POPULAR_SKINS.filter(name =>
    name.toLowerCase().includes(q.toLowerCase())
  ).slice(0, 10)

  return NextResponse.json(filtered)
}
