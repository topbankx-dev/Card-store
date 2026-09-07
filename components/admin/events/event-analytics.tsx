'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { toast } from '@/components/ui/sonner'
import {
  Users,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle,
  AlertCircle,
  Calendar,
  Loader2,
  Percent,
} from 'lucide-react'
import { formatPrice, cn } from '@/lib/utils'

interface EventAnalytics {
  event: {
    id: string
    name: string
    status: string
    event_date: string
    days_until_event: number
  }
  registrations: {
    total: number
    confirmed: number
    checked_in: number
    cancelled: number
    no_show: number
    waitlist: number
  }
  capacity: {
    max: number
    filled: number
    available: number
    fill_rate: number
  }
  check_in: {
    rate: number
    total: number
    expected: number
  }
  revenue: {
    total: number
    potential: number
    ticket_tiers: number
  }
  velocity: {
    registrations_per_day: number
    recent_signups_3d: number
    is_trending: boolean
    days_to_create: number
  }
  waitlist_pressure: number
  cancellation_rate: number
  daily_signups: { date: string; count: number }[]
}

interface EventAnalyticsDashboardProps {
  eventId: string
}

export function EventAnalyticsDashboard({ eventId }: EventAnalyticsDashboardProps) {
  const [analytics, setAnalytics] = useState<EventAnalytics | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchAnalytics = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/events/${eventId}/analytics`)
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      setAnalytics(data.data)
    } catch {
      toast.error('Failed to load analytics')
    } finally {
      setLoading(false)
    }
  }, [eventId])

  useEffect(() => {
    fetchAnalytics()
  }, [fetchAnalytics])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!analytics) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Unable to load analytics
      </div>
    )
  }

  const { event, registrations, capacity, check_in, revenue, velocity, waitlist_pressure, cancellation_rate } = analytics

  return (
    <div className="space-y-6">
      {/* Event overview */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{event.name}</h2>
          <p className="text-muted-foreground">
            {new Date(event.event_date).toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
              hour: 'numeric',
              minute: '2-digit',
            })}
          </p>
        </div>
        <Badge variant="outline" className="text-lg">
          {event.days_until_event > 0
            ? `${event.days_until_event} days until event`
            : event.days_until_event === 0
            ? 'Event is today!'
            : 'Event has passed'}
        </Badge>
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Fill Rate */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Fill Rate</span>
              <Percent className="w-4 h-4 text-muted-foreground" />
            </div>
            <p className="text-3xl font-bold">{capacity.fill_rate}%</p>
            <div className="mt-2">
              <Progress value={capacity.fill_rate} className="h-2" />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {capacity.filled}/{capacity.max} spots filled
            </p>
          </CardContent>
        </Card>

        {/* Revenue */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Revenue</span>
              <DollarSign className="w-4 h-4 text-muted-foreground" />
            </div>
            <p className="text-3xl font-bold">{formatPrice(revenue.total)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              of {formatPrice(revenue.potential)} potential
            </p>
          </CardContent>
        </Card>

        {/* Check-in Rate */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Check-in Rate</span>
              <CheckCircle className="w-4 h-4 text-muted-foreground" />
            </div>
            <p className="text-3xl font-bold">{check_in.rate}%</p>
            <p className="text-xs text-muted-foreground mt-1">
              {check_in.total}/{check_in.expected} checked in
            </p>
          </CardContent>
        </Card>

        {/* Signup Velocity */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Daily Signups</span>
              {velocity.is_trending ? (
                <TrendingUp className="w-4 h-4 text-green-500" />
              ) : (
                <TrendingDown className="w-4 h-4 text-muted-foreground" />
              )}
            </div>
            <p className="text-3xl font-bold">{velocity.registrations_per_day}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {velocity.recent_signups_3d} in last 3 days
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed breakdown */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Registration Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Registration Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Total Registrations</span>
                <span className="font-bold">{registrations.total}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-green-600">Confirmed</span>
                <span className="font-bold text-green-600">{registrations.confirmed}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-blue-600">Checked In</span>
                <span className="font-bold text-blue-600">{registrations.checked_in}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-red-600">Cancelled</span>
                <span className="font-bold text-red-600">{registrations.cancelled}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-yellow-600">No Show</span>
                <span className="font-bold text-yellow-600">{registrations.no_show}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-orange-600">Waitlist</span>
                <span className="font-bold text-orange-600">{registrations.waitlist}</span>
              </div>
            </div>

            {/* Visual breakdown */}
            <div className="h-3 rounded-full overflow-hidden flex bg-muted">
              {registrations.confirmed > 0 && (
                <div
                  className="bg-green-500"
                  style={{ width: `${(registrations.confirmed / registrations.total) * 100}%` }}
                />
              )}
              {registrations.checked_in > 0 && (
                <div
                  className="bg-blue-500"
                  style={{ width: `${(registrations.checked_in / registrations.total) * 100}%` }}
                />
              )}
              {registrations.cancelled > 0 && (
                <div
                  className="bg-red-500"
                  style={{ width: `${(registrations.cancelled / registrations.total) * 100}%` }}
                />
              )}
              {registrations.no_show > 0 && (
                <div
                  className="bg-yellow-500"
                  style={{ width: `${(registrations.no_show / registrations.total) * 100}%` }}
                />
              )}
            </div>
          </CardContent>
        </Card>

        {/* Waitlist Pressure */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Waitlist & Pressure
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center py-4">
              <div className="relative inline-flex items-center justify-center">
                <svg className="w-32 h-32">
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="8"
                    className="text-muted"
                  />
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="8"
                    strokeDasharray={`${waitlist_pressure * 3.52} 352`}
                    strokeLinecap="round"
                    className={cn(
                      waitlist_pressure > 50 ? 'text-red-500' :
                      waitlist_pressure > 25 ? 'text-yellow-500' :
                      'text-green-500'
                    )}
                    transform="rotate(-90 64 64)"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-bold">{waitlist_pressure}%</span>
                  <span className="text-xs text-muted-foreground">Pressure</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Waitlist Count</span>
                <span className="font-bold">{registrations.waitlist}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Cancellation Rate</span>
                <span className="font-bold">{cancellation_rate}%</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Available Spots</span>
                <span className="font-bold">{capacity.available}</span>
              </div>
            </div>

            {waitlist_pressure > 50 && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 text-red-600 text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <p>High waitlist pressure! Consider adding more capacity or opening more spots.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Daily signups chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Sign-up Trend
          </CardTitle>
        </CardHeader>
        <CardContent>
          {analytics.daily_signups.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">No sign-up data yet</p>
          ) : (
            <div className="space-y-2">
              {analytics.daily_signups.map((day, i) => {
                const maxCount = Math.max(...analytics.daily_signups.map(d => d.count))
                const percent = maxCount > 0 ? (day.count / maxCount) * 100 : 0

                return (
                  <div key={day.date} className="flex items-center gap-4">
                    <span className="text-sm text-muted-foreground w-24">
                      {new Date(day.date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                    <div className="flex-1 h-6 bg-muted rounded overflow-hidden">
                      <div
                        className="h-full bg-primary rounded transition-all"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium w-8 text-right">{day.count}</span>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
