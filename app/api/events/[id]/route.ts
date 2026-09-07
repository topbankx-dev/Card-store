import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// GET /api/events/[id] - Fetch a single event
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    // Get event by ID
    let { data: event, error: eventError } = await supabase
      .from('Event')
      .select(`*, registrations (
        user (id, name, email)
      )`)
      .eq('id', id)
      .single()

    if (eventError && eventError.code !== 'PGRST116') {
      console.error('Error fetching event:', eventError)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    // If not found by ID, try slug
    if (!event) {
      ;({ data: event, error: eventError } = await supabase
        .from('Event')
        .select(`*, registrations (
          user (id, name, email)
        )`)
        .eq('slug', id)
        .single())

      if (eventError && eventError.code !== 'PGRST116') {
        console.error('Error fetching event:', eventError)
        return NextResponse.json({ error: 'Database error' }, { status: 500 })
      }
    }

    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(event)
  } catch (error) {
    console.error('Error fetching event:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH /api/events/[id] - Update an event (Admin only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await request.json()

    // TODO: Add admin authentication check here

    const { data: event, error } = await supabase
      .from('Event')
      .update({
        name: body.name,
        game: body.game,
        description: body.description,
        event_date: body.event_date ? new Date(body.event_date).toISOString() : undefined,
        end_date: body.end_date ? (body.end_date === null ? null : new Date(body.end_date).toISOString()) : undefined,
        entry_fee: body.entry_fee,
        max_capacity: body.max_capacity,
        location: body.location,
        image_url: body.image_url,
        status: body.status,
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating event:', error)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    return NextResponse.json(event)
  } catch (error) {
    console.error('Error updating event:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}