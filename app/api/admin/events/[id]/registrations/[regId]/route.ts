import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

// PATCH /api/admin/events/[id]/registrations/[regId] - Update a registration
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; regId: string }> }
) {
  try {
    const { id, regId } = await params
    const body = await request.json()

    const supabase = createServerClient()

    // Check if registration exists
    const { data: existing } = await supabase
      .from('EventRegistration')
      .select('id, status')
      .eq('id', regId)
      .eq('event_id', id)
      .single()

    if (!existing) {
      return NextResponse.json({ error: 'Registration not found' }, { status: 404 })
    }

    // Handle check-in
    if (body.status === 'CHECKED_IN') {
      const { data: updated, error } = await supabase
        .from('EventRegistration')
        .update({
          status: 'CHECKED_IN',
          checked_in_at: new Date().toISOString()
        })
        .eq('id', regId)
        .select()
        .single()

      if (error) {
        console.error('Error checking in:', error)
        return NextResponse.json({ error: 'Failed to check in' }, { status: 500 })
      }

      return NextResponse.json({ data: updated })
    }

    // Handle general update
    const allowedFields = [
      'customer_name', 'customer_email', 'customer_phone',
      'dietary_requirements', 'deck_preference', 'experience_level', 'notes'
    ]

    const updateData: Record<string, unknown> = {}
    Object.keys(body).forEach(key => {
      if (allowedFields.includes(key)) {
        updateData[key] = body[key]
      }
    })

    if (body.status) {
      updateData.status = body.status
    }

    const { data: updated, error } = await supabase
      .from('EventRegistration')
      .update(updateData)
      .eq('id', regId)
      .select()
      .single()

    if (error) {
      console.error('Error updating registration:', error)
      return NextResponse.json({ error: 'Failed to update registration' }, { status: 500 })
    }

    // If status changed from CONFIRMED to CANCELLED, decrement count
    if (existing.status === 'CONFIRMED' && body.status === 'CANCELLED') {
      await supabase.rpc('decrement_registration_count', { event_id: id })
    }

    return NextResponse.json({ data: updated })
  } catch (error) {
    console.error('Error in PATCH /api/admin/events/[id]/registrations/[regId]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/admin/events/[id]/registrations/[regId] - Delete a registration
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; regId: string }> }
) {
  try {
    const { id, regId } = await params

    const supabase = createServerClient()

    // Get registration first
    const { data: registration } = await supabase
      .from('EventRegistration')
      .select('id, status')
      .eq('id', regId)
      .eq('event_id', id)
      .single()

    if (!registration) {
      return NextResponse.json({ error: 'Registration not found' }, { status: 404 })
    }

    // Delete registration
    const { error } = await supabase
      .from('EventRegistration')
      .delete()
      .eq('id', regId)

    if (error) {
      console.error('Error deleting registration:', error)
      return NextResponse.json({ error: 'Failed to delete registration' }, { status: 500 })
    }

    // Decrement registration count if was confirmed
    if (registration.status === 'CONFIRMED' || registration.status === 'CHECKED_IN') {
      const { data: event } = await supabase
        .from('Event')
        .select('registration_count')
        .eq('id', id)
        .single()

      if (event && event.registration_count > 0) {
        await supabase
          .from('Event')
          .update({ registration_count: event.registration_count - 1 })
          .eq('id', id)
      }
    }

    return NextResponse.json({ message: 'Registration deleted' })
  } catch (error) {
    console.error('Error in DELETE /api/admin/events/[id]/registrations/[regId]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
