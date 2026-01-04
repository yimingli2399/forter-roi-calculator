-- Quick fix for organizations INSERT policy
-- Run this in Supabase SQL Editor

-- Drop existing organizations policies
DROP POLICY IF EXISTS "Users can view their own organization" ON organizations;
DROP POLICY IF EXISTS "Authenticated users can create organizations" ON organizations;
DROP POLICY IF EXISTS "Authenticated users can view all organizations" ON organizations;
DROP POLICY IF EXISTS "Authenticated users can update organizations" ON organizations;

-- Create simple policies for organizations
-- 認証されたユーザーは全員、すべての組織情報を見られる
CREATE POLICY "Authenticated users can view all organizations"
  ON organizations FOR SELECT
  USING (auth.role() = 'authenticated');

-- 認証されたユーザーは組織を作成できる（重要：これがないとINSERTできない）
CREATE POLICY "Authenticated users can create organizations"
  ON organizations FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- 認証されたユーザーは組織を更新できる
CREATE POLICY "Authenticated users can update organizations"
  ON organizations FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

