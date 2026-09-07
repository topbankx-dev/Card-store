'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { CartSidebar } from '@/components/cart-sidebar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Trophy,
  ArrowLeft,
  Check,
  AlertCircle,
  Loader2,
  ExternalLink,
  Copy,
  Share2,
  Gamepad2,
  Shield,
  RefreshCw,
  FileText,
  Apple,
} from 'lucide-react'
import { cn, formatDate, formatPrice } from '@/lib/utils'
import { GAME_LABELS } from '@/lib/admin/types'
import { EXPERIENCE_LABELS, DECK_OWNERSHIP_LABELS, generateCalendarLinks, generateSurveyLink } from '@/lib/validations/event'
import type { Event, TicketTier } from '@/lib/admin/types'

const gameColors: Record<string, string> = {
  MTG: 'bg-red-500/10 text-red-500 border-red-500/20',
  YGO: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  POKEMON: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
  ONE_PIECE: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  NARUTO: 'bg-green-500/10 text-green-500 border-green-500/20',
  DIGIMON: 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20',
}

export default function EventDetailPage() {
  const params = useParams()
  const slug = params.slug as string

  const [event, setEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isRegistering, setIsRegistering] = useState(false)
  const [registrationSuccess, setRegistrationSuccess] = useState(false)
  const [registrationError, setRegistrationError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    paymentMethod: 'pay_at_store',
  })

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        // Try admin API first to get full event data
        const res = await fetch(`/api/admin/events?slug=${encodeURIComponent(slug)}&limit=1`)
        if (res.ok) {
          const data = await res.json()
          if (data.data && data.data.length > 0) {
            // Check if event is public
            const eventData = data.data[0]
            if (eventData.visibility === 'PRIVATE') {
              setError('This event is private')
              return
            }
            setEvent(eventData)
            return
          }
        }
        setError('Event not found')
      } catch (err) {
        setError('Failed to load event')
      } finally {
        setLoading(false)
      }
    }

    fetchEvent()
  }, [slug])

  // Store event id for registration API
  const eventId = event?.id

  if (loading) {
    return (
      <>
        <Header />
        <CartSidebar />
        <main className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </main>
        <Footer />
      </>
    )
  }

  if (error || !event) {
    return (
      <>
        <Header />
        <CartSidebar />
        <main className="min-h-screen py-16">
          <div className="container mx-auto px-4 text-center">
            <AlertCircle className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h1 className="text-2xl font-bold mb-2">Event Not Found</h1>
            <p className="text-muted-foreground mb-6">
              {error || "The event you're looking for doesn't exist or has been removed."}
            </p>
            <Button asChild>
              <Link href="/events">Browse All Events</Link>
            </Button>
          </div>
        </main>
        <Footer />
      </>
    )
  }

  const isFull = (event.registration_count || 0) >= (event.max_capacity || 0)
  const isPast = new Date(event.event_date) < new Date()
  const spotsLeft = (event.max_capacity || 0) - (event.registration_count || 0)
  const capacityPercent = ((event.registration_count || 0) / (event.max_capacity || 1)) * 100
  const calendarLinks = generateCalendarLinks(event)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsRegistering(true)
    setRegistrationError(null)

    try {
      const response = await fetch(`/api/events/${eventId}/registrations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guest_name: formData.name,
          guest_email: formData.email,
          guest_phone: formData.phone || undefined,
          payment_status: formData.paymentMethod === 'pay_at_store' ? 'PENDING' : 'PAID',
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed')
      }

      setRegistrationSuccess(true)
    } catch (error) {
      setRegistrationError(error instanceof Error ? error.message : 'Registration failed')
    } finally {
      setIsRegistering(false)
    }
  }

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <>
      <Header />
      <CartSidebar />

      <main className="min-h-screen">
        {/* Back link */}
        <div className="container mx-auto px-4 py-6">
          <Link
            href="/events"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Events
          </Link>
        </div>

        <div className="container mx-auto px-4 pb-16">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Event header */}
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <Badge
                    variant="outline"
                    className={cn(gameColors[event.game] || 'bg-primary/10 text-primary')}
                  >
                    {GAME_LABELS[event.game] || event.game}
                  </Badge>
                  {event.status === 'UPCOMING' && (
                    <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20">
                      Upcoming
                    </Badge>
                  )}
                  {event.status === 'ONGOING' && (
                    <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
                      🔴 Live Now
                    </Badge>
                  )}
                  {event.status === 'CANCELLED' && (
                    <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20">
                      Cancelled
                    </Badge>
                  )}
                  {isPast && (
                    <Badge variant="outline" className="bg-gray-500/10 text-gray-400 border-gray-500/20">
                      Past Event
                    </Badge>
                  )}
                </div>
                <h1 className="text-3xl md:text-4xl font-bold mb-4">{event.name}</h1>

                {/* Key info pills */}
                <div className="flex flex-wrap gap-3 mb-6">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-full">
                    <Calendar className="w-4 h-4" />
                    {formatDate(event.event_date)}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-full">
                    <MapPin className="w-4 h-4" />
                    {event.location}
                  </div>
                  {event.format && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-full">
                      <Trophy className="w-4 h-4" />
                      {event.format}
                    </div>
                  )}
                  {event.experience_level && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-full">
                      <Gamepad2 className="w-4 h-4" />
                      {EXPERIENCE_LABELS[event.experience_level]}
                    </div>
                  )}
                </div>
              </div>

              {/* Description */}
              {event.description && (
                <Card>
                  <CardHeader>
                    <CardTitle>About This Event</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                      {event.description}
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* TCG Details */}
              {(event.format || event.experience_level || event.deck_ownership || event.subformat) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Gamepad2 className="w-5 h-5" />
                      Event Format
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-3">
                      {event.format && (
                        <Badge variant="secondary" className="text-sm">
                          {event.format}
                        </Badge>
                      )}
                      {event.subformat && (
                        <Badge variant="secondary" className="text-sm">
                          {event.subformat}
                        </Badge>
                      )}
                      {event.experience_level && (
                        <Badge variant="secondary" className="text-sm">
                          {EXPERIENCE_LABELS[event.experience_level]}
                        </Badge>
                      )}
                      {event.deck_ownership && (
                        <Badge variant="secondary" className="text-sm">
                          {DECK_OWNERSHIP_LABELS[event.deck_ownership]}
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Prize info */}
              {event.prize_pool && (
                <Card className="border-primary/20 bg-primary/5">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Trophy className="w-5 h-5 text-primary" />
                      Prizes & Rewards
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-foreground">{event.prize_pool}</p>
                    {event.prize_description && (
                      <p className="text-sm text-muted-foreground mt-2">{event.prize_description}</p>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Ticket Tiers */}
              {event.ticket_tiers && event.ticket_tiers.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Trophy className="w-5 h-5" />
                      Ticket Options
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {event.ticket_tiers.map((tier: TicketTier) => (
                        <div
                          key={tier.id}
                          className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                        >
                          <div>
                            <p className="font-medium">{tier.name}</p>
                            {tier.description && (
                              <p className="text-sm text-muted-foreground">{tier.description}</p>
                            )}
                          </div>
                          <p className="font-bold">
                            {tier.price === 0 ? 'Free' : formatPrice(tier.price)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Virtual link */}
              {event.virtual_link && (
                <Card>
                  <CardHeader>
                    <CardTitle>Virtual Participation</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <a
                      href={event.virtual_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-primary hover:underline"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Join Virtual Event
                    </a>
                  </CardContent>
                </Card>
              )}

              {/* Trust & Policies */}
              {(event.refund_enabled || event.code_of_conduct_enabled || event.cancellation_consent_required) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="w-5 h-5" />
                      Event Policies
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {event.refund_enabled && event.refund_policy && (
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <RefreshCw className="w-4 h-4 text-muted-foreground" />
                          <h4 className="font-medium">Refund Policy</h4>
                        </div>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap pl-6">
                          {event.refund_policy}
                        </p>
                      </div>
                    )}
                    {event.code_of_conduct_enabled && event.code_of_conduct && (
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <FileText className="w-4 h-4 text-muted-foreground" />
                          <h4 className="font-medium">Code of Conduct</h4>
                        </div>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap pl-6">
                          {event.code_of_conduct}
                        </p>
                      </div>
                    )}
                    {event.cancellation_consent_required && event.cancellation_policy && (
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <AlertCircle className="w-4 h-4 text-muted-foreground" />
                          <h4 className="font-medium">Cancellation Policy</h4>
                        </div>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap pl-6">
                          {event.cancellation_policy}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Post-event survey (only show if event is past) */}
              {isPast && event.status === 'COMPLETED' && (
                <Card className="border-primary/20 bg-primary/5">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Trophy className="w-5 h-5 text-primary" />
                      Event Feedback
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-3">
                      Thanks for attending! Share your feedback to help us improve future events.
                    </p>
                    <Button variant="outline" asChild className="w-full">
                      <Link href={generateSurveyLink(event.slug, event.id)}>
                        Take Event Survey
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Registration card */}
              <Card className="sticky top-24">
                <CardHeader>
                  <CardTitle>Event Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Entry fee */}
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-muted-foreground">Entry Fee</span>
                    <span className="font-bold text-lg">
                      {event.entry_fee === 0 ? 'Free' : formatPrice(event.entry_fee || 0)}
                    </span>
                  </div>

                  {/* Capacity */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Capacity</span>
                      <span className="font-medium">
                        {event.registration_count || 0}/{event.max_capacity}
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={cn(
                          'h-full transition-all',
                          isFull ? 'bg-orange-500' : 'bg-primary'
                        )}
                        style={{ width: `${Math.min(capacityPercent, 100)}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground text-right">
                      {isFull
                        ? event.waitlist_enabled
                          ? 'Waitlist available'
                          : 'Event is full'
                        : `${spotsLeft} spots remaining`}
                    </p>
                  </div>

                  {/* Date & Time */}
                  <div className="flex justify-between items-center py-2 border-t border-b">
                    <span className="text-muted-foreground">Date</span>
                    <span className="text-sm font-medium">
                      {new Date(event.event_date).toLocaleDateString('en-JM', {
                        weekday: 'long',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-muted-foreground">Time</span>
                    <span className="text-sm font-medium">
                      {new Date(event.event_date).toLocaleTimeString('en-JM', {
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                      {event.end_date && (
                        <span className="text-muted-foreground">
                          {' '} - {new Date(event.end_date).toLocaleTimeString('en-JM', {
                            hour: 'numeric',
                            minute: '2-digit',
                          })}
                        </span>
                      )}
                    </span>
                  </div>

                  {/* Registration form */}
                  {!isPast && event.status !== 'CANCELLED' && event.status !== 'COMPLETED' && !registrationSuccess && (
                    <div className="pt-4 border-t space-y-4">
                      {isFull && !event.waitlist_enabled ? (
                        <div className="text-center py-4">
                          <AlertCircle className="w-8 h-8 mx-auto mb-2 text-orange-500" />
                          <p className="font-medium">This event is full</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            Check back for cancellations.
                          </p>
                        </div>
                      ) : (
                        <form onSubmit={handleSubmit} className="space-y-3">
                          <div>
                            <label htmlFor="name" className="text-sm font-medium block mb-1.5">Your Name</label>
                            <Input
                              id="name"
                              value={formData.name}
                              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                              placeholder="Enter your name"
                              required
                            />
                          </div>
                          <div>
                            <label htmlFor="email" className="text-sm font-medium block mb-1.5">Email</label>
                            <Input
                              id="email"
                              type="email"
                              value={formData.email}
                              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                              placeholder="you@example.com"
                              required
                            />
                          </div>
                          <div>
                            <label htmlFor="phone" className="text-sm font-medium block mb-1.5">Phone (optional)</label>
                            <Input
                              id="phone"
                              type="tel"
                              value={formData.phone}
                              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                              placeholder="876-555-5555"
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium block mb-1.5">Payment Method</label>
                            <div className="space-y-2 mt-1.5">
                              <label className="flex items-center gap-2 p-2 rounded-md border cursor-pointer hover:bg-muted/50 transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                                <input
                                  type="radio"
                                  name="payment"
                                  value="pay_at_store"
                                  checked={formData.paymentMethod === 'pay_at_store'}
                                  onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                                />
                                <div>
                                  <p className="text-sm font-medium">Pay at Store</p>
                                  <p className="text-xs text-muted-foreground">Cash or card on arrival</p>
                                </div>
                              </label>
                              <label className="flex items-center gap-2 p-2 rounded-md border cursor-pointer hover:bg-muted/50 transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                                <input
                                  type="radio"
                                  name="payment"
                                  value="mobile_payment"
                                  checked={formData.paymentMethod === 'mobile_payment'}
                                  onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                                />
                                <div>
                                  <p className="text-sm font-medium">Mobile Payment</p>
                                  <p className="text-xs text-muted-foreground">Pay now via JamPay</p>
                                </div>
                              </label>
                            </div>
                          </div>

                          {registrationError && (
                            <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm flex items-start gap-2">
                              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                              <span>{registrationError}</span>
                            </div>
                          )}

                          <Button type="submit" className="w-full" disabled={isRegistering}>
                            {isRegistering ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Registering...
                              </>
                            ) : (
                              isFull ? 'Join Waitlist' : 'Register Now'
                            )}
                          </Button>
                        </form>
                      )}
                    </div>
                  )}

                  {/* Success state */}
                  {registrationSuccess && (
                    <div className="pt-4 border-t text-center">
                      <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-3">
                        <Check className="w-6 h-6 text-green-500" />
                      </div>
                      <h3 className="font-semibold mb-1">You're Registered!</h3>
                      <p className="text-sm text-muted-foreground">
                        Check your email for confirmation. See you at the event!
                      </p>
                    </div>
                  )}

                  {/* Past event */}
                  {isPast && (
                    <div className="pt-4 border-t text-center">
                      <p className="text-muted-foreground">
                        This event has already taken place.
                      </p>
                      <Button variant="outline" className="w-full mt-3" asChild>
                        <Link href="/events">Browse Upcoming Events</Link>
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Share & Actions */}
              <Card>
                <CardContent className="p-4 space-y-3">
                  <p className="text-sm text-muted-foreground">Share this event</p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1" onClick={copyLink}>
                      {copied ? (
                        <>
                          <Check className="w-4 h-4 mr-1" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4 mr-1" />
                          Copy Link
                        </>
                      )}
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1" asChild>
                      <a href={calendarLinks.google} target="_blank" rel="noopener noreferrer">
                        <Calendar className="w-4 h-4 mr-1" />
                        Calendar
                      </a>
                    </Button>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => {
                        const start = new Date(event.event_date)
                        const end = event.end_date ? new Date(event.end_date) : new Date(start.getTime() + 3 * 60 * 60 * 1000)
                        const formatDate = (d: Date) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
                        const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
DTSTART:${formatDate(start).replace('Z', '')}
DTEND:${formatDate(end).replace('Z', '')}
SUMMARY:${event.name}
DESCRIPTION:${event.description || ''}
LOCATION:${event.location || ''}
END:VEVENT
END:VCALENDAR`
                        const blob = new Blob([icsContent], { type: 'text/calendar' })
                        const url = URL.createObjectURL(blob)
                        const a = document.createElement('a')
                        a.href = url
                        a.download = `${event.slug}.ics`
                        a.click()
                        URL.revokeObjectURL(url)
                      }}
                    >
                      <Apple className="w-4 h-4 mr-1" />
                      Apple
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => {
                        const start = new Date(event.event_date)
                        const end = event.end_date ? new Date(event.end_date) : new Date(start.getTime() + 3 * 60 * 60 * 1000)
                        const url = `https://outlook.live.com/calendar/0/deeplink/compose?subject=${encodeURIComponent(event.name)}&startdt=${start.toISOString()}&enddt=${end.toISOString()}&location=${encodeURIComponent(event.location || '')}&body=${encodeURIComponent(event.description || '')}`
                        window.open(url, '_blank')
                      }}
                    >
                      <Calendar className="w-4 h-4 mr-1" />
                      Outlook
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </>
  )
}
