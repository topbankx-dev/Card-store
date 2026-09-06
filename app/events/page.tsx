'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { CartSidebar } from '@/components/cart-sidebar'
import { EventCard, type Event } from '@/components/event-card'
import { EventFilters, type ViewMode } from '@/components/event-filters'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar, MapPin, Users, ArrowRight, Trophy, Sparkles } from 'lucide-react'
import { formatDate, cn } from '@/lib/utils'

// Sample event data - in production, this would come from /api/events
const sampleEvents: Event[] = [
  {
    id: '1',
    name: 'Friday Night Magic',
    slug: 'friday-night-magic',
    game: 'MTG',
    description: 'Casual Commander + Competitive Standard. Prizes from the latest set for top 4.',
    event_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    entry_fee: 1500,
    max_capacity: 24,
    current_registered: 12,
    location: 'In-Store',
    status: 'UPCOMING',
  },
  {
    id: '2',
    name: 'Yu-Gi-Oh! OTS Tournament',
    slug: 'ygo-ots-tournament',
    game: 'YGO',
    description: 'Official Tournament Store event with exclusive OTS promo cards for top finishers.',
    event_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    entry_fee: 2000,
    max_capacity: 32,
    current_registered: 28,
    location: 'In-Store',
    status: 'UPCOMING',
  },
  {
    id: '3',
    name: 'Pokémon VGC Cup',
    slug: 'pokemon-vgc-cup',
    game: 'POKEMON',
    description: 'Championship Points event - bring your best team! Single elimination bracket.',
    event_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    entry_fee: 2500,
    max_capacity: 20,
    current_registered: 8,
    location: 'In-Store',
    status: 'UPCOMING',
  },
  {
    id: '4',
    name: 'Sunday Casual Day',
    slug: 'sunday-casual-day',
    game: 'ONE_PIECE',
    description: 'Free entry - casual play, trade, and learn. New players welcome!',
    event_date: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toISOString(),
    entry_fee: 0,
    max_capacity: 40,
    current_registered: 5,
    location: 'In-Store',
    status: 'UPCOMING',
  },
  {
    id: '5',
    name: 'Naruto CCG Beginner Night',
    slug: 'naruto-beginner-night',
    game: 'NARUTO',
    description: 'Learn to play Naruto CCG! Loaner decks provided for first-timers.',
    event_date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
    entry_fee: 500,
    max_capacity: 16,
    current_registered: 6,
    location: 'In-Store',
    status: 'UPCOMING',
  },
  {
    id: '6',
    name: 'Modern Showdown',
    slug: 'modern-showdown',
    game: 'MTG',
    description: 'Competitive Modern format. $30 store credit to 1st place.',
    event_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    entry_fee: 3000,
    max_capacity: 32,
    current_registered: 18,
    location: 'In-Store',
    status: 'UPCOMING',
  },
  {
    id: '7',
    name: 'Yu-Gi-Oh! Locals',
    slug: 'ygo-locals',
    game: 'YGO',
    description: 'Weekly local tournament. Win OTS promos and store points.',
    event_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    entry_fee: 1500,
    max_capacity: 24,
    current_registered: 24,
    location: 'In-Store',
    status: 'COMPLETED',
  },
  {
    id: '8',
    name: 'Prerelease: Stellar Crown',
    slug: 'prerelease-stellar-crown',
    game: 'POKEMON',
    description: 'Be the first to play with the new set! Pre-release kit included with entry.',
    event_date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    entry_fee: 4500,
    max_capacity: 30,
    current_registered: 30,
    location: 'In-Store',
    status: 'COMPLETED',
  },
]

const gameColors: Record<string, string> = {
  MTG: 'bg-red-500/10 text-red-500 border-red-500/20',
  YGO: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  POKEMON: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
  ONE_PIECE: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  NARUTO: 'bg-green-500/10 text-green-500 border-green-500/20',
}

const gameLabels: Record<string, string> = {
  MTG: 'Magic: The Gathering',
  YGO: 'Yu-Gi-Oh!',
  POKEMON: 'Pokémon',
  ONE_PIECE: 'One Piece',
  NARUTO: 'Naruto',
}

export default function EventsPage() {
  const [selectedGame, setSelectedGame] = useState('ALL')
  const [selectedStatus, setSelectedStatus] = useState('UPCOMING')
  const [viewMode, setViewMode] = useState<ViewMode>('grid')

  const filteredEvents = useMemo(() => {
    const now = new Date()
    return sampleEvents
      .filter((event) => {
        // Game filter
        if (selectedGame !== 'ALL' && event.game !== selectedGame) return false

        // Status filter
        const eventDate = new Date(event.event_date)
        const isPast = eventDate < now
        if (selectedStatus === 'UPCOMING' && (isPast || event.status !== 'UPCOMING')) return false
        if (selectedStatus === 'ONGOING' && event.status !== 'ONGOING') return false
        if (selectedStatus === 'PAST' && !isPast) return false
        return true
      })
      .sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime())
  }, [selectedGame, selectedStatus])

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

  const upcomingCount = sampleEvents.filter(
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
          {filteredEvents.length === 0 ? (
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
function EventListItem({ event }: { event: Event }) {
  const eventDate = new Date(event.event_date)
  const isPast = eventDate < new Date()
  const isFull = event.current_registered >= event.max_capacity
  const spotsLeft = event.max_capacity - event.current_registered

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
                  {gameLabels[event.game] || event.game}
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
