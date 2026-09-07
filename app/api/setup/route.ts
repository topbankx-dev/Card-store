import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { createServerClient, supabase } from '@/lib/supabase'

// Use service-role client for setup operations (bypasses RLS for initial user creation)
const adminDb = createServerClient()

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
    const { data: existing, error: findError } = await adminDb
      .from('User')
      .select('id')
      .eq('email', email)
      .single()

    if (findError && findError.code !== 'PGRST116') { // PGRST116 = no rows returned
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    if (existing) {
      return NextResponse.json(
        { message: 'User already exists', userId: existing.id },
        { status: 200 }
      )
    }

    // Hash password and create user
    const password_hash = await bcrypt.hash(password, 12)

    const { data: user, error } = await adminDb
      .from('User')
      .insert({
        name,
        email,
        password_hash,
        role,
      })
      .select()
      .single()

    if (error) {
      console.error('Setup error:', error)
      return NextResponse.json(
        { error: 'Failed to create user. Database may not be connected.' },
        { status: 500 }
      )
    }

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
    const { count, error } = await supabase
      .from('User')
      .select('*', { count: 'exact', head: true })

    if (error) throw error

    return NextResponse.json({
      status: 'connected',
      userCount: count || 0,
      message: (count || 0) > 0
        ? `${count} user(s) in database`
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