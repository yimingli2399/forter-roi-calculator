import { NextRequest, NextResponse } from 'next/server'
import { recordLoginAttempt } from '@/lib/utils/rateLimit'

export const dynamic = 'force-dynamic'

/**
 * ログイン試行を記録するAPI
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, success } = body

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

    // ログイン試行を記録
    await recordLoginAttempt(email.toLowerCase(), success === true)
    await recordLoginAttempt(ipAddress, success === true)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Record login attempt error:', error)
    return NextResponse.json(
      { error: '記録処理中にエラーが発生しました' },
      { status: 500 }
    )
  }
}


