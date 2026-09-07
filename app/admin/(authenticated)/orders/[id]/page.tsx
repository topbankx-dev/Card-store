'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { formatPrice, formatDate, cn } from '@/lib/utils'
import {
  ORDER_STATUS_LABELS,
  ORDER_STATUS_TRANSITIONS,
  FULFILLMENT_LABELS,
  type Order,
  type OrderStatus,
} from '@/lib/admin/types'
import {
  ArrowLeft,
  Truck,
  CheckCircle2,
  Clock,
  Package,
  RotateCcw,
  Printer,
  User,
  MapPin,
  Phone,
  Mail,
  Plus,
  Save,
} from 'lucide-react'

// Sample order
const sampleOrder: Order = {
  id: 'ord_abc123def',
  userId: 'user_123',
  customer_name: 'John Smith',
  customer_email: 'john@example.com',
  customer_phone: '+1-876-555-0123',
  total_amount: 12500,
  status: 'PROCESSING',
  fulfillment_type: 'ISLAND_WIDE_DELIVERY',
  shipping_address: '123 Main St, Kingston 5, Jamaica',
  tracking_number: '',
  created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  items: [
    {
      id: 'item_1',
      orderId: 'ord_abc123def',
      productId: 'p1',
      quantity: 2,
      price_at_purchase: 4500,
      product: {
        id: 'p1',
        name: 'Blue-Eyes White Dragon',
        slug: 'blue-eyes',
        image_url: 'https://images.ygoprodeck.com/images/cards/89631139.jpg',
        price: 4500,
      },
    },
    {
      id: 'item_2',
      orderId: 'ord_abc123def',
      productId: 'p2',
      quantity: 1,
      price_at_purchase: 3500,
      product: {
        id: 'p2',
        name: 'Dark Magician',
        slug: 'dark-magician',
        price: 3500,
      },
    },
  ],
  user: {
    id: 'user_123',
    name: 'John Smith',
    email: 'john@example.com',
  },
}

const statusConfig: Record<OrderStatus, { icon: any; color: string; bgColor: string }> = {
  PENDING: { icon: Clock, color: 'text-yellow-500', bgColor: 'bg-yellow-500/10' },
  PAID: { icon: CheckCircle2, color: 'text-blue-500', bgColor: 'bg-blue-500/10' },
  PROCESSING: { icon: Package, color: 'text-purple-500', bgColor: 'bg-purple-500/10' },
  READY_FOR_PICKUP: { icon: CheckCircle2, color: 'text-green-500', bgColor: 'bg-green-500/10' },
  SHIPPED: { icon: Truck, color: 'text-indigo-500', bgColor: 'bg-indigo-500/10' },
  DELIVERED: { icon: CheckCircle2, color: 'text-green-500', bgColor: 'bg-green-500/10' },
  CANCELLED: { icon: RotateCcw, color: 'text-red-500', bgColor: 'bg-red-500/10' },
  REFUNDED: { icon: RotateCcw, color: 'text-gray-500', bgColor: 'bg-gray-500/10' },
}

const statusTimeline = ['PENDING', 'PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED']

