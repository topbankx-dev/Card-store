import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, supabase } from '@/lib/supabase'
import { z } from 'zod'

// Use service-role client for admin operations (bypasses RLS)
const adminDb = createServerClient()

// Validation schema for product filtering
const productFilterSchema = z.object({
  game: z.string().optional(),
  set: z.string().optional(),
  rarity: z.string().optional(),
  condition: z.string().optional(),
  minPrice: z.string().optional(),
  maxPrice: z.string().optional(),
  search: z.string().optional(),
  featured: z.string().optional(),
  page: z.string().optional(),
  limit: z.string().optional(),
})

// GET /api/products - Fetch all products with optional filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    // Parse and validate query parameters
    const params = productFilterSchema.parse({
      game: searchParams.get('game') ?? undefined,
      set: searchParams.get('set') ?? undefined,
      rarity: searchParams.get('rarity') ?? undefined,
      condition: searchParams.get('condition') ?? undefined,
      minPrice: searchParams.get('minPrice') ?? undefined,
      maxPrice: searchParams.get('maxPrice') ?? undefined,
      search: searchParams.get('search') ?? undefined,
      featured: searchParams.get('featured') ?? undefined,
      page: searchParams.get('page') ?? '1',
      limit: searchParams.get('limit') ?? '20',
    })

    // Pagination
    const page = parseInt(params.page ?? '1') || 1
    const limit = Math.min(parseInt(params.limit ?? '20') || 20, 100)
    const from = (page - 1) * limit
    const to = from + limit - 1

    // Build query
    let query = supabase
      .from('Product')
      .select('*', { count: 'exact' })
      .order('is_featured', { ascending: false })
      .order('created_at', { ascending: false })
      .range(from, to)

    if (params.game) {
      query = query.eq('game', params.game.toUpperCase())
    }
    if (params.set) {
      query = query.ilike('set', `%${params.set}%`)
    }
    if (params.rarity) {
      query = query.eq('rarity', params.rarity.toUpperCase())
    }
    if (params.condition) {
      query = query.eq('condition', params.condition.toUpperCase())
    }
    if (params.minPrice) {
      query = query.gte('price', parseFloat(params.minPrice))
    }
    if (params.maxPrice) {
      query = query.lte('price', parseFloat(params.maxPrice))
    }
    if (params.search) {
      query = query.or(`name.ilike.%${params.search}%,description.ilike.%${params.search}%,set.ilike.%${params.search}%`)
    }
    if (params.featured === 'true') {
      query = query.eq('is_featured', true)
    }

    const { data: products, count, error } = await query

    if (error) {
      console.error('Error fetching products:', error)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    return NextResponse.json({
      products,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching products:', error)

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

// POST /api/products - Create a new product (Admin only)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // TODO: Add admin authentication check here
    // const session = await getServerSession()
    // if (session?.user?.role !== 'ADMIN') {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    // }

    const slug = body.slug || body.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')

    const { data: product, error } = await adminDb
      .from('Product')
      .insert({
        name: body.name,
        slug,
        game: body.game,
        set: body.set,
        rarity: body.rarity,
        condition: body.condition || 'NEAR_MINT',
        price: body.price,
        stock_quantity: body.stock_quantity || 0,
        image_url: body.image_url,
        description: body.description,
        is_featured: body.is_featured || false,
        is_sealed: body.is_sealed || false,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating product:', error)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    return NextResponse.json(product, { status: 201 })
  } catch (error) {
    console.error('Error creating product:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}