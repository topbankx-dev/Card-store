import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin/auth'
import { createServerClient } from '@/lib/supabase'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    const session = await requireAdmin()
    if (session instanceof NextResponse) return session

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '100')

    const adminDb = createServerClient()

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
      .limit(Math.min(limit, 200))

    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    const { data: orders, error } = await query

    if (error) {
      console.error('Error fetching admin orders:', error)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    return NextResponse.json(orders || [])
  } catch (error) {
    console.error('Error in GET /api/admin/orders:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
