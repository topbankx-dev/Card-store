'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { GAME_LABELS } from '@/lib/admin/types'
import { Layers } from 'lucide-react'

interface GameShareItem {
  game: string
  count: number
  percentage: number
}

interface GameDistributionChartProps {
  data: GameShareItem[]
  totalProducts?: number
}

const gameColorMap: Record<string, { bar: string; badge: string; text: string }> = {
  YGO: {
    bar: 'bg-amber-500',
    badge: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    text: 'text-amber-500',
  },
  POKEMON: {
    bar: 'bg-orange-500',
    badge: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
    text: 'text-orange-500',
  },
  MTG: {
    bar: 'bg-red-500',
    badge: 'bg-red-500/10 text-red-500 border-red-500/20',
    text: 'text-red-500',
  },
  ONE_PIECE: {
    bar: 'bg-blue-500',
    badge: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    text: 'text-blue-500',
  },
  NARUTO: {
    bar: 'bg-emerald-500',
    badge: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    text: 'text-emerald-500',
  },
  DIGIMON: {
    bar: 'bg-cyan-500',
    badge: 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20',
    text: 'text-cyan-500',
  },
  OTHER: {
    bar: 'bg-purple-500',
    badge: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
    text: 'text-purple-500',
  },
}

export function GameDistributionChart({ data, totalProducts = 0 }: GameDistributionChartProps) {
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Layers className="w-5 h-5 text-primary" />
            TCG Inventory Distribution
          </CardTitle>
          <CardDescription>Breakdown by card game</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-6">
            No products in inventory yet
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Layers className="w-5 h-5 text-primary" />
            TCG Inventory Share
          </CardTitle>
          <CardDescription>Live catalog split across game systems</CardDescription>
        </div>
        <Badge variant="outline" className="font-mono text-xs">
          {totalProducts || data.reduce((s, d) => s + d.count, 0)} Total Cards
        </Badge>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Multi-segment Progress Bar */}
        <div className="h-3 w-full bg-muted rounded-full overflow-hidden flex">
          {data.map((item) => {
            const colors = gameColorMap[item.game] || gameColorMap.OTHER
            const label = (GAME_LABELS as Record<string, string>)[item.game] || item.game
            return (
              <div
                key={item.game}
                style={{ width: `${item.percentage}%` }}
                className={`${colors.bar} transition-all duration-500 first:rounded-l-full last:rounded-r-full`}
                title={`${label}: ${item.percentage}% (${item.count} items)`}
              />
            )
          })}
        </div>

        {/* Legend / Breakdown List */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          {data.map((item) => {
            const colors = gameColorMap[item.game] || gameColorMap.OTHER
            const label = (GAME_LABELS as Record<string, string>)[item.game] || item.game
            return (
              <div
                key={item.game}
                className="flex items-center justify-between p-2.5 rounded-lg border bg-muted/20"
              >
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${colors.bar}`} />
                  <span className="text-xs font-semibold">
                    {label}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold">{item.count} cards</span>
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0 font-mono">
                    {item.percentage}%
                  </Badge>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
