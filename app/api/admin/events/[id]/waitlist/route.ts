import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { z } from 'zod'

const WaitlistSchema = z.object({
  event_id: z.string(),
  user_id: z.string().optional(),
  customer_name: z.string().min(1, 'Name is required'),
  customer_email: z.string().email('Valid email is required'),
  customer_phone: z.string().optional(),
  ticket_tier_id: z.string().optional(),
  notes: z.string().optional(),
})

// GET /api/admin/events/[id]/waitlist - Get waitlist for an event
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = createServerClient()

    const { data: waitlist, error } = await supabase
      .from('EventWaitlist')
      .select('*')
      .eq('event_id', id)
      .order('position', { ascending: true })

    if (error) {
      console.error('Error fetching waitlist:', error)
      return NextResponse.json({ error: 'Failed to fetch waitlist' }, { status: 500 })
    }

    // Fetch user info
    if (waitlist && waitlist.length > 0) {
      const userIds = waitlist
        .filter(w => w.user_id)
        .map(w => w.user_id)

      if (userIds.length > 0) {
        const { data: users } = await supabase
          .from('User')
          .select('id, name, email')
          .in('id', userIds)

        const userMap = users?.reduce((acc, u) => {
          acc[u.id] = u
          return acc
        }, {} as Record<string, { id: string; name: string; email: string }>)

        waitlist.forEach(w => {
          if (w.user_id && userMap?.[w.user_id]) {
            w.user = userMap[w.user_id]
          }
        })
      }
    }

    return NextResponse.json({ data: waitlist || [] })
  } catch (error) {
    console.error('Error in GET /api/admin/events/[id]/waitlist:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/admin/events/[id]/waitlist - Add to waitlist
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const result = WaitlistSchema.safeParse({
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

    // Check event waitlist capacity
    const { data: event } = await supabase
      .from('Event')
      .select('waitlist_max, waitlist_enabled')
      .eq('id', id)
      .single()

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    if (!event.waitlist_enabled) {
      return NextResponse.json({ error: 'Waitlist is not enabled for this event' }, { status: 400 })
    }

    // Count current waitlist
    const { count: currentCount } = await supabase
      .from('EventWaitlist')
      .select('*', { count: 'exact', head: true })
      .eq('event_id', id)

    if (event.waitlist_max && currentCount && currentCount >= event.waitlist_max) {
      return NextResponse.json({ error: 'Waitlist is full' }, { status: 400 })
    }

    // Check if already on waitlist
    const { data: existing } = await supabase
      .from('EventWaitlist')
      .select('id')
      .eq('event_id', id)
      .eq('customer_email', result.data.customer_email)
      .single()

    if (existing) {
      return NextResponse.json({ error: 'Already on waitlist' }, { status: 400 })
    }

    // Get next position
    const { data: lastEntry } = await supabase
      .from('EventWaitlist')
      .select('position')
      .eq('event_id', id)
      .order('position', { ascending: false })
      .limit(1)
      .single()

    const position = (lastEntry?.position || 0) + 1

    // Add to waitlist with auto-generated ID
    const wlId = `wl_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const { data: entry, error } = await supabase
      .from('EventWaitlist')
      .insert([{
        ...result.data,
        id: wlId,
        position,
      }])
      .select()
      .single()

    if (error) {
      console.error('Error adding to waitlist:', error)
      return NextResponse.json({ error: 'Failed to add to waitlist' }, { status: 500 })
    }

    return NextResponse.json({ data: entry }, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/admin/events/[id]/waitlist:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
