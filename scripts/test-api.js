// Test analytics calculation
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

async function test() {
  const supabase = createClient(
    env.SUPABASE_URL,
    env.SUPABASE_SECRET_KEY,
    { auth: { persistSession: false } }
  )

  // Fetch latest event
  const { data: events } = await supabase
    .from('Event')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (!events) {
    console.log('No event')
    return
  }

  console.log('Event:', events.name)
  console.log('ID:', events.id)
  console.log()

  // Get registrations
  const { data: regs } = await supabase
    .from('EventRegistration')
    .select('*')
    .eq('event_id', events.id)

  // Get waitlist
  const { data: waitlist } = await supabase
    .from('EventWaitlist')
    .select('*')
    .eq('event_id', events.id)

  const confirmed = regs?.filter(r => r.status === 'CONFIRMED' || r.status === 'CHECKED_IN').length || 0
  const capacity = events.max_capacity || 1
  const fillRate = Math.round((confirmed / capacity) * 100)

  console.log('📊 Analytics Summary:')
  console.log(`  Total registrations: ${regs?.length || 0}`)
  console.log(`  Confirmed: ${confirmed}`)
  console.log(`  Capacity: ${capacity}`)
  console.log(`  Fill rate: ${fillRate}%`)
  console.log(`  Waitlist: ${waitlist?.length || 0}`)
  console.log()

  // Test adding a registration via the API pattern
  console.log('Testing registration insert...')
  const now = new Date().toISOString()
  const { data: newReg, error } = await supabase
    .from('EventRegistration')
    .insert({
      id: 'reg_api_test_' + Date.now(),
      event_id: events.id,
      customer_name: 'API Test User',
      customer_email: 'api-test@example.com',
      status: 'CONFIRMED',
      payment_status: 'PAID',
      registered_at: now,
      created_at: now,
      updated_at: now,
    })
    .select()
    .single()

  if (error) {
    console.log('❌ Error:', error.message)
  } else {
    console.log('✅ Created registration:', newReg.id)
    // Clean up
    await supabase.from('EventRegistration').delete().eq('id', newReg.id)
    console.log('   (cleaned up)')
  }
}

test().catch(e => { console.error(e); process.exit(1) })
