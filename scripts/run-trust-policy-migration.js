// Run trust_policy columns migration
// Reads DIRECT_URL from .env file (not committed to git)
require('dotenv').config()
const { Client } = require('pg')

async function run() {
  const DIRECT_URL = process.env.DIRECT_URL
  if (!DIRECT_URL) {
    console.error('Missing DIRECT_URL in .env')
    process.exit(1)
  }

  const client = new Client({
    connectionString: DIRECT_URL,
    ssl: { rejectUnauthorized: false, ca: false, checkServerIdentity: () => undefined }
  })

  try {
    await client.connect()
    console.log('Connected to database')

    // Add trust_policy columns to Event table
    const statements = [
      `ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "refund_policy" TEXT DEFAULT ''`,
      `ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "refund_enabled" BOOLEAN DEFAULT FALSE`,
      `ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "refund_deadline_hours" INTEGER DEFAULT 48`,
      `ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "code_of_conduct" TEXT DEFAULT ''`,
      `ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "code_of_conduct_enabled" BOOLEAN DEFAULT FALSE`,
      `ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "cancellation_policy" TEXT DEFAULT ''`,
      `ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "cancellation_consent_required" BOOLEAN DEFAULT FALSE`,
      `ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "media_release" BOOLEAN DEFAULT FALSE`,
      `ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "attendee_visibility" VARCHAR(20) DEFAULT 'PUBLIC'`,
      `ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "auto_reminder_1_week" BOOLEAN DEFAULT TRUE`,
      `ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "auto_reminder_1_day" BOOLEAN DEFAULT TRUE`,
      `ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "auto_reminder_1_hour" BOOLEAN DEFAULT FALSE`,
    ]

    for (const sql of statements) {
      await client.query(sql)
      console.log('OK:', sql.substring(0, 70) + '...')
    }

    // Verify
    const result = await client.query(`
      SELECT column_name, data_type, column_default
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'Event'
        AND column_name IN (
          'refund_policy', 'refund_enabled', 'refund_deadline_hours',
          'code_of_conduct', 'code_of_conduct_enabled',
          'cancellation_policy', 'cancellation_consent_required',
          'media_release', 'attendee_visibility',
          'auto_reminder_1_week', 'auto_reminder_1_day', 'auto_reminder_1_hour'
        )
      ORDER BY column_name
    `)

    console.log('\nVerification - trust_policy columns now in Event table:')
    result.rows.forEach(r => console.log(`  ${r.column_name}: ${r.data_type}`))

    console.log('\nMigration complete!')
  } catch (e) {
    console.error('Migration failed:', e.message)
    process.exit(1)
  } finally {
    await client.end()
  }
}

run()
