import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import DashboardClient from './DashboardClient'
import type { Database } from '@/lib/supabase/database.types'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const supabase = createServerClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect('/login')
  }

  // Get user data
  const { data: user } = await supabase
    .from('users')
    .select('*')
    .eq('id', session.user.id)
    .single()

  if (!user) {
    redirect('/login')
  }

  // Get sessions with creator information (all sessions)
  const { data: sessionsData } = await supabase
    .from('roi_sessions')
    .select('*')
    .eq('is_archived', false)
    .order('updated_at', { ascending: false })
    .limit(50)

  // Get creator information for each session
  type SessionRow = Database['public']['Tables']['roi_sessions']['Row']
  const sessions = (sessionsData as SessionRow[]) || []
  const creatorIds = [...new Set(sessions.map((s) => s.created_by))]
  const { data: creators } = await supabase
    .from('users')
    .select('id, email')
    .in('id', creatorIds)

  // Create a map of creator ID to email
  type UserRow = Database['public']['Tables']['users']['Row']
  const typedCreators = (creators as UserRow[]) || []
  const creatorMap = new Map(typedCreators.map((c) => [c.id, c.email]))

  // Add creator email to each session
  const sessionsWithCreators = sessions.map((session) => ({
    ...session,
    creator_email: creatorMap.get(session.created_by) || '不明',
  }))

  return (
    <DashboardClient
      user={user}
      initialSessions={sessionsWithCreators || []}
    />
  )
}

