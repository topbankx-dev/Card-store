'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { formatPrice, formatDate, cn } from '@/lib/utils'
import {
  Plus,
  MoreHorizontal,
  Edit,
  Trash2,
  Copy,
  CheckCircle2,
  XCircle,
  Ticket,
  Percent,
  DollarSign,
} from 'lucide-react'
import { type PromoCode, type DiscountType } from '@/lib/admin/types'

// Sample promo codes
const samplePromos: PromoCode[] = [
  {
    id: 'promo_1',
    code: 'WELCOME10',
    discount_type: 'PERCENTAGE',
    discount_value: 10,
    max_uses: 100,
    used_count: 45,
    min_order_amount: 5000,
    expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    is_active: true,
    created_at: '2024-01-01T10:00:00Z',
  },
  {
    id: 'promo_2',
    code: 'SUMMER20',
    discount_type: 'PERCENTAGE',
    discount_value: 20,
    max_uses: 50,
    used_count: 32,
    min_order_amount: 10000,
    expires_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    is_active: true,
    created_at: '2024-01-15T10:00:00Z',
  },
  {
    id: 'promo_3',
    code: 'FLAT500',
    discount_type: 'FIXED',
    discount_value: 500,
    max_uses: null,
    used_count: 156,
    min_order_amount: 2000,
    expires_at: null,
    is_active: true,
    created_at: '2024-01-10T10:00:00Z',
  },
  {
    id: 'promo_4',
    code: 'VIP30',
    discount_type: 'PERCENTAGE',
    discount_value: 30,
    max_uses: 10,
    used_count: 10,
    min_order_amount: 15000,
    expires_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    is_active: false,
    created_at: '2024-01-05T10:00:00Z',
  },
]

