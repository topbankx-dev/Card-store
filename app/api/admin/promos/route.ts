import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin/auth'
import { audit } from '@/lib/admin/audit'
import { createServerClient } from '@/lib/supabase'
import { z } from 'zod'

// Force Node.js runtime
export const runtime = 'nodejs'

// Validation schema for promo code creation
const createPromoSchema = z.object({
  code: z.string().min(1).max(50).toUpperCase(),
  discount_type: z.enum(['PERCENTAGE', 'FIXED']),
  discount_value: z.number().positive(),
  max_uses: z.number().int().positive().nullable().optional(),
  min_order_amount: z.number().min(0).optional().default(0),
  expires_at: z.string().nullable().optional(),
  is_active: z.boolean().optional().default(true),
})

// GET /api/admin/promos - List promo codes
export async function GET(request: NextRequest) {
  try {
    const session = await requireAdmin()
    if (session instanceof NextResponse) return session

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100)
    const active = searchParams.get('active')

    const from = (page - 1) * limit
    const to = from + limit - 1

    const adminDb = createServerClient()

    let query = adminDb
      .from('PromoCode')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to)

    if (active === 'true') {
      query = query.eq('is_active', true)
    }

    const { data: promos, count, error } = await query

    if (error) {
      console.error('Error fetching promo codes:', error)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    return NextResponse.json({
      promos,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching promo codes:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/admin/promos - Create promo code
export async function POST(request: NextRequest) {
  try {
    const session = await requireAdmin()
    if (session instanceof NextResponse) return session

    const body = await request.json()

    // Validate request body
    const validated = createPromoSchema.parse(body)

    // Validate percentage doesn't exceed 100
    if (validated.discount_type === 'PERCENTAGE' && validated.discount_value > 100) {
      return NextResponse.json(
        { error: 'Percentage discount cannot exceed 100%' },
        { status: 400 }
      )
    }

    const adminDb = createServerClient()

    // Check if code already exists
    const { data: existing } = await adminDb
      .from('PromoCode')
      .select('id')
      .eq('code', validated.code)
      .single()

    if (existing) {
      return NextResponse.json(
        { error: 'Promo code already exists' },
        { status: 400 }
      )
    }

    // Create promo code
    const { data: promo, error } = await adminDb
      .from('PromoCode')
      .insert({
        code: validated.code,
        discount_type: validated.discount_type,
        discount_value: validated.discount_value,
        max_uses: validated.max_uses,
        min_order_amount: validated.min_order_amount,
        expires_at: validated.expires_at || null,
        is_active: validated.is_active,
        created_by: session.user.id,
        used_count: 0,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating promo code:', error)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    // Log audit
    await audit.create(session.user.id, 'PromoCode', promo.id, {
      code: promo.code,
      discount_type: promo.discount_type,
      discount_value: promo.discount_value,
    })

    return NextResponse.json(promo, { status: 201 })
  } catch (error) {
    console.error('Error creating promo code:', error)

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
