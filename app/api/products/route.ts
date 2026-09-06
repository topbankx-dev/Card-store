import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

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

    // Build the where clause
    const where: Record<string, unknown> = {}

    if (params.game) {
      where.game = params.game.toUpperCase()
    }
    if (params.set) {
      where.set = { contains: params.set, mode: 'insensitive' }
    }
    if (params.rarity) {
      where.rarity = params.rarity.toUpperCase()
    }
    if (params.condition) {
      where.condition = params.condition.toUpperCase()
    }
    if (params.minPrice || params.maxPrice) {
      where.price = {}
      if (params.minPrice) {
        (where.price as Record<string, unknown>).gte = parseFloat(params.minPrice)
      }
      if (params.maxPrice) {
        (where.price as Record<string, unknown>).lte = parseFloat(params.maxPrice)
      }
    }
    if (params.search) {
      where.OR = [
        { name: { contains: params.search, mode: 'insensitive' } },
        { description: { contains: params.search, mode: 'insensitive' } },
        { set: { contains: params.search, mode: 'insensitive' } },
      ]
    }
    if (params.featured === 'true') {
      where.is_featured = true
    }

    // Pagination
    const page = parseInt(params.page ?? '1') || 1
    const limit = Math.min(parseInt(params.limit ?? '20') || 20, 100)
    const skip = (page - 1) * limit

    // Execute query with pagination
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: [
          { is_featured: 'desc' },
          { created_at: 'desc' },
        ],
        select: {
          id: true,
          name: true,
          slug: true,
          game: true,
          set: true,
          rarity: true,
          condition: true,
          price: true,
          stock_quantity: true,
          image_url: true,
          description: true,
          is_featured: true,
          is_sealed: true,
          created_at: true,
        },
      }),
      prisma.product.count({ where }),
    ])

    return NextResponse.json({
      products,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
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

    const product = await prisma.product.create({
      data: {
        name: body.name,
        slug: body.slug || body.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
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
      },
    })

    return NextResponse.json(product, { status: 201 })
  } catch (error) {
    console.error('Error creating product:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}