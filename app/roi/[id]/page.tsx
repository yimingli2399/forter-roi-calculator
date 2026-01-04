import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import ROICalculatorClient from './ROICalculatorClient'

export default async function ROIPage({ params }: { params: { id: string } }) {
  const supabase = createServerClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect('/login')
  }

  // Get session data
  const { data: sessionData, error } = await supabase
    .from('roi_sessions')
    .select('id, title, company_name, created_by, data, is_archived, is_favorite, created_at, updated_at')
    .eq('id', params.id)
    .single()

  if (error || !sessionData) {
    console.error('Failed to load session:', error)
    redirect('/dashboard')
  }

  // Log session data for debugging
  console.log('Loaded session data:', {
    id: sessionData.id,
    title: sessionData.title,
    company_name: sessionData.company_name,
  })

  // RLS policies handle access control
  // No need to check organization since it's removed

  // Log view action
  await supabase.from('audit_logs').insert({
    user_id: session.user.id,
    session_id: params.id,
    action: 'view',
  })

  return <ROICalculatorClient sessionData={sessionData} />
}

