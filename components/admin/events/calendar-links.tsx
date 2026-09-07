'use client'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Calendar, Apple, Globe } from 'lucide-react'

interface EventForCalendar {
  name: string
  event_date: string
  end_date?: string | null
  location?: string | null
  description?: string | null
}

interface CalendarLinksProps {
  event: EventForCalendar
  variant?: 'button' | 'dropdown'
}

export function CalendarLinks({ event, variant = 'dropdown' }: CalendarLinksProps) {
  const start = new Date(event.event_date)
  const end = event.end_date ? new Date(event.end_date) : new Date(start.getTime() + 3 * 60 * 60 * 1000)

  // Format for Google Calendar
  const formatDate = (d: Date) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'

  const googleUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.name)}&dates=${formatDate(start)}/${formatDate(end)}&location=${encodeURIComponent(event.location || '')}&details=${encodeURIComponent(event.description || '')}`

  // Format for Outlook
  const outlookUrl = `https://outlook.live.com/calendar/0/deeplink/compose?subject=${encodeURIComponent(event.name)}&startdt=${start.toISOString()}&enddt=${end.toISOString()}&location=${encodeURIComponent(event.location || '')}&body=${encodeURIComponent(event.description || '')}`

  // Format for Apple Calendar (ICS file)
  const generateICS = () => {
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
    a.download = `${event.name.replace(/[^a-z0-9]/gi, '-')}.ics`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (variant === 'button') {
    return (
      <Button variant="outline" size="sm" onClick={() => window.open(googleUrl, '_blank')}>
        <Calendar className="w-4 h-4 mr-2" />
        Add to Calendar
      </Button>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <Calendar className="w-4 h-4 mr-2" />
          Add to Calendar
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => window.open(googleUrl, '_blank')}>
          <Globe className="w-4 h-4 mr-2" />
          Google Calendar
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => window.open(outlookUrl, '_blank')}>
          <Calendar className="w-4 h-4 mr-2" />
          Outlook
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={generateICS}>
          <Apple className="w-4 h-4 mr-2" />
          Apple Calendar (.ics)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// Inline add-to-calendar buttons for event pages
export function InlineCalendarLinks({ event }: { event: EventForCalendar }) {
  const start = new Date(event.event_date)
  const end = event.end_date ? new Date(event.end_date) : new Date(start.getTime() + 3 * 60 * 60 * 1000)

  const formatDate = (d: Date) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'

  const googleUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.name)}&dates=${formatDate(start)}/${formatDate(end)}&location=${encodeURIComponent(event.location || '')}&details=${encodeURIComponent(event.description || '')}`

  const generateICS = () => {
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
    a.download = `${event.name.replace(/[^a-z0-9]/gi, '-')}.ics`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => window.open(googleUrl, '_blank')}
      >
        <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
        Google
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={generateICS}
      >
        <Apple className="w-4 h-4 mr-2" />
        Apple
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          const url = `https://outlook.live.com/calendar/0/deeplink/compose?subject=${encodeURIComponent(event.name)}&startdt=${start.toISOString()}&enddt=${end.toISOString()}`
          window.open(url, '_blank')
        }}
      >
        <Calendar className="w-4 h-4 mr-2" />
        Outlook
      </Button>
    </div>
  )
}
