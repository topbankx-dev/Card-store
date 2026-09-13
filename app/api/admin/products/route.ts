import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { requireAdmin } from '@/lib/admin/auth'
import { z } from 'zod'

export const runtime = 'nodejs'

const productSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  slug: z.string().optional(),
  game: z.enum(['MTG', 'YGO', 'POKEMON', 'ONE_PIECE', 'NARUTO', 'DIGIMON', 'ACCESSORIES']),
  set: z.string().optional().nullable(),
  rarity: z.string().optional().nullable(),
  condition: z.string().default('NEAR_MINT'),
  price: z.number().positive('Price must be greater than 0'),
  stock_quantity: z.number().int().min(0).default(0),
  image_url: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  is_featured: z.boolean().default(false),
  is_sealed: z.boolean().default(false),
})

// GET /api/admin/products - List products (Admin)
export async function GET(request: NextRequest) {
  try {
    const adminAuth = await requireAdmin()
    if (adminAuth instanceof NextResponse) {
      return adminAuth
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)
    const game = searchParams.get('game')
    const search = searchParams.get('search')
    const rarity = searchParams.get('rarity')
    const condition = searchParams.get('condition')
    const stock = searchParams.get('stock')

    const from = (page - 1) * limit
    const to = from + limit - 1

    const supabase = createServerClient()
    let query = supabase
      .from('Product')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to)

    if (game && game !== 'ALL' && game !== 'all') {
      query = query.eq('game', game)
    }
    if (rarity && rarity !== 'ALL' && rarity !== 'all') {
      query = query.eq('rarity', rarity)
    }
    if (condition && condition !== 'ALL' && condition !== 'all') {
      query = query.eq('condition', condition)
    }
    if (stock === 'in') {
      query = query.gt('stock_quantity', 0)
    } else if (stock === 'low') {
      query = query.gt('stock_quantity', 0).lte('stock_quantity', 5)
    } else if (stock === 'out') {
      query = query.eq('stock_quantity', 0)
    }
    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%,set.ilike.%${search}%`)
    }

    const { data: products, count, error } = await query

    if (error) {
      console.error('Error fetching admin products:', error)
      return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 })
    }

    return NextResponse.json({
      data: products || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit) || 1,
      }
    })
  } catch (error) {
    console.error('Error in GET /api/admin/products:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/admin/products - Create product (Admin)
export async function POST(request: NextRequest) {
  try {
    const adminAuth = await requireAdmin()
    if (adminAuth instanceof NextResponse) {
      return adminAuth
    }

    const body = await request.json()
    const validated = productSchema.parse(body)

    const slug = validated.slug?.trim() || validated.name
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')

    const supabase = createServerClient()

    // Check slug conflict
    const { data: existingSlug } = await supabase
      .from('Product')
      .select('id')
      .eq('slug', slug)
      .single()

    const finalSlug = existingSlug ? `${slug}-${Date.now()}` : slug

    const { data: product, error } = await supabase
      .from('Product')
      .insert({
        id: crypto.randomUUID(),
        ...validated,
        slug: finalSlug,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating product:', error)
      return NextResponse.json({ error: 'Failed to create product', details: error.message }, { status: 500 })
    }

    return NextResponse.json({ data: product }, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/admin/products:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.flatten() }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
