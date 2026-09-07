import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin/auth'
import { audit } from '@/lib/admin/audit'
import { createServerClient } from '@/lib/supabase'
import { z } from 'zod'

// Force Node.js runtime
export const runtime = 'nodejs'

// Validation schema for product updates
const updateProductSchema = z.object({
  name: z.string().min(1).optional(),
  slug: z.string().min(1).optional(),
  game: z.string().optional(),
  set: z.string().optional(),
  rarity: z.string().optional(),
  condition: z.string().optional(),
  price: z.number().positive().optional(),
  stock_quantity: z.number().int().min(0).optional(),
  image_url: z.string().url().optional().nullable(),
  description: z.string().optional().nullable(),
  is_featured: z.boolean().optional(),
  is_sealed: z.boolean().optional(),
})

// GET /api/admin/products/[id] - Get single product
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAdmin()
    if (session instanceof NextResponse) return session

    const { id } = await params
    const adminDb = createServerClient()

    const { data: product, error } = await adminDb
      .from('Product')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
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

// PUT /api/admin/products/[id] - Update product
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
    const validated = updateProductSchema.parse(body)

    const adminDb = createServerClient()

    // Get current product for audit log
    const { data: currentProduct } = await adminDb
      .from('Product')
      .select('*')
      .eq('id', id)
      .single()

    if (!currentProduct) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // Update product
    const { data: product, error } = await adminDb
      .from('Product')
      .update({
        ...validated,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating product:', error)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    // Log audit
    await audit.update(
      session.user.id,
      'Product',
      id,
      {
        changes: validated,
        previousValues: {
          name: currentProduct.name,
          price: currentProduct.price,
          stock_quantity: currentProduct.stock_quantity,
        },
      }
    )

    return NextResponse.json(product)
  } catch (error) {
    console.error('Error updating product:', error)

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

// DELETE /api/admin/products/[id] - Delete product
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAdmin()
    if (session instanceof NextResponse) return session

    const { id } = await params
    const adminDb = createServerClient()

    // Get product for audit log
    const { data: product } = await adminDb
      .from('Product')
      .select('*')
      .eq('id', id)
      .single()

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // Delete product
    const { error } = await adminDb
      .from('Product')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting product:', error)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    // Log audit
    await audit.delete(
      session.user.id,
      'Product',
      id,
      { name: product.name }
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting product:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
