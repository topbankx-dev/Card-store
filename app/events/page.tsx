'use client'

import { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { CartSidebar } from '@/components/cart-sidebar'
import { EventCard, type Event } from '@/components/event-card'
import { EventFilters, type ViewMode } from '@/components/event-filters'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar, MapPin, Users, ArrowRight, Trophy, Sparkles, Loader2 } from 'lucide-react'
import { formatDate, cn } from '@/lib/utils'
import { GAME_LABELS } from '@/lib/admin/types'

export default function EventsPage() {
  const [selectedGame, setSelectedGame] = useState('ALL')
  const [selectedStatus, setSelectedStatus] = useState('UPCOMING')
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const params = new URLSearchParams()
        if (selectedGame !== 'ALL') params.set('game', selectedGame)
        params.set('limit', '100')

        const res = await fetch(`/api/admin/events?${params}`)
        if (res.ok) {
          const data = await res.json()
          setEvents(data.data || [])
        }
      } catch (error) {
        console.error('Failed to fetch events:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchEvents()
  }, [selectedGame])

  const filteredEvents = useMemo(() => {
    const now = new Date()
    return events
      .filter((event) => {
        // Game filter (already filtered by API, but keep for status filtering)
        if (selectedGame !== 'ALL' && event.game !== selectedGame) return false

        // Status filter
        const eventDate = new Date(event.event_date)
        const isPast = eventDate < now
        if (selectedStatus === 'UPCOMING' && (isPast || event.status !== 'UPCOMING')) return false
        if (selectedStatus === 'ONGOING' && event.status !== 'ONGOING') return false
        if (selectedStatus === 'PAST' && !isPast) return false
        // Filter out drafts from public view
        if (event.status === 'DRAFT') return false
        return true
      })
      .sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime())
  }, [events, selectedGame, selectedStatus])

  // Group events by month for list view
  const eventsByMonth = useMemo(() => {
    const groups: Record<string, Event[]> = {}
    filteredEvents.forEach((event) => {
      const date = new Date(event.event_date)
      const monthKey = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
      if (!groups[monthKey]) groups[monthKey] = []
      groups[monthKey].push(event)
    })
    return groups
  }, [filteredEvents])

  const upcomingCount = events.filter(
    (e) => new Date(e.event_date) > new Date() && e.status === 'UPCOMING'
  ).length

  return (
    <>
      <Header />
      <CartSidebar />

      <main className="min-h-screen">
        {/* Hero Section */}
        <section className="border-b bg-gradient-to-br from-purple-600/10 via-blue-600/10 to-background">
          <div className="container mx-auto px-4 py-16 md:py-20">
            <div className="max-w-3xl">
              <div className="flex items-center gap-2 mb-4">
                <Trophy className="w-6 h-6 text-primary" />
                <span className="text-sm font-medium text-primary">Tournaments & Events</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                Compete. Win. Connect.
              </h1>
              <p className="text-lg text-muted-foreground mb-6">
                Join Jamaica's most active trading card game community. Weekly tournaments across Yu-Gi-Oh!, Pokémon, Magic, One Piece, and Naruto.
              </p>
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2 text-sm">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <span><strong>{upcomingCount}</strong> upcoming events</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Users className="w-4 h-4 text-primary" />
                  <span>All skill levels welcome</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Trophy className="w-4 h-4 text-primary" />
                  <span>Prizes for top finishers</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Filters */}
        <div className="container mx-auto px-4">
          <EventFilters
            selectedGame={selectedGame}
            onGameChange={setSelectedGame}
            selectedStatus={selectedStatus}
            onStatusChange={setSelectedStatus}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            totalResults={filteredEvents.length}
          />

          {/* Results count */}
          <div className="mb-4 text-sm text-muted-foreground">
            Showing <strong className="text-foreground">{filteredEvents.length}</strong>{' '}
            {filteredEvents.length === 1 ? 'event' : 'events'}
          </div>

          {/* Events Display */}
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredEvents.length === 0 ? (
            <Card className="py-16">
              <CardContent className="text-center">
                <Calendar className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No events found</h3>
                <p className="text-muted-foreground mb-4">
                  Try changing your filters or check back soon for new events.
                </p>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedGame('ALL')
                    setSelectedStatus('UPCOMING')
                  }}
                >
                  Reset Filters
                </Button>
              </CardContent>
            </Card>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-12">
              {filteredEvents.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          ) : (
            <div className="space-y-8 pb-12">
              {Object.entries(eventsByMonth).map(([month, events]) => (
                <div key={month}>
                  <h2 className="text-xl font-bold mb-4 sticky top-32 bg-background/95 backdrop-blur py-2 z-10">
                    {month}
                  </h2>
                  <div className="space-y-3">
                    {events.map((event) => (
                      <EventListItem key={event.id} event={event} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* CTA Section */}
        <section className="border-t bg-muted/30 py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-2xl mx-auto text-center">
              <h2 className="text-2xl md:text-3xl font-bold mb-3">
                Don't see what you're looking for?
              </h2>
              <p className="text-muted-foreground mb-6">
                We're always open to hosting new events and tournaments. Reach out and let us know what your community wants.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button asChild>
                  <a href="mailto:events@jamtcghub.com">
                    Suggest an Event
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </a>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/blog">Read Event Recaps</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  )
}

// List view item component
const gameColors: Record<string, string> = {
  MTG: 'bg-red-500/10 text-red-500 border-red-500/20',
  YGO: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  POKEMON: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
  ONE_PIECE: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  NARUTO: 'bg-green-500/10 text-green-500 border-green-500/20',
  DIGIMON: 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20',
}

function EventListItem({ event }: { event: Event }) {
  const eventDate = new Date(event.event_date)
  const isPast = eventDate < new Date()
  const isFull = (event.current_registered || 0) >= (event.max_capacity || 0)
  const spotsLeft = (event.max_capacity || 0) - (event.current_registered || 0)

  return (
    <Link href={`/events/${event.slug}`}>
      <Card className="hover:border-primary/50 transition-all cursor-pointer">
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            {/* Date badge */}
            <div className="flex-shrink-0 w-16 h-16 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 flex flex-col items-center justify-center text-center">
              <span className="text-xs uppercase text-muted-foreground">
                {eventDate.toLocaleDateString('en-US', { month: 'short' })}
              </span>
              <span className="text-xl font-bold leading-none">
                {eventDate.getDate()}
              </span>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <Badge
                  variant="outline"
                  className={cn(gameColors[event.game] || 'bg-primary/10 text-primary')}
                >
                  {GAME_LABELS[event.game as keyof typeof GAME_LABELS] || event.game}
                </Badge>
                {event.status === 'CANCELLED' && (
                  <Badge variant="outline" className="bg-red-500/10 text-red-500">
                    Cancelled
                  </Badge>
                )}
                {isFull && !isPast && event.status !== 'CANCELLED' && (
                  <Badge variant="outline" className="bg-orange-500/10 text-orange-500">
                    Full
                  </Badge>
                )}
                {isPast && (
                  <Badge variant="outline" className="bg-gray-500/10 text-gray-400">
                    Past
                  </Badge>
                )}
              </div>
              <h3 className="font-semibold mb-1 line-clamp-1">{event.name}</h3>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {eventDate.toLocaleTimeString('en-JM', {
                    hour: 'numeric',
                    minute: '2-digit',
                  })}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {event.location}
                </span>
                <span className="flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  {event.current_registered}/{event.max_capacity}
                </span>
                <span className="ml-auto font-semibold text-foreground">
                  {event.entry_fee === 0 ? 'Free' : `$${event.entry_fee.toLocaleString()} JMD`}
                </span>
              </div>
            </div>

            <ArrowRight className="w-4 h-4 text-muted-foreground flex-shrink-0 self-center" />
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
