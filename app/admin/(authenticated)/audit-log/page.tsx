'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import { formatDate, cn } from '@/lib/utils'
import {
  Search,
  Filter,
  ScrollText,
  User,
  Package,
  ShoppingCart,
  Calendar,
  Ticket,
  Shield,
  ArrowUpDown,
} from 'lucide-react'
import { type AuditLog } from '@/lib/admin/types'

// Sample audit logs
const sampleLogs: (AuditLog & { user?: { id: string; name?: string; email: string } })[] = [
  {
    id: 'log_1',
    user_id: 'user_456',
    action: 'CREATE',
    entity_type: 'Product',
    entity_id: 'prod_123',
    details: { name: 'Blue-Eyes White Dragon', price: 4500 },
    created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    ip_address: '192.168.1.1',
    user: { id: 'user_456', name: 'Admin User', email: 'admin@tcghub.jm' },
  },
  {
    id: 'log_2',
    user_id: 'user_456',
    action: 'STATUS_CHANGE',
    entity_type: 'Order',
    entity_id: 'ord_abc123',
    details: { oldStatus: 'PENDING', newStatus: 'PAID' },
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    ip_address: '192.168.1.1',
    user: { id: 'user_456', name: 'Admin User', email: 'admin@tcghub.jm' },
  },
  {
    id: 'log_3',
    user_id: 'user_789',
    action: 'ROLE_CHANGE',
    entity_type: 'User',
    entity_id: 'user_123',
    details: { oldRole: 'PLAYER', newRole: 'ADMIN', targetEmail: 'john@example.com' },
    created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    ip_address: '192.168.1.2',
    user: { id: 'user_789', name: 'Super Admin', email: 'super@tcghub.jm' },
  },
  {
    id: 'log_4',
    user_id: 'user_456',
    action: 'UPDATE',
    entity_type: 'Product',
    entity_id: 'prod_456',
    details: { field: 'price', oldValue: 4000, newValue: 4500 },
    created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    ip_address: '192.168.1.1',
    user: { id: 'user_456', name: 'Admin User', email: 'admin@tcghub.jm' },
  },
  {
    id: 'log_5',
    user_id: 'user_456',
    action: 'CREATE',
    entity_type: 'PromoCode',
    entity_id: 'promo_1',
    details: { code: 'SUMMER20', discount: '20%' },
    created_at: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
    ip_address: '192.168.1.1',
    user: { id: 'user_456', name: 'Admin User', email: 'admin@tcghub.jm' },
  },
  {
    id: 'log_6',
    user_id: 'user_456',
    action: 'REFUND',
    entity_type: 'Order',
    entity_id: 'ord_def456',
    details: { amount: 8500, reason: 'Product damaged' },
    created_at: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(),
    ip_address: '192.168.1.1',
    user: { id: 'user_456', name: 'Admin User', email: 'admin@tcghub.jm' },
  },
  {
    id: 'log_7',
    user_id: 'user_789',
    action: 'DELETE',
    entity_type: 'Product',
    entity_id: 'prod_789',
    details: { name: 'Old Product' },
    created_at: new Date(Date.now() - 96 * 60 * 60 * 1000).toISOString(),
    ip_address: '192.168.1.2',
    user: { id: 'user_789', name: 'Super Admin', email: 'super@tcghub.jm' },
  },
]

const actionIcons: Record<string, any> = {
  CREATE: Package,
  UPDATE: Package,
  DELETE: Package,
  STATUS_CHANGE: ShoppingCart,
  ROLE_CHANGE: Shield,
  REFUND: ShoppingCart,
  LOGIN: User,
  LOGOUT: User,
}

