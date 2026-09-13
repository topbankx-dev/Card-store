'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { EventCard, type Event } from '@/components/event-card'
import { ArrowRight, Loader2, Calendar } from 'lucide-react'
import { useState, useEffect } from 'react'

export function TournamentSchedule() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadEvents() {
      try {
        const res = await fetch('/api/events?limit=4&upcoming=true')
        if (res.ok) {
          const json = await res.json()
          if (json.events && Array.isArray(json.events)) {
            setEvents(json.events)
          }
        }
      } catch (e) {
        console.error('Failed to load events for tournament schedule:', e)
      } finally {
        setLoading(false)
      }
    }
    loadEvents()
  }, [])

  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold mb-2">
              Weekly Tournament Schedule
            </h2>
            <p className="text-muted-foreground">
              Join our weekly OTS and premier tournaments in Kingston, Jamaica
            </p>
          </div>
          <Link href="/events">
            <Button variant="outline">
              View All Events
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-12 border rounded-lg bg-card/50">
            <Calendar className="w-10 h-10 mx-auto mb-2 text-muted-foreground" />
            <p className="text-muted-foreground text-sm">No upcoming tournaments scheduled right now.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {events.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
