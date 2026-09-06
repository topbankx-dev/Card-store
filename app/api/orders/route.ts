import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

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

    const where: Record<string, unknown> = {}
    if (status) {
      where.status = status
    }

    const orders = await prisma.order.findMany({
      where,
      take: Math.min(limit, 100),
      orderBy: {
        created_at: 'desc',
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
                image_url: true,
                price: true,
              },
            },
          },
        },
      },
    })

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
    const products = await prisma.product.findMany({
      where: {
        id: {
          in: productIds,
        },
      },
    })

    if (products.length !== productIds.length) {
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

    // Create the order in a transaction
    const order = await prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          total_amount: totalAmount,
          fulfillment_type: validated.fulfillment_type,
          shipping_address: validated.shipping_address,
          customer_name: validated.customer_name,
          customer_email: validated.customer_email,
          customer_phone: validated.customer_phone,
          notes: validated.notes,
          status: 'PENDING',
          items: {
            create: orderItems,
          },
        },
      })

      // Update stock quantities
      for (const item of validated.items) {
        await tx.product.update({
          where: { id: item.product_id },
          data: {
            stock_quantity: {
              decrement: item.quantity,
            },
          },
        })
      }

      return newOrder
    })

    return NextResponse.json(
      {
        id: order.id,
        total_amount: order.total_amount,
        status: order.status,
        fulfillment_type: order.fulfillment_type,
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