'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function RegisterPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password !== confirmPassword) {
      setError('パスワードが一致しません')
      return
    }

    if (password.length < 8) {
      setError('パスワードは8文字以上である必要があります')
      return
    }

    setLoading(true)

    const supabase = createClient()
    
    // Sign up user
    // Note: Email confirmation should be disabled in Supabase settings
    // Authentication → Sign In / Providers → Email → "Enable email confirmations" → OFF
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: email.toLowerCase(),
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
      },
    })

    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    // ユーザーが作成されたか確認
    if (!authData.user) {
      setError('ユーザーの作成に失敗しました。もう一度お試しください。')
      setLoading(false)
      return
    }

    // Update user role (organization is no longer needed)
    const { error: userError } = await supabase
      .from('users')
      // @ts-ignore - Supabase type inference issue
      .update({ role: 'admin' })
      .eq('id', authData.user.id)

    if (userError) {
      setError('ユーザー情報の更新に失敗しました: ' + userError.message)
      setLoading(false)
      return
    }

    // メール確認が無効化されている場合、signUpの時点でセッションが作成される
    // authData.sessionを直接チェック
    if (authData.session) {
      // セッションが既に利用可能（メール確認が無効化されている）
      router.push('/dashboard')
      router.refresh()
      return
    }

    // セッションがまだない場合、少し待ってから再取得を試みる
    // （Supabaseの内部処理が完了するまで待つ）
    await new Promise(resolve => setTimeout(resolve, 500))
    
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (session) {
      // セッションが取得できた
      router.push('/dashboard')
      router.refresh()
      return
    }

    // セッションが取得できない場合、明示的にログインを試みる
    // （メール確認が無効化されていれば、これでログインできる）
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: email.toLowerCase(),
      password,
    })

    if (loginError) {
      // メール確認が必要な場合（Supabase設定で有効になっている）
      setError('メール確認が必要です。メールボックスを確認してください。\n\nメール確認を無効化するには、Supabaseダッシュボードで設定を変更してください。\n\n設定場所: Authentication → Sign In / Providers → Email → "Enable email confirmations" → OFF')
      setLoading(false)
      return
    }

    if (loginData.session) {
      // ログイン成功
      router.push('/dashboard')
      router.refresh()
    } else {
      setError('ログインに失敗しました。もう一度お試しください。')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            新規登録
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            アカウントを作成して開始
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleRegister}>
          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="text-sm text-red-800">{error}</div>
            </div>
          )}
          <div className="rounded-md shadow-sm space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                メールアドレス
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="メールアドレス"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                パスワード
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="パスワード（8文字以上）"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                パスワード（確認）
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="パスワード（確認）"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '登録中...' : '登録'}
            </button>
          </div>

          <div className="text-center">
            <Link
              href="/login"
              className="text-sm text-blue-600 hover:text-blue-500"
            >
              既にアカウントをお持ちの方はこちら
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}

