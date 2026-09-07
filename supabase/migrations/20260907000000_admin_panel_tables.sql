-- Admin Panel Database Schema
-- Run this migration in your Supabase SQL editor

-- ============================================
-- PROMO CODES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS "PromoCode" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    discount_type VARCHAR(20) NOT NULL CHECK (discount_type IN ('PERCENTAGE', 'FIXED')),
    discount_value DECIMAL(10, 2) NOT NULL,
    max_uses INTEGER DEFAULT NULL,
    used_count INTEGER DEFAULT 0,
    min_order_amount DECIMAL(10, 2) DEFAULT 0,
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES "User"(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- AUDIT LOG TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS "AuditLog" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES "User"(id) NOT NULL,
    action VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID,
    details JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- ORDER NOTES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS "OrderNote" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES "Order"(id) ON DELETE CASCADE NOT NULL,
    admin_id UUID REFERENCES "User"(id) NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- CUSTOMER NOTES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS "CustomerNote" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES "User"(id) ON DELETE CASCADE NOT NULL,
    admin_id UUID REFERENCES "User"(id) NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- STOCK ALERTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS "StockAlert" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES "Product"(id) ON DELETE CASCADE NOT NULL,
    threshold INTEGER DEFAULT 5,
    is_active BOOLEAN DEFAULT true,
    last_triggered_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- ADD COLUMNS TO ORDER TABLE
-- ============================================
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS tracking_number VARCHAR(100);
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS shipped_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS promo_code_id UUID REFERENCES "PromoCode"(id);
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(10, 2) DEFAULT 0;

-- ============================================
-- ADD COLUMN TO USER TABLE
-- ============================================
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN DEFAULT false;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMP WITH TIME ZONE;

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_promo_code_active ON "PromoCode"(is_active);
CREATE INDEX IF NOT EXISTS idx_promo_code_code ON "PromoCode"(code);
CREATE INDEX IF NOT EXISTS idx_audit_log_user_id ON "AuditLog"(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_entity ON "AuditLog"(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON "AuditLog"(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON "AuditLog"(action);
CREATE INDEX IF NOT EXISTS idx_order_note_order_id ON "OrderNote"(order_id);
CREATE INDEX IF NOT EXISTS idx_customer_note_customer_id ON "CustomerNote"(customer_id);
CREATE INDEX IF NOT EXISTS idx_order_tracking ON "Order"(tracking_number);
CREATE INDEX IF NOT EXISTS idx_order_status ON "Order"(status);
CREATE INDEX IF NOT EXISTS idx_order_created_at ON "Order"(created_at DESC);

-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================

-- Enable RLS on new tables
ALTER TABLE "PromoCode" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AuditLog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "OrderNote" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CustomerNote" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "StockAlert" ENABLE ROW LEVEL SECURITY;

-- Admin-only policies for PromoCode
CREATE POLICY "Admin full access to PromoCode"
ON "PromoCode" FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM "User"
    WHERE id = auth.uid() AND role = 'ADMIN'
  )
);

-- Admin-only read for AuditLog (no INSERT/UPDATE/DELETE for audit logs)
CREATE POLICY "Admin read AuditLog"
ON "AuditLog" FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM "User"
    WHERE id = auth.uid() AND role = 'ADMIN'
  )
);

-- Admin-only policies for OrderNote
CREATE POLICY "Admin full access to OrderNote"
ON "OrderNote" FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM "User"
    WHERE id = auth.uid() AND role = 'ADMIN'
  )
);

-- Admin-only policies for CustomerNote
CREATE POLICY "Admin full access to CustomerNote"
ON "CustomerNote" FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM "User"
    WHERE id = auth.uid() AND role = 'ADMIN'
  )
);

-- Admin-only policies for StockAlert
CREATE POLICY "Admin full access to StockAlert"
ON "StockAlert" FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM "User"
    WHERE id = auth.uid() AND role = 'ADMIN'
  )
);

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to increment stock (for refunds)
CREATE OR REPLACE FUNCTION increment_stock(row_id UUID, count INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE "Product"
  SET stock_quantity = stock_quantity + count
  WHERE id = row_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to decrement stock (for orders)
CREATE OR REPLACE FUNCTION decrement_stock(row_id UUID, count INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE "Product"
  SET stock_quantity = stock_quantity - count
  WHERE id = row_id AND stock_quantity >= count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- VERIFY TABLES CREATED
-- ============================================
SELECT 'PromoCode' as table_name, COUNT(*) as row_count FROM "PromoCode"
UNION ALL
SELECT 'AuditLog', COUNT(*) FROM "AuditLog"
UNION ALL
SELECT 'OrderNote', COUNT(*) FROM "OrderNote"
UNION ALL
SELECT 'CustomerNote', COUNT(*) FROM "CustomerNote"
UNION ALL
SELECT 'StockAlert', COUNT(*) FROM "StockAlert";
