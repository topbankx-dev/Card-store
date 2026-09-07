-- ============================================
-- Enable RLS and Create Policies for Card Store
-- ============================================
-- Tables: User, Product, Event, EventRegistration, Order, OrderItem
--         Account, Session, VerificationToken (NextAuth)
-- All id columns are TEXT (not UUID), so use ::text casts

-- Enable RLS on all tables
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Product" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Event" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "EventRegistration" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Order" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "OrderItem" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Account" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Session" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "VerificationToken" ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if re-running
DROP POLICY IF EXISTS "Public can read products" ON "Product";
DROP POLICY IF EXISTS "Authenticated users can read products" ON "Product";
DROP POLICY IF EXISTS "Service role can manage products" ON "Product";

DROP POLICY IF EXISTS "Public can read events" ON "Event";
DROP POLICY IF EXISTS "Service role can manage events" ON "Event";

DROP POLICY IF EXISTS "Users can read own profile" ON "User";
DROP POLICY IF EXISTS "Service role can manage users" ON "User";

DROP POLICY IF EXISTS "Users can read own orders" ON "Order";
DROP POLICY IF EXISTS "Service role can manage orders" ON "Order";

DROP POLICY IF EXISTS "Service role can manage order items" ON "OrderItem";

DROP POLICY IF EXISTS "Public can read event registrations" ON "EventRegistration";
DROP POLICY IF EXISTS "Authenticated users can register" ON "EventRegistration";
DROP POLICY IF EXISTS "Users can delete own registration" ON "EventRegistration";
DROP POLICY IF EXISTS "Service role can manage all registrations" ON "EventRegistration";

DROP POLICY IF EXISTS "Service role can manage accounts" ON "Account";
DROP POLICY IF EXISTS "Service role can manage sessions" ON "Session";
DROP POLICY IF EXISTS "Service role can manage verification tokens" ON "VerificationToken";

-- ============================================
-- Product Policies (public read, service role write)
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
-- Event Policies (public read, service role write)
-- ============================================

CREATE POLICY "Public can read events"
ON "Event" FOR SELECT
TO anon
USING (true);

CREATE POLICY "Authenticated users can read events"
ON "Event" FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Service role can manage events"
ON "Event" FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================
-- User Policies (own data + service role)
-- ============================================

-- No public read on User (password hashes should not be exposed)
-- Auth is handled server-side via service_role client

CREATE POLICY "Authenticated users can read own profile"
ON "User" FOR SELECT
TO authenticated
USING (auth.uid()::text = id::text);

CREATE POLICY "Service role can manage users"
ON "User" FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================
-- Order Policies (own orders + service role)
-- ============================================

CREATE POLICY "Users can read own orders"
ON "Order" FOR SELECT
TO authenticated
USING (auth.uid()::text = "customer_email");

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
USING (auth.uid()::text = "user_id"::text OR "user_id" IS NULL);

CREATE POLICY "Service role can manage all registrations"
ON "EventRegistration" FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================
-- NextAuth Tables (service role only)
-- ============================================

CREATE POLICY "Service role can manage accounts"
ON "Account" FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "Service role can manage sessions"
ON "Session" FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "Service role can manage verification tokens"
ON "VerificationToken" FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================
-- Helper function for stock decrement (used in orders)
-- ============================================

CREATE OR REPLACE FUNCTION decrement_stock(row_id TEXT, count INTEGER)
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
