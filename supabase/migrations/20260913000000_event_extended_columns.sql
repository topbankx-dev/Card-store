-- Extended Event Columns Migration
-- Run this in Supabase SQL editor: https://app.supabase.com -> SQL Editor

-- TICKET TIER TABLE
CREATE TABLE IF NOT EXISTS "TicketTier" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES "Event"(id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL,
    price DECIMAL(10, 2) NOT NULL DEFAULT 0,
    quantity INTEGER NOT NULL DEFAULT 1,
    sold_count INTEGER NOT NULL DEFAULT 0,
    description TEXT,
    benefits TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ticket_tier_event_id ON "TicketTier"(event_id);

-- EXTENDED EVENT COLUMNS
ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "visibility" VARCHAR(20) DEFAULT 'PUBLIC' CHECK (visibility IN ('PUBLIC', 'PRIVATE', 'UNLISTED'));
ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "registration_deadline" TIMESTAMP WITH TIME ZONE;
ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "waitlist_enabled" BOOLEAN DEFAULT FALSE;
ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "waitlist_max" INTEGER DEFAULT 0;
ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "format" VARCHAR(50);
ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "subformat" VARCHAR(100);
ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "experience_level" VARCHAR(20) DEFAULT 'ALL' CHECK (experience_level IN ('BEGINNER', 'INTERMEDIATE', 'COMPETITIVE', 'ALL'));
ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "deck_ownership" VARCHAR(20) DEFAULT 'BYO' CHECK (deck_ownership IN ('BYO', 'PROVIDED', 'BOTH'));
ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "max_tables" INTEGER DEFAULT 6;
ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "prize_pool" TEXT;
ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "prize_description" TEXT;
ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "virtual_link" TEXT;
ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "is_recurring" BOOLEAN DEFAULT FALSE;
ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "recurring_pattern" VARCHAR(20) CHECK (recurring_pattern IN ('DAILY', 'WEEKLY', 'BIWEEKLY', 'MONTHLY'));
ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "recurring_end_date" TIMESTAMP WITH TIME ZONE;
ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "recurring_count" INTEGER DEFAULT 4;

-- RLS FOR TICKETTIER
ALTER TABLE "TicketTier" ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Public read TicketTier" ON "TicketTier" FOR SELECT USING (EXISTS (SELECT 1 FROM "Event" WHERE "Event".id = "TicketTier".event_id AND "Event".visibility = 'PUBLIC'));
CREATE POLICY IF NOT EXISTS "Admin full access to TicketTier" ON "TicketTier" FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM "User" WHERE id = auth.uid() AND role = 'ADMIN'));

-- VERIFY
SELECT column_name, data_type FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'Event' AND column_name IN ('visibility','registration_deadline','waitlist_enabled','format','experience_level','deck_ownership','max_tables','prize_pool','virtual_link','is_recurring') ORDER BY column_name;
