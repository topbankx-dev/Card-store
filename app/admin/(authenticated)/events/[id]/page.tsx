'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { toast } from '@/components/ui/sonner'
import {
  ArrowLeft,
  Edit,
  Trash2,
  Copy,
  MoreHorizontal,
  Eye,
  Users,
  Calendar,
  MapPin,
  DollarSign,
  Ticket,
  Trophy,
  Gamepad2,
  Clock,
  ExternalLink,
  AlertTriangle,
  Loader2,
  CheckCircle,
  XCircle,
  BarChart3,
  Mail,
  RefreshCw,
  Share2,
  CalendarPlus,
} from 'lucide-react'
import { formatDate, formatPrice, cn } from '@/lib/utils'
import { GAME_LABELS, EVENT_STATUS_LABELS, type Event, type TicketTier } from '@/lib/admin/types'
import { EXPERIENCE_LABELS, DECK_OWNERSHIP_LABELS } from '@/lib/validations/event'
import { AttendeeManagement } from '@/components/admin/events/attendee-management'
import { EventAnalyticsDashboard } from '@/components/admin/events/event-analytics'
import { InlineCalendarLinks } from '@/components/admin/events/calendar-links'

const gameColors: Record<string, string> = {
  MTG: 'bg-red-500/10 text-red-500 border-red-500/20',
  YGO: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  POKEMON: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
  ONE_PIECE: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  NARUTO: 'bg-green-500/10 text-green-500 border-green-500/20',
  DIGIMON: 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20',
}

const statusColors: Record<string, string> = {
  DRAFT: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
  UPCOMING: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  ONGOING: 'bg-green-500/10 text-green-500 border-green-500/20',
  COMPLETED: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
  CANCELLED: 'bg-red-500/10 text-red-500 border-red-500/20',
}

