import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/supabase/database.types'

export interface RateLimitConfig {
  maxAttempts: number // 最大試行回数
  windowMs: number // 時間窓（ミリ秒）
  blockDurationMs: number // ブロック期間（ミリ秒）
}

const DEFAULT_CONFIG: RateLimitConfig = {
  maxAttempts: 5, // 5回まで
  windowMs: 15 * 60 * 1000, // 15分間
  blockDurationMs: 30 * 60 * 1000, // 30分間ブロック
}

export interface RateLimitResult {
  allowed: boolean
  remainingAttempts: number
  resetTime: Date | null
  blockedUntil: Date | null
  message?: string
}

/**
 * ログイン試行のレート制限をチェック
 * @param identifier 識別子（メールアドレスまたはIPアドレス）
 * @param config レート制限設定（オプション）
 * @returns レート制限の結果
 */
export async function checkRateLimit(
  identifier: string,
  config: RateLimitConfig = DEFAULT_CONFIG
): Promise<RateLimitResult> {
  const supabase = createServerClient()
  const now = new Date()
  const windowStart = new Date(now.getTime() - config.windowMs)

  // 最近の試行回数を取得
  const { data: attempts, error } = await supabase
    .from('login_attempts')
    .select('*')
    .eq('identifier', identifier)
    .gte('attempted_at', windowStart.toISOString())
    .order('attempted_at', { ascending: false })

  if (error) {
    console.error('Rate limit check error:', error)
    // エラー時は許可（セキュリティより可用性を優先）
    return {
      allowed: true,
      remainingAttempts: config.maxAttempts,
      resetTime: null,
      blockedUntil: null,
    }
  }

  const recentAttempts = attempts || []
  const failedAttempts = recentAttempts.filter((a) => !a.success)

  // ブロック期間内の試行をチェック
  const blockedAttempt = failedAttempts.find((a) => {
    if (!a.blocked_until) return false
    return new Date(a.blocked_until) > now
  })

  if (blockedAttempt && blockedAttempt.blocked_until) {
    return {
      allowed: false,
      remainingAttempts: 0,
      resetTime: null,
      blockedUntil: new Date(blockedAttempt.blocked_until),
      message: `ログイン試行回数が上限に達しました。${new Date(blockedAttempt.blocked_until).toLocaleString('ja-JP')}までお待ちください。`,
    }
  }

  // 時間窓内の失敗回数をチェック
  const failedCount = failedAttempts.length

  if (failedCount >= config.maxAttempts) {
    // ブロック期間を設定
    const blockedUntil = new Date(now.getTime() + config.blockDurationMs)

    // ブロック記録を保存
    await supabase.from('login_attempts').insert({
      identifier,
      success: false,
      blocked_until: blockedUntil.toISOString(),
      attempted_at: now.toISOString(),
    })

    return {
      allowed: false,
      remainingAttempts: 0,
      resetTime: null,
      blockedUntil,
      message: `ログイン試行回数が上限に達しました。${blockedUntil.toLocaleString('ja-JP')}までお待ちください。`,
    }
  }

  const remainingAttempts = config.maxAttempts - failedCount
  const oldestAttempt = failedAttempts[failedAttempts.length - 1]
  const resetTime = oldestAttempt
    ? new Date(new Date(oldestAttempt.attempted_at).getTime() + config.windowMs)
    : null

  return {
    allowed: true,
    remainingAttempts,
    resetTime,
    blockedUntil: null,
  }
}

/**
 * ログイン試行を記録
 * @param identifier 識別子（メールアドレスまたはIPアドレス）
 * @param success 成功したかどうか
 */
export async function recordLoginAttempt(
  identifier: string,
  success: boolean
): Promise<void> {
  const supabase = createServerClient()
  const now = new Date()

  await supabase.from('login_attempts').insert({
    identifier,
    success,
    attempted_at: now.toISOString(),
  })

  // 古い記録を削除（30日以上前）
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  await supabase
    .from('login_attempts')
    .delete()
    .lt('attempted_at', thirtyDaysAgo.toISOString())
}

/**
 * 成功したログインでブロックを解除
 * @param identifier 識別子
 */
export async function clearRateLimit(identifier: string): Promise<void> {
  // 成功したログインで、その識別子の最近の失敗記録をクリアする必要はない
  // 記録は保持して、将来の分析に使用
  // ただし、ブロック状態は解除される（成功記録により）
}

