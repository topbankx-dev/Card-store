'use client'

import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  AlertTriangle,
  Clock,
  Store,
  Flame,
  ArrowRight,
  CheckCircle2,
  BellRing,
} from 'lucide-react'
import { cn } from '@/lib/utils'

export interface ActionQueueItem {
  id: string
  type: 'PENDING_ORDER' | 'PICKUP_READY' | 'EVENT_NEAR_CAPACITY' | 'LOW_STOCK'
  title: string
  description: string
  link: string
  severity: 'urgent' | 'warning' | 'info'
}

interface ActionQueueProps {
  items: ActionQueueItem[]
}

const severityConfig = {
  urgent: {
    bg: 'bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400',
    icon: Flame,
    badge: 'Urgent Action',
  },
  warning: {
    bg: 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400',
    icon: AlertTriangle,
    badge: 'Attention',
  },
  info: {
    bg: 'bg-blue-500/10 border-blue-500/30 text-blue-600 dark:text-blue-400',
    icon: Store,
    badge: 'Counter / Pickup',
  },
}

export function ActionQueue({ items }: ActionQueueProps) {
  if (!items || items.length === 0) {
    return (
      <Card className="border-emerald-500/20 bg-emerald-500/5">
        <CardContent className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <p className="font-semibold text-sm">Action Queue Clear</p>
              <p className="text-xs text-muted-foreground">
                All customer orders packed, payments verified, and tournaments running smoothly.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-primary/20 bg-card">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <BellRing className="w-5 h-5 text-primary" />
          <CardTitle className="text-base font-bold">Needs Your Attention</CardTitle>
        </div>
        <Badge variant="secondary" className="font-mono text-xs">
          {items.length} pending task{items.length > 1 ? 's' : ''}
        </Badge>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {items.map((item) => {
            const config = severityConfig[item.severity] || severityConfig.info
            const Icon = config.icon

            return (
              <Link
                key={item.id}
                href={item.link}
                className={cn(
                  'flex flex-col justify-between p-3.5 rounded-xl border transition-all hover:scale-[1.01] hover:shadow-md group',
                  config.bg
                )}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-background/80 shadow-xs">
                      {config.badge}
                    </span>
                    <Icon className="w-4 h-4" />
                  </div>
                  <h4 className="font-bold text-sm text-foreground mb-1 group-hover:text-primary transition-colors">
                    {item.title}
                  </h4>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {item.description}
                  </p>
                </div>

                <div className="flex items-center gap-1 text-xs font-semibold text-primary mt-3 pt-2 border-t border-border/40">
                  <span>Take Action</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
