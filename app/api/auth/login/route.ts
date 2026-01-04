import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit } from '@/lib/utils/rateLimit'

export const dynamic = 'force-dynamic'

/**
 * ログインレート制限チェックAPI
 * ログイン試行前にレート制限をチェックするエンドポイント
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = body

    if (!email) {
      return NextResponse.json(
        { error: 'メールアドレスが必要です' },
        { status: 400 }
      )
    }

    // IPアドレスを取得
    const ipAddress =
      request.headers.get('x-forwarded-for')?.split(',')[0] ||
      request.headers.get('x-real-ip') ||
      'unknown'

    // レート制限をチェック（メールアドレスとIPアドレスの両方をチェック）
    const emailCheck = await checkRateLimit(email.toLowerCase())
    const ipCheck = await checkRateLimit(ipAddress)

    if (!emailCheck.allowed) {
      return NextResponse.json(
        {
          error: emailCheck.message || 'ログイン試行回数が上限に達しました',
          rateLimit: {
            remainingAttempts: emailCheck.remainingAttempts,
            resetTime: emailCheck.resetTime,
            blockedUntil: emailCheck.blockedUntil,
          },
        },
        { status: 429 }
      )
    }

    if (!ipCheck.allowed) {
      return NextResponse.json(
        {
          error: ipCheck.message || 'ログイン試行回数が上限に達しました',
          rateLimit: {
            remainingAttempts: ipCheck.remainingAttempts,
            resetTime: ipCheck.resetTime,
            blockedUntil: ipCheck.blockedUntil,
          },
        },
        { status: 429 }
      )
    }

    // レート制限が許可されている場合、クライアント側でログインを試行することを許可
    return NextResponse.json({
      allowed: true,
      rateLimit: {
        remainingAttempts: Math.min(emailCheck.remainingAttempts, ipCheck.remainingAttempts),
        resetTime: emailCheck.resetTime || ipCheck.resetTime,
      },
    })
  } catch (error) {
    console.error('Rate limit check error:', error)
    return NextResponse.json(
      { error: 'レート制限チェック中にエラーが発生しました' },
      { status: 500 }
    )
  }
}

