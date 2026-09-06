import { NextResponse } from 'next/server'
import { auth } from '@/auth'

// Force Node.js runtime for Prisma adapter compatibility
export const runtime = 'nodejs'

export async function GET() {
  const session = await auth()

  if (!session?.user) {
    return NextResponse.json({ isAdmin: false }, { status: 401 })
  }

  return NextResponse.json({
    isAdmin: session.user.role === 'ADMIN',
  })
}
