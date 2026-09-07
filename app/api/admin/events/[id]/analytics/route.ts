import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

// GET /api/admin/events/[id]/analytics - Get event analytics
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = createServerClient()

    // Get event details
    const { data: event } = await supabase
      .from('Event')
      .select('*')
      .eq('id', id)
      .single()

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    // Get registrations over time
    const { data: registrations } = await supabase
      .from('EventRegistration')
      .select('created_at, status')
      .eq('event_id', id)

    // Get waitlist
    const { data: waitlist } = await supabase
      .from('EventWaitlist')
      .select('created_at')
      .eq('event_id', id)

    // Calculate daily signups
    const dailySignups: Record<string, number> = {}
    registrations?.forEach(reg => {
      const date = new Date(reg.created_at).toISOString().split('T')[0]
      dailySignups[date] = (dailySignups[date] || 0) + 1
    })

    // Calculate conversion metrics
    const totalRegistrations = registrations?.length || 0
    const confirmedRegistrations = registrations?.filter(r => r.status === 'CONFIRMED' || r.status === 'CHECKED_IN').length || 0
    const checkedIn = registrations?.filter(r => r.status === 'CHECKED_IN').length || 0
    const cancelled = registrations?.filter(r => r.status === 'CANCELLED').length || 0
    const noShow = registrations?.filter(r => r.status === 'NO_SHOW').length || 0
    const waitlistCount = waitlist?.length || 0

    const capacity = event.max_capacity || 1
    const fillRate = Math.round((confirmedRegistrations / capacity) * 100)
    const checkInRate = confirmedRegistrations > 0
      ? Math.round((checkedIn / confirmedRegistrations) * 100)
      : 0
    const cancellationRate = totalRegistrations > 0
      ? Math.round((cancelled / totalRegistrations) * 100)
      : 0

    // Calculate revenue (if paid event)
    const ticketTiers = event.ticket_tiers || []
    let totalRevenue = 0
    let potentialRevenue = 0

    if (ticketTiers.length > 0) {
      // For now, estimate based on entry_fee * registrations
      // In production, you'd track which tier each registration used
      totalRevenue = (event.entry_fee || 0) * confirmedRegistrations
      potentialRevenue = (event.entry_fee || 0) * capacity
    }

    // Time-based metrics
    const eventDate = new Date(event.event_date)
    const createdAt = new Date(event.created_at)
    const daysUntilEvent = Math.ceil((eventDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    const daysToCreate = Math.ceil((eventDate.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24))

    // Signup velocity (registrations per day)
    const signupVelocity = daysToCreate > 0
      ? Math.round((totalRegistrations / daysToCreate) * 10) / 10
      : totalRegistrations

    // Check if event is trending (more signups in last 3 days)
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
    const recentSignups = registrations?.filter(r => r.created_at > threeDaysAgo).length || 0
    const isTrending = recentSignups > 0

    // Waitlist pressure (ratio of waitlist to capacity)
    const waitlistPressure = Math.round((waitlistCount / capacity) * 100)

    return NextResponse.json({
      data: {
        // Event info
        event: {
          id: event.id,
          name: event.name,
          status: event.status,
          event_date: event.event_date,
          days_until_event: daysUntilEvent,
        },

        // Registration stats
        registrations: {
          total: totalRegistrations,
          confirmed: confirmedRegistrations,
          checked_in: checkedIn,
          cancelled,
          no_show: noShow,
          waitlist: waitlistCount,
        },

        // Capacity metrics
        capacity: {
          max: event.max_capacity,
          filled: confirmedRegistrations,
          available: Math.max(0, (event.max_capacity || 0) - confirmedRegistrations),
          fill_rate: fillRate,
        },

        // Check-in metrics
        check_in: {
          rate: checkInRate,
          total: checkedIn,
          expected: confirmedRegistrations,
        },

        // Revenue metrics
        revenue: {
          total: totalRevenue,
          potential: potentialRevenue,
          ticket_tiers: ticketTiers.length,
        },

        // Velocity metrics
        velocity: {
          registrations_per_day: signupVelocity,
          recent_signups_3d: recentSignups,
          is_trending: isTrending,
          days_to_create: daysToCreate,
        },

        // Waitlist pressure
        waitlist_pressure: waitlistPressure,

        // Cancellation metrics
        cancellation_rate: cancellationRate,

        // Daily breakdown
        daily_signups: Object.entries(dailySignups)
          .map(([date, count]) => ({ date, count }))
          .sort((a, b) => a.date.localeCompare(b.date)),
      }
    })
  } catch (error) {
    console.error('Error in GET /api/admin/events/[id]/analytics:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
