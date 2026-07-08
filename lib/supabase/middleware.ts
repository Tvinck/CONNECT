import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const PUBLIC_PATHS = ['/login', '/forgot-password']

/**
 * Обновляет и проверяет сессию пользователя (Supabase Auth).
 * 
 * Если пользователь не авторизован и пытается получить доступ к закрытой странице,
 * он будет перенаправлен на страницу входа (/login).
 * Если авторизованный пользователь пытается зайти на страницу входа,
 * он будет перенаправлен в панель управления (/dashboard).
 * 
 * @param {NextRequest} request - Входящий HTTP-запрос.
 * @returns {Promise<NextResponse>} HTTP-ответ с обновленными cookie или редирект.
 */
export async function updateSession(request: NextRequest) {
  const path = request.nextUrl.pathname
  const isApi = path.startsWith('/api')

  // Handle CORS preflight OPTIONS requests for API routes
  if (isApi && request.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400',
      },
    })
  }

  let response = NextResponse.next({ request: { headers: request.headers } })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options })
          response = NextResponse.next({ request: { headers: request.headers } })
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options })
          response = NextResponse.next({ request: { headers: request.headers } })
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const isPublic = PUBLIC_PATHS.includes(path) || path.startsWith('/auth') || isApi

  // Unauthenticated visitor on a protected page -> login
  if (!user && !isPublic) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Authenticated visitor on the login page -> dashboard
  if (user && path === '/login') {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  // Append CORS headers for other API methods
  if (isApi) {
    response.headers.set('Access-Control-Allow-Origin', '*')
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  }

  return response
}
