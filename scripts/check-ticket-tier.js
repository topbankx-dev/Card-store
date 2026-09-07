// Read env and check ticket tier schema
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

  // Get any events
  const { data: events } = await supabase
    .from('Event')
    .select('id')
    .limit(1)

  if (!events || events.length === 0) {
    console.log('No event found')
    return
  }

  // Try simple insert with minimal fields
  const { data: ins, error: insErr } = await supabase
    .from('TicketTier')
    .insert({
      id: `tt_check_${Date.now()}`,
      event_id: events[0].id,
      name: 'Test Tier',
      price: 1000,
      quantity: 5,
    })
    .select()

  console.log('Insert result:', ins)
  console.log('Insert error:', insErr)

  if (ins && ins[0]) {
    // Clean up
    await supabase.from('TicketTier').delete().eq('id', ins[0].id)
    console.log('Test tier cleaned up')
  }
}

check().catch(e => { console.error(e); process.exit(1) })
