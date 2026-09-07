-- ============================================
-- Fix Event Schema for Card Store
-- Run this in Supabase Dashboard > SQL Editor
-- ============================================

-- Enable pgcrypto extension for UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- CREATE EVENT TABLE (if not exists)
-- ============================================
CREATE TABLE IF NOT EXISTS "Event" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "name" VARCHAR(255) NOT NULL,
    "slug" VARCHAR(255) UNIQUE,
    "game" VARCHAR(50) NOT NULL DEFAULT 'MTG',
    "description" TEXT,
    "event_date" TIMESTAMP WITH TIME ZONE NOT NULL,
    "end_date" TIMESTAMP WITH TIME ZONE,
    "registration_deadline" TIMESTAMP WITH TIME ZONE,
    "location" VARCHAR(255) NOT NULL,
    "virtual_link" TEXT,
    "entry_fee" DECIMAL(10, 2) DEFAULT 0,
    "max_capacity" INTEGER NOT NULL DEFAULT 24,
    "waitlist_enabled" BOOLEAN DEFAULT false,
    "waitlist_max" INTEGER DEFAULT 0,
    "format" VARCHAR(100),
    "experience_level" VARCHAR(50) DEFAULT 'ALL',
    "subformat" VARCHAR(100),
    "deck_ownership" VARCHAR(50) DEFAULT 'BYO',
    "max_tables" INTEGER DEFAULT 6,
    "prize_pool" TEXT,
    "prize_description" TEXT,
    "image_url" TEXT,
    "visibility" VARCHAR(20) DEFAULT 'PUBLIC',
    "status" VARCHAR(50) DEFAULT 'DRAFT',
    "is_recurring" BOOLEAN DEFAULT false,
    "recurring_pattern" VARCHAR(50),
    "recurring_end_date" TIMESTAMP WITH TIME ZONE,
    "recurring_count" INTEGER DEFAULT 4,
    "registration_count" INTEGER DEFAULT 0,
    "current_registered" INTEGER DEFAULT 0,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    -- Trust & Policy columns
    "refund_policy" TEXT DEFAULT '',
    "refund_enabled" BOOLEAN DEFAULT FALSE,
    "refund_deadline_hours" INTEGER DEFAULT 48,
    "code_of_conduct" TEXT DEFAULT '',
    "code_of_conduct_enabled" BOOLEAN DEFAULT FALSE,
    "cancellation_policy" TEXT DEFAULT '',
    "cancellation_consent_required" BOOLEAN DEFAULT FALSE,
    "media_release" BOOLEAN DEFAULT FALSE,
    "attendee_visibility" VARCHAR(20) DEFAULT 'PUBLIC',
    "auto_reminder_1_week" BOOLEAN DEFAULT TRUE,
    "auto_reminder_1_day" BOOLEAN DEFAULT TRUE,
    "auto_reminder_1_hour" BOOLEAN DEFAULT FALSE
);

-- ============================================
-- CREATE TICKET TIER TABLE (if not exists)
-- ============================================
CREATE TABLE IF NOT EXISTS "TicketTier" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "event_id" UUID NOT NULL REFERENCES "Event"(id) ON DELETE CASCADE,
    "name" VARCHAR(255) NOT NULL,
    "price" DECIMAL(10, 2) NOT NULL DEFAULT 0,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "sold_count" INTEGER DEFAULT 0,
    "description" TEXT,
    "benefits" TEXT[],
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- CREATE EVENT REGISTRATION TABLE (if not exists)
-- ============================================
CREATE TABLE IF NOT EXISTS "EventRegistration" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "event_id" UUID NOT NULL REFERENCES "Event"(id) ON DELETE CASCADE,
    "customer_name" VARCHAR(255) NOT NULL,
    "customer_email" VARCHAR(255) NOT NULL,
    "phone" VARCHAR(50),
    "ticket_tier_id" UUID REFERENCES "TicketTier"(id),
    "ticket_count" INTEGER DEFAULT 1,
    "total_price" DECIMAL(10, 2) DEFAULT 0,
    "payment_status" VARCHAR(50) DEFAULT 'PENDING',
    "payment_method" VARCHAR(50),
    "payment_reference" VARCHAR(255),
    "order_id" UUID,
    "registration_status" VARCHAR(50) DEFAULT 'CONFIRMED',
    "notes" TEXT,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- CREATE INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_event_status ON "Event"(status);
CREATE INDEX IF NOT EXISTS idx_event_date ON "Event"(event_date);
CREATE INDEX IF NOT EXISTS idx_event_game ON "Event"(game);
CREATE INDEX IF NOT EXISTS idx_event_slug ON "Event"(slug);
CREATE INDEX IF NOT EXISTS idx_ticket_tier_event ON "TicketTier"(event_id);
CREATE INDEX IF NOT EXISTS idx_registration_event ON "EventRegistration"(event_id);
CREATE INDEX IF NOT EXISTS idx_registration_email ON "EventRegistration"(customer_email);

-- ============================================
-- ENABLE RLS ON TABLES
-- ============================================
ALTER TABLE "Event" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "TicketTier" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "EventRegistration" ENABLE ROW LEVEL SECURITY;

-- ============================================
-- DROP EXISTING POLICIES (if any) TO RECREATE CLEAN
-- ============================================
DROP POLICY IF EXISTS "Public can read events" ON "Event";
DROP POLICY IF EXISTS "Service role can manage events" ON "Event";
DROP POLICY IF EXISTS "Public can read ticket tiers" ON "TicketTier";
DROP POLICY IF EXISTS "Service role can manage ticket tiers" ON "TicketTier";
DROP POLICY IF EXISTS "Public can read event registrations" ON "EventRegistration";
DROP POLICY IF EXISTS "Service role can manage all registrations" ON "EventRegistration";

-- ============================================
-- CREATE RLS POLICIES
-- ============================================

-- Event policies
CREATE POLICY "Public can read events"
ON "Event" FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Service role can manage events"
ON "Event" FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- TicketTier policies
CREATE POLICY "Public can read ticket tiers"
ON "TicketTier" FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Service role can manage ticket tiers"
ON "TicketTier" FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- EventRegistration policies
CREATE POLICY "Public can read event registrations"
ON "EventRegistration" FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Authenticated users can register"
ON "EventRegistration" FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Service role can manage all registrations"
ON "EventRegistration" FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================
-- GRANT PERMISSIONS
-- ============================================
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;

-- ============================================
-- VERIFY SETUP
-- ============================================
SELECT 'Tables created:' as status;
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('Event', 'TicketTier', 'EventRegistration');

SELECT 'Event columns:' as status;
SELECT column_name, data_type FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'Event' ORDER BY column_name;

SELECT 'RLS enabled:' as status;
SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' AND tablename IN ('Event', 'TicketTier', 'EventRegistration');

SELECT 'Setup complete!' as status;
