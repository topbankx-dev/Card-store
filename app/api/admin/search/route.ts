import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { createServerClient } from '@/lib/supabase'

interface SearchResult {
  type: 'product' | 'user' | 'event' | 'order'
  id: string
  title: string
  subtitle: string
  href: string
}

// GET /api/admin/search?q=query - Global search
export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')?.trim()
    const type = searchParams.get('type') // Optional: filter by type
    const limit = parseInt(searchParams.get('limit') || '10')

    if (!query || query.length < 2) {
      return NextResponse.json({ results: [] })
    }

    const supabase = createServerClient()
    const results: SearchResult[] = []

    // Search products
    if (!type || type === 'product') {
      const { data: products } = await supabase
        .from('Product')
        .select('id, name, slug, game, price, stock_quantity')
        .ilike('name', `%${query}%`)
        .limit(limit)

      if (products) {
        results.push(
          ...products.map((p) => ({
            type: 'product' as const,
            id: p.id,
            title: p.name,
            subtitle: `${p.game} • $${p.price.toLocaleString()} • Stock: ${p.stock_quantity}`,
            href: `/admin/products/${p.id}`,
          }))
        )
      }
    }

    // Search users/customers
    if (!type || type === 'user') {
      const { data: users } = await supabase
        .from('User')
        .select('id, name, email, role')
        .or(`name.ilike.%${query}%,email.ilike.%${query}%`)
        .limit(limit)

      if (users) {
        results.push(
          ...users.map((u) => ({
            type: 'user' as const,
            id: u.id,
            title: u.name || 'Unknown User',
            subtitle: `${u.email} • ${u.role}`,
            href: `/admin/users/${u.id}`,
          }))
        )
      }
    }

    // Search events
    if (!type || type === 'event') {
      const { data: events } = await supabase
        .from('Event')
        .select('id, name, slug, event_date, status')
        .ilike('name', `%${query}%`)
        .limit(limit)

      if (events) {
        results.push(
          ...events.map((e) => ({
            type: 'event' as const,
            id: e.id,
            title: e.name,
            subtitle: `${e.status} • ${new Date(e.event_date).toLocaleDateString()}`,
            href: `/admin/events`,
          }))
        )
      }
    }

    // Search orders
    if (!type || type === 'order') {
      const { data: orders } = await supabase
        .from('Order')
        .select('id, customer_name, customer_email, total_amount, status')
        .or(`id.ilike.%${query}%,customer_name.ilike.%${query}%,customer_email.ilike.%${query}%`)
        .limit(limit)

      if (orders) {
        results.push(
          ...orders.map((o) => ({
            type: 'order' as const,
            id: o.id,
            title: `#${o.id.slice(-8)} - ${o.customer_name}`,
            subtitle: `${o.status} • $${o.total_amount.toLocaleString()}`,
            href: `/admin/orders/${o.id}`,
          }))
        )
      }
    }

    // Sort by relevance (exact matches first, then starts-with, then contains)
    results.sort((a, b) => {
      const aLower = a.title.toLowerCase()
      const bLower = b.title.toLowerCase()
      const queryLower = query.toLowerCase()

      // Exact match
      if (aLower === queryLower) return -1
      if (bLower === queryLower) return 1

      // Starts with
      if (aLower.startsWith(queryLower) && !bLower.startsWith(queryLower)) return -1
      if (bLower.startsWith(queryLower) && !aLower.startsWith(queryLower)) return 1

      return 0
    })

    return NextResponse.json({
      results: results.slice(0, limit),
      total: results.length,
    })
  } catch (error) {
    console.error('Error in GET /api/admin/search:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
