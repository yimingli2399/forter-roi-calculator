import { createClient } from '@/lib/supabase/client'

export type AuditAction = 'view' | 'edit' | 'delete' | 'share' | 'create' | 'export'

export async function logAuditAction(
  userId: string,
  sessionId: string | null,
  action: AuditAction,
  metadata?: Record<string, any>
) {
  const supabase = createClient()

  // Get client IP and user agent (if available)
  const userAgent = typeof window !== 'undefined' ? window.navigator.userAgent : null

  const { error } = await supabase.from('audit_logs').insert({
    user_id: userId,
    session_id: sessionId,
    action,
    user_agent: userAgent,
    metadata: metadata || null,
  })

  if (error) {
    console.error('Failed to log audit action:', error)
    // Don't throw - audit logging should not break the app
  }
}

