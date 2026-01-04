'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      // まずレート制限をチェック
      const rateLimitResponse = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
        }),
      })

      const rateLimitData = await rateLimitResponse.json()

      if (!rateLimitResponse.ok) {
        // レート制限エラー（429）
        let errorMessage = rateLimitData.error || 'ログイン試行回数が上限に達しました'
        
        if (rateLimitData.rateLimit) {
          const { remainingAttempts, resetTime, blockedUntil } = rateLimitData.rateLimit
          
          if (blockedUntil) {
            const blockedDate = new Date(blockedUntil)
            errorMessage = `ログイン試行回数が上限に達しました。${blockedDate.toLocaleString('ja-JP')}までお待ちください。`
          } else if (remainingAttempts !== undefined && remainingAttempts >= 0) {
            if (remainingAttempts === 0) {
              errorMessage = 'ログイン試行回数が上限に達しました。しばらく時間をおいてから再度お試しください。'
            } else {
              errorMessage = `${errorMessage}（残り試行回数: ${remainingAttempts}回）`
            }
          }
        }
        
        setError(errorMessage)
        setLoading(false)
        return
      }

      // レート制限チェックが通過した場合、Supabaseでログインを試行
      const supabase = createClient()
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.toLowerCase(),
        password,
      })

      if (error) {
        // 失敗を記録（APIルートで記録）
        await fetch('/api/auth/login/record', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: email.toLowerCase(),
            success: false,
          }),
        })

        let errorMessage = error.message
        if (rateLimitData.rateLimit) {
          const { remainingAttempts } = rateLimitData.rateLimit
          if (remainingAttempts !== undefined && remainingAttempts > 0) {
            errorMessage = `${errorMessage}（残り試行回数: ${remainingAttempts - 1}回）`
          }
        }
        
        setError(errorMessage)
        setLoading(false)
        return
      }

      // 成功を記録（APIルートで記録）
      await fetch('/api/auth/login/record', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.toLowerCase(),
          success: true,
        }),
      })

      // ログイン成功
      const redirectTo = searchParams.get('redirect') || '/dashboard'
      router.push(redirectTo)
      router.refresh()
    } catch (error) {
      console.error('Login error:', error)
      setError('ログイン処理中にエラーが発生しました')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Forter ROI Calculator
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            アカウントにログイン
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="text-sm text-red-800">{error}</div>
            </div>
          )}
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email" className="sr-only">
                メールアドレス
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="メールアドレス"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                パスワード
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="パスワード"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'ログイン中...' : 'ログイン'}
            </button>
          </div>

          <div className="text-center">
            <Link
              href="/register"
              className="text-sm text-blue-600 hover:text-blue-500"
            >
              新規登録はこちら
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}

