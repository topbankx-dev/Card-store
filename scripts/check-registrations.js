// Check registrations
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

async function check() {
  const supabase = createClient(
    env.SUPABASE_URL,
    env.SUPABASE_SECRET_KEY,
    { auth: { persistSession: false } }
  )

  // Get latest event
  const { data: events } = await supabase
    .from('Event')
    .select('id')
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  console.log('Event ID:', events?.id)

  // Check ALL registrations
  const { data: allRegs, error: allErr } = await supabase
    .from('EventRegistration')
    .select('id, customer_name, event_id')
    .limit(10)

  console.log('All registrations:', allRegs)
  console.log('Error:', allErr)

  // Try to insert one manually
  const { data: ins, error: insErr } = await supabase
    .from('EventRegistration')
    .insert({
      id: `reg_test_${Date.now()}`,
      event_id: events.id,
      customer_name: 'Test User',
      customer_email: 'test_manual@example.com',
      status: 'CONFIRMED',
    })
    .select()

  console.log('Insert result:', ins)
  console.log('Insert error:', insErr)

  // Verify again
  const { data: after } = await supabase
    .from('EventRegistration')
    .select('id, customer_name, event_id')
    .eq('event_id', events.id)

  console.log('Registrations for event after insert:', after?.length)
}

check().catch(e => { console.error(e); process.exit(1) })
