import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/products/[id] - Fetch a single product by ID or slug
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    // Try to find by ID first, then by slug
    let product = await prisma.product.findUnique({
      where: { id },
      include: {
        order_items: {
          select: {
            id: true,
            quantity: true,
            price_at_purchase: true,
            order: {
              select: {
                id: true,
                status: true,
                created_at: true,
              },
            },
          },
        },
      },
    })

    // If not found by ID, try slug
    if (!product) {
      product = await prisma.product.findUnique({
        where: { slug: id },
        include: {
          order_items: {
            select: {
              id: true,
              quantity: true,
              price_at_purchase: true,
              order: {
                select: {
                  id: true,
                  status: true,
                  created_at: true,
                },
              },
            },
          },
        },
      })
    }

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(product)
  } catch (error) {
    console.error('Error fetching product:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH /api/products/[id] - Update a product (Admin only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await request.json()

    // TODO: Add admin authentication check here

    const product = await prisma.product.update({
      where: { id },
      data: {
        name: body.name,
        slug: body.slug,
        game: body.game,
        set: body.set,
        rarity: body.rarity,
        condition: body.condition,
        price: body.price,
        stock_quantity: body.stock_quantity,
        image_url: body.image_url,
        description: body.description,
        is_featured: body.is_featured,
        is_sealed: body.is_sealed,
      },
    })

    return NextResponse.json(product)
  } catch (error) {
    console.error('Error updating product:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/products/[id] - Delete a product (Admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    // TODO: Add admin authentication check here

    await prisma.product.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting product:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}