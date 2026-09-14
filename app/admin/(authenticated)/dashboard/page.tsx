'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  StatCard,
  RevenueChart,
  LowStockAlert,
  ActionQueue,
  UpcomingTournamentsHub,
  GameDistributionChart,
  type ActionQueueItem,
} from '@/components/admin/dashboard'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatPrice, formatDate, cn } from '@/lib/utils'
import {
  TrendingUp,
  ShoppingCart,
  Users,
  Package,
  Clock,
  CheckCircle2,
  Truck,
  ArrowRight,
  XCircle,
  RefreshCw,
  Plus,
  Store,
  Calendar,
  AlertCircle,
  Check,
  Loader2,
} from 'lucide-react'
import { type Order, type Product, type Event, type OrderStatus } from '@/lib/admin/types'

interface DashboardData {
  revenue: {
    total: number
    allTime: number
    change: number
    byDay: { date: string; amount: number; orders: number }[]
  }
  orders: {
    total: number
    allTimeTotal: number
    pending: number
    processing: number
    readyForPickup: number
    shipped: number
    delivered: number
    recent: Order[]
  }
  tournaments: {
    upcomingCount: number
    totalRegistered: number
    totalCapacity: number
    events: Event[]
  }
  inventory: {
    total: number
    lowStockCount: number
    outOfStockCount: number
    lowStockItems: Product[]
  }
  customers: {
    total: number
  }
  gameShare: { game: string; count: number; percentage: number }[]
  actionQueue: ActionQueueItem[]
}

const statusConfig: Record<
  string,
  { icon: React.ComponentType<{ className?: string }>; color: string; label: string }
