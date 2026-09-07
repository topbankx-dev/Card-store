// Check id column type and default
// Requires environment variables: SUPABASE_URL and SUPABASE_SECRET_KEY
const { createClient } = require('@supabase/supabase-js')

async function checkId() {
  const supabaseUrl = process.env.SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SECRET_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing environment variables: SUPABASE_URL and SUPABASE_SECRET_KEY are required')
    console.error('   Set them in your .env file or environment')
    process.exit(1)
  }

  const supabase = createClient(
    supabaseUrl,
    supabaseKey,
    { auth: { persistSession: false } }
  )

  // Use SQL function to check
  const { data, error } = await supabase.rpc('exec', {
    sql: `
      SELECT column_name, data_type, column_default, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'EventRegistration'
      AND column_name = 'id'
    `
  }).then(r => ({ data: null, error: r.error })).catch(e => ({ data: null, error: e }))

  if (error) {
    console.log('RPC failed, trying raw query...')
  }

  // Direct query approach
  const { data: regs } = await supabase
    .from('EventRegistration')
    .select('id, customer_name')
    .limit(1)

  console.log('Sample registration:', regs)
}

checkId()
