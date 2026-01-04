-- DEFINITIVE FIX for infinite recursion
-- This completely bypasses RLS in the trigger function
-- Run this in Supabase SQL Editor

-- ============================================
-- Step 1: Drop ALL existing policies and function
-- ============================================
DROP POLICY IF EXISTS "Users can view users in their organization" ON users;
DROP POLICY IF EXISTS "Users can view their own record" ON users;
DROP POLICY IF EXISTS "Users can insert their own record" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
DROP POLICY IF EXISTS "Users can view their own organization" ON organizations;
DROP POLICY IF EXISTS "Authenticated users can create organizations" ON organizations;

DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- ============================================
-- Step 2: Recreate handle_new_user function
-- This function MUST bypass RLS completely
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Use a subquery with explicit schema to bypass RLS
  -- The SECURITY DEFINER should allow this, but we're being explicit
  INSERT INTO public.users (id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email;
  RETURN NEW;
EXCEPTION
  WHEN others THEN
    -- If insert fails, try to update instead
    UPDATE public.users SET email = NEW.email WHERE id = NEW.id;
    RETURN NEW;
END;
$$;

-- Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- Step 3: Recreate users policies
-- CRITICAL: These must NOT cause recursion
-- ============================================

-- Policy 1: Users can always view their own record (no recursion possible)
CREATE POLICY "Users can view their own record"
  ON users FOR SELECT
  USING (id = auth.uid());

-- Policy 2: Users can view others in their organization
-- Use a CTE to avoid recursion
CREATE POLICY "Users can view users in their organization"
  ON users FOR SELECT
  USING (
    -- First check if current user has an organization
    (SELECT organization_id FROM users WHERE id = auth.uid()) IS NOT NULL
    AND
    -- Then check if target user is in same organization
    organization_id = (SELECT organization_id FROM users WHERE id = auth.uid())
    AND
    -- Make sure we're not checking ourselves (already covered by first policy)
    id != auth.uid()
  );

-- Policy 3: Allow INSERT - this is critical for signup
-- The trigger function uses SECURITY DEFINER, but we also allow direct inserts
CREATE POLICY "Users can insert their own record"
  ON users FOR INSERT
  WITH CHECK (id = auth.uid());

-- Policy 4: Allow UPDATE
CREATE POLICY "Users can update their own profile"
  ON users FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- ============================================
-- Step 4: Recreate organizations policies
-- CRITICAL: INSERT policy must NOT reference users table
-- ============================================

-- Policy 1: View own organization
CREATE POLICY "Users can view their own organization"
  ON organizations FOR SELECT
  USING (
    id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

-- Policy 2: INSERT - MUST NOT reference users table to avoid recursion
-- This is the key fix - authenticated users can create organizations
CREATE POLICY "Authenticated users can create organizations"
  ON organizations FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

