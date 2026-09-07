// Run a migration using Supabase's pg_net or a custom RPC
// Since we can't directly execute DDL via the JS client without a function,
// we'll use the supabase CLI to apply the migration
// Requires environment variable: SUPABASE_URL
const { exec } = require('child_process')
const path = require('path')

const supabaseUrl = process.env.SUPABASE_URL
if (!supabaseUrl) {
  console.error('❌ Missing environment variable: SUPABASE_URL')
  console.error('   Set it in your .env file or environment')
  process.exit(1)
}

const migrationFile = process.argv[2] || '20260907000003_event_registrations.sql'
const filePath = path.join('supabase', 'migrations', migrationFile)

console.log(`Running migration: ${migrationFile}`)
console.log('Use: npx supabase db push or apply via SQL editor')
console.log(`\nFile contents at: ${filePath}`)
console.log('\nTo apply this migration:')
console.log(`1. Open Supabase dashboard: ${supabaseUrl}`)
console.log('2. Go to SQL Editor')
console.log('3. Paste the contents of: ' + filePath)
console.log('4. Click "Run"')
