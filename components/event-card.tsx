'use client'

import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Calendar, Clock, MapPin, Users, ArrowRight } from 'lucide-react'
import { formatDate, cn } from '@/lib/utils'

export interface Event {
  id: string
  name: string
  slug: string
  game: string
  description?: string | null
  event_date: string
  end_date?: string | null
  entry_fee: number
  max_capacity: number
  current_registered: number
  location: string
  status: string
  image_url?: string | null
}

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

const statusColors: Record<string, string> = {
  UPCOMING: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  ONGOING: 'bg-green-500/10 text-green-500 border-green-500/20',
  COMPLETED: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
  CANCELLED: 'bg-red-500/10 text-red-500 border-red-500/20',
}

export function EventCard({ event }: { event: Event }) {
  const capacityPercent = (event.current_registered / event.max_capacity) * 100
  const spotsLeft = event.max_capacity - event.current_registered
  const isFull = event.current_registered >= event.max_capacity
  const isPast = new Date(event.event_date) < new Date()

  return (
    <Card className="group hover:border-primary/50 transition-all overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2 mb-2">
          <Badge
            variant="outline"
            className={cn(gameColors[event.game] || 'bg-primary/10 text-primary')}
          >
            {gameLabels[event.game] || event.game}
          </Badge>
          {event.status === 'CANCELLED' ? (
            <Badge variant="outline" className={statusColors.CANCELLED}>
              Cancelled
            </Badge>
          ) : isFull && !isPast ? (
            <Badge variant="outline" className="bg-orange-500/10 text-orange-500 border-orange-500/20">
              Full
            </Badge>
          ) : event.status === 'ONGOING' ? (
            <Badge variant="outline" className={statusColors.ONGOING}>
              🔴 Live
            </Badge>
          ) : isPast ? (
            <Badge variant="outline" className={statusColors.COMPLETED}>
              Past
            </Badge>
          ) : event.entry_fee === 0 ? (
            <Badge variant="secondary">Free Entry</Badge>
          ) : (
            <span className="text-sm font-semibold">
              ${event.entry_fee.toLocaleString()} JMD
            </span>
          )}
        </div>
        <CardTitle className="text-lg leading-tight group-hover:text-primary transition-colors">
          {event.name}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {event.description && (
          <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
            {event.description}
          </p>
        )}
        <div className="space-y-2 text-sm mb-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="w-4 h-4 flex-shrink-0" />
            <span>{formatDate(event.event_date)}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="w-4 h-4 flex-shrink-0" />
            <span>
              {new Date(event.event_date).toLocaleTimeString('en-JM', {
                hour: 'numeric',
                minute: '2-digit',
              })}
            </span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Users className="w-4 h-4 flex-shrink-0" />
            <span>
              {event.current_registered}/{event.max_capacity} registered
            </span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="w-4 h-4 flex-shrink-0" />
            <span>{event.location}</span>
          </div>
        </div>

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

        <Link href={`/events/${event.slug}`} className="block">
          <Button
            className="w-full"
            size="sm"
            disabled={event.status === 'CANCELLED' || isPast}
          >
            {event.status === 'CANCELLED' ? 'Cancelled' : isPast ? 'View Results' : 'View & Register'}
            <ArrowRight className="w-3 h-3 ml-1" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  )
}
