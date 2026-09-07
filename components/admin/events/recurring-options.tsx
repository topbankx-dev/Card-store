'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Repeat, Calendar, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react'
import { generateRecurringDates } from '@/lib/validations/event'

interface RecurringOptionsProps {
  startDate: string
  isRecurring: boolean
  pattern?: 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY'
  endDate?: string | null
  count?: number
  onChange: (updates: {
    is_recurring: boolean
    recurring_pattern?: 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY'
    recurring_end_date?: string | null
    recurring_count?: number
  }) => void
}

export function RecurringOptions({
  startDate,
  isRecurring,
  pattern = 'WEEKLY',
  endDate,
  count = 4,
  onChange,
}: RecurringOptionsProps) {
  const [isExpanded, setIsExpanded] = useState(isRecurring)

  // Generate preview dates
  const previewDates = isRecurring && startDate
    ? generateRecurringDates(startDate, pattern, endDate, count).slice(0, 6)
    : []

  const formatPreviewDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Repeat className="w-5 h-5" />
            <CardTitle className="text-lg">Recurring Event</CardTitle>
            {isRecurring && (
              <Badge variant="secondary" className="text-xs">
                {pattern.charAt(0) + pattern.slice(1).toLowerCase()}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-3">
            <Switch
              checked={isRecurring}
              onCheckedChange={(checked) => {
                onChange({
                  is_recurring: checked,
                  recurring_pattern: checked ? pattern : undefined,
                })
                if (checked) setIsExpanded(true)
              }}
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="w-4 h-4 mr-1" />
                  Less
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4 mr-1" />
                  More
                </>
              )}
            </Button>
          </div>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Automatically create future occurrences of this event
        </p>
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-4">
          {/* Pattern selection */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label>Repeat Pattern</Label>
              <Select
                value={pattern}
                onValueChange={(value: 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY') =>
                  onChange({ is_recurring: isRecurring, recurring_pattern: value })
                }
                disabled={!isRecurring}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="WEEKLY">Weekly</SelectItem>
                  <SelectItem value="BIWEEKLY">Every 2 Weeks</SelectItem>
                  <SelectItem value="MONTHLY">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Number of Occurrences</Label>
              <Input
                type="number"
                min="1"
                max="52"
                value={count}
                onChange={(e) =>
                  onChange({
                    is_recurring: isRecurring,
                    recurring_pattern: pattern,
                    recurring_count: parseInt(e.target.value) || 4,
                  })
                }
                disabled={!isRecurring}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Or End Date (optional)</Label>
              <Input
                type="date"
                value={endDate ? endDate.split('T')[0] : ''}
                onChange={(e) =>
                  onChange({
                    is_recurring: isRecurring,
                    recurring_pattern: pattern,
                    recurring_end_date: e.target.value ? new Date(e.target.value).toISOString() : undefined,
                  })
                }
                disabled={!isRecurring}
                min={startDate ? startDate.split('T')[0] : new Date().toISOString().split('T')[0]}
              />
            </div>
          </div>

          {/* Preview */}
          {previewDates.length > 0 && (
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">
                Preview of future events:
              </Label>
              <div className="flex flex-wrap gap-2">
                {previewDates.map((date, i) => (
                  <Badge key={i} variant="outline" className="text-xs">
                    <Calendar className="w-3 h-3 mr-1" />
                    {formatPreviewDate(date)}
                  </Badge>
                ))}
                {count > 6 && (
                  <Badge variant="outline" className="text-xs">
                    +{count - 6} more
                  </Badge>
                )}
              </div>
            </div>
          )}

          {/* Info note */}
          <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-500/10 text-blue-600 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <p>
              All recurring events will be created as drafts. You can edit or publish
              them individually after creation.
            </p>
          </div>
        </CardContent>
      )}
    </Card>
  )
}
