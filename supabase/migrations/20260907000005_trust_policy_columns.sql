-- Add Trust Policy columns to Event table
-- These columns were referenced in the form but not added to the database

-- Refund Policy columns
ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "refund_policy" TEXT DEFAULT '';
ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "refund_enabled" BOOLEAN DEFAULT FALSE;
ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "refund_deadline_hours" INTEGER DEFAULT 48;

-- Code of Conduct columns
ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "code_of_conduct" TEXT DEFAULT '';
ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "code_of_conduct_enabled" BOOLEAN DEFAULT FALSE;

-- Cancellation Policy columns
ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "cancellation_policy" TEXT DEFAULT '';
ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "cancellation_consent_required" BOOLEAN DEFAULT FALSE;

-- Media Release column
ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "media_release" BOOLEAN DEFAULT FALSE;

-- Attendee Visibility column
ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "attendee_visibility" VARCHAR(20) DEFAULT 'PUBLIC'
  CHECK (attendee_visibility IN ('PUBLIC', 'PRIVATE', 'HIDDEN'));

-- Automated Reminder columns
ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "auto_reminder_1_week" BOOLEAN DEFAULT TRUE;
ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "auto_reminder_1_day" BOOLEAN DEFAULT TRUE;
ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "auto_reminder_1_hour" BOOLEAN DEFAULT FALSE;

-- Verify columns were added
SELECT 'Event table trust_policy columns:' as info;
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'Event'
  AND column_name IN (
    'refund_policy', 'refund_enabled', 'refund_deadline_hours',
    'code_of_conduct', 'code_of_conduct_enabled',
    'cancellation_policy', 'cancellation_consent_required',
    'media_release', 'attendee_visibility',
    'auto_reminder_1_week', 'auto_reminder_1_day', 'auto_reminder_1_hour'
  )
ORDER BY column_name;
