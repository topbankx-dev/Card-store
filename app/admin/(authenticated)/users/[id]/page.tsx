'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatPrice, formatDate, cn } from '@/lib/utils'
import {
  ArrowLeft,
  Mail,
  User,
  Calendar,
  Shield,
  ShoppingCart,
  MessageSquare,
  Save,
  UserCog,
  Ban,
} from 'lucide-react'
import { type User as UserType, type Order, type Role } from '@/lib/admin/types'

// Sample user
const sampleUser: UserType & { is_suspended?: boolean; notes?: string } = {
  id: 'user_123',
  email: 'john@example.com',
  name: 'John Smith',
  role: 'PLAYER',
  created_at: '2024-01-15T10:00:00Z',
  order_count: 12,
  is_suspended: false,
  notes: 'VIP customer, prefers in-store pickup',
}

const sampleOrders: Order[] = [
  {
    id: 'ord_abc123',
    customer_name: 'John Smith',
    customer_email: 'john@example.com',
    total_amount: 12500,
    status: 'DELIVERED',
    fulfillment_type: 'IN_STORE_PICKUP',
    created_at: '2024-01-20T10:00:00Z',
    items: [],
  },
  {
    id: 'ord_def456',
    customer_name: 'John Smith',
    customer_email: 'john@example.com',
    total_amount: 8500,
    status: 'DELIVERED',
    fulfillment_type: 'ISLAND_WIDE_DELIVERY',
    created_at: '2024-01-18T10:00:00Z',
    items: [],
  },
  {
    id: 'ord_ghi789',
    customer_name: 'John Smith',
    customer_email: 'john@example.com',
    total_amount: 3200,
    status: 'PENDING',
    fulfillment_type: 'IN_STORE_PICKUP',
    created_at: '2024-01-22T10:00:00Z',
    items: [],
  },
]

export default function UserDetailPage() {
  const params = useParams()
  const [user, setUser] = useState<typeof sampleUser | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [newRole, setNewRole] = useState<Role>('PLAYER')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const fetchUser = async () => {
      try {
        // In production, fetch from /api/admin/users/[id]
        await new Promise(resolve => setTimeout(resolve, 500))
        setUser(sampleUser)
        setNewRole(sampleUser.role)
        setNotes(sampleUser.notes || '')
        setOrders(sampleOrders)
      } catch (error) {
        console.error('Failed to fetch user:', error)
      } finally {
        setLoading(false)
      }
    }

    if (params.id) {
      fetchUser()
    }
  }, [params.id])

  const handleSave = async () => {
    if (!user) return
    setSaving(true)

    try {
      // In production, call API
      await new Promise(resolve => setTimeout(resolve, 500))
      setUser({ ...user, role: newRole, notes })
    } catch (error) {
      console.error('Failed to save user:', error)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/users">
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">Loading...</h1>
        </div>
        <div className="h-96 bg-muted rounded animate-pulse" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/users">
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </Button>
        </div>
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">User not found</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const getUserInitials = () => {
    return user.name
      ?.split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || user.email[0].toUpperCase()
  }

  const totalSpent = orders.reduce((sum, order) => sum + order.total_amount, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/users">
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </Button>
          <div className="flex items-center gap-4">
            <Avatar className="h-14 w-14">
              <AvatarFallback className="text-lg bg-primary/10 text-primary">
                {getUserInitials()}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold">{user.name || 'No name'}</h1>
                {user.is_suspended && (
                  <Badge variant="destructive">Suspended</Badge>
                )}
              </div>
              <p className="text-muted-foreground flex items-center gap-1">
                <Mail className="w-4 h-4" />
                {user.email}
              </p>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleSave} disabled={saving}>
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sidebar */}
        <div className="space-y-6">
          {/* Profile Info */}
          <Card>
            <CardHeader>
              <CardTitle>Profile</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span>Joined {formatDate(user.created_at)}</span>
              </div>
              <Separator />
              <div className="space-y-2">
                <Label>Role</Label>
                <Select value={newRole} onValueChange={(value) => setNewRole(value as Role)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PLAYER">Player</SelectItem>
                    <SelectItem value="ADMIN">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Separator />
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-muted-foreground" />
                <Badge variant={user.role === 'ADMIN' ? 'default' : 'secondary'}>
                  {user.role === 'ADMIN' ? 'Administrator' : 'Customer'}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">Total Orders</span>
                </div>
                <span className="font-bold">{user.order_count || 0}</span>
              </div>
              <Separator />
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Total Spent</span>
                <span className="font-bold text-primary">{formatPrice(totalSpent)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Notes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add notes about this customer..."
                rows={4}
              />
            </CardContent>
          </Card>
        </div>

        {/* Order History */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Order History</CardTitle>
            </CardHeader>
            <CardContent>
              {orders.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <ShoppingCart className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No orders yet</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell>
                          <Link
                            href={`/admin/orders/${order.id}`}
                            className="font-mono text-sm hover:underline"
                          >
                            #{order.id.slice(-6)}
                          </Link>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {order.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatPrice(order.total_amount)}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDate(order.created_at)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
