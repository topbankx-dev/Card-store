import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { createServerClient } from '@/lib/supabase'
import { authConfig } from './auth.config'

// Service-role client for auth (bypasses RLS to read password hashes securely)
const adminDb = createServerClient()

export type Role = 'PLAYER' | 'ADMIN'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
      role: Role
    }
  }

  interface User {
    role: Role
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  session: { strategy: 'jwt' },
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          console.error('Missing credentials')
          return null
        }

        const email = credentials.email as string
        const password = credentials.password as string

        try {
          const { data: user, error } = await adminDb
            .from('User')
            .select('*')
            .eq('email', email)
            .single()

          if (error || !user) {
            console.error(`User not found: ${email}`)
            return null
          }

          if (!user.password_hash) {
            console.error(`No password hash for user: ${email}`)
            return null
          }

          const isValid = await bcrypt.compare(password, user.password_hash)

          if (!isValid) {
            console.error(`Invalid password for user: ${email}`)
            return null
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          }
        } catch (error) {
          console.error('Database error during authentication:', error)
          return null
        }
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id as string
        token.role = (user as { role: Role }).role
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
        session.user.role = token.role as Role
      }
      return session
    },
  },
  debug: process.env.NODE_ENV === 'development',
})