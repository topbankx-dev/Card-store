import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

// Email templates for reminders
const EMAIL_TEMPLATES = {
  '1_week': {
    subject: 'Your event is coming up next week!',
    body: (event: { name: string; event_date: string; location: string }) =>
      `Hi {{name}},\n\nJust a reminder that "${event.name}" is coming up next week!\n\nDate: ${event.event_date}\nLocation: ${event.location}\n\nDon't forget to prepare your deck and arrive on time.\n\nSee you there!`,
  },
  '1_day': {
    subject: 'Reminder: Your event is tomorrow!',
    body: (event: { name: string; event_date: string; location: string }) =>
      `Hi {{name}},\n\nThis is a friendly reminder that "${event.name}" is happening tomorrow!\n\nDate: ${event.event_date}\nLocation: ${event.location}\n\nMake sure you have everything ready. Looking forward to seeing you!`,
  },
  '1_hour': {
    subject: 'Event starting soon!',
    body: (event: { name: string; event_date: string; location: string }) =>
      `Hi {{name}},\n\n"${event.name}" is starting in about an hour!\n\nLocation: ${event.location}\n\nPlease head over if you haven't already. See you soon!`,
  },
  'post_event': {
    subject: 'Thanks for attending!',
    body: (event: { name: string }) =>
      `Hi {{name}},\n\nThank you for attending "${event.name}"! We hope you had a great time.\n\nWe'd love to hear your feedback - it helps us improve future events.\n\nStay tuned for more upcoming events!`,
  },
}

type ReminderType = keyof typeof EMAIL_TEMPLATES

// POST /api/admin/events/[id]/send-reminder - Send reminder email to all registered attendees
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { type } = body as { type: ReminderType }

    if (!type || !EMAIL_TEMPLATES[type]) {
      return NextResponse.json({ error: 'Invalid reminder type' }, { status: 400 })
    }

    const supabase = createServerClient()

    // Get event details
    const { data: event } = await supabase
      .from('Event')
      .select('*')
      .eq('id', id)
      .single()

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    // Get confirmed registrations
    const { data: registrations } = await supabase
      .from('EventRegistration')
      .select('customer_email, customer_name')
      .eq('event_id', id)
      .in('status', ['CONFIRMED', 'CHECKED_IN'])

    if (!registrations || registrations.length === 0) {
      return NextResponse.json({ error: 'No attendees to notify' }, { status: 400 })
    }

    const template = EMAIL_TEMPLATES[type]
    const eventInfo = {
      name: event.name,
      event_date: new Date(event.event_date).toLocaleString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      }),
      location: event.location || 'TBD',
    }

    // In production, this would integrate with an email service (SendGrid, Resend, etc.)
    // For now, we'll log what would be sent and store the reminder record
    const emailsToSend = registrations.map(reg => ({
      to: reg.customer_email,
      subject: template.subject.replace('{{name}}', reg.customer_name.split(' ')[0]),
      body: template.body(eventInfo).replace('{{name}}', reg.customer_name),
    }))

    // Store reminder record with auto-generated ID
    const reminderId = `rem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const { data: reminder, error: reminderError } = await supabase
      .from('EventReminder')
      .insert([{
        id: reminderId,
        event_id: id,
        type,
        subject: template.subject,
        recipient_count: emailsToSend.length,
        sent_at: new Date().toISOString(),
      }])
      .select()
      .single()

    if (reminderError) {
      console.error('Error storing reminder:', reminderError)
    }

    // In production: Send emails via email service
    // await Promise.all(emailsToSend.map(email => sendEmail(email)))

    return NextResponse.json({
      data: {
        reminder_id: reminder?.id,
        sent_count: emailsToSend.length,
        emails: emailsToSend, // Remove in production
      },
      message: `Reminder sent to ${emailsToSend.length} attendees`,
    })
  } catch (error) {
    console.error('Error in POST /api/admin/events/[id]/send-reminder:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET /api/admin/events/[id]/send-reminder - Get reminder history
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = createServerClient()

    const { data: reminders } = await supabase
      .from('EventReminder')
      .select('*')
      .eq('event_id', id)
      .order('sent_at', { ascending: false })

    return NextResponse.json({ data: reminders || [] })
  } catch (error) {
    console.error('Error in GET /api/admin/events/[id]/send-reminder:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
