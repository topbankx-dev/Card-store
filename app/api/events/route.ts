import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// Validation schema for event filtering
const eventFilterSchema = z.object({
  game: z.string().optional(),
  status: z.string().optional(),
  upcoming: z.string().optional(),
  page: z.string().optional(),
  limit: z.string().optional(),
})

// GET /api/events - Fetch all events with optional filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    const params = eventFilterSchema.parse({
      game: searchParams.get('game') ?? undefined,
      status: searchParams.get('status') ?? undefined,
      upcoming: searchParams.get('upcoming') ?? undefined,
      page: searchParams.get('page') ?? '1',
      limit: searchParams.get('limit') ?? '20',
    })

    const where: Record<string, unknown> = {}

    if (params.game) {
      where.game = params.game.toUpperCase()
    }
    if (params.status) {
      where.status = params.status.toUpperCase()
    }
    if (params.upcoming === 'true') {
      where.event_date = {
        gte: new Date(),
      }
      where.status = 'UPCOMING'
    }

    const page = parseInt(params.page ?? '1') || 1
    const limit = Math.min(parseInt(params.limit ?? '20') || 20, 100)
    const skip = (page - 1) * limit

    const [events, total] = await Promise.all([
      prisma.event.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          event_date: 'asc',
        },
        select: {
          id: true,
          name: true,
          slug: true,
          game: true,
          description: true,
          event_date: true,
          end_date: true,
          entry_fee: true,
          max_capacity: true,
          current_registered: true,
          location: true,
          status: true,
          image_url: true,
          created_at: true,
        },
      }),
      prisma.event.count({ where }),
    ])

    return NextResponse.json({
      events,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
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

    const event = await prisma.event.create({
      data: {
        name: body.name,
        slug: body.slug || body.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
        game: body.game,
        description: body.description,
        event_date: new Date(body.event_date),
        end_date: body.end_date ? new Date(body.end_date) : null,
        entry_fee: body.entry_fee,
        max_capacity: body.max_capacity,
        location: body.location || 'In-Store',
        image_url: body.image_url,
        status: 'UPCOMING',
      },
    })

    return NextResponse.json(event, { status: 201 })
  } catch (error) {
    console.error('Error creating event:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}