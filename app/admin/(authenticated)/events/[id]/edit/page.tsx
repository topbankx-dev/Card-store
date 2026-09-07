'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { EventForm } from '@/components/admin/events/event-form'
import { ArrowLeft, Loader2, AlertTriangle } from 'lucide-react'
import type { Event } from '@/lib/admin/types'

export default function EditEventPage() {
  const params = useParams()
  const router = useRouter()
  const eventId = params.id as string

  const [event, setEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const res = await fetch(`/api/admin/events/${eventId}`)
        if (!res.ok) {
          if (res.status === 404) {
            setError('Event not found')
          } else {
            throw new Error('Failed to fetch event')
          }
          return
        }
        const data = await res.json()
        setEvent(data.data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load event')
      } finally {
        setLoading(false)
      }
    }

    fetchEvent()
  }, [eventId])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error || !event) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" asChild>
          <Link href="/admin/events">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Events
          </Link>
        </Button>
        <Card className="p-12 text-center">
          <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-xl font-semibold mb-2">
            {error || 'Event not found'}
          </h2>
          <p className="text-muted-foreground mb-4">
            The event you're looking for doesn't exist or has been removed.
          </p>
          <Button asChild>
            <Link href="/admin/events">Browse Events</Link>
          </Button>
        </Card>
      </div>
    )
  }

  // Convert Event type to EventFormData
  const initialData = {
    name: event.name,
    slug: event.slug,
    game: event.game,
    description: event.description,
    event_date: event.event_date,
    end_date: event.end_date,
    registration_deadline: event.registration_deadline,
    location: event.location,
    virtual_link: event.virtual_link,
    entry_fee: event.entry_fee,
    max_capacity: event.max_capacity,
    waitlist_enabled: event.waitlist_enabled,
    waitlist_max: event.waitlist_max,
    format: event.format,
    experience_level: event.experience_level,
    subformat: event.subformat,
    deck_ownership: event.deck_ownership,
    max_tables: event.max_tables,
    prize_pool: event.prize_pool,
    prize_description: event.prize_description,
    image_url: event.image_url,
    visibility: event.visibility,
    status: event.status,
    is_recurring: event.is_recurring,
    recurring_pattern: event.recurring_pattern,
    recurring_end_date: event.recurring_end_date,
    recurring_count: event.recurring_count,
    ticket_tiers: event.ticket_tiers?.map(t => ({
      id: t.id,
      name: t.name,
      price: t.price,
      quantity: t.quantity,
      sold_count: t.sold_count,
      description: t.description,
      benefits: t.benefits,
    })),
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/admin/events/${eventId}`}>
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Edit Event</h1>
          <p className="text-muted-foreground mt-1">
            Update "{event.name}"
          </p>
        </div>
      </div>

      <EventForm
        mode="edit"
        eventId={eventId}
        initialData={initialData}
      />
    </div>
  )
}
