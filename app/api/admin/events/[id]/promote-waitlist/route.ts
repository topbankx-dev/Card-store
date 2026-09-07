import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

// POST /api/admin/events/[id]/promote-waitlist - Auto-promote from waitlist when spot opens
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = createServerClient()

    // Get event details
    const { data: event } = await supabase
      .from('Event')
      .select('id, max_capacity, registration_count, waitlist_enabled')
      .eq('id', id)
      .single()

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    if (!event.waitlist_enabled) {
      return NextResponse.json({ error: 'Waitlist not enabled' }, { status: 400 })
    }

    // Check if there's capacity
    const currentCount = event.registration_count || 0
    const spotsAvailable = (event.max_capacity || 0) - currentCount

    if (spotsAvailable <= 0) {
      return NextResponse.json({ error: 'No spots available' }, { status: 400 })
    }

    // Get first person on waitlist
    const { data: waitlistEntry } = await supabase
      .from('EventWaitlist')
      .select('*')
      .eq('event_id', id)
      .order('position', { ascending: true })
      .limit(1)
      .single()

    if (!waitlistEntry) {
      return NextResponse.json({ error: 'Waitlist is empty' }, { status: 400 })
    }

    // Create registration with auto-generated ID and required fields
    const regId = `reg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const now = new Date().toISOString()
    const { data: registration, error: regError } = await supabase
      .from('EventRegistration')
      .insert([{
        id: regId,
        event_id: id,
        customer_name: waitlistEntry.customer_name,
        customer_email: waitlistEntry.customer_email,
        customer_phone: waitlistEntry.customer_phone,
        ticket_tier_id: waitlistEntry.ticket_tier_id,
        notes: waitlistEntry.notes,
        status: 'CONFIRMED',
        payment_status: 'PENDING',
        registered_at: now,
        created_at: now,
        updated_at: now,
        promoted_from_waitlist: true,
        promoted_at: now,
      }])
      .select()
      .single()

    if (regError) {
      console.error('Error promoting:', regError)
      return NextResponse.json({ error: 'Failed to promote' }, { status: 500 })
    }

    // Remove from waitlist
    await supabase
      .from('EventWaitlist')
      .delete()
      .eq('id', waitlistEntry.id)

    // Update registration count
    await supabase
      .from('Event')
      .update({ registration_count: currentCount + 1 })
      .eq('id', id)

    return NextResponse.json({
      data: {
        registration,
        promoted: waitlistEntry.customer_name,
      },
      message: `${waitlistEntry.customer_name} has been promoted from waitlist`,
    })
  } catch (error) {
    console.error('Error in POST /api/admin/events/[id]/promote-waitlist:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
