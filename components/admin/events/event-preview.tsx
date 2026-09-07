'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Calendar, Clock, MapPin, Users, DollarSign, Eye, EyeOff, Globe, Lock } from 'lucide-react'
import { EventFormData, EXPERIENCE_LABELS, DECK_OWNERSHIP_LABELS } from '@/lib/validations/event'
import { formatDate, formatPrice, cn } from '@/lib/utils'
import type { Event } from '@/lib/admin/types'

const gameColors: Record<string, string> = {
  MTG: 'bg-red-500/10 text-red-500 border-red-500/20',
  YGO: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  POKEMON: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
  ONE_PIECE: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  NARUTO: 'bg-green-500/10 text-green-500 border-green-500/20',
  DIGIMON: 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20',
}

const gameLabels: Record<string, string> = {
  MTG: 'Magic: The Gathering',
  YGO: 'Yu-Gi-Oh!',
  POKEMON: 'Pokémon',
  ONE_PIECE: 'One Piece',
  NARUTO: 'Naruto',
  DIGIMON: 'Digimon',
}

const visibilityIcons: Record<string, React.ReactNode> = {
  PUBLIC: <Globe className="w-3 h-3" />,
  PRIVATE: <Lock className="w-3 h-3" />,
  UNLISTED: <EyeOff className="w-3 h-3" />,
}

interface EventPreviewProps {
  event: Partial<EventFormData>
  className?: string
}

export function EventPreview({ event, className }: EventPreviewProps) {
  // Convert form data to Event type for the preview (convert null to undefined)
  const previewEvent: Event = {
    id: 'preview',
    name: event.name || 'Event Name',
    slug: event.slug || 'event-slug',
    game: event.game || 'MTG',
    description: event.description || '',
    event_date: event.event_date || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    end_date: event.end_date ?? undefined,
    location: event.location || 'Location',
    virtual_link: event.virtual_link ?? undefined,
    entry_fee: event.entry_fee || 0,
    max_capacity: event.max_capacity || 20,
    registration_count: 0,
    waitlist_enabled: event.waitlist_enabled,
    waitlist_max: event.waitlist_max ?? undefined,
    format: event.format,
    experience_level: event.experience_level,
    subformat: event.subformat,
    deck_ownership: event.deck_ownership,
    max_tables: event.max_tables ?? undefined,
    prize_pool: event.prize_pool,
    prize_description: event.prize_description,
    image_url: event.image_url ?? undefined,
    visibility: event.visibility || 'PUBLIC',
    status: event.status || 'DRAFT',
    is_recurring: event.is_recurring,
    recurring_pattern: event.recurring_pattern,
    recurring_end_date: event.recurring_end_date ?? undefined,
    recurring_count: event.recurring_count ?? undefined,
    created_at: new Date().toISOString(),
    ticket_tiers: event.ticket_tiers?.map((t, i) => ({
      id: t.id || `tier-${i}`,
      event_id: 'preview',
      name: t.name,
      price: t.price,
      quantity: t.quantity,
      sold_count: t.sold_count || 0,
      description: t.description,
      benefits: t.benefits,
    })),
  }

  const spotsLeft = previewEvent.max_capacity! - previewEvent.registration_count!
  const capacityPercent = (previewEvent.registration_count! / previewEvent.max_capacity!) * 100
  const isFull = previewEvent.registration_count! >= previewEvent.max_capacity!

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground">Live Preview</h3>
        <Badge variant="outline" className="text-xs">
          {event.visibility && (
            <span className="flex items-center gap-1">
              {visibilityIcons[event.visibility]}
              {event.visibility}
            </span>
          )}
        </Badge>
      </div>

      <Card className="overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-2 mb-2">
            <Badge
              variant="outline"
              className={cn(gameColors[previewEvent.game] || 'bg-primary/10 text-primary')}
            >
              {gameLabels[previewEvent.game] || previewEvent.game}
            </Badge>
            {previewEvent.status === 'DRAFT' ? (
              <Badge variant="secondary">Draft</Badge>
            ) : (
              <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20">
                Upcoming
              </Badge>
            )}
          </div>
          <CardTitle className="text-lg leading-tight">
            {previewEvent.name}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {previewEvent.description && (
            <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
              {previewEvent.description}
            </p>
          )}

          <div className="space-y-2 text-sm mb-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="w-4 h-4 flex-shrink-0" />
              <span>
                {previewEvent.event_date
                  ? formatDate(previewEvent.event_date)
                  : 'Select a date'}
              </span>
            </div>
            {previewEvent.end_date && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="w-4 h-4 flex-shrink-0" />
                <span>
                  Ends {formatDate(previewEvent.end_date)}
                </span>
              </div>
            )}
            <div className="flex items-center gap-2 text-muted-foreground">
              <Users className="w-4 h-4 flex-shrink-0" />
              <span>
                {previewEvent.registration_count}/{previewEvent.max_capacity} registered
              </span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="w-4 h-4 flex-shrink-0" />
              <span>{previewEvent.location || 'Location'}</span>
            </div>
          </div>

          {/* TCG-specific badges */}
          {(previewEvent.format || previewEvent.experience_level) && (
            <div className="flex flex-wrap gap-1 mb-4">
              {previewEvent.format && (
                <Badge variant="outline" className="text-xs">
                  {previewEvent.format}
                </Badge>
              )}
              {previewEvent.experience_level && (
                <Badge variant="outline" className="text-xs">
                  {EXPERIENCE_LABELS[previewEvent.experience_level]}
                </Badge>
              )}
              {previewEvent.deck_ownership && (
                <Badge variant="outline" className="text-xs">
                  {DECK_OWNERSHIP_LABELS[previewEvent.deck_ownership]}
                </Badge>
              )}
            </div>
          )}

          {/* Prize info */}
          {previewEvent.prize_pool && (
            <div className="mb-4 p-2 rounded bg-primary/5 text-xs">
              <span className="font-medium">Prizes: </span>
              {previewEvent.prize_pool}
            </div>
          )}

          {/* Ticket tiers */}
          {previewEvent.ticket_tiers && previewEvent.ticket_tiers.length > 0 && (
            <div className="mb-4 space-y-1">
              {previewEvent.ticket_tiers.map((tier, i) => (
                <div key={i} className="flex justify-between text-xs">
                  <span className="text-muted-foreground">{tier.name}</span>
                  <span className="font-medium">
                    {tier.price === 0 ? 'Free' : formatPrice(tier.price)}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Capacity bar */}
          <div className="mb-4">
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className={cn(
                  'h-full transition-all',
                  isFull ? 'bg-orange-500' : 'bg-primary'
                )}
                style={{ width: `${Math.min(capacityPercent, 100)}%` }}
              />
            </div>
            <div className="flex justify-between mt-1.5">
              <span className="text-xs text-muted-foreground">Capacity</span>
              <span className="text-xs text-muted-foreground">
                {spotsLeft > 0 ? `${spotsLeft} spots left` : 'Full'}
              </span>
            </div>
          </div>

          {/* Entry fee */}
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <span className="text-2xl font-bold">
              {previewEvent.entry_fee === 0 ? 'Free' : formatPrice(previewEvent.entry_fee!)}
            </span>
            {previewEvent.entry_fee !== 0 && (
              <span className="text-sm text-muted-foreground ml-1">entry</span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Registration preview */}
      <Card className="bg-muted/30">
        <CardContent className="p-3 text-center">
          <p className="text-sm text-muted-foreground">
            {previewEvent.status === 'DRAFT'
              ? 'Save or publish to enable registration'
              : 'View & Register'}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
