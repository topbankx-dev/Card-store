import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin/auth'
import { audit } from '@/lib/admin/audit'
import { createServerClient } from '@/lib/supabase'
import { z } from 'zod'

// Force Node.js runtime
export const runtime = 'nodejs'

// Validation schema for refund
const refundSchema = z.object({
  reason: z.string().min(1, 'Refund reason is required'),
})

// POST /api/admin/orders/[id]/refund - Process refund
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAdmin()
    if (session instanceof NextResponse) return session

    const { id } = await params
    const body = await request.json()

    // Validate request body
    const validated = refundSchema.parse(body)

    const adminDb = createServerClient()

    // Get order with items
    const { data: order, error: orderError } = await adminDb
      .from('Order')
      .select(`
        *,
        items:OrderItem (productId, quantity)
      `)
      .eq('id', id)
      .single()

    if (orderError || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Check if order can be refunded
    if (order.status === 'REFUNDED') {
      return NextResponse.json({ error: 'Order already refunded' }, { status: 400 })
    }

    if (order.status === 'CANCELLED') {
      return NextResponse.json({ error: 'Cannot refund cancelled order' }, { status: 400 })
    }

    // Update order status to refunded
    const { data: updatedOrder, error: updateError } = await adminDb
      .from('Order')
      .update({
        status: 'REFUNDED',
        notes: `Refund processed: ${validated.reason}`,
      })
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating order:', updateError)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    // Restore stock for each item
    if (order.items && order.items.length > 0) {
      for (const item of order.items) {
        await adminDb.rpc('increment_stock', {
          row_id: item.productId,
          count: item.quantity,
        })
      }
    }

    // Log audit
    await audit.refund(
      session.user.id,
      id,
      Number(order.total_amount),
      validated.reason
    )

    return NextResponse.json({
      success: true,
      refund_id: `ref_${Date.now()}`,
      amount: order.total_amount,
      message: 'Refund processed successfully',
    })
  } catch (error) {
    console.error('Error processing refund:', error)

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
