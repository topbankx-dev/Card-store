'use client'

import { useState, useEffect } from 'react'
import { StatCard, RevenueChart, LowStockAlert } from '@/components/admin/dashboard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatPrice, formatDate, cn } from '@/lib/utils'
import {
  TrendingUp,
  ShoppingCart,
  Users,
  Package,
  Clock,
  AlertCircle,
  CheckCircle2,
  Truck,
  ArrowRight,
  XCircle,
} from 'lucide-react'
import Link from 'next/link'
import { GAME_LABELS, type Order, type Product, type AnalyticsData } from '@/lib/admin/types'

// Sample data for demonstration - in production, this comes from API
const sampleAnalytics: AnalyticsData = {
  revenue: {
    total: 245000,
    change: 12.5,
    byDay: Array.from({ length: 30 }, (_, i) => ({
      date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      amount: Math.floor(Math.random() * 15000) + 5000,
      orders: Math.floor(Math.random() * 5) + 1,
    })),
  },
  orders: {
    total: 47,
    pending: 5,
    completed: 38,
    cancelled: 4,
    byStatus: [
      { status: 'PENDING', count: 5 },
      { status: 'PROCESSING', count: 3 },
      { status: 'SHIPPED', count: 4 },
      { status: 'DELIVERED', count: 35 },
    ],
  },
  products: {
    total: 234,
    lowStock: 8,
    outOfStock: 3,
    topSelling: [],
  },
  customers: {
    total: 89,
    newThisPeriod: 12,
    returningRate: 65,
  },
}

const sampleOrders: Order[] = [
  {
    id: 'ord_1',
    customer_name: 'John Smith',
    customer_email: 'john@example.com',
    total_amount: 12500,
    status: 'PENDING',
    fulfillment_type: 'IN_STORE_PICKUP',
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    items: [{ id: '1', orderId: 'ord_1', productId: 'p1', quantity: 3, price_at_purchase: 12500 }],
  },
  {
    id: 'ord_2',
    customer_name: 'Jane Doe',
    customer_email: 'jane@example.com',
    total_amount: 8500,
    status: 'PAID',
    fulfillment_type: 'ISLAND_WIDE_DELIVERY',
    created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    items: [{ id: '2', orderId: 'ord_2', productId: 'p2', quantity: 2, price_at_purchase: 4250 }],
  },
  {
    id: 'ord_3',
    customer_name: 'Mike Brown',
    customer_email: 'mike@example.com',
    total_amount: 45000,
    status: 'SHIPPED',
    fulfillment_type: 'ISLAND_WIDE_DELIVERY',
    created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    items: [{ id: '3', orderId: 'ord_3', productId: 'p3', quantity: 5, price_at_purchase: 9000 }],
  },
  {
    id: 'ord_4',
    customer_name: 'Sarah Wilson',
    customer_email: 'sarah@example.com',
    total_amount: 3200,
    status: 'DELIVERED',
    fulfillment_type: 'IN_STORE_PICKUP',
    created_at: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
    items: [{ id: '4', orderId: 'ord_4', productId: 'p4', quantity: 1, price_at_purchase: 3200 }],
  },
]

const sampleLowStock: Product[] = [
  { id: '1', name: 'Blue-Eyes White Dragon', slug: 'blue-eyes', game: 'YGO', rarity: 'RARE', condition: 'NEAR_MINT', price: 4500, stock_quantity: 2, is_featured: false, is_sealed: false, created_at: '' },
  { id: '2', name: 'Charizard VMAX Rainbow', slug: 'charizard', game: 'POKEMON', rarity: 'SECRET_RARE', condition: 'MINT', price: 12500, stock_quantity: 1, is_featured: true, is_sealed: false, created_at: '' },
  { id: '3', name: 'Pikachu V Union', slug: 'pikachu', game: 'POKEMON', rarity: 'ULTRA_RARE', condition: 'NEAR_MINT', price: 2800, stock_quantity: 0, is_featured: false, is_sealed: false, created_at: '' },
]

const statusConfig: Record<string, { icon: any; color: string; label: string }> = {
  PENDING: { icon: Clock, color: 'bg-yellow-500/10 text-yellow-500', label: 'Pending' },
  PAID: { icon: CheckCircle2, color: 'bg-blue-500/10 text-blue-500', label: 'Paid' },
  PROCESSING: { icon: Package, color: 'bg-purple-500/10 text-purple-500', label: 'Processing' },
  READY_FOR_PICKUP: { icon: CheckCircle2, color: 'bg-green-500/10 text-green-500', label: 'Ready' },
  SHIPPED: { icon: Truck, color: 'bg-indigo-500/10 text-indigo-500', label: 'Shipped' },
  DELIVERED: { icon: CheckCircle2, color: 'bg-green-500/10 text-green-500', label: 'Delivered' },
  CANCELLED: { icon: XCircle, color: 'bg-red-500/10 text-red-500', label: 'Cancelled' },
  REFUNDED: { icon: XCircle, color: 'bg-gray-500/10 text-gray-500', label: 'Refunded' },
}

export default function DashboardPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simulate API fetch
    const fetchData = async () => {
      try {
        // In production, fetch from /api/admin/analytics
        await new Promise(resolve => setTimeout(resolve, 500))
        setAnalytics(sampleAnalytics)
      } catch (error) {
        console.error('Failed to fetch analytics:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-20 bg-muted rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Revenue"
          value={formatPrice(analytics?.revenue.total || 0)}
          icon={TrendingUp}
          trend={{ value: analytics?.revenue.change || 0 }}
          variant="success"
        />
        <StatCard
          title="Total Orders"
          value={analytics?.orders.total || 0}
          icon={ShoppingCart}
          trend={{ value: 8 }}
        />
        <StatCard
          title="Total Customers"
          value={analytics?.customers.total || 0}
          icon={Users}
          trend={{ value: analytics?.customers.newThisPeriod || 0, label: 'new' }}
          variant="success"
        />
        <StatCard
          title="Pending Orders"
          value={analytics?.orders.pending || 0}
          icon={Clock}
          variant={analytics?.orders.pending ? 'warning' : 'default'}
        />
      </div>

      {/* Charts and Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RevenueChart data={analytics?.revenue.byDay || []} />
        </div>
        <div>
          <LowStockAlert products={sampleLowStock} />
        </div>
      </div>

      {/* Recent Orders */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Orders</CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin/orders">
              View All
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {sampleOrders.map((order) => {
              const StatusIcon = statusConfig[order.status]?.icon || Clock
              const statusClass = statusConfig[order.status]?.color || ''
              const statusLabel = statusConfig[order.status]?.label || order.status

              return (
                <Link
                  key={order.id}
                  href={`/admin/orders/${order.id}`}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg border hover:bg-accent/50 transition-colors gap-4"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-xs bg-muted px-2 py-0.5 rounded">
                        #{order.id.slice(-6)}
                      </span>
                      <Badge variant="secondary" className="text-xs">
                        {order.fulfillment_type === 'IN_STORE_PICKUP'
                          ? 'Pickup'
                          : 'Delivery'}
                      </Badge>
                    </div>
                    <p className="font-medium">{order.customer_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {order.customer_email}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">
                        {formatDate(order.created_at)}
                      </p>
                      <p className="font-bold text-primary">
                        {formatPrice(order.total_amount)}
                      </p>
                    </div>
                    <Badge className={cn('gap-1', statusClass)}>
                      <StatusIcon className="w-3 h-3" />
                      {statusLabel}
                    </Badge>
                  </div>
                </Link>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
