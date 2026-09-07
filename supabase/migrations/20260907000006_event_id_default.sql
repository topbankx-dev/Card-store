-- Fix Event.id to auto-generate UUID
-- The id columns are UUID type, so we just need gen_random_uuid() without text cast

-- Enable pgcrypto if not already enabled
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Set default for all id columns (they are UUID type)
ALTER TABLE "Event" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();
ALTER TABLE "EventRegistration" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();
ALTER TABLE "TicketTier" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();
ALTER TABLE "EventWaitlist" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();
ALTER TABLE "EventReminder" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();

-- Verify defaults are set
SELECT table_name, column_name, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('Event', 'EventRegistration', 'TicketTier', 'EventWaitlist', 'EventReminder')
  AND column_name = 'id'
ORDER BY table_name;
