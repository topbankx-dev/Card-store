import { NextResponse } from 'next/server'
import { auth } from '@/auth'

export async function GET() {
  const session = await auth()

  if (!session?.user) {
    return NextResponse.json({ isAdmin: false }, { status: 401 })
  }

  return NextResponse.json({
    isAdmin: session.user.role === 'ADMIN',
  })
}
