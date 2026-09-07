import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { createServerClient } from '@/lib/supabase'

// POST /api/admin/invites/accept - Accept an invite
export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { token } = await request.json()

    if (!token) {
      return NextResponse.json({ error: 'Token required' }, { status: 400 })
    }

    const supabase = createServerClient()

    // Check if token is valid
    const { data: invite, error: inviteError } = await supabase
      .from('AdminInvite')
      .select('*')
      .eq('token', token)
      .eq('status', 'PENDING')
      .single()

    if (inviteError || !invite) {
      return NextResponse.json(
        { error: 'Invalid or expired invite' },
        { status: 400 }
      )
    }

    // Check if invite has expired
    if (new Date(invite.expires_at) < new Date()) {
      await supabase
        .from('AdminInvite')
        .update({ status: 'EXPIRED' })
        .eq('id', invite.id)

      return NextResponse.json(
        { error: 'This invite has expired' },
        { status: 400 }
      )
    }

    // Check if user's email matches invite email
    if (session.user.email !== invite.email) {
      return NextResponse.json(
        { error: 'This invite was sent to a different email address' },
        { status: 403 }
      )
    }

    // Update user role to ADMIN
    const { error: userError } = await supabase
      .from('User')
      .update({ role: 'ADMIN' })
      .eq('id', session.user.id)

    if (userError) {
      console.error('Error promoting user to admin:', userError)
      return NextResponse.json(
        { error: 'Failed to promote user' },
        { status: 500 }
      )
    }

    // Update invite status
    await supabase
      .from('AdminInvite')
      .update({
        status: 'ACCEPTED',
        accepted_at: new Date().toISOString()
      })
      .eq('id', invite.id)

    // Log the action
    await supabase.from('AuditLog').insert({
      user_id: session.user.id,
      action: 'ADMIN_INVITE_ACCEPTED',
      entity_type: 'AdminInvite',
      entity_id: invite.id,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in POST /api/admin/invites/accept:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
