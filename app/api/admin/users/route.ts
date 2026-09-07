import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin/auth'
import { createServerClient } from '@/lib/supabase'

// Force Node.js runtime
export const runtime = 'nodejs'

// GET /api/admin/users - List all users
export async function GET(request: NextRequest) {
  try {
    const session = await requireAdmin()
    if (session instanceof NextResponse) return session

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100)
    const search = searchParams.get('search')
    const role = searchParams.get('role')

    const from = (page - 1) * limit
    const to = from + limit - 1

    const adminDb = createServerClient()

    let query = adminDb
      .from('User')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to)

    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`)
    }

    if (role) {
      query = query.eq('role', role)
    }

    const { data: users, count, error } = await query

    if (error) {
      console.error('Error fetching users:', error)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    // Get order counts for each user
    const usersWithCounts = await Promise.all(
      (users || []).map(async (user) => {
        const { count: orderCount } = await adminDb
          .from('Order')
          .select('*', { count: 'exact', head: true })
          .eq('userId', user.id)

        return {
          ...user,
          order_count: orderCount || 0,
        }
      })
    )

    return NextResponse.json({
      users: usersWithCounts,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
