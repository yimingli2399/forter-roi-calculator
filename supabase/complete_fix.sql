-- Complete fix for RLS infinite recursion and missing policies
-- Run this in Supabase SQL Editor

-- Step 1: Drop ALL existing policies (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view users in their organization" ON users;
DROP POLICY IF EXISTS "Users can view their own record" ON users;
DROP POLICY IF EXISTS "Users can insert their own record" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
DROP POLICY IF EXISTS "Users can view their own organization" ON organizations;
DROP POLICY IF EXISTS "Authenticated users can create organizations" ON organizations;

-- Step 2: Fix users policies
-- Allow users to view their own record (no recursion)
CREATE POLICY "Users can view their own record"
  ON users FOR SELECT
  USING (id = auth.uid());

-- Allow users to view users in their organization (fixed to avoid recursion)
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

-- Allow users to insert their own record (for signup via trigger)
CREATE POLICY "Users can insert their own record"
  ON users FOR INSERT
  WITH CHECK (id = auth.uid());

-- Step 3: Fix organizations policies
-- Allow users to view their own organization (fixed to avoid recursion)
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

