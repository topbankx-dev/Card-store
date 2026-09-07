// Test if guest_name/guest_email are required
// Requires environment variables: SUPABASE_URL and SUPABASE_SECRET_KEY
const { createClient } = require('@supabase/supabase-js')

async function testRegInsert() {
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

  // Get event
  const { data: events } = await supabase
    .from('Event')
    .select('id')
    .limit(1)

  if (!events || events.length === 0) {
    console.log('No event to test with')
    return
  }

  const eventId = events[0].id

  // Try with both new and old fields
  const { data, error } = await supabase
    .from('EventRegistration')
    .insert({
      event_id: eventId,
      customer_name: 'Test User',
      customer_email: 'test@example.com',
      customer_phone: '876-555-1234',
      status: 'CONFIRMED',
    })
    .select()

  if (error) {
    console.log('❌ Error:', error.message)
    console.log('   Details:', JSON.stringify(error, null, 2))
  } else {
    console.log('✅ Created registration:', data)
  }
}

testRegInsert()
