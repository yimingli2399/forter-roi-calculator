import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import DashboardClient from './DashboardClient'

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
  const sessions = sessionsData || []
  const creatorIds = [...new Set(sessions.map((s) => s.created_by))]
  const { data: creators } = await supabase
    .from('users')
    .select('id, email')
    .in('id', creatorIds)

  // Create a map of creator ID to email
  const creatorMap = new Map(creators?.map((c) => [c.id, c.email]) || [])

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

