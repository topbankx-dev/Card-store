// Seed test data via Supabase client
// Requires environment variables: SUPABASE_URL and SUPABASE_SECRET_KEY
const { createClient } = require('@supabase/supabase-js')

async function seedTestData() {
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
    console.log('✅ Connected via Supabase\n')

    // Generate a cuid-like ID (matches the pattern used by other tables)
    const eventId = 'cm' + Date.now() + Math.random().toString(36).substr(2, 9)

    // Create event
    console.log('📅 Creating test event...')
    const { data: event, error: eventError } = await supabase
      .from('Event')
      .insert({
        id: eventId,
        name: 'Friday Night Magic',
        slug: 'friday-night-magic-' + Date.now(),
        game: 'MTG',
        description: 'Weekly casual Magic: The Gathering tournament. All skill levels welcome!',
        event_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000).toISOString(),
        entry_fee: 1500,
        max_capacity: 24,
        current_registered: 0,
        registration_count: 0,
        location: 'In-Store',
        status: 'UPCOMING',
        format: 'Commander',
        experience_level: 'ALL',
        prize_pool: 'Store credit for top 4: 1st $50, 2nd $25, 3rd-4th $10 each',
        waitlist_enabled: true,
        waitlist_max: 10,
        visibility: 'PUBLIC',
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (eventError) {
      console.log('❌ Event error:', eventError.message)
      return
    }

    console.log(`   ✓ Created: ${event.name}`)
    console.log(`   ID: ${event.id}\n`)

    // Create ticket tiers (TicketTier.id is UUID with default, don't provide)
    console.log('🎫 Creating ticket tiers...')
    const { data: tier1 } = await supabase
      .from('TicketTier')
      .insert({
        event_id: event.id,
        name: 'General Admission',
        price: 1500,
        quantity: 18,
        description: 'Standard entry to FNM',
        benefits: ['Prize support', 'Casual atmosphere'],
      })
      .select()
      .single()
    console.log(`   ✓ ${tier1.name} - JMD ${tier1.price}`)

    const { data: tier2 } = await supabase
      .from('TicketTier')
      .insert({
        event_id: event.id,
        name: 'VIP',
        price: 2500,
        quantity: 6,
        description: 'Premium entry with guaranteed prize pack',
        benefits: ['Prize pack', 'Premium seating', 'Free drink'],
      })
      .select()
      .single()
    console.log(`   ✓ ${tier2.name} - JMD ${tier2.price}\n`)

    // Add registrations
    console.log('📝 Adding registrations...')
    const names = ['John Doe', 'Jane Smith', 'Mike Wilson', 'Sarah Brown', 'Chris Lee']
    const decks = ['Blue-Eyes', 'Dimir Control', 'RG Aggro', 'Amulet Titan', 'Jund Sacrifice']
    const levels = ['INTERMEDIATE', 'COMPETITIVE', 'BEGINNER', 'INTERMEDIATE', 'COMPETITIVE']
    const now = new Date().toISOString()

    for (let i = 0; i < 5; i++) {
      const { error } = await supabase
        .from('EventRegistration')
        .insert({
          id: `reg_${Date.now()}_${i}`,
          event_id: event.id,
          customer_name: names[i],
          customer_email: `${names[i].toLowerCase().replace(' ', '.')}@example.com`,
          customer_phone: `876-555-${1000 + i}`,
          status: 'CONFIRMED',
          payment_status: 'PAID',
          registered_at: now,
          created_at: now,
          updated_at: now,
          deck_preference: decks[i],
          experience_level: levels[i],
        })
      if (error) console.log(`   ⚠️ Reg ${i} error: ${error.message}`)
    }
    console.log(`   ✓ Added 5 registrations`)

    // Update registration count
    await supabase
      .from('Event')
      .update({ current_registered: 5, registration_count: 5 })
      .eq('id', event.id)

    // Add waitlist
    console.log('\n⏳ Adding waitlist...')
    const waitlist = ['Tom Harris', 'Amy Chen', 'Dave Martinez']
    for (let i = 0; i < 3; i++) {
      await supabase
        .from('EventWaitlist')
        .insert({
          event_id: event.id,
          customer_name: waitlist[i],
          customer_email: `${waitlist[i].toLowerCase().replace(' ', '.')}@example.com`,
          position: i + 1,
        })
    }
    console.log(`   ✓ Added 3 waitlist entries`)

    // Add reminder
    console.log('\n📧 Creating reminder...')
    await supabase
      .from('EventReminder')
      .insert({
        event_id: event.id,
        type: '1_week',
        subject: 'Your FNM event is coming up next week!',
        recipient_count: 5,
        sent_at: new Date().toISOString(),
      })
    console.log(`   ✓ Created reminder\n`)

    // Final summary
    console.log('📊 Final Summary:')
    const { data: summary } = await supabase
      .from('Event')
      .select(`
        name, current_registered, max_capacity,
        ticket_tiers:TicketTier(id),
        registrations:EventRegistration(id, status),
        waitlist:EventWaitlist(id),
        reminders:EventReminder(id)
      `)
      .eq('id', event.id)
      .single()

    console.log(`   Event: ${summary.name}`)
    console.log(`   Registered: ${summary.current_registered}/${summary.max_capacity}`)
    console.log(`   Ticket Tiers: ${summary.ticket_tiers.length}`)
    console.log(`   Registrations: ${summary.registrations.length}`)
    console.log(`   Waitlist: ${summary.waitlist.length}`)
    console.log(`   Reminders: ${summary.reminders.length}`)

    console.log('\n🎉 Test data created successfully!')
    console.log(`\n📋 Event ID: ${event.id}`)
    console.log(`🔗 Slug: ${event.slug}`)

  } catch (error) {
    console.error('❌ Failed:', error.message)
  }
}

seedTestData()