export default function EventDetailPage() {
  const params = useParams()
  const router = useRouter()
  const eventId = params.id as string

  const [event, setEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isDuplicating, setIsDuplicating] = useState(false)
  const [sendingReminder, setSendingReminder] = useState<string | null>(null)

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

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
      return
    }

    setIsDeleting(true)
    try {
      const res = await fetch(`/api/admin/events/${eventId}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        throw new Error('Failed to delete event')
      }

      toast.success('Event deleted')

      router.push('/admin/events')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete event')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleDuplicate = async (shiftDays = 7) => {
    setIsDuplicating(true)
    try {
      const res = await fetch(`/api/admin/events/${eventId}/duplicate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shiftDays }),
      })

      if (!res.ok) {
        throw new Error('Failed to duplicate event')
      }

      const data = await res.json()

      toast.success('Event duplicated - redirecting...')

      router.push(`/admin/events/${data.data.id}/edit`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to duplicate event')
    } finally {
      setIsDuplicating(false)
    }
  }

  const handleStatusChange = async (newStatus: string) => {
    try {
      const res = await fetch(`/api/admin/events/${eventId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!res.ok) {
        throw new Error('Failed to update status')
      }

      const data = await res.json()
      setEvent(data.data)

      toast.success(`Event is now ${EVENT_STATUS_LABELS[newStatus as keyof typeof EVENT_STATUS_LABELS]}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update status')
    }
  }

  const handleSendReminder = async (type: string) => {
    setSendingReminder(type)
    try {
      const res = await fetch(`/api/admin/events/${eventId}/send-reminder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to send reminder')
      }

      const data = await res.json()
      toast.success(data.message)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to send reminder')
    } finally {
      setSendingReminder(null)
    }
  }

  const handlePromoteWaitlist = async () => {
    try {
      const res = await fetch(`/api/admin/events/${eventId}/promote-waitlist`, {
        method: 'POST',
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to promote')
      }

      const data = await res.json()
      toast.success(data.message)
      // Refresh event data
      const eventRes = await fetch(`/api/admin/events/${eventId}`)
      const eventData = await eventRes.json()
      setEvent(eventData.data)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to promote')
    }
  }

  const copyShareLink = () => {
    const url = `${window.location.origin}/events/${event?.slug}`
    navigator.clipboard.writeText(url)
    toast.success('Share link copied to clipboard')
  }

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

  const spotsLeft = (event.max_capacity || 0) - (event.registration_count || 0)
  const capacityPercent = ((event.registration_count || 0) / (event.max_capacity || 1)) * 100
  const isFull = (event.registration_count || 0) >= (event.max_capacity || 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/events">
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge
                variant="outline"
                className={cn(gameColors[event.game] || 'bg-primary/10 text-primary')}
              >
                {GAME_LABELS[event.game]}
              </Badge>
              <Badge
                variant="outline"
                className={cn(statusColors[event.status], 'gap-1')}
              >
                {event.status === 'ONGOING' && <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />}
                {EVENT_STATUS_LABELS[event.status]}
              </Badge>
            </div>
            <h1 className="text-3xl font-bold">{event.name}</h1>
            <p className="text-muted-foreground">
              /events/{event.slug}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {event.status !== 'DRAFT' && (
            <>
              <InlineCalendarLinks event={{
                name: event.name,
                event_date: event.event_date,
                end_date: event.end_date,
                location: event.location,
                description: event.description,
              }} />
              <Button variant="outline" onClick={copyShareLink}>
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
            </>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/admin/events/${eventId}/edit`}>
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Event
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleDuplicate(7)} disabled={isDuplicating}>
                <Copy className="w-4 h-4 mr-2" />
                Duplicate (1 week later)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleDuplicate(14)} disabled={isDuplicating}>
                <Copy className="w-4 h-4 mr-2" />
                Duplicate (2 weeks later)
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {event.status === 'UPCOMING' && (
                <>
                  <DropdownMenuItem onClick={() => handleSendReminder('1_week')} disabled={sendingReminder === '1_week'}>
                    <Mail className="w-4 h-4 mr-2" />
                    Send 1-Week Reminder
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleSendReminder('1_day')} disabled={sendingReminder === '1_day'}>
                    <Mail className="w-4 h-4 mr-2" />
                    Send 1-Day Reminder
                  </DropdownMenuItem>
                  {event.waitlist_enabled && (
                    <DropdownMenuItem onClick={handlePromoteWaitlist}>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Promote from Waitlist
                    </DropdownMenuItem>
                  )}
                </>
              )}
              <DropdownMenuSeparator />
              {event.status === 'DRAFT' && (
                <DropdownMenuItem onClick={() => handleStatusChange('UPCOMING')}>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Publish Event
                </DropdownMenuItem>
              )}
              {event.status === 'UPCOMING' && (
                <>
                  <DropdownMenuItem onClick={() => handleStatusChange('ONGOING')}>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Mark as Ongoing
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleStatusChange('CANCELLED')}>
                    <XCircle className="w-4 h-4 mr-2" />
                    Cancel Event
                  </DropdownMenuItem>
                </>
              )}
              {event.status === 'ONGOING' && (
                <DropdownMenuItem onClick={() => handleStatusChange('COMPLETED')}>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Mark as Completed
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleDelete}
                disabled={isDeleting}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Event
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="attendees">
            <Users className="w-4 h-4 mr-2" />
            Attendees
          </TabsTrigger>
          <TabsTrigger value="analytics">
            <BarChart3 className="w-4 h-4 mr-2" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Main content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Description */}
              {event.description && (
                <Card>
                  <CardHeader>
                    <CardTitle>About</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground whitespace-pre-wrap">
                      {event.description}
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Quick stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4 text-center">
                    <Users className="w-5 h-5 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-2xl font-bold">
                      {event.registration_count || 0}/{event.max_capacity}
                    </p>
                    <p className="text-xs text-muted-foreground">Registered</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <DollarSign className="w-5 h-5 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-2xl font-bold">
                      {event.entry_fee === 0 ? 'Free' : formatPrice(event.entry_fee || 0)}
                    </p>
                    <p className="text-xs text-muted-foreground">Entry Fee</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <Calendar className="w-5 h-5 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-lg font-bold">
                      {new Date(event.event_date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(event.event_date).toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <Trophy className="w-5 h-5 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm font-bold line-clamp-1">
                      {event.prize_pool || 'No prizes'}
                    </p>
                    <p className="text-xs text-muted-foreground">Prize Pool</p>
                  </CardContent>
                </Card>
              </div>

              {/* TCG Details */}
              {(event.format || event.experience_level || event.deck_ownership) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Gamepad2 className="w-5 h-5" />
                      TCG Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {event.format && (
                        <div>
                          <p className="text-sm text-muted-foreground">Format</p>
                          <p className="font-medium">{event.format}</p>
                        </div>
                      )}
                      {event.subformat && (
                        <div>
                          <p className="text-sm text-muted-foreground">Subformat</p>
                          <p className="font-medium">{event.subformat}</p>
                        </div>
                      )}
                      {event.experience_level && (
                        <div>
                          <p className="text-sm text-muted-foreground">Experience</p>
                          <p className="font-medium">
                            {EXPERIENCE_LABELS[event.experience_level]}
                          </p>
                        </div>
                      )}
                      {event.deck_ownership && (
                        <div>
                          <p className="text-sm text-muted-foreground">Decks</p>
                          <p className="font-medium">
                            {DECK_OWNERSHIP_LABELS[event.deck_ownership]}
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Ticket Tiers */}
              {event.ticket_tiers && event.ticket_tiers.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Ticket className="w-5 h-5" />
                      Ticket Tiers
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {event.ticket_tiers.map((tier: TicketTier, i: number) => (
                        <div key={tier.id || i} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                          <div>
                            <p className="font-medium">{tier.name}</p>
                            {tier.description && (
                              <p className="text-sm text-muted-foreground">{tier.description}</p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="font-bold">
                              {tier.price === 0 ? 'Free' : formatPrice(tier.price)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {tier.sold_count || 0} / {tier.quantity} sold
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Prize details */}
              {event.prize_description && (
                <Card className="border-primary/20 bg-primary/5">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Trophy className="w-5 h-5" />
                      Prize Structure
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-foreground">{event.prize_description}</p>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Capacity */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Capacity
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    <Progress value={capacityPercent} className={cn(isFull && '[&>div]:bg-orange-500')} />
                    <div className="flex justify-between text-sm">
                      <span>{event.registration_count || 0} registered</span>
                      <span className={cn(isFull && 'text-orange-500 font-medium')}>
                        {isFull ? 'Full' : `${spotsLeft} spots left`}
                      </span>
                    </div>
                  </div>
                  {event.waitlist_enabled && (
                    <div className="pt-2 border-t">
                      <p className="text-sm text-muted-foreground">
                        Waitlist: {event.waitlist_max || 'Unlimited'}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Date & Time */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Date & Time
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div>
                    <p className="text-muted-foreground">Start</p>
                    <p className="font-medium">{formatDate(event.event_date)}</p>
                  </div>
                  {event.end_date && (
                    <div>
                      <p className="text-muted-foreground">End</p>
                      <p className="font-medium">{formatDate(event.end_date)}</p>
                    </div>
                  )}
                  {event.registration_deadline && (
                    <div>
                      <p className="text-muted-foreground">Registration Deadline</p>
                      <p className="font-medium">{formatDate(event.registration_deadline)}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Location */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Location
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm">
                  <p className="font-medium">{event.location}</p>
                  {event.virtual_link && (
                    <a
                      href={event.virtual_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline flex items-center gap-1 mt-1"
                    >
                      Virtual Link
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </CardContent>
              </Card>

              {/* Visibility */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Visibility</CardTitle>
                </CardHeader>
                <CardContent className="text-sm">
                  <Badge variant="outline" className="capitalize">
                    {event.visibility?.toLowerCase() || 'Public'}
                  </Badge>
                </CardContent>
              </Card>

              {/* Recurring */}
              {event.is_recurring && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Recurring</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm">
                    <p className="font-medium capitalize">
                      {event.recurring_pattern?.toLowerCase().replace('_', ' ')}
                    </p>
                    {event.recurring_count && (
                      <p className="text-muted-foreground">
                        {event.recurring_count} occurrences
                      </p>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Actions */}
              <Card>
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <Button className="w-full" asChild>
                      <Link href={`/admin/events/${eventId}/edit`}>
                        <Edit className="w-4 h-4 mr-2" />
                        Edit Event
                      </Link>
                    </Button>
                    <Button variant="outline" className="w-full" onClick={() => handleDuplicate(7)} disabled={isDuplicating}>
                      <Copy className="w-4 h-4 mr-2" />
                      Duplicate Event
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="attendees">
          <AttendeeManagement
            eventId={eventId}
            eventName={event.name}
            maxCapacity={event.max_capacity || 0}
          />
        </TabsContent>

        <TabsContent value="analytics">
          <EventAnalyticsDashboard eventId={eventId} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
