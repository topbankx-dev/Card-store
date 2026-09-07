// Verify counts of all event data
const fs = require('fs')
const envContent = fs.readFileSync('.env', 'utf8')
const env = Object.fromEntries(
  envContent.split('\n')
    .filter(l => l.includes('=') && !l.startsWith('#'))
    .map(l => {
      const [key, ...rest] = l.split('=')
      return [key.trim(), rest.join('=').replace(/^"|"$/g, '').trim()]
    })
)

const { createClient } = require('@supabase/supabase-js')

async function verify() {
  const supabase = createClient(
    env.SUPABASE_URL,
    env.SUPABASE_SECRET_KEY,
    { auth: { persistSession: false } }
  )

  // Get latest event
  const { data: events } = await supabase
    .from('Event')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (!events) {
    console.log('No events found')
    return
  }

  console.log(`📅 Event: ${events.name} (${events.id})`)

  const { data: tiers } = await supabase
    .from('TicketTier')
    .select('*')
    .eq('event_id', events.id)

  console.log(`\n🎫 Ticket Tiers: ${tiers?.length || 0}`)
  tiers?.forEach(t => console.log(`   - ${t.name}: JMD ${t.price} (${t.quantity} available)`))

  const { data: regs } = await supabase
    .from('EventRegistration')
    .select('*')
    .eq('event_id', events.id)

  console.log(`\n📝 Registrations: ${regs?.length || 0}`)
  regs?.forEach(r => console.log(`   - ${r.customer_name} <${r.customer_email}> (${r.status})`))

  const { data: waitlist } = await supabase
    .from('EventWaitlist')
    .select('*')
    .eq('event_id', events.id)
    .order('position', { ascending: true })

  console.log(`\n⏳ Waitlist: ${waitlist?.length || 0}`)
  waitlist?.forEach(w => console.log(`   #${w.position}: ${w.customer_name} <${w.customer_email}>`))

  const { data: reminders } = await supabase
    .from('EventReminder')
    .select('*')
    .eq('event_id', events.id)
    .order('sent_at', { ascending: false })

  console.log(`\n📧 Reminders: ${reminders?.length || 0}`)
  reminders?.forEach(r => console.log(`   - ${r.type}: "${r.subject}" (${r.recipient_count} recipients)`))

  console.log(`\n📊 Stats:`)
  console.log(`   Capacity: ${events.max_capacity}`)
  console.log(`   Registered (from event): ${events.registration_count}`)
  console.log(`   Registered (actual): ${regs?.length || 0}`)
}

verify().catch(e => { console.error(e); process.exit(1) })
