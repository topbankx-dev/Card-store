import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { generateSlug } from '@/lib/validations/event'

// POST /api/admin/events/[id]/duplicate - Duplicate an event
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json().catch(() => ({}))
    const supabase = createServerClient()

    // Fetch original event
    const { data: original, error: fetchError } = await supabase
      .from('Event')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Event not found' }, { status: 404 })
      }
      console.error('Error fetching event for duplicate:', fetchError)
      return NextResponse.json({ error: 'Failed to fetch event' }, { status: 500 })
    }

    // Fetch ticket tiers
    const { data: tiers } = await supabase
      .from('TicketTier')
      .select('*')
      .eq('event_id', id)

    // Generate new slug
    let newSlug = generateSlug(`${original.name} (Copy)`)

    // Check for slug conflicts and make unique
    const { data: slugConflict } = await supabase
      .from('Event')
      .select('id')
      .eq('slug', newSlug)
      .single()

    if (slugConflict) {
      newSlug = `${newSlug}-${Date.now()}`
    }

    // Create duplicate event (reset some fields)
    const duplicateEvent = {
      ...original,
      id: undefined, // Let Supabase generate new ID
      name: body.newName || `${original.name} (Copy)`,
      slug: newSlug,
      status: 'DRAFT', // Always start as draft
      created_at: undefined,
      updated_at: undefined,
      registration_count: 0,
    }

    // Remove system fields
    delete (duplicateEvent as any).id
    delete (duplicateEvent as any).created_at
    delete (duplicateEvent as any).updated_at

    // Update dates if specified in body
    if (body.shiftDate) {
      const originalDate = new Date(duplicateEvent.event_date)
      const shiftDays = body.shiftDays || 7 // Default to 1 week later
      originalDate.setDate(originalDate.getDate() + shiftDays)

      duplicateEvent.event_date = originalDate.toISOString()

      // Also shift end date if it exists
      if (duplicateEvent.end_date) {
        const originalEndDate = new Date(duplicateEvent.end_date)
        originalEndDate.setDate(originalEndDate.getDate() + shiftDays)
        duplicateEvent.end_date = originalEndDate.toISOString()
      }

      // Shift registration deadline if it exists
      if (duplicateEvent.registration_deadline) {
        const originalDeadline = new Date(duplicateEvent.registration_deadline)
        originalDeadline.setDate(originalDeadline.getDate() + shiftDays)
        duplicateEvent.registration_deadline = originalDeadline.toISOString()
      }
    }

    // Insert duplicate
    const { data: newEvent, error: insertError } = await supabase
      .from('Event')
      .insert([duplicateEvent])
      .select()
      .single()

    if (insertError) {
      console.error('Error creating duplicate event:', insertError)
      return NextResponse.json({ error: 'Failed to duplicate event' }, { status: 500 })
    }

    // Duplicate ticket tiers
    if (tiers && tiers.length > 0) {
      const duplicatedTiers = tiers.map(tier => ({
        event_id: newEvent.id,
        name: tier.name,
        price: tier.price,
        quantity: tier.quantity,
        sold_count: 0, // Reset sold count
        description: tier.description,
        benefits: tier.benefits,
      }))

      await supabase
        .from('TicketTier')
        .insert(duplicatedTiers)

      // Fetch the tiers we just created
      const { data: createdTiers } = await supabase
        .from('TicketTier')
        .select('*')
        .eq('event_id', newEvent.id)
        .order('created_at', { ascending: true })

      newEvent.ticket_tiers = createdTiers || []
    }

    return NextResponse.json({
      data: newEvent,
      message: 'Event duplicated successfully'
    }, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/admin/events/[id]/duplicate:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
