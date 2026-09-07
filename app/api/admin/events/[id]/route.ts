import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { EventSchema } from '@/lib/validations/event'
import { generateSlug } from '@/lib/validations/event'

// GET /api/admin/events/[id] - Get single event
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = createServerClient()

    const { data: event, error } = await supabase
      .from('events')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Event not found' }, { status: 404 })
      }
      console.error('Error fetching event:', error)
      return NextResponse.json({ error: 'Failed to fetch event' }, { status: 500 })
    }

    // Fetch ticket tiers
    const { data: tiers } = await supabase
      .from('ticket_tiers')
      .select('*')
      .eq('event_id', id)
      .order('created_at', { ascending: true })

    event.ticket_tiers = tiers || []

    return NextResponse.json({ data: event })
  } catch (error) {
    console.error('Error in GET /api/admin/events/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH /api/admin/events/[id] - Update event
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    // Validate with Zod (partial validation)
    const result = EventSchema.partial().safeParse(body)
    if (!result.success) {
      return NextResponse.json({
        error: 'Validation failed',
        details: result.error.flatten()
      }, { status: 400 })
    }

    const eventData = result.data
    const supabase = createServerClient()

    // Check if event exists
    const { data: existing } = await supabase
      .from('events')
      .select('id')
      .eq('id', id)
      .single()

    if (!existing) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    // If slug is being updated, check for conflicts
    if (eventData.slug) {
      const { data: slugConflict } = await supabase
        .from('events')
        .select('id')
        .eq('slug', eventData.slug)
        .neq('id', id)
        .single()

      if (slugConflict) {
        eventData.slug = `${eventData.slug}-${Date.now()}`
      }
    }

    // Prepare update data
    const { ticket_tiers, ...eventUpdate } = eventData

    // Update event
    const { data: updatedEvent, error: updateError } = await supabase
      .from('events')
      .update({ ...eventUpdate, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating event:', updateError)
      return NextResponse.json({ error: 'Failed to update event' }, { status: 500 })
    }

    // Update ticket tiers if provided
    if (ticket_tiers !== undefined) {
      // Delete existing tiers
      await supabase
        .from('ticket_tiers')
        .delete()
        .eq('event_id', id)

      // Insert new tiers
      if (ticket_tiers.length > 0) {
        const tiersToInsert = ticket_tiers.map(tier => ({
          ...tier,
          event_id: id,
          sold_count: tier.sold_count || 0,
        }))

        await supabase
          .from('ticket_tiers')
          .insert(tiersToInsert)
      }

      // Fetch updated tiers
      const { data: updatedTiers } = await supabase
        .from('ticket_tiers')
        .select('*')
        .eq('event_id', id)
        .order('created_at', { ascending: true })

      updatedEvent.ticket_tiers = updatedTiers || []
    }

    return NextResponse.json({ data: updatedEvent })
  } catch (error) {
    console.error('Error in PATCH /api/admin/events/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/admin/events/[id] - Delete event
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = createServerClient()

    // Check if event exists
    const { data: existing } = await supabase
      .from('events')
      .select('id, name')
      .eq('id', id)
      .single()

    if (!existing) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    // Delete ticket tiers first (foreign key constraint)
    await supabase
      .from('ticket_tiers')
      .delete()
      .eq('event_id', id)

    // Delete registrations if they exist
    await supabase
      .from('event_registrations')
      .delete()
      .eq('event_id', id)

    // Delete the event
    const { error: deleteError } = await supabase
      .from('events')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error('Error deleting event:', deleteError)
      return NextResponse.json({ error: 'Failed to delete event' }, { status: 500 })
    }

    return NextResponse.json({
      message: `Event "${existing.name}" deleted successfully`
    })
  } catch (error) {
    console.error('Error in DELETE /api/admin/events/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
