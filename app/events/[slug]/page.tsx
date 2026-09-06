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
import { Calendar, Clock, MapPin, Users, Trophy, ArrowLeft, Check, AlertCircle, Loader2 } from 'lucide-react'
import { cn, formatDate } from '@/lib/utils'

// Sample event data - in production, fetch from /api/events/[slug]
const sampleEvents: Record<string, {
  id: string
  name: string
  slug: string
  game: string
  description: string
  event_date: string
  end_date?: string
  entry_fee: number
  max_capacity: number
  current_registered: number
  location: string
  status: string
  format?: string
  prize?: string
}> = {
  'friday-night-magic': {
    id: '1',
    name: 'Friday Night Magic',
    slug: 'friday-night-magic',
    game: 'MTG',
    description: 'Join us every Friday for our popular Magic: The Gathering night! We run two pods of Commander (casual) alongside a competitive Standard showdown. Entry includes a promo pack, with store credit and set boosters for the top performers in Standard. Whether you\'re a veteran or just learning, there\'s a seat for you.',
    event_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    entry_fee: 1500,
    max_capacity: 24,
    current_registered: 12,
    location: 'In-Store',
    status: 'UPCOMING',
    format: 'Commander (Casual) + Standard (Competitive)',
    prize: 'Promo packs for all, store credit for top Standard',
  },
  'ygo-ots-tournament': {
    id: '2',
    name: 'Yu-Gi-Oh! OTS Tournament',
    slug: 'ygo-ots-tournament',
    game: 'YGO',
    description: 'Our monthly OTS Championship is here! This Konami-sanctioned event awards OTS promo cards to top finishers and carries Championship Points for the YCS season. Swiss rounds based on attendance, followed by Top 8 single elimination. Prepare your deck and come ready to compete!',
    event_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    entry_fee: 2000,
    max_capacity: 32,
    current_registered: 28,
    location: 'In-Store',
    status: 'UPCOMING',
    format: 'Advanced (Tournament Legal)',
    prize: 'OTS Promos + YCS Points',
  },
  'pokemon-vgc-cup': {
    id: '3',
    name: 'Pokémon VGC Cup',
    slug: 'pokemon-vgc-cup',
    game: 'POKEMON',
    description: 'Championship Points on the line! This VGC event follows the official Pokemon tournament rules and uses the current Season\'s Legal formats. Singles bracket, best-of-three matches. Bring your best team and climb the ranks to earn valuable CP toward the World Championships.',
    event_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    entry_fee: 2500,
    max_capacity: 20,
    current_registered: 8,
    location: 'In-Store',
    status: 'UPCOMING',
    format: 'VGC 2024 (Sun & Moon)',
    prize: 'Championship Points + Exclusive Playmats',
  },
  'naruto-beginner-night': {
    id: '5',
    name: 'Naruto CCG Beginner Night',
    slug: 'naruto-beginner-night',
    game: 'NARUTO',
    description: 'Curious about Naruto Shippuden: The Last Crusade? This beginner-friendly event is the perfect introduction. We provide loaner decks so you can jump right in — no collection required. Learn the rules, play some games, and meet fellow ninja in training!',
    event_date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
    entry_fee: 500,
    max_capacity: 16,
    current_registered: 6,
    location: 'In-Store',
    status: 'UPCOMING',
    format: 'Beginner Friendly / Loaner Decks',
    prize: 'Starter packs for all participants',
  },
}

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

export default function EventDetailPage() {
  const params = useParams()
  const slug = params.slug as string

  const event = sampleEvents[slug]

  const [isRegistering, setIsRegistering] = useState(false)
  const [registrationSuccess, setRegistrationSuccess] = useState(false)
  const [registrationError, setRegistrationError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    paymentMethod: 'pay_at_store',
  })

  if (!event) {
    return (
      <>
        <Header />
        <CartSidebar />
        <main className="min-h-screen py-16">
          <div className="container mx-auto px-4 text-center">
            <AlertCircle className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h1 className="text-2xl font-bold mb-2">Event Not Found</h1>
            <p className="text-muted-foreground mb-6">
              The event you're looking for doesn't exist or has been removed.
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

  const isFull = event.current_registered >= event.max_capacity
  const isPast = new Date(event.event_date) < new Date()
  const spotsLeft = event.max_capacity - event.current_registered
  const capacityPercent = (event.current_registered / event.max_capacity) * 100

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsRegistering(true)
    setRegistrationError(null)

    try {
      const response = await fetch(`/api/events/${event.id}/registrations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guest_name: formData.name,
          guest_email: formData.email,
          payment_status: formData.paymentMethod === 'pay_at_store' ? 'PENDING' : 'PAID',
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Registration failed')
      }

      setRegistrationSuccess(true)
    } catch (error) {
      setRegistrationError(error instanceof Error ? error.message : 'Registration failed')
    } finally {
      setIsRegistering(false)
    }
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
                    {gameLabels[event.game] || event.game}
                  </Badge>
                  {event.status === 'UPCOMING' && (
                    <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20">
                      Upcoming
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
                </div>
              </div>

              {/* Description */}
              <Card>
                <CardHeader>
                  <CardTitle>About This Event</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed">{event.description}</p>
                </CardContent>
              </Card>

              {/* Prize info */}
              {event.prize && (
                <Card className="border-primary/20 bg-primary/5">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Trophy className="w-5 h-5 text-primary" />
                      Prizes & Rewards
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-foreground">{event.prize}</p>
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
                      {event.entry_fee === 0 ? 'Free' : `$${event.entry_fee.toLocaleString()} JMD`}
                    </span>
                  </div>

                  {/* Capacity */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Capacity</span>
                      <span className="font-medium">
                        {event.current_registered}/{event.max_capacity}
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
                      {isFull ? 'Event is full' : `${spotsLeft} spots remaining`}
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
                    </span>
                  </div>

                  {/* Registration form */}
                  {!isPast && event.status !== 'CANCELLED' && !registrationSuccess && (
                    <div className="pt-4 border-t space-y-4">
                      {isFull ? (
                        <div className="text-center py-4">
                          <AlertCircle className="w-8 h-8 mx-auto mb-2 text-orange-500" />
                          <p className="font-medium">This event is full</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            Join our waitlist or check back for cancellations.
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
                              'Register Now'
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

              {/* Share */}
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground mb-3">Share this event</p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      Copy Link
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1">
                      Add to Calendar
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
