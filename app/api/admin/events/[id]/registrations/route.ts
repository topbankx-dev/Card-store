import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { z } from 'zod'

// Registration schema
const RegistrationSchema = z.object({
  event_id: z.string(),
  user_id: z.string().optional(),
  ticket_tier_id: z.string().optional(),
  customer_name: z.string().min(1, 'Name is required'),
  customer_email: z.string().email('Valid email is required'),
  customer_phone: z.string().optional(),
  status: z.enum(['CONFIRMED', 'CANCELLED', 'NO_SHOW', 'CHECKED_IN']).default('CONFIRMED'),
  checked_in_at: z.string().optional(),
  dietary_requirements: z.string().optional(),
  deck_preference: z.string().optional(),
  experience_level: z.string().optional(),
  notes: z.string().optional(),
})

// GET /api/admin/events/[id]/registrations - List registrations for an event
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const includeWaitlist = searchParams.get('waitlist') === 'true'

    const supabase = createServerClient()

    // Fetch main registrations
    let query = supabase
      .from('EventRegistration')
      .select('*')
      .eq('event_id', id)
      .order('created_at', { ascending: true })

    if (status) {
      query = query.eq('status', status)
    }

    const { data: registrations, error } = await query

    if (error) {
      console.error('Error fetching registrations:', error)
      return NextResponse.json({ error: 'Failed to fetch registrations' }, { status: 500 })
    }

    // Fetch waitlist if requested
    let waitlist: unknown[] = []
    if (includeWaitlist) {
      const { data: waitlistData } = await supabase
        .from('EventWaitlist')
        .select('*')
        .eq('event_id', id)
        .order('position', { ascending: true })

      waitlist = waitlistData || []
    }

    // Fetch user info for registered users
    if (registrations && registrations.length > 0) {
      const userIds = registrations
        .filter(r => r.user_id)
        .map(r => r.user_id)

      if (userIds.length > 0) {
        const { data: users } = await supabase
          .from('User')
          .select('id, name, email')
          .in('id', userIds)

        const userMap = users?.reduce((acc, u) => {
          acc[u.id] = u
          return acc
        }, {} as Record<string, { id: string; name: string; email: string }>)

        registrations.forEach(reg => {
          if (reg.user_id && userMap?.[reg.user_id]) {
            reg.user = userMap[reg.user_id]
          }
        })
      }
    }

    return NextResponse.json({
      data: registrations || [],
      waitlist,
      stats: {
        total: registrations?.length || 0,
        confirmed: registrations?.filter(r => r.status === 'CONFIRMED').length || 0,
        checkedIn: registrations?.filter(r => r.status === 'CHECKED_IN').length || 0,
        cancelled: registrations?.filter(r => r.status === 'CANCELLED').length || 0,
        noShow: registrations?.filter(r => r.status === 'NO_SHOW').length || 0,
        waitlistCount: (waitlist as unknown[])?.length || 0,
      }
    })
  } catch (error) {
    console.error('Error in GET /api/admin/events/[id]/registrations:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/admin/events/[id]/registrations - Add a registration
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const result = RegistrationSchema.safeParse({
      ...body,
      event_id: id,
    })

    if (!result.success) {
      return NextResponse.json({
        error: 'Validation failed',
        details: result.error.flatten()
      }, { status: 400 })
    }

    const supabase = createServerClient()

    // Check event capacity
    const { data: event } = await supabase
      .from('Event')
      .select('max_capacity, registration_count')
      .eq('id', id)
      .single()

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    const currentCount = event.registration_count || 0
    if (currentCount >= (event.max_capacity || 0)) {
      return NextResponse.json({ error: 'Event is at full capacity' }, { status: 400 })
    }

    // Check if email already registered
    const { data: existing } = await supabase
      .from('EventRegistration')
      .select('id')
      .eq('event_id', id)
      .eq('customer_email', result.data.customer_email)
      .eq('status', 'CONFIRMED')
      .single()

    if (existing) {
      return NextResponse.json({ error: 'This email is already registered for this event' }, { status: 400 })
    }

    // Create registration with auto-generated ID and required fields
    const regId = `reg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const now = new Date().toISOString()
    const { data: registration, error } = await supabase
      .from('EventRegistration')
      .insert([{
        ...result.data,
        id: regId,
        payment_status: 'PENDING',
        registered_at: now,
        created_at: now,
        updated_at: now,
      }])
      .select()
      .single()

    if (error) {
      console.error('Error creating registration:', error)
      return NextResponse.json({ error: 'Failed to create registration' }, { status: 500 })
    }

    // Update event registration count
    await supabase
      .from('Event')
      .update({ registration_count: currentCount + 1 })
      .eq('id', id)

    return NextResponse.json({ data: registration }, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/admin/events/[id]/registrations:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
