import { EventForm } from '@/components/admin/events/event-form'

export default function NewEventPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Create Event</h1>
        <p className="text-muted-foreground mt-1">
          Set up a new tournament or gaming event
        </p>
      </div>

      <EventForm mode="create" />
    </div>
  )
}