const actionColors: Record<string, string> = {
  CREATE: 'bg-green-500/10 text-green-500 border-green-500',
  UPDATE: 'bg-blue-500/10 text-blue-500 border-blue-500',
  DELETE: 'bg-red-500/10 text-red-500 border-red-500',
  STATUS_CHANGE: 'bg-purple-500/10 text-purple-500 border-purple-500',
  ROLE_CHANGE: 'bg-yellow-500/10 text-yellow-500 border-yellow-500',
  REFUND: 'bg-orange-500/10 text-orange-500 border-orange-500',
  LOGIN: 'bg-gray-500/10 text-gray-500 border-gray-500',
  LOGOUT: 'bg-gray-500/10 text-gray-500 border-gray-500',
}

export default function AuditLogPage() {
  const [logs, setLogs] = useState<typeof sampleLogs>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [actionFilter, setActionFilter] = useState<string>('all')
  const [entityFilter, setEntityFilter] = useState<string>('all')

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        // In production, fetch from /api/admin/audit-log
        await new Promise((resolve) => setTimeout(resolve, 500))
        setLogs(sampleLogs)
      } catch (error) {
        console.error('Failed to fetch audit logs:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchLogs()
  }, [])

  const filteredLogs = logs.filter((log) => {
    if (actionFilter !== 'all' && log.action !== actionFilter) return false
    if (entityFilter !== 'all' && log.entity_type !== entityFilter) return false
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      const matchesUser = log.user?.name?.toLowerCase().includes(query) ||
                          log.user?.email.toLowerCase().includes(query)
      const matchesDetails = JSON.stringify(log.details).toLowerCase().includes(query)
      if (!matchesUser && !matchesDetails) return false
    }
    return true
  })

  const formatActionDetails = (log: typeof sampleLogs[0]) => {
    const details = log.details
    if (!details) return null

    switch (log.action) {
      case 'CREATE':
        return `Created ${log.entity_type}: ${details.name || details.code || 'Item'}`
      case 'UPDATE':
        return `Updated ${log.entity_type}: ${details.field} changed to ${details.newValue}`
      case 'DELETE':
        return `Deleted ${log.entity_type}: ${details.name || 'Item'}`
      case 'STATUS_CHANGE':
        return `Order status: ${details.oldStatus} → ${details.newStatus}`
      case 'ROLE_CHANGE':
        return `Changed role: ${details.oldRole} → ${details.newRole}`
      case 'REFUND':
        return `Refunded ${details.amount} - ${details.reason}`
      default:
        return JSON.stringify(details)
    }
  }

  const actions = [...new Set(logs.map((l) => l.action))]
  const entities = [...new Set(logs.map((l) => l.entity_type))]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Audit Log</h1>
        <p className="text-muted-foreground">
          Track all admin actions and changes
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search logs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                {actions.map((action) => (
                  <SelectItem key={action} value={action}>
                    {action.replace('_', ' ')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={entityFilter} onValueChange={setEntityFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Entity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Entities</SelectItem>
                {entities.map((entity) => (
                  <SelectItem key={entity} value={entity}>
                    {entity}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Logs Table */}
      {loading ? (
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="h-16 bg-muted rounded animate-pulse" />
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[180px]">Timestamp</TableHead>
                <TableHead>User</TableHead>
                <TableHead className="w-[120px]">Action</TableHead>
                <TableHead>Details</TableHead>
                <TableHead className="w-[100px]">IP Address</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    <ScrollText className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <p className="text-muted-foreground">No audit logs found</p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredLogs.map((log) => {
                  const ActionIcon = actionIcons[log.action] || ScrollText
                  const actionColor = actionColors[log.action] || 'bg-gray-500/10 text-gray-500'

                  return (
                    <TableRow key={log.id}>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(log.created_at)}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{log.user?.name || 'Unknown'}</span>
                          <span className="text-xs text-muted-foreground">
                            {log.user?.email}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn('gap-1', actionColor)}>
                          <ActionIcon className="w-3 h-3" />
                          {log.action.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {log.entity_type}: {formatActionDetails(log)}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground font-mono">
                        {log.ip_address || '-'}
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  )
}
