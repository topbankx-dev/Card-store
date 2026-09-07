-- ============================================
-- RLS Setup for Card Store
-- Run this in Supabase Dashboard → SQL Editor
-- ============================================

-- Enable RLS on all tables
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Product" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Event" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "EventRegistration" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Order" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "OrderItem" ENABLE ROW LEVEL SECURITY;

-- NextAuth tables
ALTER TABLE "next_auth"."users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "next_auth"."accounts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "next_auth"."sessions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "next_auth"."verification_tokens" ENABLE ROW LEVEL SECURITY;

-- ============================================
-- Product Policies (public read, admin write)
-- ============================================

CREATE POLICY "Public can read products"
ON "Product" FOR SELECT
TO anon
USING (true);

CREATE POLICY "Authenticated users can read products"
ON "Product" FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Service role can manage products"
ON "Product" FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================
-- Event Policies (public read, admin write)
-- ============================================

CREATE POLICY "Public can read events"
ON "Event" FOR SELECT
TO anon
USING (true);

CREATE POLICY "Service role can manage events"
ON "Event" FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================
-- User Policies (own data + admin)
-- ============================================

CREATE POLICY "Users can read own profile"
ON "User" FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Service role can manage users"
ON "User" FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================
-- Order Policies (own orders + admin)
-- ============================================

CREATE POLICY "Users can read own orders"
ON "Order" FOR SELECT
TO authenticated
USING (auth.uid()::text = "customer_email" OR auth.uid()::text = "userId");

CREATE POLICY "Service role can manage orders"
ON "Order" FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================
-- OrderItem Policies
-- ============================================

CREATE POLICY "Service role can manage order items"
ON "OrderItem" FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================
-- EventRegistration Policies
-- ============================================

CREATE POLICY "Public can read event registrations"
ON "EventRegistration" FOR SELECT
TO anon
USING (true);

CREATE POLICY "Authenticated users can register"
ON "EventRegistration" FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Users can delete own registration"
ON "EventRegistration" FOR DELETE
TO authenticated
USING (auth.uid()::text = "userId");

CREATE POLICY "Service role can manage all registrations"
ON "EventRegistration" FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================
-- NextAuth Policies (service role only)
-- ============================================

CREATE POLICY "Service role can manage next_auth users"
ON "next_auth"."users" FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "Service role can manage accounts"
ON "next_auth"."accounts" FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "Service role can manage sessions"
ON "next_auth"."sessions" FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "Service role can manage verification tokens"
ON "next_auth"."verification_tokens" FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================
-- Helper function for stock decrement (used in orders)
-- ============================================

CREATE OR REPLACE FUNCTION decrement_stock(row_id UUID, count INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE "Product"
  SET stock_quantity = stock_quantity - count
  WHERE id = row_id AND stock_quantity >= count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to service_role
GRANT EXECUTE ON FUNCTION decrement_stock TO service_role;

-- ============================================
-- Grant permissions
-- ============================================

GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;

GRANT USAGE ON SCHEMA next_auth TO service_role;
GRANT ALL ON ALL TABLES IN SCHEMA next_auth TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA next_auth TO service_role;
