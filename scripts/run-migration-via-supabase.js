// Run a migration by creating a temporary SECURITY DEFINER function
// and calling it via Supabase's rpc mechanism
// Requires environment variables: SUPABASE_URL and SUPABASE_SECRET_KEY
const { createClient } = require('@supabase/supabase-js')

async function runMigration() {
  const supabaseUrl = process.env.SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SECRET_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing environment variables: SUPABASE_URL and SUPABASE_SECRET_KEY are required')
    console.error('   Set them in your .env file or environment')
    process.exit(1)
  }

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false }
  })

  // SQL statements to run individually via direct Supabase queries
  // Since JS client doesn't support DDL, we'll do this via a callable function
  // First, let's see what we can verify

  // Check if the exec function already exists
  const { data: fns, error: fnErr } = await supabase
    .from('pg_proc')
    .select('proname')
    .limit(1)

  console.log('pg_proc check:', fnErr?.message || 'ok')

  // Use raw query via RPC
  const migrationStatements = [
    `CREATE EXTENSION IF NOT EXISTS "pgcrypto"`,
    `ALTER TABLE "EventRegistration" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text`,
    `ALTER TABLE "User" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text`,
    `ALTER TABLE "Event" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text`,
    `ALTER TABLE "Order" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text`,
    `ALTER TABLE "OrderItem" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text`,
    `ALTER TABLE "OrderNote" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text`,
    `ALTER TABLE "Product" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text`,
    `ALTER TABLE "PromoCode" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text`,
    `ALTER TABLE "CustomerNote" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text`,
    `ALTER TABLE "AuditLog" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text`,
    `ALTER TABLE "StockAlert" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text`,
    `UPDATE "EventRegistration" SET customer_name = guest_name WHERE customer_name IS NULL AND guest_name IS NOT NULL`,
    `UPDATE "EventRegistration" SET customer_email = guest_email WHERE customer_email IS NULL AND guest_email IS NOT NULL`,
    `ALTER TABLE "EventRegistration" ALTER COLUMN "customer_name" SET NOT NULL`,
    `ALTER TABLE "EventRegistration" ALTER COLUMN "customer_email" SET NOT NULL`,
  ]

  // Check current state
  const { data: idDefaults, error: idErr } = await supabase
    .rpc('exec', {
      sql: `
        SELECT table_name, column_name, column_default, is_nullable
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'EventRegistration'
        AND column_name IN ('id', 'customer_name', 'customer_email')
      `
    })

  console.log('Current state:', JSON.stringify(idDefaults, null, 2))
  console.log('Error:', idErr?.message)

  // Try inserting a test registration to see what happens
  const { data: events } = await supabase
    .from('Event')
    .select('id')
    .limit(1)

  if (!events || events.length === 0) {
    console.log('No event to test with')
    return
  }

  const eventId = events[0].id
  console.log('Testing with event:', eventId)

  // Try to insert with just name+email, no id
  const { data: ins, error: insErr } = await supabase
    .from('EventRegistration')
    .insert({
      event_id: eventId,
      customer_name: 'Test After Migration',
      customer_email: 'test-after@example.com',
      status: 'CONFIRMED',
    })
    .select()

  if (insErr) {
    console.log('❌ Insert failed:', insErr.message)
  } else {
    console.log('✅ Inserted:', ins)
  }
}

runMigration().catch(e => { console.error(e); process.exit(1) })
