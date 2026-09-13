import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { createServerClient } from '@/lib/supabase'
import { checkRateLimit, rateLimitResponse, RATE_LIMIT_PRESETS } from '@/lib/rate-limit'

// Use service-role client for user creation (bypasses RLS)
const adminDb = createServerClient()

export async function POST(request: Request) {
  try {
    // Rate limit registration requests to prevent bot account creation
    const rl = checkRateLimit(request, RATE_LIMIT_PRESETS.AUTH)
    if (!rl.success) {
      return rateLimitResponse(rl, 'Too many registration attempts. Please try again in 15 minutes.')
    }

    const body = await request.json()
    const name = body.name?.trim()
    const email = body.email?.trim().toLowerCase()
    const password = body.password

    // Validate input
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Name, email, and password are required' },
        { status: 400 }
      )
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const { data: existingUser, error: findError } = await adminDb
      .from('User')
      .select('id')
      .eq('email', email)
      .single()

    if (findError && findError.code !== 'PGRST116') { // PGRST116 = no rows returned
      return NextResponse.json(
        { error: 'Database error' },
        { status: 500 }
      )
    }

    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 400 }
      )
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, 12)

    // Create user
    const { data: user, error: createError } = await adminDb
      .from('User')
      .insert({
        name,
        email,
        password_hash,
        role: 'PLAYER',
      })
      .select()
      .single()

    if (createError) {
      return NextResponse.json(
        { error: 'Failed to create user' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    })
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}
