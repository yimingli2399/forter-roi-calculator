-- Forter ROI Calculator Database Schema
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Organizations table
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  role TEXT CHECK (role IN ('admin', 'member', 'viewer')) DEFAULT 'member',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ROI Sessions table
CREATE TABLE IF NOT EXISTS roi_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL NOT NULL,
  data JSONB NOT NULL DEFAULT '{}',
  is_archived BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Session versions (for version history)
CREATE TABLE IF NOT EXISTS roi_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES roi_sessions(id) ON DELETE CASCADE NOT NULL,
  version_number INTEGER NOT NULL,
  data JSONB NOT NULL,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Session shares (for sharing with specific users)
CREATE TABLE IF NOT EXISTS session_shares (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES roi_sessions(id) ON DELETE CASCADE NOT NULL,
  shared_with_user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  permission TEXT CHECK (permission IN ('read', 'write')) DEFAULT 'read',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(session_id, shared_with_user_id)
);

-- Audit logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  session_id UUID REFERENCES roi_sessions(id) ON DELETE SET NULL,
  action TEXT NOT NULL CHECK (action IN ('view', 'edit', 'delete', 'share', 'create', 'export')),
  ip_address INET,
  user_agent TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_organization ON users(organization_id);
CREATE INDEX IF NOT EXISTS idx_roi_sessions_organization ON roi_sessions(organization_id);
CREATE INDEX IF NOT EXISTS idx_roi_sessions_created_by ON roi_sessions(created_by);
CREATE INDEX IF NOT EXISTS idx_roi_versions_session ON roi_versions(session_id);
CREATE INDEX IF NOT EXISTS idx_session_shares_session ON session_shares(session_id);
CREATE INDEX IF NOT EXISTS idx_session_shares_user ON session_shares(shared_with_user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_session ON audit_logs(session_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

-- Row Level Security (RLS) Policies

-- Enable RLS on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE roi_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE roi_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Organizations policies
-- Fix: Avoid infinite recursion by using EXISTS instead of subquery
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

-- Users policies
-- Allow users to view their own record and users in their organization
-- Fix: Avoid infinite recursion by checking own ID first
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

CREATE POLICY "Users can update their own profile"
  ON users FOR UPDATE
  USING (id = auth.uid());

-- ROI Sessions policies
CREATE POLICY "Users can view sessions from their organization"
  ON roi_sessions FOR SELECT
  USING (
    organization_id = (SELECT organization_id FROM users WHERE id = auth.uid())
    OR id IN (
      SELECT session_id FROM session_shares
      WHERE shared_with_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create sessions in their organization"
  ON roi_sessions FOR INSERT
  WITH CHECK (
    organization_id = (SELECT organization_id FROM users WHERE id = auth.uid())
  );

CREATE POLICY "Users can update sessions they created or have write access"
  ON roi_sessions FOR UPDATE
  USING (
    created_by = auth.uid()
    OR id IN (
      SELECT session_id FROM session_shares
      WHERE shared_with_user_id = auth.uid()
      AND permission = 'write'
    )
  );

CREATE POLICY "Users can delete sessions they created"
  ON roi_sessions FOR DELETE
  USING (created_by = auth.uid());

-- ROI Versions policies
CREATE POLICY "Users can view versions of accessible sessions"
  ON roi_versions FOR SELECT
  USING (
    session_id IN (
      SELECT id FROM roi_sessions
      WHERE organization_id = (SELECT organization_id FROM users WHERE id = auth.uid())
      OR id IN (
        SELECT session_id FROM session_shares
        WHERE shared_with_user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can create versions for accessible sessions"
  ON roi_versions FOR INSERT
  WITH CHECK (
    session_id IN (
      SELECT id FROM roi_sessions
      WHERE organization_id = (SELECT organization_id FROM users WHERE id = auth.uid())
      OR id IN (
        SELECT session_id FROM session_shares
        WHERE shared_with_user_id = auth.uid()
        AND permission = 'write'
      )
    )
  );

-- Session Shares policies
CREATE POLICY "Users can view shares for accessible sessions"
  ON session_shares FOR SELECT
  USING (
    session_id IN (
      SELECT id FROM roi_sessions
      WHERE organization_id = (SELECT organization_id FROM users WHERE id = auth.uid())
      OR created_by = auth.uid()
    )
  );

CREATE POLICY "Users can create shares for sessions they created"
  ON session_shares FOR INSERT
  WITH CHECK (
    session_id IN (
      SELECT id FROM roi_sessions WHERE created_by = auth.uid()
    )
  );

-- Audit Logs policies
CREATE POLICY "Users can view their own audit logs"
  ON audit_logs FOR SELECT
  USING (
    user_id = auth.uid()
    OR session_id IN (
      SELECT id FROM roi_sessions
      WHERE organization_id = (SELECT organization_id FROM users WHERE id = auth.uid())
    )
  );

CREATE POLICY "System can insert audit logs"
  ON audit_logs FOR INSERT
  WITH CHECK (true);

-- Functions

-- Function to automatically create user record when auth user is created
-- Fix: Bypass RLS to avoid infinite recursion
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Temporarily disable RLS for this operation
  PERFORM set_config('role', 'postgres', true);
  INSERT INTO public.users (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create user record on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON organizations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_roi_sessions_updated_at
  BEFORE UPDATE ON roi_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

