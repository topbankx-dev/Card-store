import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin/auth'
import { createServerClient } from '@/lib/supabase'

// Force Node.js runtime
export const runtime = 'nodejs'

// GET /api/admin/analytics - Get analytics data
export async function GET(request: NextRequest) {
  try {
    const session = await requireAdmin()
    if (session instanceof NextResponse) return session

    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || '30d'

    const adminDb = createServerClient()

    // Calculate date range
    const now = new Date()
    let startDate = new Date()

    switch (period) {
      case '7d':
        startDate.setDate(now.getDate() - 7)
        break
      case '30d':
        startDate.setDate(now.getDate() - 30)
        break
      case '90d':
        startDate.setDate(now.getDate() - 90)
        break
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1)
        break
      default:
        startDate.setDate(now.getDate() - 30)
    }

    // Fetch revenue data
    const { data: orders, error: ordersError } = await adminDb
      .from('Order')
      .select('total_amount, status, created_at')
      .gte('created_at', startDate.toISOString())

    if (ordersError) {
      console.error('Error fetching orders:', ordersError)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    // Calculate daily revenue
    const revenueByDay: Record<string, number> = {}
    orders?.forEach((order) => {
      const date = new Date(order.created_at).toISOString().split('T')[0]
      revenueByDay[date] = (revenueByDay[date] || 0) + Number(order.total_amount)
    })

    const revenueByDayArray = Object.entries(revenueByDay)
      .map(([date, amount]) => ({ date, amount }))
      .sort((a, b) => a.date.localeCompare(b.date))

    // Calculate totals
    const totalRevenue = orders?.reduce((sum, o) => sum + Number(o.total_amount), 0) || 0
    const totalOrders = orders?.length || 0
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0

    // Status breakdown
    const ordersByStatus = orders?.reduce((acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1
      return acc
    }, {} as Record<string, number>) || {}

    // Fetch product stats
    const { data: products } = await adminDb
      .from('Product')
      .select('stock_quantity, price')

    const totalProducts = products?.length || 0
    const lowStockProducts = products?.filter((p) => Number(p.stock_quantity) > 0 && Number(p.stock_quantity) < 5).length || 0
    const outOfStockProducts = products?.filter((p) => Number(p.stock_quantity) === 0).length || 0

    // Fetch customer stats
    const { count: totalCustomers } = await adminDb
      .from('User')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'PLAYER')

    // Calculate previous period for comparison
    const periodLength = now.getTime() - startDate.getTime()
    const prevStartDate = new Date(startDate.getTime() - periodLength)
    const prevEndDate = new Date(startDate)

    const { data: prevOrders } = await adminDb
      .from('Order')
      .select('total_amount')
      .gte('created_at', prevStartDate.toISOString())
      .lt('created_at', prevEndDate.toISOString())

    const prevRevenue = prevOrders?.reduce((sum, o) => sum + Number(o.total_amount), 0) || 0
    const revenueChange = prevRevenue > 0 ? ((totalRevenue - prevRevenue) / prevRevenue) * 100 : 0

    return NextResponse.json({
      revenue: {
        total: totalRevenue,
        change: Math.round(revenueChange * 10) / 10,
        byDay: revenueByDayArray,
      },
      orders: {
        total: totalOrders,
        byStatus: Object.entries(ordersByStatus).map(([status, count]) => ({ status, count })),
      },
      products: {
        total: totalProducts,
        lowStock: lowStockProducts,
        outOfStock: outOfStockProducts,
      },
      customers: {
        total: totalCustomers || 0,
      },
    })
  } catch (error) {
    console.error('Error fetching analytics:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
