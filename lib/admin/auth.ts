import { auth } from '@/auth'
import { NextResponse } from 'next/server'

/**
 * Server-side helper to require admin authentication
 * Use at the top of API route handlers
 */
export async function requireAdmin() {
  const session = await auth()

  if (!session?.user) {
    return NextResponse.json(
      { error: 'Unauthorized', message: 'You must be logged in' },
      { status: 401 }
    )
  }

  if (session.user.role !== 'ADMIN') {
    return NextResponse.json(
      { error: 'Forbidden', message: 'Admin access required' },
      { status: 403 }
    )
  }

  return session
}

/**
 * Get the current admin session or null
 */
export async function getAdminSession() {
  const session = await auth()

  if (!session?.user || session.user.role !== 'ADMIN') {
    return null
  }

  return session
}
