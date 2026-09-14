'use client'

import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Trophy, Users, Calendar, MapPin, QrCode, ArrowRight, Plus } from 'lucide-react'
import { formatDate, cn } from '@/lib/utils'
import { GAME_LABELS, type Event } from '@/lib/admin/types'

interface UpcomingTournamentsHubProps {
  events: Event[]
}

const gameColors: Record<string, string> = {
  MTG: 'bg-red-500/10 text-red-500 border-red-500/20',
  YGO: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  POKEMON: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
  ONE_PIECE: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  NARUTO: 'bg-green-500/10 text-green-500 border-green-500/20',
  DIGIMON: 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20',
}

export function UpcomingTournamentsHub({ events }: UpcomingTournamentsHubProps) {
  return (
    <Card className="flex flex-col justify-between">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-500" />
            Upcoming Tournaments & OTS Events
          </CardTitle>
          <CardDescription>
            Live player registration & seating capacity in Kingston
          </CardDescription>
        </div>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/admin/events">
            View All <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Link>
        </Button>
      </CardHeader>

      <CardContent className="space-y-3">
        {(!events || events.length === 0) ? (
          <div className="text-center py-8 border rounded-xl bg-muted/20">
            <Trophy className="w-8 h-8 text-muted-foreground/50 mx-auto mb-2" />
            <p className="text-sm font-semibold">No upcoming events scheduled</p>
            <p className="text-xs text-muted-foreground mb-3">Create your weekly OTS tournament</p>
            <Button size="sm" asChild>
              <Link href="/admin/events/new">
                <Plus className="w-3.5 h-3.5 mr-1" /> Create Event
              </Link>
            </Button>
          </div>
        ) : (
          events.map((ev) => {
            const regCount = ev.registration_count || 0
            const maxCap = ev.max_capacity || 32
            const capacityPercent = maxCap > 0 ? (regCount / maxCap) * 100 : 0
            const isFull = regCount >= maxCap
            const isNearing = capacityPercent >= 80

            return (
              <div
                key={ev.id}
                className="p-3.5 rounded-xl border bg-card hover:border-primary/50 transition-all flex flex-col justify-between space-y-2 group"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Badge
                        variant="outline"
                        className={cn('text-[10px] font-semibold', gameColors[ev.game])}
                      >
                        {GAME_LABELS[ev.game] || ev.game}
                      </Badge>
                      <span className="text-xs text-muted-foreground flex items-center gap-1 font-mono">
                        <Calendar className="w-3 h-3" />
                        {new Date(ev.event_date).toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                    <Link
                      href={`/admin/events/${ev.id}`}
                      className="font-bold text-sm text-foreground group-hover:text-primary transition-colors line-clamp-1"
                    >
                      {ev.name}
                    </Link>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-xs font-bold font-mono">
                      {regCount} / {maxCap}
                    </span>
                    <span className="text-[10px] text-muted-foreground block">
                      Seats Filled
                    </span>
                  </div>
                </div>

                {/* Capacity Progress Bar */}
                <div className="space-y-1">
                  <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                    <div
                      className={cn(
                        'h-full transition-all rounded-full',
                        isFull
                          ? 'bg-rose-500'
                          : isNearing
                          ? 'bg-amber-500'
                          : 'bg-primary'
                      )}
                      style={{ width: `${Math.min(capacityPercent, 100)}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1 text-xs">
                  <span className="text-muted-foreground">
                    {ev.entry_fee === 0 ? 'Free Entry' : `$${Number(ev.entry_fee).toLocaleString()} JMD`}
                  </span>

                  <div className="flex items-center gap-2">
                    <Link href={`/admin/events/${ev.id}`}>
                      <Button variant="outline" size="sm" className="h-7 text-xs px-2.5">
                        <Users className="w-3 h-3 mr-1" /> Roster
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </CardContent>
    </Card>
  )
}
