// Run the migration directly against Supabase using the connection string
// Requires environment variable: DIRECT_URL (format: postgresql://user:pass@host:port/db?sslmode=require)
const { Client } = require('pg')
const fs = require('fs')
const path = require('path')

async function runMigration() {
  const DIRECT_URL = process.env.DIRECT_URL

  if (!DIRECT_URL) {
    console.error('❌ Missing environment variable: DIRECT_URL')
    console.error('   Set it in your .env file or environment')
    console.error('   Format: postgresql://user:password@host:port/db?sslmode=require')
    process.exit(1)
  }

  const client = new Client({
    connectionString: DIRECT_URL,
    ssl: {
      rejectUnauthorized: false,
      ca: false,
      checkServerIdentity: () => undefined
    }
  })

  try {
    await client.connect()
    console.log('✅ Connected to Supabase database')

    // Read the migration file
    const migrationFile = process.argv[2] || '20260907000003_event_registrations.sql'
    const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', migrationFile)
    let sql = fs.readFileSync(migrationPath, 'utf8')

    console.log(`📄 Running migration: ${migrationFile}`)
    console.log(`   SQL size: ${(sql.length / 1024).toFixed(1)} KB`)

    // Try the whole thing first
    try {
      await client.query(sql)
      console.log('✅ Migration completed successfully!')
    } catch (err) {
      console.log('⚠️  Whole-file failed, trying statement-by-statement...')
      console.log('   Error:', err.message)

      // Split on semicolons that end statements (not inside strings/comments)
      const statements = sql
        .split(/;\s*$/m)
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.match(/^--/))

      let success = 0
      let failed = 0
      for (const stmt of statements) {
        if (stmt.startsWith('--') || stmt.length < 3) continue
        try {
          await client.query(stmt)
          success++
        } catch (e) {
          failed++
          console.log(`   ❌ Statement failed: ${e.message}`)
          console.log(`   First 200 chars: ${stmt.substring(0, 200).replace(/\n/g, ' ')}`)
        }
      }
      console.log(`\n📊 ${success} succeeded, ${failed} failed`)
    }

    // Verify tables exist
    const result = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name IN ('EventRegistration', 'EventWaitlist', 'EventReminder', 'TicketTier')
      ORDER BY table_name;
    `)

    console.log('\n📊 Tables created:')
    if (result.rows.length === 0) {
      console.log('   ⚠️  No tables found - check if they exist with different naming')
    } else {
      result.rows.forEach(row => {
        console.log(`   ✓ ${row.table_name}`)
      })
    }

    // Verify id defaults
    const idCheck = await client.query(`
      SELECT table_name, column_name, column_default
      FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'EventRegistration'
      AND column_name = 'id';
    `)
    console.log('\n🔑 EventRegistration.id default:')
    idCheck.rows.forEach(row => {
      console.log(`   ${row.column_default || '(none)'}`)
    })

  } catch (error) {
    console.error('❌ Migration failed:', error.message)
    if (error.detail) console.error('   Detail:', error.detail)
    if (error.hint) console.error('   Hint:', error.hint)
    process.exit(1)
  } finally {
    await client.end()
  }
}

runMigration()