export default function PromosPage() {
  const [promos, setPromos] = useState<PromoCode[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [selectedPromo, setSelectedPromo] = useState<PromoCode | null>(null)
  const [filter, setFilter] = useState<'all' | 'active' | 'expired'>('all')

  // Form state
  const [formData, setFormData] = useState({
    code: '',
    discount_type: 'PERCENTAGE' as DiscountType,
    discount_value: 10,
    max_uses: '',
    min_order_amount: 0,
    expires_at: '',
    is_active: true,
  })

  useEffect(() => {
    const fetchPromos = async () => {
      try {
        // In production, fetch from /api/admin/promos
        await new Promise((resolve) => setTimeout(resolve, 500))
        setPromos(samplePromos)
      } catch (error) {
        console.error('Failed to fetch promo codes:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchPromos()
  }, [])

  const filteredPromos = promos.filter((promo) => {
    if (filter === 'active') return promo.is_active && (!promo.expires_at || new Date(promo.expires_at) > new Date())
    if (filter === 'expired') return !promo.is_active || (promo.expires_at && new Date(promo.expires_at) <= new Date())
    return true
  })

  const handleCreate = () => {
    const newPromo: PromoCode = {
      id: `promo_${Date.now()}`,
      code: formData.code.toUpperCase(),
      discount_type: formData.discount_type,
      discount_value: formData.discount_value,
      max_uses: formData.max_uses ? parseInt(formData.max_uses) : null,
      used_count: 0,
      min_order_amount: formData.min_order_amount,
      expires_at: formData.expires_at || null,
      is_active: formData.is_active,
      created_at: new Date().toISOString(),
    }
    setPromos([newPromo, ...promos])
    setShowCreateDialog(false)
    resetForm()
    // In production, call API
  }

  const handleDelete = () => {
    if (selectedPromo) {
      setPromos(promos.filter((p) => p.id !== selectedPromo.id))
      setShowDeleteDialog(false)
      setSelectedPromo(null)
      // In production, call API
    }
  }

  const handleToggleActive = (promo: PromoCode) => {
    setPromos(promos.map((p) =>
      p.id === promo.id ? { ...p, is_active: !p.is_active } : p
    ))
    // In production, call API
  }

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code)
  }

  const resetForm = () => {
    setFormData({
      code: '',
      discount_type: 'PERCENTAGE',
      discount_value: 10,
      max_uses: '',
      min_order_amount: 0,
      expires_at: '',
      is_active: true,
    })
  }

  const formatDiscount = (promo: PromoCode) => {
    if (promo.discount_type === 'PERCENTAGE') {
      return `${promo.discount_value}%`
    }
    return formatPrice(promo.discount_value)
  }

  const isExpired = (promo: PromoCode) => {
    return promo.expires_at && new Date(promo.expires_at) <= new Date()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Promo Codes</h1>
          <p className="text-muted-foreground">
            Create and manage discount codes
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Create Promo Code
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('all')}
        >
          All ({promos.length})
        </Button>
        <Button
          variant={filter === 'active' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('active')}
        >
          Active ({promos.filter(p => p.is_active).length})
        </Button>
        <Button
          variant={filter === 'expired' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('expired')}
        >
          Expired/Inactive ({promos.filter(p => !p.is_active || isExpired(p)).length})
        </Button>
      </div>

      {/* Promo Codes Table */}
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
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Discount</TableHead>
                <TableHead>Usage</TableHead>
                <TableHead>Min. Order</TableHead>
                <TableHead>Expires</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPromos.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <Ticket className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <p className="text-muted-foreground">No promo codes found</p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredPromos.map((promo) => (
                  <TableRow key={promo.id} className={cn(!promo.is_active && 'opacity-50')}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <code className="bg-muted px-2 py-1 rounded font-mono font-bold">
                          {promo.code}
                        </code>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleCopyCode(promo.code)}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {promo.discount_type === 'PERCENTAGE' ? (
                          <Percent className="w-4 h-4 text-muted-foreground" />
                        ) : (
                          <DollarSign className="w-4 h-4 text-muted-foreground" />
                        )}
                        <span className="font-bold">{formatDiscount(promo)}</span>
                        <span className="text-muted-foreground">off</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span>{promo.used_count}</span>
                        {promo.max_uses && (
                          <span className="text-muted-foreground">/ {promo.max_uses}</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {promo.min_order_amount > 0 ? formatPrice(promo.min_order_amount) : '-'}
                    </TableCell>
                    <TableCell>
                      {promo.expires_at ? (
                        <span className={cn(
                          isExpired(promo) && 'text-red-500'
                        )}>
                          {formatDate(promo.expires_at)}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">Never</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {isExpired(promo) ? (
                        <Badge variant="destructive">Expired</Badge>
                      ) : promo.is_active ? (
                        <Badge variant="default" className="bg-green-500">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          <XCircle className="w-3 h-3 mr-1" />
                          Inactive
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleToggleActive(promo)}>
                            {promo.is_active ? 'Deactivate' : 'Activate'}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => {
                              setSelectedPromo(promo)
                              setShowDeleteDialog(true)
                            }}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create Promo Code</DialogTitle>
            <DialogDescription>
              Create a new discount code for your customers
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="code">Code</Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                placeholder="e.g. SUMMER20"
                className="font-mono uppercase"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Discount Type</Label>
                <Select
                  value={formData.discount_type}
                  onValueChange={(value) => setFormData({ ...formData, discount_type: value as DiscountType })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PERCENTAGE">Percentage</SelectItem>
                    <SelectItem value="FIXED">Fixed Amount</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="value">
                  {formData.discount_type === 'PERCENTAGE' ? 'Percentage' : 'Amount (JMD)'}
                </Label>
                <Input
                  id="value"
                  type="number"
                  value={formData.discount_value}
                  onChange={(e) => setFormData({ ...formData, discount_value: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="max_uses">Max Uses (optional)</Label>
                <Input
                  id="max_uses"
                  type="number"
                  value={formData.max_uses}
                  onChange={(e) => setFormData({ ...formData, max_uses: e.target.value })}
                  placeholder="Unlimited"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="min_order">Min. Order (JMD)</Label>
                <Input
                  id="min_order"
                  type="number"
                  value={formData.min_order_amount}
                  onChange={(e) => setFormData({ ...formData, min_order_amount: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="expires">Expires (optional)</Label>
              <Input
                id="expires"
                type="date"
                value={formData.expires_at}
                onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="active">Active</Label>
                <p className="text-sm text-muted-foreground">
                  Code can be used immediately
                </p>
              </div>
              <Switch
                id="active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowCreateDialog(false); resetForm() }}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={!formData.code}>
              Create Code
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Promo Code</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the code <strong>{selectedPromo?.code}</strong>?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
