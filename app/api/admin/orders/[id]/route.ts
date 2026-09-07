import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin/auth'
import { audit } from '@/lib/admin/audit'
import { createServerClient } from '@/lib/supabase'
import { z } from 'zod'

// Force Node.js runtime
export const runtime = 'nodejs'

// Validation schema for order updates
const updateOrderSchema = z.object({
  status: z.enum(['PENDING', 'PAID', 'PROCESSING', 'READY_FOR_PICKUP', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED']).optional(),
  tracking_number: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  shipping_address: z.string().optional().nullable(),
})

// Valid status transitions
const VALID_TRANSITIONS: Record<string, string[]> = {
  PENDING: ['PAID', 'CANCELLED'],
  PAID: ['PROCESSING', 'REFUNDED'],
  PROCESSING: ['READY_FOR_PICKUP', 'SHIPPED', 'REFUNDED'],
  READY_FOR_PICKUP: ['DELIVERED', 'REFUNDED'],
  SHIPPED: ['DELIVERED', 'REFUNDED'],
  DELIVERED: ['REFUNDED'],
  CANCELLED: [],
  REFUNDED: [],
}

// GET /api/admin/orders/[id] - Get single order
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAdmin()
    if (session instanceof NextResponse) return session

    const { id } = await params
    const adminDb = createServerClient()

    const { data: order, error } = await adminDb
      .from('Order')
      .select(`
        *,
        user:User (id, name, email),
        items:OrderItem (
          *,
          product:Product (id, name, slug, image_url, price)
        )
      `)
      .eq('id', id)
      .single()

    if (error || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    return NextResponse.json(order)
  } catch (error) {
    console.error('Error fetching order:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/admin/orders/[id] - Update order
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAdmin()
    if (session instanceof NextResponse) return session

    const { id } = await params
    const body = await request.json()

    // Validate request body
    const validated = updateOrderSchema.parse(body)

    const adminDb = createServerClient()

    // Get current order
    const { data: currentOrder, error: fetchError } = await adminDb
      .from('Order')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !currentOrder) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Validate status transition
    if (validated.status && validated.status !== currentOrder.status) {
      const validTransitions = VALID_TRANSITIONS[currentOrder.status] || []
      if (!validTransitions.includes(validated.status)) {
        return NextResponse.json(
          {
            error: 'Invalid status transition',
            message: `Cannot transition from ${currentOrder.status} to ${validated.status}`,
          },
          { status: 400 }
        )
      }
    }

    // Build update object
    const updateData: Record<string, unknown> = {}

    if (validated.status) {
      updateData.status = validated.status
      if (validated.status === 'SHIPPED') {
        updateData.shipped_at = new Date().toISOString()
      }
      if (validated.status === 'DELIVERED') {
        updateData.delivered_at = new Date().toISOString()
      }
    }

    if (validated.tracking_number !== undefined) {
      updateData.tracking_number = validated.tracking_number
    }

    if (validated.notes !== undefined) {
      updateData.notes = validated.notes
    }

    if (validated.shipping_address !== undefined) {
      updateData.shipping_address = validated.shipping_address
    }

    // Update order
    const { data: order, error } = await adminDb
      .from('Order')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating order:', error)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    // Log audit
    if (validated.status && validated.status !== currentOrder.status) {
      await audit.statusChange(
        session.user.id,
        'Order',
        id,
        currentOrder.status,
        validated.status
      )
    }

    return NextResponse.json(order)
  } catch (error) {
    console.error('Error updating order:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
