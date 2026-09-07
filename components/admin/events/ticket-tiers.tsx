'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Plus,
  Trash2,
  GripVertical,
  Ticket,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { TicketTier, createDefaultTicketTier } from '@/lib/validations/event'
import { formatPrice } from '@/lib/utils'

interface TicketTiersProps {
  tiers: TicketTier[]
  onChange: (tiers: TicketTier[]) => void
  maxCapacity: number
}

export function TicketTiers({ tiers, onChange, maxCapacity }: TicketTiersProps) {
  const [isExpanded, setIsExpanded] = useState(tiers.length === 0)
  const [expandedTier, setExpandedTier] = useState<string | null>(null)

  const addTier = () => {
    const newTier = createDefaultTicketTier()
    newTier.quantity = Math.ceil(maxCapacity / 3) // Default to 1/3 of capacity
    onChange([...tiers, newTier])
    setExpandedTier(newTier.id!)
  }

  const removeTier = (id: string) => {
    onChange(tiers.filter(t => t.id !== id))
  }

  const updateTier = (id: string, updates: Partial<TicketTier>) => {
    onChange(tiers.map(t => t.id === id ? { ...t, ...updates } : t))
  }

  const totalQuantity = tiers.reduce((sum, t) => sum + t.quantity, 0)
  const totalSold = tiers.reduce((sum, t) => sum + (t.sold_count || 0), 0)

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Ticket className="w-5 h-5" />
            <CardTitle className="text-lg">Ticket Tiers</CardTitle>
            {tiers.length > 0 && (
              <Badge variant="secondary">{tiers.length} tier{tiers.length !== 1 ? 's' : ''}</Badge>
            )}
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? (
              <>
                <ChevronUp className="w-4 h-4 mr-1" />
                Collapse
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4 mr-1" />
                Expand
              </>
            )}
          </Button>
        </div>

        {tiers.length > 0 && (
          <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
            <span>Total tickets: <strong>{totalQuantity}</strong></span>
            {totalSold > 0 && (
              <span>Sold: <strong>{totalSold}</strong></span>
            )}
            {totalQuantity > maxCapacity && (
              <Badge variant="destructive">Exceeds capacity!</Badge>
            )}
          </div>
        )}
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-4">
          {/* Tier list */}
          {tiers.map((tier, index) => (
            <div
              key={tier.id}
              className="border rounded-lg p-4 space-y-3 bg-card"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab" />
                  <span className="text-sm font-medium text-muted-foreground">
                    Tier {index + 1}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setExpandedTier(expandedTier === tier.id ? null : tier.id!)}
                  >
                    {expandedTier === tier.id ? 'Less' : 'More'}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeTier(tier.id!)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Basic info row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor={`tier-name-${tier.id}`}>Tier Name</Label>
                  <Input
                    id={`tier-name-${tier.id}`}
                    value={tier.name}
                    onChange={(e) => updateTier(tier.id!, { name: e.target.value })}
                    placeholder="General Admission"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor={`tier-price-${tier.id}`}>Price (JMD)</Label>
                  <Input
                    id={`tier-price-${tier.id}`}
                    type="number"
                    min="0"
                    step="100"
                    value={tier.price}
                    onChange={(e) => updateTier(tier.id!, { price: parseInt(e.target.value) || 0 })}
                    placeholder="1500"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor={`tier-quantity-${tier.id}`}>Quantity</Label>
                  <Input
                    id={`tier-quantity-${tier.id}`}
                    type="number"
                    min="1"
                    value={tier.quantity}
                    onChange={(e) => updateTier(tier.id!, { quantity: parseInt(e.target.value) || 1 })}
                    placeholder="20"
                  />
                </div>
              </div>

              {/* Expanded options */}
              {expandedTier === tier.id && (
                <div className="space-y-3 pt-3 border-t">
                  <div className="space-y-1.5">
                    <Label htmlFor={`tier-desc-${tier.id}`}>Description (optional)</Label>
                    <Input
                      id={`tier-desc-${tier.id}`}
                      value={tier.description || ''}
                      onChange={(e) => updateTier(tier.id!, { description: e.target.value })}
                      placeholder="What's included with this tier"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Benefits (one per line)</Label>
                    <Textarea
                      value={(tier.benefits || []).join('\n')}
                      onChange={(e) => updateTier(tier.id!, {
                        benefits: e.target.value.split('\n').filter(b => b.trim())
                      })}
                      placeholder="Promo pack included&#10;Store credit for top 4&#10;Free drink"
                      rows={3}
                    />
                  </div>
                  {tier.sold_count !== undefined && tier.sold_count > 0 && (
                    <div className="text-sm text-muted-foreground">
                      {tier.sold_count} sold / {tier.quantity} available
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}

          {/* Add tier button */}
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={addTier}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Ticket Tier
          </Button>

          {/* Quick templates */}
          {tiers.length === 0 && (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground text-center">Or use a template:</p>
              <div className="flex flex-wrap gap-2 justify-center">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    onChange([
                      { ...createDefaultTicketTier(), name: 'General Admission', price: 1500, quantity: Math.ceil(maxCapacity * 0.7) },
                      { ...createDefaultTicketTier(), name: 'VIP', price: 2500, quantity: Math.ceil(maxCapacity * 0.3) },
                    ])
                  }}
                >
                  Tournament (2 tiers)
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    onChange([
                      { ...createDefaultTicketTier(), name: 'Early Bird', price: 1000, quantity: Math.ceil(maxCapacity * 0.3) },
                      { ...createDefaultTicketTier(), name: 'Standard', price: 1500, quantity: Math.ceil(maxCapacity * 0.5) },
                      { ...createDefaultTicketTier(), name: 'At Door', price: 2000, quantity: Math.ceil(maxCapacity * 0.2) },
                    ])
                  }}
                >
                  Early Bird (3 tiers)
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    onChange([
                      { ...createDefaultTicketTier(), name: 'Free Entry', price: 0, quantity: maxCapacity },
                    ])
                  }}
                >
                  Free Event
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  )
}
