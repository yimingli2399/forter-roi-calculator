-- Remove organization concept completely
-- Run this in Supabase SQL Editor

-- ============================================
-- Step 1: Drop all policies that reference organizations
-- ============================================
DROP POLICY IF EXISTS "Users can view users in their organization" ON users;
DROP POLICY IF EXISTS "Users can view their own record" ON users;
DROP POLICY IF EXISTS "Users can insert their own record" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
DROP POLICY IF EXISTS "Authenticated users can view all users" ON users;
DROP POLICY IF EXISTS "Authenticated users can insert their own record" ON users;
DROP POLICY IF EXISTS "Authenticated users can update their own record" ON users;

DROP POLICY IF EXISTS "Users can view their own organization" ON organizations;
DROP POLICY IF EXISTS "Authenticated users can create organizations" ON organizations;
DROP POLICY IF EXISTS "Authenticated users can view all organizations" ON organizations;
DROP POLICY IF EXISTS "Authenticated users can update organizations" ON organizations;

DROP POLICY IF EXISTS "Users can view sessions from their organization" ON roi_sessions;
DROP POLICY IF EXISTS "Users can create sessions in their organization" ON roi_sessions;
DROP POLICY IF EXISTS "Users can update sessions they created or have write access" ON roi_sessions;
DROP POLICY IF EXISTS "Users can delete sessions they created" ON roi_sessions;
DROP POLICY IF EXISTS "Authenticated users can view all sessions" ON roi_sessions;
DROP POLICY IF EXISTS "Authenticated users can create sessions" ON roi_sessions;
DROP POLICY IF EXISTS "Authenticated users can update sessions" ON roi_sessions;
DROP POLICY IF EXISTS "Authenticated users can delete sessions" ON roi_sessions;

DROP POLICY IF EXISTS "Users can view versions of accessible sessions" ON roi_versions;
DROP POLICY IF EXISTS "Users can create versions for accessible sessions" ON roi_versions;
DROP POLICY IF EXISTS "Authenticated users can view all versions" ON roi_versions;
DROP POLICY IF EXISTS "Authenticated users can create versions" ON roi_versions;

DROP POLICY IF EXISTS "Users can view shares for accessible sessions" ON session_shares;
DROP POLICY IF EXISTS "Users can create shares for sessions they created" ON session_shares;
DROP POLICY IF EXISTS "Authenticated users can view all shares" ON session_shares;
DROP POLICY IF EXISTS "Authenticated users can create shares" ON session_shares;

DROP POLICY IF EXISTS "Users can view their own audit logs" ON audit_logs;
DROP POLICY IF EXISTS "System can insert audit logs" ON audit_logs;
DROP POLICY IF EXISTS "Authenticated users can view all audit logs" ON audit_logs;
DROP POLICY IF EXISTS "Authenticated users can insert audit logs" ON audit_logs;

-- ============================================
-- Step 2: Drop foreign key constraints
-- ============================================
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_organization_id_fkey;
ALTER TABLE roi_sessions DROP CONSTRAINT IF EXISTS roi_sessions_organization_id_fkey;

-- ============================================
-- Step 3: Remove organization_id columns
-- ============================================
ALTER TABLE users DROP COLUMN IF EXISTS organization_id;
ALTER TABLE roi_sessions DROP COLUMN IF EXISTS organization_id;

-- ============================================
-- Step 4: Drop organizations table
-- ============================================
DROP TABLE IF EXISTS organizations CASCADE;

-- ============================================
-- Step 5: Recreate simple policies (no organization concept)
-- ============================================

-- Users policies
CREATE POLICY "Authenticated users can view all users"
  ON users FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert their own record"
  ON users FOR INSERT
  WITH CHECK (id = auth.uid());

CREATE POLICY "Authenticated users can update their own record"
  ON users FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- ROI Sessions policies
CREATE POLICY "Authenticated users can view all sessions"
  ON roi_sessions FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can create sessions"
  ON roi_sessions FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update sessions"
  ON roi_sessions FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete sessions"
  ON roi_sessions FOR DELETE
  USING (auth.role() = 'authenticated');

-- ROI Versions policies
CREATE POLICY "Authenticated users can view all versions"
  ON roi_versions FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can create versions"
  ON roi_versions FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Session Shares policies
CREATE POLICY "Authenticated users can view all shares"
  ON session_shares FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can create shares"
  ON session_shares FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Audit Logs policies
CREATE POLICY "Authenticated users can view all audit logs"
  ON audit_logs FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert audit logs"
  ON audit_logs FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

