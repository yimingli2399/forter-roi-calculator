import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/lib/supabase/database.types'

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

  type AuditLogInsert = Database['public']['Tables']['audit_logs']['Insert']
  const insertData: AuditLogInsert = {
    user_id: userId,
    session_id: sessionId,
    action,
    user_agent: userAgent,
    metadata: metadata || null,
  }
  const { error } = await supabase.from('audit_logs').insert(insertData as any)

  if (error) {
    console.error('Failed to log audit action:', error)
    // Don't throw - audit logging should not break the app
  }
}

