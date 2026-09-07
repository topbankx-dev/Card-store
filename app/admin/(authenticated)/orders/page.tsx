'use client'

import { useState, useEffect } from 'react'
import { OrderTable } from '@/components/admin/orders'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Package,
  Clock,
  CheckCircle2,
  Truck,
  XCircle,
  RotateCcw,
} from 'lucide-react'
import { ORDER_STATUS_LABELS, type Order, type OrderStatus } from '@/lib/admin/types'

// Sample data
const sampleOrders: Order[] = [
  {
    id: 'ord_abc123def',
    customer_name: 'John Smith',
    customer_email: 'john@example.com',
    customer_phone: '+1-876-555-0123',
    total_amount: 12500,
    status: 'PENDING',
    fulfillment_type: 'IN_STORE_PICKUP',
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    items: [
      { id: '1', orderId: 'ord_abc123def', productId: 'p1', quantity: 2, price_at_purchase: 4500 },
      { id: '2', orderId: 'ord_abc123def', productId: 'p2', quantity: 1, price_at_purchase: 3500 },
    ],
  },
  {
    id: 'ord_def456ghi',
    customer_name: 'Jane Doe',
    customer_email: 'jane@example.com',
    total_amount: 8500,
    status: 'PROCESSING',
    fulfillment_type: 'ISLAND_WIDE_DELIVERY',
    shipping_address: '123 Main St, Kingston, Jamaica',
    created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    items: [
      { id: '3', orderId: 'ord_def456ghi', productId: 'p3', quantity: 1, price_at_purchase: 8500 },
    ],
  },
  {
    id: 'ord_ghi789jkl',
    customer_name: 'Mike Brown',
    customer_email: 'mike@example.com',
    total_amount: 45000,
    status: 'SHIPPED',
    fulfillment_type: 'ISLAND_WIDE_DELIVERY',
    shipping_address: '456 Oak Ave, Montego Bay, Jamaica',
    tracking_number: 'JM-POST-123456',
    created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    items: [
      { id: '4', orderId: 'ord_ghi789jkl', productId: 'p4', quantity: 3, price_at_purchase: 15000 },
    ],
  },
  {
    id: 'ord_jkl012mno',
    customer_name: 'Sarah Wilson',
    customer_email: 'sarah@example.com',
    total_amount: 3200,
    status: 'DELIVERED',
    fulfillment_type: 'IN_STORE_PICKUP',
    created_at: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
    items: [
      { id: '5', orderId: 'ord_jkl012mno', productId: 'p5', quantity: 1, price_at_purchase: 3200 },
    ],
  },
  {
    id: 'ord_mno345pqr',
    customer_name: 'Tom Davis',
    customer_email: 'tom@example.com',
    total_amount: 7800,
    status: 'CANCELLED',
    fulfillment_type: 'ISLAND_WIDE_DELIVERY',
    notes: 'Customer requested cancellation',
    created_at: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(),
    items: [],
  },
  {
    id: 'ord_pqr678stu',
    customer_name: 'Lisa Garcia',
    customer_email: 'lisa@example.com',
    total_amount: 15000,
    status: 'READY_FOR_PICKUP',
    fulfillment_type: 'IN_STORE_PICKUP',
    created_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    items: [
      { id: '6', orderId: 'ord_pqr678stu', productId: 'p6', quantity: 1, price_at_purchase: 15000 },
    ],
  },
]

const statusTabs = [
  { value: 'all', label: 'All', icon: Package },
  { value: 'PENDING', label: 'Pending', icon: Clock },
  { value: 'PROCESSING', label: 'Processing', icon: Package },
  { value: 'SHIPPED', label: 'Shipped', icon: Truck },
  { value: 'DELIVERED', label: 'Delivered', icon: CheckCircle2 },
  { value: 'CANCELLED', label: 'Cancelled', icon: XCircle },
] as const

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<string>('all')

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        // In production, fetch from /api/admin/orders
        await new Promise(resolve => setTimeout(resolve, 500))
        setOrders(sampleOrders)
      } catch (error) {
        console.error('Failed to fetch orders:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchOrders()
  }, [])

  // Calculate counts for tabs
  const counts = {
    all: orders.length,
    PENDING: orders.filter((o) => o.status === 'PENDING').length,
    PROCESSING: orders.filter((o) => o.status === 'PROCESSING' || o.status === 'READY_FOR_PICKUP').length,
    SHIPPED: orders.filter((o) => o.status === 'SHIPPED').length,
    DELIVERED: orders.filter((o) => o.status === 'DELIVERED' || o.status === 'REFUNDED').length,
    CANCELLED: orders.filter((o) => o.status === 'CANCELLED').length,
  }

  const handleStatusChange = (orderId: string, newStatus: OrderStatus) => {
    setOrders(orders.map((order) =>
      order.id === orderId ? { ...order, status: newStatus } : order
    ))
    // In production, call API
  }

  const handleRefund = (orderId: string, reason: string) => {
    setOrders(orders.map((order) =>
      order.id === orderId ? { ...order, status: 'REFUNDED' as OrderStatus, notes: reason } : order
    ))
    // In production, call API
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Orders</h1>
        <p className="text-muted-foreground">
          Manage and track customer orders
        </p>
      </div>

      {/* Status Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6">
          {statusTabs.map((tab) => {
            const Icon = tab.icon
            return (
              <TabsTrigger key={tab.value} value={tab.value} className="gap-2">
                <Icon className="w-4 h-4" />
                {tab.label}
                {counts[tab.value as keyof typeof counts] > 0 && (
                  <span className="ml-1 rounded-full bg-muted px-2 py-0.5 text-xs">
                    {counts[tab.value as keyof typeof counts]}
                  </span>
                )}
              </TabsTrigger>
            )
          })}
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {loading ? (
            <Card>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-16 bg-muted rounded animate-pulse" />
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <OrderTable
              orders={activeTab === 'all' ? orders : orders.filter((o) => {
                if (activeTab === 'PROCESSING') {
                  return o.status === 'PROCESSING' || o.status === 'READY_FOR_PICKUP'
                }
                if (activeTab === 'DELIVERED') {
                  return o.status === 'DELIVERED' || o.status === 'REFUNDED'
                }
                return o.status === activeTab
              })}
              onStatusChange={handleStatusChange}
              onRefund={handleRefund}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
