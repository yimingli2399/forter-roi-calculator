-- SIMPLE FIX: 社内専用のシンプルなセキュリティ設定
-- 認証されたユーザーは全員、すべてのデータにアクセス可能
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
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.users (id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email;
  RETURN NEW;
EXCEPTION
  WHEN others THEN
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
-- Step 3: Simple users policies (社内専用)
-- 認証されたユーザーは全員、すべてのユーザー情報にアクセス可能
-- ============================================

-- 認証されたユーザーは全員、すべてのユーザー情報を見られる
CREATE POLICY "Authenticated users can view all users"
  ON users FOR SELECT
  USING (auth.role() = 'authenticated');

-- 認証されたユーザーは自分のレコードを挿入できる
CREATE POLICY "Authenticated users can insert their own record"
  ON users FOR INSERT
  WITH CHECK (id = auth.uid());

-- 認証されたユーザーは自分のレコードを更新できる
CREATE POLICY "Authenticated users can update their own record"
  ON users FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- ============================================
-- Step 4: Simple organizations policies (社内専用)
-- 認証されたユーザーは全員、すべての組織情報にアクセス可能
-- ============================================

-- 認証されたユーザーは全員、すべての組織情報を見られる
CREATE POLICY "Authenticated users can view all organizations"
  ON organizations FOR SELECT
  USING (auth.role() = 'authenticated');

-- 認証されたユーザーは組織を作成できる
CREATE POLICY "Authenticated users can create organizations"
  ON organizations FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- 認証されたユーザーは組織を更新できる（必要に応じて）
CREATE POLICY "Authenticated users can update organizations"
  ON organizations FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- ============================================
-- Step 5: ROI Sessions policies (社内専用)
-- 認証されたユーザーは全員、すべてのセッションにアクセス可能
-- ============================================

-- 既存のROI Sessionsポリシーを削除
DROP POLICY IF EXISTS "Users can view sessions from their organization" ON roi_sessions;
DROP POLICY IF EXISTS "Users can create sessions in their organization" ON roi_sessions;
DROP POLICY IF EXISTS "Users can update sessions they created or have write access" ON roi_sessions;
DROP POLICY IF EXISTS "Users can delete sessions they created" ON roi_sessions;

-- 認証されたユーザーは全員、すべてのセッションを見られる
CREATE POLICY "Authenticated users can view all sessions"
  ON roi_sessions FOR SELECT
  USING (auth.role() = 'authenticated');

-- 認証されたユーザーはセッションを作成できる
CREATE POLICY "Authenticated users can create sessions"
  ON roi_sessions FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- 認証されたユーザーはセッションを更新できる
CREATE POLICY "Authenticated users can update sessions"
  ON roi_sessions FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- 認証されたユーザーはセッションを削除できる
CREATE POLICY "Authenticated users can delete sessions"
  ON roi_sessions FOR DELETE
  USING (auth.role() = 'authenticated');

-- ============================================
-- Step 6: ROI Versions policies (社内専用)
-- ============================================

DROP POLICY IF EXISTS "Users can view versions of accessible sessions" ON roi_versions;
DROP POLICY IF EXISTS "Users can create versions for accessible sessions" ON roi_versions;

CREATE POLICY "Authenticated users can view all versions"
  ON roi_versions FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can create versions"
  ON roi_versions FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- ============================================
-- Step 7: Session Shares policies (社内専用)
-- ============================================

DROP POLICY IF EXISTS "Users can view shares for accessible sessions" ON session_shares;
DROP POLICY IF EXISTS "Users can create shares for sessions they created" ON session_shares;

CREATE POLICY "Authenticated users can view all shares"
  ON session_shares FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can create shares"
  ON session_shares FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- ============================================
-- Step 8: Audit Logs policies (社内専用)
-- ============================================

DROP POLICY IF EXISTS "Users can view their own audit logs" ON audit_logs;
DROP POLICY IF EXISTS "System can insert audit logs" ON audit_logs;

CREATE POLICY "Authenticated users can view all audit logs"
  ON audit_logs FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert audit logs"
  ON audit_logs FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

