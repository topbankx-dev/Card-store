import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// Validation schema for event registration
const registerSchema = z.object({
  user_id: z.string().optional(),
  guest_name: z.string().optional(),
  guest_email: z.string().email().optional(),
  payment_status: z.enum(['PENDING', 'PAID', 'REFUNDED', 'FAILED']).default('PENDING'),
})

// GET /api/events/[id]/registrations - List registrations for an event (Admin only)
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    // Verify event exists
    const event = await prisma.event.findUnique({
      where: { id },
    })

    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      )
    }

    const registrations = await prisma.eventRegistration.findMany({
      where: { event_id: id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        registered_at: 'asc',
      },
    })

    return NextResponse.json(registrations)
  } catch (error) {
    console.error('Error fetching registrations:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/events/[id]/registrations - Register for an event
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await request.json()

    // Validate request body
    const validated = registerSchema.parse(body)

    // Verify event exists and has capacity
    const event = await prisma.event.findUnique({
      where: { id },
    })

    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      )
    }

    if (event.status !== 'UPCOMING') {
      return NextResponse.json(
        { error: 'Event is not accepting registrations' },
        { status: 400 }
      )
    }

    if (event.current_registered >= event.max_capacity) {
      return NextResponse.json(
        { error: 'Event is full' },
        { status: 400 }
      )
    }

    // Check if already registered
    if (validated.user_id) {
      const existing = await prisma.eventRegistration.findFirst({
        where: {
          event_id: id,
          user_id: validated.user_id,
        },
      })

      if (existing) {
        return NextResponse.json(
          { error: 'Already registered for this event' },
          { status: 400 }
        )
      }
    }

    // Create registration and update event count in a transaction
    const registration = await prisma.$transaction(async (tx) => {
      const newRegistration = await tx.eventRegistration.create({
        data: {
          event_id: id,
          user_id: validated.user_id,
          guest_name: validated.guest_name,
          guest_email: validated.guest_email,
          payment_status: validated.payment_status,
        },
      })

      await tx.event.update({
        where: { id },
        data: {
          current_registered: {
            increment: 1,
          },
        },
      })

      return newRegistration
    })

    return NextResponse.json(
      {
        id: registration.id,
        event_id: registration.event_id,
        payment_status: registration.payment_status,
        message: 'Registration successful',
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error registering for event:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}