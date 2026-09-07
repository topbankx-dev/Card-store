import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { EventSchema } from '@/lib/validations/event'
import { generateSlug, generateRecurringDates } from '@/lib/validations/event'

// GET /api/admin/events - List all events
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient()
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const game = searchParams.get('game')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    let query = supabase
      .from('Event')
      .select('*', { count: 'exact' })
      .order('event_date', { ascending: false })
      .range(offset, offset + limit - 1)

    if (status) {
      query = query.eq('status', status)
    }
    if (game) {
      query = query.eq('game', game)
    }

    const { data: events, error, count } = await query

    if (error) {
      console.error('Error fetching events:', error)
      return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 })
    }

    // Fetch ticket tiers for each event
    if (events && events.length > 0) {
      const eventIds = events.map(e => e.id)
      const { data: tiers } = await supabase
        .from('TicketTier')
        .select('*')
        .in('event_id', eventIds)
        .order('created_at', { ascending: true })

      const tiersByEvent = tiers?.reduce((acc, tier) => {
        if (!acc[tier.event_id]) acc[tier.event_id] = []
        acc[tier.event_id].push(tier)
        return acc
      }, {} as Record<string, typeof tiers>)

      events.forEach(event => {
        event.ticket_tiers = tiersByEvent?.[event.id] || []
      })
    }

    return NextResponse.json({
      data: events || [],
      pagination: {
        total: count || 0,
        limit,
        offset,
        hasMore: (count || 0) > offset + limit
      }
    })
  } catch (error) {
    console.error('Error in GET /api/admin/events:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/admin/events - Create new event
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate with Zod
    const result = EventSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json({
        error: 'Validation failed',
        details: result.error.flatten()
      }, { status: 400 })
    }

    const eventData = result.data
    const supabase = createServerClient()

    // Generate slug if not provided
    if (!eventData.slug) {
      eventData.slug = generateSlug(eventData.name)
    }

    // Check for duplicate slug
    const { data: existingSlug } = await supabase
      .from('Event')
      .select('id')
      .eq('slug', eventData.slug)
      .single()

    if (existingSlug) {
      eventData.slug = `${eventData.slug}-${Date.now()}`
    }

    // Prepare event data for insertion
    // Flatten trust_policy and remove nested objects that aren't columns
    const { ticket_tiers, trust_policy, ...eventInsert } = eventData
    if (trust_policy) {
      Object.assign(eventInsert, {
        refund_policy: trust_policy.refund_policy,
        refund_enabled: trust_policy.refund_enabled,
        refund_deadline_hours: trust_policy.refund_deadline_hours,
        code_of_conduct: trust_policy.code_of_conduct,
        code_of_conduct_enabled: trust_policy.code_of_conduct_enabled,
        cancellation_policy: trust_policy.cancellation_policy,
        cancellation_consent_required: trust_policy.cancellation_consent_required,
        media_release: trust_policy.media_release,
        attendee_visibility: trust_policy.attendee_visibility,
        auto_reminder_1_week: trust_policy.auto_reminder_1_week,
        auto_reminder_1_day: trust_policy.auto_reminder_1_day,
        auto_reminder_1_hour: trust_policy.auto_reminder_1_hour,
      })
    }

    // Insert event
    const { data: newEvent, error: eventError } = await supabase
      .from('Event')
      .insert([eventInsert])
      .select()
      .single()

    if (eventError) {
      console.error('Error creating event:', eventError)
      return NextResponse.json({ error: 'Failed to create event' }, { status: 500 })
    }

    // Handle recurring events - create multiple events
    if (eventData.is_recurring && eventData.recurring_pattern) {
      const recurringDates = generateRecurringDates(
        eventData.event_date,
        eventData.recurring_pattern,
        eventData.recurring_end_date,
        eventData.recurring_count
      )

      // Skip the first date (already created as the main event)
      const futureDates = recurringDates.slice(1)

      if (futureDates.length > 0) {
        const recurringEvents = futureDates.map(date => {
          const duration = eventData.end_date && eventData.event_date
            ? new Date(eventData.end_date).getTime() - new Date(eventData.event_date).getTime()
            : 3 * 60 * 60 * 1000 // Default 3 hours

          const endDate = new Date(new Date(date).getTime() + duration).toISOString()

          return {
            ...eventInsert,
            event_date: date,
            end_date: endDate,
            status: 'UPCOMING' as const,
            // Generate unique slug for recurring events
            slug: `${eventData.slug}-${new Date(date).toISOString().split('T')[0]}`,
          }
        })

        const { error: recurringError } = await supabase
          .from('Event')
          .insert(recurringEvents)

        if (recurringError) {
          console.error('Error creating recurring events:', recurringError)
          // Don't fail the whole request, just log the error
        }
      }
    }

    // Insert ticket tiers if provided
    if (ticket_tiers && ticket_tiers.length > 0) {
      const tiersToInsert = ticket_tiers.map(tier => ({
        ...tier,
        event_id: newEvent.id,
        sold_count: 0,
      }))

      const { error: tiersError } = await supabase
        .from('TicketTier')
        .insert(tiersToInsert)

      if (tiersError) {
        console.error('Error creating ticket tiers:', tiersError)
        // Don't fail the whole request, but return warning
      } else {
        // Fetch and attach tiers to response
        const { data: createdTiers } = await supabase
          .from('TicketTier')
          .select('*')
          .eq('event_id', newEvent.id)
          .order('created_at', { ascending: true })

        newEvent.ticket_tiers = createdTiers || []
      }
    }

    return NextResponse.json({ data: newEvent }, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/admin/events:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