> = {
  PENDING: { icon: Clock, color: 'bg-amber-500/10 text-amber-500 border-amber-500/20', label: 'Pending' },
  PAID: { icon: CheckCircle2, color: 'bg-blue-500/10 text-blue-500 border-blue-500/20', label: 'Paid' },
  PROCESSING: { icon: Package, color: 'bg-purple-500/10 text-purple-500 border-purple-500/20', label: 'Processing' },
  READY_FOR_PICKUP: { icon: Store, color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20', label: 'Ready for Pickup' },
  SHIPPED: { icon: Truck, color: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20', label: 'Shipped' },
  DELIVERED: { icon: CheckCircle2, color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20', label: 'Delivered' },
  CANCELLED: { icon: XCircle, color: 'bg-rose-500/10 text-rose-500 border-rose-500/20', label: 'Cancelled' },
  REFUNDED: { icon: XCircle, color: 'bg-muted text-muted-foreground border-border', label: 'Refunded' },
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [period, setPeriod] = useState<'7d' | '30d' | '90d' | 'year'>('30d')
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const fetchDashboardData = useCallback(async (selectedPeriod = period, showRefreshSpinner = false) => {
    if (showRefreshSpinner) setRefreshing(true)
    setError(null)

    try {
      const res = await fetch(`/api/admin/analytics?period=${selectedPeriod}`)
      if (!res.ok) {
        throw new Error(`Failed to load analytics (${res.status})`)
      }
      const json = await res.json()
      setData(json)
    } catch (err: any) {
      console.error('Error fetching dashboard data:', err)
      setError(err.message || 'Failed to load dashboard metrics')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [period])

  useEffect(() => {
    fetchDashboardData(period)
  }, [fetchDashboardData, period])

  const handlePeriodChange = (newPeriod: '7d' | '30d' | '90d' | 'year') => {
    setPeriod(newPeriod)
    fetchDashboardData(newPeriod)
  }

  const handleUpdateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
    setUpdatingOrderId(orderId)
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}))
        throw new Error(errJson.message || errJson.error || 'Failed to update order status')
      }

      // Optimistically update recent orders in state
      if (data) {
        setData({
          ...data,
          orders: {
            ...data.orders,
            recent: data.orders.recent.map((o) =>
              o.id === orderId ? { ...o, status: newStatus } : o
            ),
          },
        })
      }

      // Re-fetch analytics in background to keep all counts and queues accurate
      fetchDashboardData(period)
    } catch (err: any) {
      console.error('Failed to update order:', err)
      alert(err.message || 'Error updating order status')
    } finally {
      setUpdatingOrderId(null)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="h-8 w-48 bg-muted rounded animate-pulse" />
            <div className="h-4 w-72 bg-muted rounded animate-pulse" />
          </div>
          <div className="flex gap-2">
            <div className="h-9 w-28 bg-muted rounded animate-pulse" />
            <div className="h-9 w-28 bg-muted rounded animate-pulse" />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-20 bg-muted rounded" />
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-[350px] bg-muted rounded-xl animate-pulse" />
          <div className="h-[350px] bg-muted rounded-xl animate-pulse" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-500">
          <AlertCircle className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-xl font-bold">Failed to load Dashboard Data</h2>
          <p className="text-sm text-muted-foreground mt-1">{error}</p>
        </div>
        <Button onClick={() => fetchDashboardData(period, true)}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Retry
        </Button>
      </div>
    )
  }

  const pendingCount = data?.orders.pending || 0
  const readyPickupCount = data?.orders.readyForPickup || 0
  const totalTourneySeats = data?.tournaments.totalRegistered || 0
  const totalTourneyCap = data?.tournaments.totalCapacity || 0

  return (
    <div className="space-y-6">
      {/* Top Header & Fast Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
              Operations Center
            </h1>
            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-xs font-semibold">
              🟢 Live
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Jamaica TCG Hub Storefront, Lounge & Tournament Desk
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchDashboardData(period, true)}
            disabled={refreshing}
            className="h-9"
          >
            <RefreshCw className={cn('w-3.5 h-3.5 mr-1.5', refreshing && 'animate-spin')} />
            Refresh
          </Button>

          <Button size="sm" variant="outline" asChild className="h-9">
            <Link href="/admin/events/new">
              <Calendar className="w-3.5 h-3.5 mr-1.5 text-amber-500" />
              New Event
            </Link>
          </Button>

          <Button size="sm" asChild className="h-9">
            <Link href="/admin/products/new">
              <Plus className="w-3.5 h-3.5 mr-1.5" />
              Add Product
            </Link>
          </Button>
        </div>
      </div>

      {/* Action Queue Pinned at Top */}
      {data?.actionQueue && <ActionQueue items={data.actionQueue} />}

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Period Revenue"
          value={formatPrice(data?.revenue.total || 0)}
          icon={TrendingUp}
          trend={{
            value: data?.revenue.change || 0,
            label: `vs prior ${period}`,
          }}
          description={`All-time: ${formatPrice(data?.revenue.allTime || 0)}`}
          variant="success"
        />

        <StatCard
          title="Pending Orders"
          value={pendingCount}
          icon={Clock}
          variant={pendingCount > 0 ? 'warning' : 'default'}
          description={pendingCount > 0 ? 'Requires fulfillment / pack' : 'All orders processed'}
        />

        <StatCard
          title="Kingston Pickups Ready"
          value={readyPickupCount}
          icon={Store}
          variant={readyPickupCount > 0 ? 'success' : 'default'}
          description="Waiting for customer counter pickup"
        />

        <StatCard
          title="Tournament Seats Filled"
          value={`${totalTourneySeats} / ${totalTourneyCap > 0 ? totalTourneyCap : '—'}`}
          icon={Users}
          description={`${data?.tournaments.upcomingCount || 0} upcoming tournament${(data?.tournaments.upcomingCount || 0) === 1 ? '' : 's'}`}
        />
      </div>

      {/* Revenue Performance Area Chart */}
      <RevenueChart
        data={data?.revenue.byDay || []}
        period={period}
        onPeriodChange={handlePeriodChange}
      />

      {/* Dual Hub: Upcoming OTS Tournaments & Low Stock Restock */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <UpcomingTournamentsHub events={data?.tournaments.events || []} />
        <LowStockAlert products={data?.inventory.lowStockItems || []} />
      </div>

      {/* Recent Orders Stream with 1-Click Status Update */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-primary" />
              Live Orders & Counter Fulfillment
            </CardTitle>
            <CardDescription>
              Recent customer orders with 1-click status actions
            </CardDescription>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin/orders">
              View All ({data?.orders.allTimeTotal || 0})
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Link>
          </Button>
        </CardHeader>

        <CardContent>
          {(!data?.orders.recent || data.orders.recent.length === 0) ? (
            <div className="text-center py-8 text-muted-foreground border rounded-xl bg-muted/20">
              <ShoppingCart className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm font-semibold">No recent orders found</p>
              <p className="text-xs">Customer purchases from the storefront will appear here instantly.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {data.orders.recent.map((order) => {
                const config = statusConfig[order.status] || statusConfig.PENDING
                const StatusIcon = config.icon
                const isPickup = order.fulfillment_type === 'IN_STORE_PICKUP'
                const isUpdating = updatingOrderId === order.id

                return (
                  <div
                    key={order.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl border bg-card hover:border-primary/40 transition-all gap-4"
                  >
                    {/* Customer & Order Metadata */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Link
                          href={`/admin/orders/${order.id}`}
                          className="font-mono text-xs font-bold hover:underline bg-muted px-2 py-0.5 rounded text-foreground"
                        >
                          #{order.id.slice(0, 8)}
                        </Link>
                        <Badge
                          variant="outline"
                          className={cn(
                            'text-[10px] font-semibold',
                            isPickup
                              ? 'bg-blue-500/10 text-blue-500 border-blue-500/20'
                              : 'bg-purple-500/10 text-purple-500 border-purple-500/20'
                          )}
                        >
                          {isPickup ? 'Store Pickup' : 'Island Delivery'}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(order.created_at)}
                        </span>
                      </div>

                      <div className="flex items-baseline gap-2">
                        <p className="font-bold text-sm text-foreground truncate">
                          {order.customer_name || 'Anonymous Customer'}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {order.customer_email}
                        </p>
                      </div>
                    </div>

                    {/* Price & Current Status */}
                    <div className="flex items-center gap-4 shrink-0">
                      <div className="text-right">
                        <p className="font-mono font-bold text-sm text-primary">
                          {formatPrice(order.total_amount)}
                        </p>
                        <Badge variant="outline" className={cn('text-[10px] gap-1 mt-0.5', config.color)}>
                          <StatusIcon className="w-3 h-3" />
                          {config.label}
                        </Badge>
                      </div>

                      {/* 1-Click Fast Operational Actions */}
                      <div className="flex items-center gap-1.5 border-l pl-3">
                        {isUpdating ? (
                          <Button size="sm" variant="ghost" disabled className="h-8 px-2.5">
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          </Button>
                        ) : (
                          <>
                            {order.status === 'PENDING' && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 text-xs bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border-emerald-500/30"
                                onClick={() => handleUpdateOrderStatus(order.id, 'PAID')}
                              >
                                <Check className="w-3.5 h-3.5 mr-1" />
                                Mark Paid
                              </Button>
                            )}

                            {(order.status === 'PAID' || order.status === 'PROCESSING') && isPickup && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 text-xs bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 border-blue-500/30"
                                onClick={() => handleUpdateOrderStatus(order.id, 'READY_FOR_PICKUP')}
                              >
                                <Store className="w-3.5 h-3.5 mr-1" />
                                Ready for Pickup
                              </Button>
                            )}

                            {(order.status === 'PAID' || order.status === 'PROCESSING') && !isPickup && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 text-xs bg-indigo-500/10 text-indigo-600 hover:bg-indigo-500/20 border-indigo-500/30"
                                onClick={() => handleUpdateOrderStatus(order.id, 'SHIPPED')}
                              >
                                <Truck className="w-3.5 h-3.5 mr-1" />
                                Mark Shipped
                              </Button>
                            )}

                            {(order.status === 'READY_FOR_PICKUP' || order.status === 'SHIPPED') && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 text-xs bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border-emerald-500/30"
                                onClick={() => handleUpdateOrderStatus(order.id, 'DELIVERED')}
                              >
                                <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                                Delivered
                              </Button>
                            )}

                            <Link href={`/admin/orders/${order.id}`}>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                                <ArrowRight className="w-4 h-4" />
                              </Button>
                            </Link>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* TCG Inventory Game Share */}
      <GameDistributionChart
        data={data?.gameShare || []}
        totalProducts={data?.inventory.total || 0}
      />
    </div>
  )
}
