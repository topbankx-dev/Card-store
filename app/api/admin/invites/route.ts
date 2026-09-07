import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { createServerClient } from '@/lib/supabase'
import { z } from 'zod'

const inviteSchema = z.object({
  email: z.string().email('Invalid email address'),
})

// GET /api/admin/invites - List all pending invites
export async function GET() {
  try {
    const session = await auth()

    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createServerClient()

    const { data: invites, error } = await supabase
      .from('AdminInvite')
      .select(`
        id,
        email,
        status,
        expires_at,
        created_at,
        accepted_at,
        invited_by_user:User!AdminInvite_invited_by_fkey(
          id,
          name,
          email
        )
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching invites:', error)
      return NextResponse.json({ error: 'Failed to fetch invites' }, { status: 500 })
    }

    return NextResponse.json({ invites })
  } catch (error) {
    console.error('Error in GET /api/admin/invites:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/admin/invites - Send a new invite
export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { email } = inviteSchema.parse(body)

    const supabase = createServerClient()

    // Check if user already exists with this email
    const { data: existingUser } = await supabase
      .from('User')
      .select('id, role')
      .eq('email', email)
      .single()

    if (existingUser) {
      if (existingUser.role === 'ADMIN') {
        return NextResponse.json(
          { error: 'This user is already an admin' },
          { status: 400 }
        )
      }
      // User exists but is not admin - they can be promoted
      return NextResponse.json({
        message: 'User already exists',
        userId: existingUser.id,
        needsPromotion: true
      })
    }

    // Check for existing pending invite
    const { data: existingInvite } = await supabase
      .from('AdminInvite')
      .select('id, status')
      .eq('email', email)
      .eq('status', 'PENDING')
      .single()

    if (existingInvite) {
      return NextResponse.json(
        { error: 'An invite has already been sent to this email' },
        { status: 400 }
      )
    }

    // Generate invite token
    const token = generateToken()

    // Create invite
    const { data: invite, error } = await supabase
      .from('AdminInvite')
      .insert({
        email,
        token,
        invited_by: session.user.id,
        status: 'PENDING',
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating invite:', error)
      return NextResponse.json({ error: 'Failed to create invite' }, { status: 500 })
    }

    // Log the action
    await supabase.from('AuditLog').insert({
      user_id: session.user.id,
      action: 'ADMIN_INVITE_SENT',
      entity_type: 'AdminInvite',
      entity_id: invite.id,
      details: { invited_email: email },
    })

    return NextResponse.json({
      invite,
      inviteUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'https://rapid-strike-gaming-lounge.vercel.app'}/admin/accept-invite?token=${token}`
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    console.error('Error in POST /api/admin/invites:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/admin/invites?id=xxx - Cancel an invite
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const inviteId = searchParams.get('id')

    if (!inviteId) {
      return NextResponse.json({ error: 'Invite ID required' }, { status: 400 })
    }

    const supabase = createServerClient()

    // Cancel the invite
    const { error } = await supabase
      .from('AdminInvite')
      .update({ status: 'CANCELLED' })
      .eq('id', inviteId)
      .eq('status', 'PENDING')

    if (error) {
      console.error('Error cancelling invite:', error)
      return NextResponse.json({ error: 'Failed to cancel invite' }, { status: 500 })
    }

    // Log the action
    await supabase.from('AuditLog').insert({
      user_id: session.user.id,
      action: 'ADMIN_INVITE_CANCELLED',
      entity_type: 'AdminInvite',
      entity_id: inviteId,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/admin/invites:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function generateToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let token = ''
  for (let i = 0; i < 48; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return token
}
