-- Admin Invite System
-- Run this migration in your Supabase SQL editor

-- ============================================
-- ADMIN INVITES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS "AdminInvite" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL,
    token VARCHAR(255) UNIQUE NOT NULL,
    invited_by UUID REFERENCES "User"(id) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACCEPTED', 'EXPIRED', 'CANCELLED')),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
    accepted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_admin_invite_email ON "AdminInvite"(email);
CREATE INDEX IF NOT EXISTS idx_admin_invite_token ON "AdminInvite"(token);
CREATE INDEX IF NOT EXISTS idx_admin_invite_status ON "AdminInvite"(status);
CREATE INDEX IF NOT EXISTS idx_admin_invite_invited_by ON "AdminInvite"(invited_by);

-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================
ALTER TABLE "AdminInvite" ENABLE ROW LEVEL SECURITY;

-- Admins can manage all invites
CREATE POLICY "Admin manage AdminInvite"
ON "AdminInvite" FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM "User"
    WHERE id = auth.uid() AND role = 'ADMIN'
  )
);

-- Invited users can accept their invite (read by token)
CREATE POLICY "Invited user can read own invite"
ON "AdminInvite" FOR SELECT
TO authenticated
USING (
  email = (SELECT email FROM "User" WHERE id = auth.uid())
);

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to check if an invite is valid
CREATE OR REPLACE FUNCTION is_invite_valid(invite_token VARCHAR)
RETURNS BOOLEAN AS $$
DECLARE
  valid BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM "AdminInvite"
    WHERE token = invite_token
    AND status = 'PENDING'
    AND expires_at > NOW()
  ) INTO valid;

  RETURN valid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to accept an invite and update user role
CREATE OR REPLACE FUNCTION accept_admin_invite(invite_token VARCHAR, user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  invite_record RECORD;
BEGIN
  -- Get the invite
  SELECT * INTO invite_record
  FROM "AdminInvite"
  WHERE token = invite_token AND status = 'PENDING' AND expires_at > NOW();

  IF invite_record IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Check if user email matches invite email
  IF (SELECT email FROM "User" WHERE id = user_id) != invite_record.email THEN
    RETURN FALSE;
  END IF;

  -- Update user role to ADMIN
  UPDATE "User"
  SET role = 'ADMIN'
  WHERE id = user_id;

  -- Update invite status
  UPDATE "AdminInvite"
  SET status = 'ACCEPTED', accepted_at = NOW()
  WHERE id = invite_record.id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- AUTO-EXPIRE OLD INVITES
-- ============================================
UPDATE "AdminInvite"
SET status = 'EXPIRED'
WHERE status = 'PENDING' AND expires_at < NOW();

-- ============================================
-- VERIFY
-- ============================================
SELECT 'AdminInvite' as table_name, COUNT(*) as row_count FROM "AdminInvite";
