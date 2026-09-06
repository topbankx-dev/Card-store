import type { NextAuthConfig } from 'next-auth'
import Credentials from 'next-auth/providers/credentials'

// This config is for middleware - doesn't use Prisma adapter (Edge compatible)
export const authConfig = {
  pages: {
    signIn: '/login',
  },
  providers: [
    // Dummy credentials provider - actual auth is handled in API routes
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize() {
        // This is handled by the API route with full database access
        // Middleware only needs to check JWT tokens
        return null
      },
    }),
  ],
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const isProtectedRoute = nextUrl.pathname.startsWith('/account') ||
                              nextUrl.pathname.startsWith('/checkout') ||
                              nextUrl.pathname.startsWith('/orders')
      const isAdminRoute = nextUrl.pathname.startsWith('/admin') &&
                           !nextUrl.pathname.startsWith('/admin/login')

      if (isProtectedRoute && !isLoggedIn) {
        return Response.redirect(new URL(`/login?callbackUrl=${nextUrl.pathname}`, nextUrl))
      }

      if (isAdminRoute && !isLoggedIn) {
        return Response.redirect(new URL('/admin/login', nextUrl))
      }

      return true
    },
  },
} satisfies NextAuthConfig
