-- Event Registrations Enhancement, Waitlist, Reminders, and Ticket Tiers
-- Run this migration in your Supabase SQL editor

-- ============================================
-- TICKET TIERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS "TicketTier" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id TEXT REFERENCES "Event"(id) ON DELETE CASCADE NOT NULL,
    name VARCHAR(100) NOT NULL,
    price DECIMAL(10, 2) NOT NULL DEFAULT 0,
    quantity INTEGER NOT NULL,
    sold_count INTEGER NOT NULL DEFAULT 0,
    description TEXT,
    benefits TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- EVENT WAITLIST TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS "EventWaitlist" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id TEXT REFERENCES "Event"(id) ON DELETE CASCADE NOT NULL,
    user_id TEXT REFERENCES "User"(id) ON DELETE SET NULL,
    customer_name VARCHAR(255) NOT NULL,
    customer_email VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(50),
    ticket_tier_id UUID REFERENCES "TicketTier"(id) ON DELETE SET NULL,
    position INTEGER NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- EVENT REMINDERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS "EventReminder" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id TEXT REFERENCES "Event"(id) ON DELETE CASCADE NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('1_week', '1_day', '1_hour', 'post_event')),
    subject VARCHAR(255) NOT NULL,
    body TEXT,
    recipient_count INTEGER DEFAULT 0,
    sent_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- ENHANCE EVENT REGISTRATION TABLE
-- ============================================
-- Add new columns if they don't exist

ALTER TABLE "EventRegistration" ADD COLUMN IF NOT EXISTS "status" VARCHAR(20)
    DEFAULT 'CONFIRMED' CHECK (status IN ('CONFIRMED', 'CANCELLED', 'NO_SHOW', 'CHECKED_IN'));

ALTER TABLE "EventRegistration" ADD COLUMN IF NOT EXISTS "checked_in_at" TIMESTAMP WITH TIME ZONE;

ALTER TABLE "EventRegistration" ADD COLUMN IF NOT EXISTS "ticket_tier_id" UUID REFERENCES "TicketTier"(id) ON DELETE SET NULL;

ALTER TABLE "EventRegistration" ADD COLUMN IF NOT EXISTS "customer_name" TEXT;

ALTER TABLE "EventRegistration" ADD COLUMN IF NOT EXISTS "customer_email" TEXT;

ALTER TABLE "EventRegistration" ADD COLUMN IF NOT EXISTS "customer_phone" VARCHAR(50);

ALTER TABLE "EventRegistration" ADD COLUMN IF NOT EXISTS "deck_preference" VARCHAR(255);

ALTER TABLE "EventRegistration" ADD COLUMN IF NOT EXISTS "experience_level" VARCHAR(50);

ALTER TABLE "EventRegistration" ADD COLUMN IF NOT EXISTS "dietary_requirements" TEXT;

ALTER TABLE "EventRegistration" ADD COLUMN IF NOT EXISTS "notes" TEXT;

ALTER TABLE "EventRegistration" ADD COLUMN IF NOT EXISTS "promoted_from_waitlist" BOOLEAN DEFAULT FALSE;

ALTER TABLE "EventRegistration" ADD COLUMN IF NOT EXISTS "promoted_at" TIMESTAMP WITH TIME ZONE;

-- Migrate existing data from guest_name/customer_name
UPDATE "EventRegistration" SET customer_name = guest_name WHERE customer_name IS NULL AND guest_name IS NOT NULL;
UPDATE "EventRegistration" SET customer_email = guest_email WHERE customer_email IS NULL AND guest_email IS NOT NULL;

-- Set default status from payment_status for existing records
UPDATE "EventRegistration" SET status = 'CONFIRMED' WHERE status IS NULL;

-- ============================================
-- ADD REGISTRATION DEADLINE TO EVENT
-- ============================================
ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "registration_deadline" TIMESTAMP WITH TIME ZONE;
ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "virtual_link" TEXT;
ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "waitlist_enabled" BOOLEAN DEFAULT FALSE;
ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "waitlist_max" INTEGER;
ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "format" TEXT;
ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "subformat" TEXT;
ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "experience_level" VARCHAR(50);
ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "deck_ownership" VARCHAR(50);
ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "max_tables" INTEGER;
ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "prize_pool" TEXT;
ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "prize_description" TEXT;
ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "visibility" VARCHAR(20) DEFAULT 'PUBLIC';
ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "is_recurring" BOOLEAN DEFAULT FALSE;
ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "recurring_pattern" VARCHAR(20);
ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "recurring_end_date" TIMESTAMP WITH TIME ZONE;
ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "recurring_count" INTEGER;
ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "registration_count" INTEGER DEFAULT 0;

