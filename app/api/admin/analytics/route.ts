import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin/auth'
import { createServerClient } from '@/lib/supabase'

export const runtime = 'nodejs'

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

    // 1. Fetch Orders in period and all-time recent
    const { data: allOrders, error: ordersError } = await adminDb
      .from('Order')
      .select('*')
      .order('created_at', { ascending: false })

    if (ordersError) {
      console.error('Error fetching orders:', ordersError)
    }

    const ordersList = allOrders || []

    // Filter orders by date range for revenue calculations
    const periodOrders = ordersList.filter(
      (o) => new Date(o.created_at) >= startDate
    )

    // Calculate daily revenue for chart
    const dailyMap: Record<string, { amount: number; orders: number }> = {}

    // Pre-populate days in range so chart doesn't have gaps
    const dayCount = period === '7d' ? 7 : period === '30d' ? 30 : period === '90d' ? 90 : 365
    for (let i = dayCount - 1; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      dailyMap[d] = { amount: 0, orders: 0 }
    }

    periodOrders.forEach((order) => {
      const date = new Date(order.created_at).toISOString().split('T')[0]
      if (dailyMap[date]) {
        dailyMap[date].amount += Number(order.total_amount || 0)
        dailyMap[date].orders += 1
      } else {
        dailyMap[date] = {
          amount: Number(order.total_amount || 0),
          orders: 1,
        }
      }
    })

    const byDayArray = Object.entries(dailyMap)
      .map(([date, val]) => ({ date, amount: val.amount, orders: val.orders }))
      .sort((a, b) => a.date.localeCompare(b.date))

    const totalRevenue = periodOrders.reduce((sum, o) => sum + Number(o.total_amount || 0), 0)
    const allTimeRevenue = ordersList.reduce((sum, o) => sum + Number(o.total_amount || 0), 0)

    // Previous period calculation for % trend
    const periodDurationMs = now.getTime() - startDate.getTime()
    const prevStartDate = new Date(startDate.getTime() - periodDurationMs)
    const prevOrders = ordersList.filter(
      (o) => new Date(o.created_at) >= prevStartDate && new Date(o.created_at) < startDate
    )
    const prevRevenue = prevOrders.reduce((sum, o) => sum + Number(o.total_amount || 0), 0)
    const revenueChange = prevRevenue > 0 ? ((totalRevenue - prevRevenue) / prevRevenue) * 100 : totalRevenue > 0 ? 100 : 0

    // Order status counts
    const pendingOrders = ordersList.filter((o) => o.status === 'PENDING').length
    const processingOrders = ordersList.filter((o) => o.status === 'PROCESSING').length
    const readyPickupOrders = ordersList.filter((o) => o.status === 'READY_FOR_PICKUP').length
    const shippedOrders = ordersList.filter((o) => o.status === 'SHIPPED').length
    const deliveredOrders = ordersList.filter((o) => o.status === 'DELIVERED').length

    // 2. Fetch Products
    const { data: allProducts } = await adminDb
      .from('Product')
      .select('*')
      .order('stock_quantity', { ascending: true })

    const productList = allProducts || []
    const totalProducts = productList.length
    const lowStockItems = productList.filter((p) => Number(p.stock_quantity) > 0 && Number(p.stock_quantity) <= 3)
    const outOfStockItems = productList.filter((p) => Number(p.stock_quantity) === 0)

    // Game distribution breakdown
    const gameCounts: Record<string, number> = {}
    productList.forEach((p) => {
      const g = p.game || 'OTHER'
      gameCounts[g] = (gameCounts[g] || 0) + 1
    })
    const gameShare = Object.entries(gameCounts).map(([game, count]) => ({
      game,
      count,
      percentage: totalProducts > 0 ? Math.round((count / totalProducts) * 100) : 0,
    }))

    // 3. Fetch Tournaments / Events & Registrations
    const { data: allEvents } = await adminDb
      .from('Event')
      .select('*')
      .order('event_date', { ascending: true })

    const eventsList = allEvents || []
    const upcomingEvents = eventsList.filter(
      (e) => new Date(e.event_date) >= new Date(Date.now() - 12 * 60 * 60 * 1000) && e.status !== 'CANCELLED' && e.status !== 'DRAFT'
    ).slice(0, 4)

    const totalRegisteredPlayers = upcomingEvents.reduce((sum, e) => sum + Number(e.registration_count || 0), 0)
    const totalEventCapacity = upcomingEvents.reduce((sum, e) => sum + Number(e.max_capacity || 0), 0)

    // 4. Fetch Customers count
    const { count: totalCustomers } = await adminDb
      .from('User')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'PLAYER')

    // 5. Build Dynamic Action Queue
    const actionQueue: Array<{
      id: string
      type: 'PENDING_ORDER' | 'PICKUP_READY' | 'EVENT_NEAR_CAPACITY' | 'LOW_STOCK'
      title: string
      description: string
      link: string
      severity: 'urgent' | 'warning' | 'info'
    }> = []

    if (pendingOrders > 0) {
      actionQueue.push({
        id: 'action_pending_orders',
        type: 'PENDING_ORDER',
        title: `${pendingOrders} Pending Order${pendingOrders > 1 ? 's' : ''}`,
        description: 'Orders awaiting payment confirmation or packing.',
        link: '/admin/orders?status=PENDING',
        severity: 'urgent',
      })
    }

    if (readyPickupOrders > 0) {
      actionQueue.push({
        id: 'action_ready_pickups',
        type: 'PICKUP_READY',
        title: `${readyPickupOrders} Order${readyPickupOrders > 1 ? 's' : ''} Ready for Kingston Pickup`,
        description: 'Waiting for customers at the counter.',
        link: '/admin/orders?status=READY_FOR_PICKUP',
        severity: 'info',
      })
    }

    upcomingEvents.forEach((ev) => {
      const reg = ev.registration_count || 0
      const cap = ev.max_capacity || 32
      const percent = cap > 0 ? (reg / cap) * 100 : 0
      if (percent >= 80) {
        actionQueue.push({
          id: `action_event_${ev.id}`,
          type: 'EVENT_NEAR_CAPACITY',
          title: `"${ev.name}" is ${Math.round(percent)}% Full!`,
          description: `${reg} of ${cap} seats filled. Only ${cap - reg} spots remaining.`,
          link: `/admin/events/${ev.id}`,
          severity: 'warning',
        })
      }
    })

    if (outOfStockItems.length > 0) {
      actionQueue.push({
        id: 'action_out_of_stock',
        type: 'LOW_STOCK',
        title: `${outOfStockItems.length} Card${outOfStockItems.length > 1 ? 's' : ''} Out of Stock`,
        description: `${outOfStockItems.slice(0, 2).map((p) => p.name).join(', ')}${outOfStockItems.length > 2 ? ' and more' : ''}.`,
        link: '/admin/products?stock=out',
        severity: 'warning',
      })
    }

    return NextResponse.json({
      revenue: {
        total: totalRevenue,
        allTime: allTimeRevenue,
        change: Math.round(revenueChange * 10) / 10,
        byDay: byDayArray,
      },
      orders: {
        total: periodOrders.length,
        allTimeTotal: ordersList.length,
        pending: pendingOrders,
        processing: processingOrders,
        readyForPickup: readyPickupOrders,
        shipped: shippedOrders,
        delivered: deliveredOrders,
        recent: ordersList.slice(0, 6),
      },
      tournaments: {
        upcomingCount: upcomingEvents.length,
        totalRegistered: totalRegisteredPlayers,
        totalCapacity: totalEventCapacity,
        events: upcomingEvents,
      },
      inventory: {
        total: totalProducts,
        lowStockCount: lowStockItems.length,
        outOfStockCount: outOfStockItems.length,
        lowStockItems: [...outOfStockItems, ...lowStockItems].slice(0, 6),
      },
      customers: {
        total: totalCustomers || 0,
      },
      gameShare,
      actionQueue,
    })
  } catch (error) {
    console.error('Error fetching analytics:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
