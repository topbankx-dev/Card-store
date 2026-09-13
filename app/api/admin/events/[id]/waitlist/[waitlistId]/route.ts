import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { requireAdmin } from '@/lib/admin/auth'

// DELETE /api/admin/events/[id]/waitlist/[waitlistId] - Remove from waitlist
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; waitlistId: string }> }
) {
  try {
    const adminAuth = await requireAdmin()
    if (adminAuth instanceof NextResponse) {
      return adminAuth
    }

    const { id, waitlistId } = await params
    const supabase = createServerClient()

    const { error } = await supabase
      .from('EventWaitlist')
      .delete()
      .eq('id', waitlistId)
      .eq('event_id', id)

    if (error) {
      console.error('Error removing from waitlist:', error)
      return NextResponse.json({ error: 'Failed to remove from waitlist' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Removed from waitlist' })
  } catch (error) {
    console.error('Error in DELETE /api/admin/events/[id]/waitlist/[waitlistId]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
