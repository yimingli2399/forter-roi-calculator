-- Fix for infinite recursion in RLS policies
-- Run this in Supabase SQL Editor after the main schema

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can view users in their organization" ON users;
DROP POLICY IF EXISTS "Users can view their own organization" ON organizations;

-- Recreate users policies with fixed logic
CREATE POLICY "Users can view their own record"
  ON users FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "Users can view users in their organization"
  ON users FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.organization_id IS NOT NULL
      AND users.organization_id = u.organization_id
    )
  );

-- Allow users to insert their own record (for signup)
CREATE POLICY "Users can insert their own record"
  ON users FOR INSERT
  WITH CHECK (id = auth.uid());

-- Recreate organizations policy with fixed logic
CREATE POLICY "Users can view their own organization"
  ON organizations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.organization_id = organizations.id
    )
  );

-- Allow authenticated users to create organizations (for signup)
CREATE POLICY "Authenticated users can create organizations"
  ON organizations FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

