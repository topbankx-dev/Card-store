import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import bcrypt from 'bcryptjs'
import { createServerClient } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { currentPassword, newPassword } = await request.json()

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: 'Current password and new password are required' }, { status: 400 })
    }

    if (newPassword.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
    }

    const supabase = createServerClient()

    // Get current user
    const { data: user, error: userError } = await supabase
      .from('User')
      .select('password_hash')
      .eq('id', session.user.id)
      .single()

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Verify current password
    if (user.password_hash) {
      const isValid = await bcrypt.compare(currentPassword, user.password_hash)
      if (!isValid) {
        return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 })
      }
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, 12)

    // Update password
    const { error: updateError } = await supabase
      .from('User')
      .update({ password_hash: newPasswordHash })
      .eq('id', session.user.id)

    if (updateError) {
      console.error('Error updating password:', updateError)
      return NextResponse.json({ error: 'Failed to update password' }, { status: 500 })
    }

    // Log the action
    await supabase.from('AuditLog').insert({
      user_id: session.user.id,
      action: 'PASSWORD_CHANGED',
      entity_type: 'User',
      entity_id: session.user.id,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in POST /api/auth/change-password:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
