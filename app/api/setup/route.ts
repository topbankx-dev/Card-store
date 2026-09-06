import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import type { Role } from '@prisma/client'

export async function POST(request: Request) {
  try {
    // Check for secret key to prevent unauthorized access
    const authHeader = request.headers.get('authorization')
    const secretKey = process.env.SETUP_SECRET || 'setup-secret-key'

    if (authHeader !== `Bearer ${secretKey}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { email, password, name, role = 'PLAYER' } = await request.json()

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Email, password, and name are required' },
        { status: 400 }
      )
    }

    // Check if user exists
    const existing = await prisma.user.findUnique({
      where: { email },
    })

    if (existing) {
      return NextResponse.json(
        { message: 'User already exists', userId: existing.id },
        { status: 200 }
      )
    }

    // Hash password and create user
    const password_hash = await bcrypt.hash(password, 12)

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password_hash,
        role: role as Role,
      },
    })

    return NextResponse.json({
      success: true,
      message: `User ${name} created successfully`,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    })
  } catch (error) {
    console.error('Setup error:', error)
    return NextResponse.json(
      { error: 'Failed to create user. Database may not be connected.' },
      { status: 500 }
    )
  }
}

// Simple GET to check status
export async function GET() {
  try {
    const userCount = await prisma.user.count()
    return NextResponse.json({
      status: 'connected',
      userCount,
      message: userCount > 0
        ? `${userCount} user(s) in database`
        : 'No users yet. Use POST to create one.'
    })
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      message: 'Cannot connect to database',
      error: String(error)
    }, { status: 500 })
  }
}
