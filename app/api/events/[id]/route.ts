import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/events/[id] - Fetch a single event
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    let event = await prisma.event.findUnique({
      where: { id },
      include: {
        registrations: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    })

    // If not found by ID, try slug
    if (!event) {
      event = await prisma.event.findUnique({
        where: { slug: id },
        include: {
          registrations: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
      })
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

    const event = await prisma.event.update({
      where: { id },
      data: {
        name: body.name,
        game: body.game,
        description: body.description,
        event_date: body.event_date ? new Date(body.event_date) : undefined,
        end_date: body.end_date ? new Date(body.end_date) : body.end_date === null ? null : undefined,
        entry_fee: body.entry_fee,
        max_capacity: body.max_capacity,
        location: body.location,
        image_url: body.image_url,
        status: body.status,
      },
    })

    return NextResponse.json(event)
  } catch (error) {
    console.error('Error updating event:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}