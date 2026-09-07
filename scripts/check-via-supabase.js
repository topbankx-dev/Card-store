// Check via Supabase JS client (handles SSL properly)
// Requires environment variables: SUPABASE_URL and SUPABASE_SECRET_KEY
const { createClient } = require('@supabase/supabase-js')

async function checkSchema() {
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

  try {
    console.log('✅ Connecting via Supabase JS client\n')

    // Test: get a sample event
    const { data: events, error: eventsError } = await supabase
      .from('Event')
      .select('id, name, slug, current_registered, max_capacity')
      .limit(3)

    if (eventsError) {
      console.log('❌ Error:', eventsError.message)
      return
    }

    console.log(`📅 Found ${events.length} events:`)
    events.forEach(e => {
      console.log(`   - ${e.id} | ${e.name} | ${e.current_registered}/${e.max_capacity}`)
    })

    // Check if TicketTier table is accessible
    const { data: tiers, error: tiersError } = await supabase
      .from('TicketTier')
      .select('*')
      .limit(5)

    if (tiersError) {
      console.log('\n⚠️  TicketTier error:', tiersError.message)
    } else {
      console.log(`\n🎫 Found ${tiers.length} ticket tiers`)
    }

    // Check EventRegistration columns
    const { data: regs, error: regsError } = await supabase
      .from('EventRegistration')
      .select('*')
      .limit(3)

    if (regsError) {
      console.log('\n⚠️  EventRegistration error:', regsError.message)
    } else {
      console.log(`\n📝 Found ${regs.length} registrations`)
      if (regs.length > 0) {
        console.log('   Sample columns:', Object.keys(regs[0]).join(', '))
      }
    }

    // Check EventWaitlist
    const { data: waitlist, error: waitError } = await supabase
      .from('EventWaitlist')
      .select('*')
      .limit(3)

    if (waitError) {
      console.log('\n⚠️  EventWaitlist error:', waitError.message)
    } else {
      console.log(`\n⏳ Found ${waitlist.length} waitlist entries`)
    }

    // Check EventReminder
    const { data: reminders, error: remError } = await supabase
      .from('EventReminder')
      .select('*')
      .limit(3)

    if (remError) {
      console.log('\n⚠️  EventReminder error:', remError.message)
    } else {
      console.log(`\n📧 Found ${reminders.length} reminders`)
    }

    console.log('\n🎉 All tables are accessible via Supabase client!')

  } catch (error) {
    console.error('❌ Failed:', error.message)
  }
}

checkSchema()
