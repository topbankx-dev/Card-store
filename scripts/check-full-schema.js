// Check full EventRegistration schema
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

  // Query the full schema via OpenAPI
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/`, {
    headers: {
      'apikey': env.SUPABASE_SECRET_KEY,
      'Authorization': `Bearer ${env.SUPABASE_SECRET_KEY}`
    }
  })
  const schema = await res.json()
  const def = schema.definitions?.EventRegistration

  console.log('EventRegistration columns:')
  if (def?.properties) {
    for (const [col, info] of Object.entries(def.properties)) {
      const req = def.required?.includes(col) ? ' [REQUIRED]' : ''
      console.log(`  ${col}: ${info.type}${req}`)
    }
  }

  console.log('\nRequired columns:', def?.required)
}

check().catch(e => { console.error(e); process.exit(1) })
