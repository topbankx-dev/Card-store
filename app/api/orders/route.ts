import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, supabase } from '@/lib/supabase'
import { z } from 'zod'

// Force Node.js runtime for server-side operations
export const runtime = 'nodejs'

// Use service-role client for order operations (bypasses RLS for admin/customer flows)
const adminDb = createServerClient()

// Validation schema for creating an order
const createOrderSchema = z.object({
  items: z.array(
    z.object({
      product_id: z.string().min(1),
      quantity: z.number().int().positive(),
    })
  ).min(1),
  fulfillment_type: z.enum(['IN_STORE_PICKUP', 'ISLAND_WIDE_DELIVERY']),
  shipping_address: z.string().optional(),
  customer_name: z.string().min(1),
  customer_email: z.string().email(),
  customer_phone: z.string().optional(),
  notes: z.string().optional(),
})

// GET /api/orders - Fetch orders (Admin only)
export async function GET(request: NextRequest) {
  try {
    // TODO: Add admin authentication check here
    // const session = await getServerSession()
    // if (session?.user?.role !== 'ADMIN') {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    // }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '50')

    let query = adminDb
      .from('Order')
      .select(`
        *,
        user:User (
          id,
          name,
          email
        ),
        items:OrderItem (
          *,
          product:Product (
            id,
            name,
            slug,
            image_url,
            price
          )
        )
      `)
      .order('created_at', { ascending: false })
      .limit(Math.min(limit, 100))

    if (status) {
      query = query.eq('status', status)
    }

    const { data: orders, error } = await query

    if (error) {
      console.error('Error fetching orders:', error)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    return NextResponse.json(orders)
  } catch (error) {
    console.error('Error fetching orders:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/orders - Create a new order
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate request body
    const validated = createOrderSchema.parse(body)

    // Get current user from session (if authenticated)
    // TODO: Add NextAuth session check
    // const session = await getServerSession()
    // const userId = session?.user?.id

    // Verify all products exist and have sufficient stock
    const productIds = validated.items.map(item => item.product_id)
    const { data: products, error: productsError } = await adminDb
      .from('Product')
      .select('id, name, price, stock_quantity')
      .in('id', productIds)

    if (productsError || !products || products.length !== productIds.length) {
      return NextResponse.json(
        { error: 'One or more products not found' },
        { status: 400 }
      )
    }

    // Check stock availability
    for (const item of validated.items) {
      const product = products.find(p => p.id === item.product_id)
      if (product && product.stock_quantity < item.quantity) {
        return NextResponse.json(
          {
            error: `Insufficient stock for ${product.name}. Available: ${product.stock_quantity}, Requested: ${item.quantity}`,
          },
          { status: 400 }
        )
      }
    }

    // Calculate total amount
    let totalAmount = 0
    const orderItems = validated.items.map(item => {
      const product = products.find(p => p.id === item.product_id)!
      const priceNum = Number(product.price)
      const subtotal = priceNum * item.quantity
      totalAmount += subtotal
      return {
        product_id: item.product_id,
        quantity: item.quantity,
        price_at_purchase: product.price,
      }
    })

    // Create the order (Supabase doesn't support Prisma-style nested transactions)
    // Insert order first, then items, then update stock
    const { data: newOrder, error: orderError } = await adminDb
      .from('Order')
      .insert({
        total_amount: totalAmount,
        fulfillment_type: validated.fulfillment_type,
        shipping_address: validated.shipping_address,
        customer_name: validated.customer_name,
        customer_email: validated.customer_email,
        customer_phone: validated.customer_phone,
        notes: validated.notes,
        status: 'PENDING',
      })
      .select()
      .single()

    if (orderError) {
      console.error('Error creating order:', orderError)
      return NextResponse.json(
        { error: 'Failed to create order' },
        { status: 500 }
      )
    }

    // Insert order items and update stock in parallel
    const insertItems = orderItems.map(item =>
      adminDb.from('OrderItem').insert({
        orderId: newOrder.id,
        productId: item.product_id,
        quantity: item.quantity,
        price_at_purchase: item.price_at_purchase,
      })
    )

    // Decrement stock using the database function (safe from race conditions)
    const updateStock = validated.items.map(item =>
      adminDb.rpc('decrement_stock', { row_id: item.product_id, count: item.quantity })
    )

    const results = await Promise.all([...insertItems, ...updateStock])
    const errors = results.filter(r => r.error)

    if (errors.length > 0) {
      console.error('Error creating order items or updating stock:', errors[0].error)
      return NextResponse.json(
        { error: 'Failed to create order items' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        id: newOrder.id,
        total_amount: newOrder.total_amount,
        status: newOrder.status,
        fulfillment_type: newOrder.fulfillment_type,
        message: 'Order created successfully',
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating order:', error)

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