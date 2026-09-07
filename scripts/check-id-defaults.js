// Check if Event.id has a default
// Requires environment variable: DIRECT_URL (format: postgresql://user:pass@host:port/db?sslmode=require)
const { Client } = require('pg')

async function checkDefaults() {
  const DIRECT_URL = process.env.DIRECT_URL

  if (!DIRECT_URL) {
    console.error('❌ Missing environment variable: DIRECT_URL')
    console.error('   Set it in your .env file or environment')
    console.error('   Format: postgresql://user:password@host:port/db?sslmode=require')
    process.exit(1)
  }

  const client = new Client({
    connectionString: DIRECT_URL,
    ssl: { rejectUnauthorized: false, ca: false, checkServerIdentity: () => undefined }
  })

  try {
    await client.connect()
    console.log('✅ Connected\n')

    // Check the default for id column
    const cols = await client.query(`
      SELECT column_name, column_default, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'Event' AND column_name = 'id'
    `)
    console.log('Event.id:')
    console.log(cols.rows[0])

    // Look at existing events to see their id format
    const sample = await client.query(`
      SELECT id, name FROM "Event" LIMIT 3
    `)
    console.log('\nSample event IDs:')
    sample.rows.forEach(r => console.log(`  ${r.id} - ${r.name}`))

  } catch (error) {
    console.error('Failed:', error.message)
  } finally {
    await client.end()
  }
}

checkDefaults()