-- Copy current_registered to registration_count if needed
UPDATE "Event" SET registration_count = current_registered WHERE registration_count IS NULL OR registration_count = 0;

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to decrement registration count
CREATE OR REPLACE FUNCTION decrement_registration_count(event_id TEXT)
RETURNS VOID AS $$
BEGIN
    UPDATE "Event"
    SET registration_count = GREATEST(0, registration_count - 1)
    WHERE id = event_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get next waitlist position
CREATE OR REPLACE FUNCTION get_next_waitlist_position(event_id TEXT)
RETURNS INTEGER AS $$
DECLARE
    next_pos INTEGER;
BEGIN
    SELECT COALESCE(MAX(position), 0) + 1 INTO next_pos
    FROM "EventWaitlist"
    WHERE event_id = $1;
    RETURN next_pos;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to auto-promote from waitlist
CREATE OR REPLACE FUNCTION auto_promote_from_waitlist(event_id TEXT)
RETURNS UUID AS $$
DECLARE
    waitlist_entry RECORD;
    new_registration_id UUID;
BEGIN
    SELECT * INTO waitlist_entry
    FROM "EventWaitlist"
    WHERE event_id = $1
    ORDER BY position ASC
    LIMIT 1 FOR UPDATE;

    IF waitlist_entry IS NULL THEN
        RETURN NULL;
    END IF;

    INSERT INTO "EventRegistration" (
        event_id, user_id, customer_name, customer_email, customer_phone,
        ticket_tier_id, notes, status, promoted_from_waitlist, promoted_at
    ) VALUES (
        waitlist_entry.event_id, waitlist_entry.user_id,
        waitlist_entry.customer_name, waitlist_entry.customer_email, waitlist_entry.customer_phone,
        waitlist_entry.ticket_tier_id, waitlist_entry.notes,
        'CONFIRMED', TRUE, NOW()
    ) RETURNING id INTO new_registration_id;

    DELETE FROM "EventWaitlist" WHERE id = waitlist_entry.id;

    UPDATE "Event"
    SET registration_count = COALESCE(registration_count, 0) + 1
    WHERE id = event_id;

    UPDATE "EventWaitlist"
    SET position = position - 1
    WHERE event_id = $1 AND position > waitlist_entry.position;

    RETURN new_registration_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_ticket_tier_event_id ON "TicketTier"(event_id);
CREATE INDEX IF NOT EXISTS idx_waitlist_event_id ON "EventWaitlist"(event_id);
CREATE INDEX IF NOT EXISTS idx_waitlist_position ON "EventWaitlist"(position);
CREATE INDEX IF NOT EXISTS idx_reminder_event_id ON "EventReminder"(event_id);
CREATE INDEX IF NOT EXISTS idx_registration_status ON "EventRegistration"(status);
CREATE INDEX IF NOT EXISTS idx_registration_customer_email ON "EventRegistration"(customer_email);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
ALTER TABLE "TicketTier" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "EventWaitlist" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "EventReminder" ENABLE ROW LEVEL SECURITY;

-- Admins manage ticket tiers
CREATE POLICY "Admin manage TicketTier"
ON "TicketTier" FOR ALL TO authenticated
USING (
  EXISTS (SELECT 1 FROM "User" WHERE id = auth.uid()::text AND role = 'ADMIN')
);

-- Admins manage waitlist
CREATE POLICY "Admin manage EventWaitlist"
ON "EventWaitlist" FOR ALL TO authenticated
USING (
  EXISTS (SELECT 1 FROM "User" WHERE id = auth.uid()::text AND role = 'ADMIN')
);

-- Admins manage reminders
CREATE POLICY "Admin manage EventReminder"
ON "EventReminder" FOR ALL TO authenticated
USING (
  EXISTS (SELECT 1 FROM "User" WHERE id = auth.uid()::text AND role = 'ADMIN')
);

-- Public can read ticket tiers
CREATE POLICY "Public read TicketTier"
ON "TicketTier" FOR SELECT TO anon, authenticated USING (true);

-- ============================================
-- VERIFY
-- ============================================
SELECT 'Tables created:' as info;
SELECT table_name, (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = 'public' AND table_name = t.table_name) as columns
FROM information_schema.tables t
WHERE table_schema = 'public'
AND table_name IN ('TicketTier', 'EventWaitlist', 'EventReminder', 'EventRegistration', 'Event')
ORDER BY table_name;
