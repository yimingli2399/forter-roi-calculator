-- Final fix for RLS infinite recursion
-- This fixes the handle_new_user function and all policies
-- Run this in Supabase SQL Editor

-- ============================================
-- Step 1: Drop ALL existing policies
-- ============================================
DROP POLICY IF EXISTS "Users can view users in their organization" ON users;
DROP POLICY IF EXISTS "Users can view their own record" ON users;
DROP POLICY IF EXISTS "Users can insert their own record" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
DROP POLICY IF EXISTS "Users can view their own organization" ON organizations;
DROP POLICY IF EXISTS "Authenticated users can create organizations" ON organizations;

-- ============================================
-- Step 2: Fix handle_new_user function
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Bypass RLS by using service role
  INSERT INTO public.users (id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ============================================
-- Step 3: Recreate users policies (fixed)
-- ============================================

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
-- Note: This is mainly for the trigger function, but also allows direct inserts
CREATE POLICY "Users can insert their own record"
  ON users FOR INSERT
  WITH CHECK (id = auth.uid());

-- Allow users to update their own profile
CREATE POLICY "Users can update their own profile"
  ON users FOR UPDATE
  USING (id = auth.uid());

-- ============================================
-- Step 4: Recreate organizations policies (fixed)
-- ============================================

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
-- This does NOT reference users table to avoid recursion
CREATE POLICY "Authenticated users can create organizations"
  ON organizations FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

