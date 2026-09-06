'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { EventCard, type Event } from '@/components/event-card'
import { ArrowRight } from 'lucide-react'

// Sample event data - in production, this would come from the database
const sampleEvents: Event[] = [
  {
    id: '1',
    name: 'Friday Night Magic',
    slug: 'friday-night-magic',
    game: 'MTG',
    description: 'Casual Commander + Competitive Standard',
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
    description: 'Official Tournament Store event with exclusive OTS promo cards',
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
    description: 'Championship Points event - bring your best team!',
    event_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    entry_fee: 2500,
    max_capacity: 20,
    current_registered: 8,
    location: 'In-Store',
    status: 'UPCOMING',
  },
  {
    id: '5',
    name: 'Naruto CCG Beginner Night',
    slug: 'naruto-beginner-night',
    game: 'NARUTO',
    description: 'Learn to play Naruto CCG! Loaner decks provided.',
    event_date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
    entry_fee: 500,
    max_capacity: 16,
    current_registered: 6,
    location: 'In-Store',
    status: 'UPCOMING',
  },
]

export function TournamentSchedule() {
  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold mb-2">
              Weekly Tournament Schedule
            </h2>
            <p className="text-muted-foreground">
              Join our weekly events and compete for prizes and glory
            </p>
          </div>
          <Link href="/events">
            <Button variant="outline">
              View All Events
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {sampleEvents.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      </div>
    </section>
  )
}
