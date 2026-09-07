import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, supabase } from '@/lib/supabase'
import { z } from 'zod'

// Use service-role client for write operations (bypasses RLS)
const adminDb = createServerClient()

// Validation schema for event registration
const registerSchema = z.object({
  user_id: z.string().optional(),
  guest_name: z.string().optional(),
  guest_email: z.string().email().optional(),
  payment_status: z.enum(['PENDING', 'PAID', 'REFUNDED', 'FAILED']).default('PENDING'),
})

// GET /api/events/[id]/registrations - List registrations for an event (Admin only)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Verify event exists
    const { data: event, error: eventError } = await supabase
      .from('Event')
      .select('id')
      .eq('id', id)
      .single()

    if (eventError && eventError.code !== 'PGRST116') {
      console.error('Error fetching event:', eventError)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      )
    }

    const { data: registrations, error } = await supabase
      .from('EventRegistration')
      .select(`
        *,
        user:User (
          id,
          name,
          email
        )
      `)
      .eq('event_id', id)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching registrations:', error)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    return NextResponse.json(registrations)
  } catch (error) {
    console.error('Error fetching registrations:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/events/[id]/registrations - Register for an event
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    // Validate request body
    const validated = registerSchema.parse(body)

    // Verify event exists and has capacity
    const { data: event, error: eventError } = await supabase
      .from('Event')
      .select('id, status, current_registered, max_capacity')
      .eq('id', id)
      .single()

    if (eventError && eventError.code !== 'PGRST116') {
      console.error('Error fetching event:', eventError)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      )
    }

    if (event.status !== 'UPCOMING') {
      return NextResponse.json(
        { error: 'Event is not accepting registrations' },
        { status: 400 }
      )
    }

    if (event.current_registered >= event.max_capacity) {
      return NextResponse.json(
        { error: 'Event is full' },
        { status: 400 }
      )
    }

    // Check if already registered
    if (validated.user_id) {
      const { data: existing, error: checkError } = await supabase
        .from('EventRegistration')
        .select('id')
        .eq('event_id', id)
        .eq('user_id', validated.user_id)
        .single()

      if (checkError && checkError.code !== 'PGRST116') {
        return NextResponse.json(
          { error: 'Database error' },
          { status: 500 }
        )
      }

      if (existing) {
        return NextResponse.json(
          { error: 'Already registered for this event' },
          { status: 400 }
        )
      }
    }

    // Create registration and update event count
    const { data: newRegistration, error: regError } = await adminDb
      .from('EventRegistration')
      .insert({
        event_id: id,
        user_id: validated.user_id,
        customer_name: validated.guest_name,
        customer_email: validated.guest_email,
        payment_status: validated.payment_status,
      })
      .select()
      .single()

    if (regError) {
      console.error('Error creating registration:', regError)
      return NextResponse.json(
        { error: 'Failed to create registration' },
        { status: 500 }
      )
    }

    // Update event registration count
    const { error: updateError } = await adminDb
      .from('Event')
      .update({
        current_registered: event.current_registered + 1,
      })
      .eq('id', id)

    if (updateError) {
      console.error('Error updating event count:', updateError)
      // We could rollback the registration here, but for simplicity we'll just return the error
      return NextResponse.json(
        { error: 'Failed to update event registration count' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        id: newRegistration.id,
        event_id: newRegistration.event_id,
        payment_status: newRegistration.payment_status,
        message: 'Registration successful',
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error registering for event:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}