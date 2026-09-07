'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { formatPrice, formatDate, cn } from '@/lib/utils'
import {
  GAME_LABELS,
  ORDER_STATUS_LABELS,
  ORDER_STATUS_TRANSITIONS,
  type Order,
  type OrderStatus,
} from '@/lib/admin/types'
import {
  MoreHorizontal,
  Eye,
  Truck,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Clock,
  Package,
  Search,
} from 'lucide-react'

interface OrderTableProps {
  orders: Order[]
  onStatusChange?: (orderId: string, newStatus: OrderStatus, notes?: string) => void
  onRefund?: (orderId: string, reason: string) => void
}

const statusConfig: Record<OrderStatus, { icon: any; color: string; className: string }> = {
  PENDING: { icon: Clock, color: 'bg-yellow-500/10 text-yellow-500', className: 'border-yellow-500' },
  PAID: { icon: CheckCircle2, color: 'bg-blue-500/10 text-blue-500', className: 'border-blue-500' },
  PROCESSING: { icon: Package, color: 'bg-purple-500/10 text-purple-500', className: 'border-purple-500' },
  READY_FOR_PICKUP: { icon: CheckCircle2, color: 'bg-green-500/10 text-green-500', className: 'border-green-500' },
  SHIPPED: { icon: Truck, color: 'bg-indigo-500/10 text-indigo-500', className: 'border-indigo-500' },
  DELIVERED: { icon: CheckCircle2, color: 'bg-green-500/10 text-green-500', className: 'border-green-500' },
  CANCELLED: { icon: XCircle, color: 'bg-red-500/10 text-red-500', className: 'border-red-500' },
  REFUNDED: { icon: RotateCcw, color: 'bg-gray-500/10 text-gray-500', className: 'border-gray-500' },
}

export function OrderTable({ orders, onStatusChange, onRefund }: OrderTableProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [showStatusDialog, setShowStatusDialog] = useState(false)
  const [showRefundDialog, setShowRefundDialog] = useState(false)
  const [newStatus, setNewStatus] = useState<OrderStatus | ''>('')
  const [refundReason, setRefundReason] = useState('')

  const filteredOrders = orders.filter((order) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      const matchesSearch =
        order.id.toLowerCase().includes(query) ||
        order.customer_name.toLowerCase().includes(query) ||
        order.customer_email.toLowerCase().includes(query)
      if (!matchesSearch) return false
    }
    if (statusFilter !== 'all' && order.status !== statusFilter) return false
    return true
  })

  const handleStatusChange = () => {
    if (selectedOrder && newStatus) {
      onStatusChange?.(selectedOrder.id, newStatus as OrderStatus)
      setShowStatusDialog(false)
      setSelectedOrder(null)
      setNewStatus('')
    }
  }

  const handleRefund = () => {
    if (selectedOrder && refundReason) {
      onRefund?.(selectedOrder.id, refundReason)
      setShowRefundDialog(false)
      setSelectedOrder(null)
      setRefundReason('')
    }
  }

  const openStatusDialog = (order: Order) => {
    setSelectedOrder(order)
    setNewStatus('')
    setShowStatusDialog(true)
  }

  const openRefundDialog = (order: Order) => {
    setSelectedOrder(order)
    setRefundReason('')
    setShowRefundDialog(true)
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search orders..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {Object.entries(ORDER_STATUS_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Items</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredOrders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No orders found
                </TableCell>
              </TableRow>
            ) : (
              filteredOrders.map((order) => {
                const StatusIcon = statusConfig[order.status]?.icon || Clock
                const statusClass = statusConfig[order.status]?.color || ''
                const availableTransitions = ORDER_STATUS_TRANSITIONS[order.status] || []

                return (
                  <TableRow key={order.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-mono text-xs bg-muted px-2 py-0.5 rounded w-fit">
                          #{order.id.slice(-6)}
                        </span>
                        <Badge variant="outline" className="w-fit mt-1 text-xs">
                          {order.fulfillment_type === 'IN_STORE_PICKUP'
                            ? 'Pickup'
                            : 'Delivery'}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{order.customer_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {order.customer_email}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">
                        {order.items?.length || 0} items
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-bold text-primary">
                      {formatPrice(order.total_amount)}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge className={cn('gap-1', statusClass)}>
                        <StatusIcon className="w-3 h-3" />
                        {ORDER_STATUS_LABELS[order.status]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {formatDate(order.created_at)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/admin/orders/${order.id}`}>
                              <Eye className="w-4 h-4 mr-2" />
                              View Details
                            </Link>
                          </DropdownMenuItem>
                          {availableTransitions.length > 0 && (
                            <DropdownMenuItem onClick={() => openStatusDialog(order)}>
                              <CheckCircle2 className="w-4 h-4 mr-2" />
                              Update Status
                            </DropdownMenuItem>
                          )}
                          {order.status !== 'REFUNDED' && order.status !== 'CANCELLED' && (
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => openRefundDialog(order)}
                            >
                              <RotateCcw className="w-4 h-4 mr-2" />
                              Refund
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Status Update Dialog */}
      <Dialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Order Status</DialogTitle>
            <DialogDescription>
              Select the new status for order #{selectedOrder?.id.slice(-6)}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>New Status</Label>
              <Select
                value={newStatus}
                onValueChange={(value) => setNewStatus(value as OrderStatus)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {(ORDER_STATUS_TRANSITIONS[selectedOrder?.status as OrderStatus] || []).map(
                    (status) => (
                      <SelectItem key={status} value={status}>
                        {ORDER_STATUS_LABELS[status]}
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowStatusDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleStatusChange} disabled={!newStatus}>
              Update Status
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Refund Dialog */}
      <Dialog open={showRefundDialog} onOpenChange={setShowRefundDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Process Refund</DialogTitle>
            <DialogDescription>
              Are you sure you want to refund order #{selectedOrder?.id.slice(-6)}?
              This will reverse the payment and restore stock.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="p-4 rounded-lg bg-muted">
              <p className="text-sm text-muted-foreground">Refund Amount</p>
              <p className="text-2xl font-bold text-primary">
                {formatPrice(selectedOrder?.total_amount || 0)}
              </p>
            </div>
            <div className="space-y-2">
              <Label>Reason for Refund</Label>
              <Textarea
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                placeholder="Enter the reason for this refund..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRefundDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRefund}
              disabled={!refundReason.trim()}
            >
              Process Refund
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
