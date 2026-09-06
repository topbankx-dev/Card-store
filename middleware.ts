import NextAuth from 'next-auth'
import { authConfig } from './auth.config'

export default NextAuth(authConfig).auth

export const config = {
  // Match all paths except static files, images, API routes, and favicon
  matcher: ['/((?!_next/static|_next/image|favicon.ico|public|api/).*)'],
}
