-- Run this separate file for indexes
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