export default function OrderDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [newStatus, setNewStatus] = useState<OrderStatus | ''>('')
  const [trackingNumber, setTrackingNumber] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        // In production, fetch from /api/admin/orders/[id]
        await new Promise(resolve => setTimeout(resolve, 500))
        setOrder(sampleOrder)
        setNewStatus(sampleOrder.status)
        setTrackingNumber(sampleOrder.tracking_number || '')
      } catch (error) {
        console.error('Failed to fetch order:', error)
      } finally {
        setLoading(false)
      }
    }

    if (params.id) {
      fetchOrder()
    }
  }, [params.id])

  const handleSave = async () => {
    if (!order) return
    setSaving(true)

    try {
      // In production, call API
      await new Promise(resolve => setTimeout(resolve, 500))
      setOrder({
        ...order,
        status: newStatus as OrderStatus,
        tracking_number: trackingNumber,
      })
    } catch (error) {
      console.error('Failed to save order:', error)
    } finally {
      setSaving(false)
    }
  }

  const handlePrintPackingSlip = () => {
    window.print()
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/orders">
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Order Details</h1>
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
        <div className="h-96 bg-muted rounded animate-pulse" />
      </div>
    )
  }

  if (!order) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/orders">
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </Button>
        </div>
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">Order not found</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const StatusIcon = statusConfig[order.status]?.icon || Clock
  const availableTransitions = ORDER_STATUS_TRANSITIONS[order.status] || []
  const currentStep = statusTimeline.indexOf(order.status)
  const isDelivered = order.status === 'DELIVERED' || order.status === 'REFUNDED' || order.status === 'CANCELLED'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/orders">
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">Order #{order.id.slice(-6)}</h1>
              <Badge className={cn('gap-1', statusConfig[order.status]?.bgColor, statusConfig[order.status]?.color)}>
                <StatusIcon className="w-3 h-3" />
                {ORDER_STATUS_LABELS[order.status]}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Placed on {formatDate(order.created_at)}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handlePrintPackingSlip}>
            <Printer className="w-4 h-4 mr-2" />
            Print Packing Slip
          </Button>
          {availableTransitions.length > 0 && (
            <Button onClick={handleSave} disabled={saving}>
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Status Timeline */}
          {!isDelivered && (
            <Card>
              <CardHeader>
                <CardTitle>Order Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  {statusTimeline.map((status, index) => {
                    const isCompleted = index <= currentStep
                    const isCurrent = index === currentStep
                    const Icon = statusConfig[status]?.icon || Clock

                    return (
                      <div key={status} className="flex items-center">
                        <div className="flex flex-col items-center">
                          <div
                            className={cn(
                              'w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors',
                              isCompleted
                                ? 'bg-primary border-primary text-primary-foreground'
                                : 'bg-muted border-muted-foreground/20'
                            )}
                          >
                            <Icon className="w-5 h-5" />
                          </div>
                          <span className={cn(
                            'text-xs mt-2 font-medium',
                            isCurrent ? 'text-primary' : 'text-muted-foreground'
                          )}>
                            {ORDER_STATUS_LABELS[status]}
                          </span>
                        </div>
                        {index < statusTimeline.length - 1 && (
                          <div
                            className={cn(
                              'w-16 sm:w-24 h-0.5 mx-2',
                              index < currentStep ? 'bg-primary' : 'bg-muted'
                            )}
                          />
                        )}
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Order Items */}
          <Card>
            <CardHeader>
              <CardTitle>Order Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {order.items?.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-4 p-4 rounded-lg border"
                  >
                    <div className="w-16 h-16 rounded-md bg-muted flex items-center justify-center overflow-hidden">
                      {item.product?.image_url ? (
                        <img
                          src={item.product.image_url}
                          alt={item.product?.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Package className="w-8 h-8 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium">{item.product?.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatPrice(item.price_at_purchase)} × {item.quantity}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">
                        {formatPrice(item.price_at_purchase * item.quantity)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <Separator className="my-6" />
              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span className="text-primary">{formatPrice(order.total_amount)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <CardHeader>
              <CardTitle>Order Notes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {order.notes && (
                <div className="p-4 rounded-lg bg-muted">
                  <p className="text-sm">{order.notes}</p>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="notes">Add Note</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add a note to this order..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Update Status */}
          {availableTransitions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Update Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>New Status</Label>
                  <Select
                    value={newStatus}
                    onValueChange={(value) => setNewStatus(value as OrderStatus)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {availableTransitions.map((status) => (
                        <SelectItem key={status} value={status}>
                          {ORDER_STATUS_LABELS[status]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {order.fulfillment_type === 'ISLAND_WIDE_DELIVERY' && (
                  <div className="space-y-2">
                    <Label htmlFor="tracking">Tracking Number</Label>
                    <Input
                      id="tracking"
                      value={trackingNumber}
                      onChange={(e) => setTrackingNumber(e.target.value)}
                      placeholder="e.g. JM-POST-123456"
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Customer Info */}
          <Card>
            <CardHeader>
              <CardTitle>Customer</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">{order.customer_name}</p>
                  {order.user && (
                    <Link
                      href={`/admin/users/${order.user.id}`}
                      className="text-sm text-primary hover:underline"
                    >
                      View Profile
                    </Link>
                  )}
                </div>
              </div>
              <Separator />
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <span>{order.customer_email}</span>
                </div>
                {order.customer_phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <span>{order.customer_phone}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Shipping Info */}
          <Card>
            <CardHeader>
              <CardTitle>Fulfillment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge variant="outline">
                  {FULFILLMENT_LABELS[order.fulfillment_type]}
                </Badge>
              </div>
              {order.shipping_address && (
                <>
                  <Separator />
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                    <span className="text-sm">{order.shipping_address}</span>
                  </div>
                </>
              )}
              {order.tracking_number && (
                <>
                  <Separator />
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Tracking Number</p>
                    <p className="font-mono text-sm">{order.tracking_number}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
