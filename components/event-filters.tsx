'use client'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { LayoutGrid, List, X } from 'lucide-react'
import { useState } from 'react'

export type ViewMode = 'grid' | 'list'

const games = [
  { value: 'ALL', label: 'All Games' },
  { value: 'YGO', label: 'Yu-Gi-Oh!' },
  { value: 'POKEMON', label: 'Pokémon' },
  { value: 'MTG', label: 'Magic: The Gathering' },
  { value: 'ONE_PIECE', label: 'One Piece' },
  { value: 'NARUTO', label: 'Naruto' },
]

const statuses = [
  { value: 'ALL', label: 'All Events' },
  { value: 'UPCOMING', label: 'Upcoming' },
  { value: 'ONGOING', label: 'Live Now' },
  { value: 'PAST', label: 'Past Events' },
]

interface EventFiltersProps {
  selectedGame: string
  onGameChange: (game: string) => void
  selectedStatus: string
  onStatusChange: (status: string) => void
  viewMode: ViewMode
  onViewModeChange: (mode: ViewMode) => void
  totalResults: number
}

export function EventFilters({
  selectedGame,
  onGameChange,
  selectedStatus,
  onStatusChange,
  viewMode,
  onViewModeChange,
  totalResults,
}: EventFiltersProps) {
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false)

  const hasActiveFilters = selectedGame !== 'ALL' || selectedStatus !== 'ALL'

  return (
    <>
      {/* Desktop Filter Bar */}
      <div className="hidden md:block sticky top-16 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b py-4 -mx-4 px-4 mb-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          {/* Game Filters */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-muted-foreground mr-2">Game:</span>
            {games.map((game) => (
              <Button
                key={game.value}
                variant={selectedGame === game.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => onGameChange(game.value)}
                className={cn(
                  'h-8 text-xs',
                  selectedGame === game.value && 'shadow-sm'
                )}
              >
                {game.label}
              </Button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            {/* Status Filter */}
            <div className="flex items-center gap-2 border-l pl-3">
              <span className="text-sm font-medium text-muted-foreground">Status:</span>
              <div className="flex gap-1">
                {statuses.map((status) => (
                  <Button
                    key={status.value}
                    variant={selectedStatus === status.value ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => onStatusChange(status.value)}
                    className="h-8 text-xs"
                  >
                    {status.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* View Toggle */}
            <div className="flex items-center gap-1 border-l pl-3">
              <Button
                variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                size="icon"
                className="h-8 w-8"
                onClick={() => onViewModeChange('grid')}
              >
                <LayoutGrid className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                size="icon"
                className="h-8 w-8"
                onClick={() => onViewModeChange('list')}
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Filter Bar */}
      <div className="md:hidden">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-2 flex-1 overflow-x-auto pb-2 -mb-2">
            {games.slice(1).map((game) => (
              <Button
                key={game.value}
                variant={selectedGame === game.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => onGameChange(game.value)}
                className="h-8 text-xs whitespace-nowrap flex-shrink-0"
              >
                {game.label}
              </Button>
            ))}
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <Button
              variant={viewMode === 'grid' ? 'secondary' : 'outline'}
              size="icon"
              className="h-8 w-8"
              onClick={() => onViewModeChange('grid')}
            >
              <LayoutGrid className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'secondary' : 'outline'}
              size="icon"
              className="h-8 w-8"
              onClick={() => onViewModeChange('list')}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Status pills on mobile */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
          {statuses.map((status) => (
            <Button
              key={status.value}
              variant={selectedStatus === status.value ? 'default' : 'secondary'}
              size="sm"
              onClick={() => onStatusChange(status.value)}
              className="h-8 text-xs whitespace-nowrap flex-shrink-0"
            >
              {status.label}
            </Button>
          ))}
        </div>
      </div>
    </>
  )
}
