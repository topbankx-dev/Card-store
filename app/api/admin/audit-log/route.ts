import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin/auth'
import { createServerClient } from '@/lib/supabase'

// Force Node.js runtime
export const runtime = 'nodejs'

// GET /api/admin/audit-log - Get audit logs
export async function GET(request: NextRequest) {
  try {
    const session = await requireAdmin()
    if (session instanceof NextResponse) return session

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)
    const userId = searchParams.get('userId')
    const action = searchParams.get('action')
    const entityType = searchParams.get('entityType')

    const from = (page - 1) * limit
    const to = from + limit - 1

    const adminDb = createServerClient()

    let query = adminDb
      .from('AuditLog')
      .select(`
        *,
        user:User (id, name, email)
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to)

    if (userId) {
      query = query.eq('user_id', userId)
    }

    if (action) {
      query = query.eq('action', action)
    }

    if (entityType) {
      query = query.eq('entity_type', entityType)
    }

    const { data: logs, count, error } = await query

    if (error) {
      console.error('Error fetching audit logs:', error)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    return NextResponse.json({
      logs,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching audit logs:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
