import { type NextRequest, NextResponse } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options as CookieOptions)
          )
        },
      },
    }
  )

  // Get the authenticated user (also refreshes the session)
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Protected routes
  const protectedRoutes = ['/dashboard', '/posts', '/calendar', '/system-health']
  const authRoutes = ['/login', '/signup']
  const currentPath = request.nextUrl.pathname

  // DEBUG MODE: Allow access to protected routes without auth for debugging
  const debugMode = process.env.DEBUG_AUTH === 'true'

  // If user is not authenticated and trying to access protected route
  if (!user && !debugMode && protectedRoutes.some(route => currentPath.startsWith(route))) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // If user is authenticated and trying to access auth routes, redirect to dashboard
  if (user && authRoutes.some(route => currentPath.startsWith(route))) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - login/signup (auth pages - don't check auth on these routes)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|login|signup).*)',
  ],
}
