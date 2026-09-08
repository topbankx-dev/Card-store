import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, supabase } from '@/lib/supabase'
import { z } from 'zod'

// Convert datetime-local format (YYYY-MM-DDTHH:mm) to ISO 8601 (YYYY-MM-DDTHH:mm:00Z)
function normalizeTimestamp(ts: string | null | undefined): string | null {
  if (!ts) return null
  if (ts.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)) return ts
  if (ts.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/)) {
    return ts + ':00'
  }
  return ts
}

// Use service-role client for admin operations (bypasses RLS)
const adminDb = createServerClient()

// Validation schema for event filtering
const eventFilterSchema = z.object({
  game: z.string().optional(),
  status: z.string().optional(),
  upcoming: z.boolean().optional(),
  page: z.string().optional(),
  limit: z.string().optional(),
})

// GET /api/events - Fetch all events with optional filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    // Parse and validate query parameters
    const params = eventFilterSchema.parse({
      game: searchParams.get('game') ?? undefined,
      status: searchParams.get('status') ?? undefined,
      upcoming: searchParams.get('upcoming') === 'true' ? true :
               searchParams.get('upcoming') === 'false' ? false : undefined,
      page: searchParams.get('page') ?? '1',
      limit: searchParams.get('limit') ?? '20',
    })

    // Pagination
    const page = parseInt(params.page ?? '1') || 1
    const limit = Math.min(parseInt(params.limit ?? '20') || 20, 100)
    const from = (page - 1) * limit
    const to = from + limit - 1

    // Build query
    let query = supabase
      .from('Event')
      .select('*', { count: 'exact' })
      .order('event_date', { ascending: true })

    if (params.game) {
      query = query.eq('game', params.game.toUpperCase())
    }
    if (params.status) {
      query = query.eq('status', params.status.toUpperCase())
    }
    if (params.upcoming !== undefined) {
      if (params.upcoming) {
        query = query.gte('event_date', new Date().toISOString())
      } else {
        query = query.lt('event_date', new Date().toISOString())
      }
    }

    const { data: events, count, error } = await query.range(from, to)

    if (error) {
      console.error('Error fetching events:', error)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    return NextResponse.json({
      events,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching events:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/events - Create a new event (Admin only)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // TODO: Add admin authentication check here
    // const session = await getServerSession()
    // if (session?.user?.role !== 'ADMIN') {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    // }

    const slug = body.slug || body.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')

    const { data: event, error } = await adminDb
      .from('Event')
      .insert({
        name: body.name,
        slug,
        game: body.game,
        description: body.description,
        event_date: normalizeTimestamp(body.event_date),
        end_date: normalizeTimestamp(body.end_date),
        entry_fee: body.entry_fee,
        max_capacity: body.max_capacity,
        location: body.location || 'In-Store',
        status: body.status || 'UPCOMING',
        image_url: body.image_url,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating event:', error)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    return NextResponse.json(event, { status: 201 })
  } catch (error) {
    console.error('Error creating event:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}