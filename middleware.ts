import { auth } from '@/auth'
import { NextResponse } from 'next/server'

// Routes that require authentication
const protectedRoutes = ['/account', '/checkout', '/orders']

// Routes that require admin role
const adminRoutes = ['/admin']

// Routes that are only for unauthenticated users (login, register)
const authRoutes = ['/login', '/register']

export default auth((req) => {
  const { nextUrl } = req
  const isLoggedIn = !!req.auth
  const isAuthRoute = authRoutes.some((route) => nextUrl.pathname.startsWith(route))
  const isProtectedRoute = protectedRoutes.some((route) => nextUrl.pathname.startsWith(route))
  const isAdminRoute = adminRoutes.some((route) => nextUrl.pathname.startsWith(route))

  // If user is on auth route and is logged in, redirect to home
  if (isAuthRoute && isLoggedIn) {
    return NextResponse.redirect(new URL('/', nextUrl))
  }

  // If user is on protected route and not logged in, redirect to login
  if (isProtectedRoute && !isLoggedIn) {
    const callbackUrl = nextUrl.pathname
    return NextResponse.redirect(
      new URL(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`, nextUrl)
    )
  }

  // If user is on admin route (not admin/login) and not logged in, redirect to admin login
  if (isAdminRoute && nextUrl.pathname !== '/admin/login' && !isLoggedIn) {
    return NextResponse.redirect(new URL('/admin/login', nextUrl))
  }

  return NextResponse.next()
})

// Configure which routes the middleware runs on
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     * - All API routes
     */
    '/((?!_next/static|_next/image|favicon.ico|public|api/).*)',
  ],
}
