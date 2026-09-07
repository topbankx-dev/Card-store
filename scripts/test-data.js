// Test the schema and create sample data
// Requires environment variable: DIRECT_URL (format: postgresql://user:pass@host:port/db?sslmode=require)
const { Client } = require('pg')

async function testAndSeed() {
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
    console.log('✅ Connected to Supabase database\n')

    // Get an existing event to use for testing
    const events = await client.query(`
      SELECT id, name, current_registered, max_capacity
      FROM "Event"
      ORDER BY event_date ASC
      LIMIT 3
    `)

    if (events.rows.length === 0) {
      console.log('⚠️  No events found in database. Skipping test data creation.')
      return
    }

    console.log(`📅 Found ${events.rows.length} events`)

    // Test: create a sample ticket tier
    const testEvent = events.rows[0]
    console.log(`\n🎫 Creating ticket tier for: ${testEvent.name}`)

    const tier = await client.query(`
      INSERT INTO "TicketTier" (event_id, name, price, quantity, description)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, name, price, quantity
    `, [testEvent.id, 'General Admission', 1500, testEvent.max_capacity, 'Standard entry'])

    console.log(`   ✓ Created: ${tier.rows[0].name} (JMD ${tier.rows[0].price})`)

    // Test: add a registration
    console.log(`\n📝 Adding sample registration...`)
    const reg = await client.query(`
      INSERT INTO "EventRegistration" (
        event_id, customer_name, customer_email, customer_phone,
        status, deck_preference, experience_level
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, customer_name, status
    `, [
      testEvent.id,
      'John Doe',
      'john@example.com',
      '876-555-1234',
      'CONFIRMED',
      'Blue-Eyes White Dragon',
      'INTERMEDIATE'
    ])

    console.log(`   ✓ Created: ${reg.rows[0].customer_name} (${reg.rows[0].status})`)

    // Test: add to waitlist
    console.log(`\n⏳ Adding to waitlist...`)
    const wait = await client.query(`
      INSERT INTO "EventWaitlist" (event_id, customer_name, customer_email, position)
      VALUES ($1, $2, $3, 1)
      RETURNING id, customer_name, position
    `, [testEvent.id, 'Jane Smith', 'jane@example.com'])

    console.log(`   ✓ Added: ${wait.rows[0].customer_name} (position ${wait.rows[0].position})`)

    // Test: create a reminder
    console.log(`\n📧 Creating reminder...`)
    const reminder = await client.query(`
      INSERT INTO "EventReminder" (event_id, type, subject, recipient_count, sent_at)
      VALUES ($1, $2, $3, $4, NOW())
      RETURNING id, type, subject
    `, [testEvent.id, '1_week', 'Your event is coming up next week!', 5])

    console.log(`   ✓ Created: ${reminder.rows[0].type} - "${reminder.rows[0].subject}"`)

    // Test auto-promote function
    console.log(`\n🚀 Testing auto-promote function...`)
    const promote = await client.query(`
      SELECT auto_promote_from_waitlist($1) as new_registration_id
    `, [testEvent.id])

    if (promote.rows[0].new_registration_id) {
      console.log(`   ✓ Auto-promoted waitlist entry: ${promote.rows[0].new_registration_id}`)
    }

    // Final summary
    console.log(`\n📊 Summary:`)
    const summary = await client.query(`
      SELECT
        (SELECT COUNT(*) FROM "TicketTier") as ticket_tiers,
        (SELECT COUNT(*) FROM "EventRegistration") as registrations,
        (SELECT COUNT(*) FROM "EventWaitlist") as waitlist,
        (SELECT COUNT(*) FROM "EventReminder") as reminders
    `)

    const s = summary.rows[0]
    console.log(`   Ticket Tiers: ${s.ticket_tiers}`)
    console.log(`   Registrations: ${s.registrations}`)
    console.log(`   Waitlist entries: ${s.waitlist}`)
    console.log(`   Reminders: ${s.reminders}`)

    console.log('\n✅ All tests passed!')

  } catch (error) {
    console.error('❌ Test failed:', error.message)
    if (error.detail) console.error('   Detail:', error.detail)
  } finally {
    await client.end()
  }
}

testAndSeed()
