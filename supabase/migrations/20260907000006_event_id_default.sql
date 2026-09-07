-- Fix Event.id to auto-generate UUID as text
-- This is needed because the API doesn't send an id, expecting the database to generate it

-- Enable pgcrypto if not already enabled
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Set default for Event.id
ALTER TABLE "Event" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text;

-- Also fix all other tables that might have the same issue
ALTER TABLE "EventRegistration" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text;
ALTER TABLE "TicketTier" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text;
ALTER TABLE "EventWaitlist" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text;
ALTER TABLE "EventReminder" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text;

-- Verify defaults are set
SELECT table_name, column_name, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('Event', 'EventRegistration', 'TicketTier', 'EventWaitlist', 'EventReminder')
  AND column_name = 'id'
ORDER BY table_name;
