-- Fix ID columns to auto-generate (gen_random_uuid as text)
-- Run this migration in your Supabase SQL editor

-- Enable pgcrypto if not already enabled
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- FIX EVENT REGISTRATION ID
-- ============================================
ALTER TABLE "EventRegistration" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text;

-- ============================================
-- FIX OTHER TABLES (for consistency)
-- ============================================
ALTER TABLE "User" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text;
ALTER TABLE "Event" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text;
ALTER TABLE "Order" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text;
ALTER TABLE "OrderItem" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text;
ALTER TABLE "OrderNote" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text;
ALTER TABLE "Product" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text;
ALTER TABLE "PromoCode" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text;
ALTER TABLE "CustomerNote" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text;
ALTER TABLE "AuditLog" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text;
ALTER TABLE "StockAlert" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text;

-- ============================================
-- ENSURE CUSTOMER_NAME AND CUSTOMER_EMAIL ARE NOT NULL ON REGISTRATIONS
-- ============================================
-- Migrate any existing data first
UPDATE "EventRegistration" SET customer_name = guest_name WHERE customer_name IS NULL AND guest_name IS NOT NULL;
UPDATE "EventRegistration" SET customer_email = guest_email WHERE customer_email IS NULL AND guest_email IS NOT NULL;

-- Set NOT NULL constraints
ALTER TABLE "EventRegistration" ALTER COLUMN "customer_name" SET NOT NULL;
ALTER TABLE "EventRegistration" ALTER COLUMN "customer_email" SET NOT NULL;

-- ============================================
-- VERIFY
-- ============================================
SELECT 'EventRegistration.id default:' as info;
SELECT column_default FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'EventRegistration' AND column_name = 'id';
