'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { formatPrice, formatDate, cn } from '@/lib/utils'
import {
  Plus,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Calendar,
  MapPin,
  Users,
  DollarSign,
  CheckCircle2,
} from 'lucide-react'
import { GAME_LABELS, EVENT_STATUS_LABELS, type Event } from '@/lib/admin/types'

// Sample events
const sampleEvents: Event[] = [
  {
    id: 'evt_123',
    name: 'Friday Night Magic',
    slug: 'friday-night-magic',
    game: 'MTG',
    description: 'Weekly casual Magic: The Gathering event',
    event_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    end_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000).toISOString(),
    entry_fee: 1500,
    max_capacity: 24,
    location: 'Rapid Strike Gaming Lounge',
    status: 'UPCOMING',
    registration_count: 12,
  },
  {
    id: 'evt_456',
    name: 'Yu-Gi-Oh! OTS Tournament',
    slug: 'ygo-ots-tournament',
    game: 'YGO',
    description: 'Official Tournament Series - Advanced Format',
    event_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    entry_fee: 2500,
    max_capacity: 32,
    location: 'Rapid Strike Gaming Lounge',
    status: 'UPCOMING',
    registration_count: 28,
  },
  {
    id: 'evt_789',
    name: 'Pokemon VGC Cup',
    slug: 'pokemon-vgc-cup',
    game: 'POKEMON',
    description: 'VGC Championship Series Qualifier',
    event_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    entry_fee: 3000,
    max_capacity: 20,
    location: 'Rapid Strike Gaming Lounge',
    status: 'UPCOMING',
    registration_count: 8,
  },
  {
    id: 'evt_012',
    name: 'One Piece Card Game League',
    slug: 'opcg-league',
    game: 'ONE_PIECE',
    description: 'Weekly One Piece TCG league night',
    event_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    entry_fee: 1000,
    max_capacity: 16,
    location: 'Rapid Strike Gaming Lounge',
    status: 'COMPLETED',
    registration_count: 14,
  },
]

const statusColors: Record<string, string> = {
  UPCOMING: 'bg-blue-500/10 text-blue-500 border-blue-500',
  ONGOING: 'bg-green-500/10 text-green-500 border-green-500',
  COMPLETED: 'bg-gray-500/10 text-gray-500 border-gray-500',
  CANCELLED: 'bg-red-500/10 text-red-500 border-red-500',
}

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        // In production, fetch from /api/admin/events
        await new Promise(resolve => setTimeout(resolve, 500))
        setEvents(sampleEvents)
      } catch (error) {
        console.error('Failed to fetch events:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchEvents()
  }, [])

  const upcomingEvents = events.filter((e) => e.status === 'UPCOMING')
  const pastEvents = events.filter((e) => e.status !== 'UPCOMING')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Events</h1>
          <p className="text-muted-foreground">
            Manage tournaments and gaming events
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/events/new">
            <Plus className="w-4 h-4 mr-2" />
            Create Event
          </Link>
        </Button>
      </div>

      {/* Upcoming Events */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Upcoming Events</h2>
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6 h-48" />
              </Card>
            ))}
          </div>
        ) : upcomingEvents.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <Calendar className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">No upcoming events</p>
              <Button variant="outline" className="mt-4" asChild>
                <Link href="/admin/events/new">Create your first event</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {upcomingEvents.map((event) => {
              const capacityPercent = event.max_capacity
                ? (event.registration_count / event.max_capacity) * 100
                : 0
              const isFull = capacityPercent >= 100

              return (
                <Card key={event.id} className="overflow-hidden">
                  <div className="p-4 bg-gradient-to-r from-primary/10 to-primary/5 border-b">
                    <div className="flex items-start justify-between">
                      <Badge variant="outline" className="mb-2">
                        {GAME_LABELS[event.game]}
                      </Badge>
                      <Badge
                        variant="outline"
                        className={cn('gap-1', statusColors[event.status])}
                      >
                        <Calendar className="w-3 h-3" />
                        {EVENT_STATUS_LABELS[event.status]}
                      </Badge>
                    </div>
                    <h3 className="font-semibold text-lg">{event.name}</h3>
                    {event.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                        {event.description}
                      </p>
                    )}
                  </div>
                  <CardContent className="p-4 space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Users className="w-4 h-4" />
                          <span>
                            {event.registration_count} / {event.max_capacity}
                          </span>
                        </div>
                        <span className={cn(
                          'text-xs',
                          isFull ? 'text-red-500 font-medium' : 'text-muted-foreground'
                        )}>
                          {isFull ? 'Full' : `${Math.round(capacityPercent)}%`}
                        </span>
                      </div>
                      <Progress
                        value={capacityPercent}
                        className={cn(isFull && '[&>div]:bg-red-500')}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Date</p>
                        <p className="font-medium">{formatDate(event.event_date)}</p>
                      </div>
                      {event.entry_fee ? (
                        <div>
                          <p className="text-muted-foreground">Entry Fee</p>
                          <p className="font-medium">{formatPrice(event.entry_fee)}</p>
                        </div>
                      ) : (
                        <div>
                          <p className="text-muted-foreground">Entry Fee</p>
                          <p className="font-medium text-green-600">Free</p>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <MapPin className="w-4 h-4" />
                      <span>{event.location}</span>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button variant="outline" size="sm" className="flex-1" asChild>
                        <Link href={`/admin/events/${event.id}`}>
                          <Eye className="w-4 h-4 mr-2" />
                          View
                        </Link>
                      </Button>
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/admin/events/${event.id}/edit`}>
                          <Edit className="w-4 h-4" />
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {/* Past Events */}
      {pastEvents.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Past Events</h2>
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Event</TableHead>
                  <TableHead>Game</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Participants</TableHead>
                  <TableHead>Revenue</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pastEvents.map((event) => (
                  <TableRow key={event.id}>
                    <TableCell>
                      <Link
                        href={`/admin/events/${event.id}`}
                        className="font-medium hover:underline"
                      >
                        {event.name}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{GAME_LABELS[event.game]}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(event.event_date)}
                    </TableCell>
                    <TableCell>
                      {event.registration_count}/{event.max_capacity}
                    </TableCell>
                    <TableCell className="font-medium text-primary">
                      {formatPrice(event.entry_fee && event.registration_count
                        ? event.entry_fee * event.registration_count
                        : 0)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn('gap-1', statusColors[event.status])}
                      >
                        {EVENT_STATUS_LABELS[event.status]}
                      </Badge>
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
                            <Link href={`/admin/events/${event.id}`}>
                              <Eye className="w-4 h-4 mr-2" />
                              View Details
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/admin/events/${event.id}/edit`}>
                              <Edit className="w-4 h-4 mr-2" />
                              Edit
                            </Link>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </div>
      )}
    </div>
  )
}
