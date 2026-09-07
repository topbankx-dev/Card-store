// Read env and check schema of all event tables
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

  // Query the schema using OpenAPI metadata
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/`, {
    headers: {
      'apikey': env.SUPABASE_SECRET_KEY,
      'Authorization': `Bearer ${env.SUPABASE_SECRET_KEY}`
    }
  })
  const schema = await res.json()

  const tables = ['Event', 'EventRegistration', 'EventWaitlist', 'EventReminder', 'TicketTier']
  for (const table of tables) {
    console.log(`\n=== ${table} ===`)
    const def = schema.definitions?.[table]
    if (def?.properties) {
      for (const [col, info] of Object.entries(def.properties)) {
        if (['id', 'event_id', 'ticket_tier_id'].includes(col)) {
          console.log(`  ${col}: ${JSON.stringify(info)}`)
        }
      }
    }
  }
}

check().catch(e => { console.error(e); process.exit(1) })
