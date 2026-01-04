'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/lib/supabase/database.types'

type Session = Database['public']['Tables']['roi_sessions']['Row'] & {
  creator_email?: string
}
type User = Database['public']['Tables']['users']['Row']

interface DashboardClientProps {
  user: User | null
  initialSessions: Session[]
}

export default function DashboardClient({ user, initialSessions }: DashboardClientProps) {
  const router = useRouter()
  const [sessions, setSessions] = useState(initialSessions)
  const [loading, setLoading] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newCompanyName, setNewCompanyName] = useState('')
  const [newTitle, setNewTitle] = useState('')
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false)

  // Refresh sessions when component becomes visible (user returns from ROI page)
  useEffect(() => {
    const handleFocus = async () => {
      const supabase = createClient()
      const { data: sessionsData } = await supabase
        .from('roi_sessions')
        .select('*')
        .eq('is_archived', false)
        .order('updated_at', { ascending: false })
        .limit(50)
      
      if (sessionsData) {
        // Get creator information
        const creatorIds = [...new Set(sessionsData.map((s) => s.created_by))]
        const { data: creators } = await supabase
          .from('users')
          .select('id, email')
          .in('id', creatorIds)

        const creatorMap = new Map(creators?.map((c) => [c.id, c.email]) || [])
        const sessionsWithCreators = sessionsData.map((session) => ({
          ...session,
          creator_email: creatorMap.get(session.created_by) || '不明',
        }))
        
        setSessions(sessionsWithCreators)
      }
    }

    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const handleCreateSession = async () => {
    if (!newTitle.trim()) {
      alert('タイトルを入力してください')
      return
    }

    setLoading(true)
    const supabase = createClient()

    const { data, error } = await supabase
      .from('roi_sessions')
      .insert({
        title: newTitle.trim(),
        company_name: newCompanyName.trim() || null,
        created_by: user.id,
        data: {},
      })
      .select()
      .single()

    if (error) {
      alert('セッションの作成に失敗しました: ' + error.message)
      setLoading(false)
      return
    }

    setShowCreateModal(false)
    setNewTitle('')
    setNewCompanyName('')
    setLoading(false)
    router.push(`/roi/${data.id}`)
  }

  // Filter sessions by favorite if needed
  const filteredSessions = showFavoritesOnly
    ? sessions.filter((s) => s.is_favorite)
    : sessions

  // Group sessions by company name
  const groupedSessions = filteredSessions.reduce((acc, session) => {
    const companyName = session.company_name || '(企業名なし)'
    if (!acc[companyName]) {
      acc[companyName] = []
    }
    acc[companyName].push(session)
    return acc
  }, {} as Record<string, Session[]>)

  const sortedCompanies = Object.keys(groupedSessions).sort((a, b) => {
    if (a === '(企業名なし)') return 1
    if (b === '(企業名なし)') return -1
    return a.localeCompare(b, 'ja')
  })

  const handleDeleteSession = async (sessionId: string) => {
    if (!confirm('このセッションを削除しますか？')) {
      return
    }

    const supabase = createClient()
    const { error } = await supabase
      .from('roi_sessions')
      .delete()
      .eq('id', sessionId)

    if (error) {
      alert('削除に失敗しました: ' + error.message)
      return
    }

    setSessions(sessions.filter((s) => s.id !== sessionId))
  }

  const handleDuplicateSession = async (session: Session) => {
    setLoading(true)
    const supabase = createClient()

    // Build insert data without is_favorite if column doesn't exist
    const insertData: any = {
      title: `${session.title} (コピー)`,
      company_name: session.company_name,
      created_by: user.id,
      data: session.data,
    }

    const { data, error } = await supabase
      .from('roi_sessions')
      .insert(insertData)
      .select()
      .single()

    if (error) {
      // If error is about missing is_favorite column, try without it
      if (error.message.includes('is_favorite')) {
        const { data: retryData, error: retryError } = await supabase
          .from('roi_sessions')
          .insert({
            title: `${session.title} (コピー)`,
            company_name: session.company_name,
            created_by: user.id,
            data: session.data,
          })
          .select()
          .single()

        if (retryError) {
          alert(
            `セッションの複製に失敗しました: ${retryError.message}\n\nデータベースにis_favoriteカラムが存在しない可能性があります。SupabaseのSQL Editorで以下を実行してください:\n\nALTER TABLE roi_sessions ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN DEFAULT FALSE;`
          )
          setLoading(false)
          return
        }

        // Refresh sessions with creator information (all sessions)
        const { data: updatedSessionsData } = await supabase
          .from('roi_sessions')
          .select('*')
          .eq('is_archived', false)
          .order('updated_at', { ascending: false })
          .limit(50)

        if (updatedSessionsData) {
          const creatorIds = [...new Set(updatedSessionsData.map((s) => s.created_by))]
          const { data: creators } = await supabase
            .from('users')
            .select('id, email')
            .in('id', creatorIds)

          const creatorMap = new Map(creators?.map((c) => [c.id, c.email]) || [])
          const updatedSessions = updatedSessionsData.map((session) => ({
            ...session,
            creator_email: creatorMap.get(session.created_by) || '不明',
          }))
          
          setSessions(updatedSessions)
        }

        setLoading(false)
        router.push(`/roi/${retryData.id}`)
        return
      }

      alert(
        `セッションの複製に失敗しました: ${error.message}\n\nデータベースにis_favoriteカラムが存在しない可能性があります。SupabaseのSQL Editorで以下を実行してください:\n\nALTER TABLE roi_sessions ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN DEFAULT FALSE;`
      )
      setLoading(false)
      return
    }

    // Refresh sessions
    const { data: updatedSessions } = await supabase
      .from('roi_sessions')
      .select('*')
      .eq('is_archived', false)
      .order('updated_at', { ascending: false })
      .limit(50)

    if (updatedSessions) {
      setSessions(updatedSessions)
    }

    setLoading(false)
    router.push(`/roi/${data.id}`)
  }

  const handleToggleFavorite = async (sessionId: string, currentFavorite: boolean) => {
    const supabase = createClient()
    const { error } = await supabase
      .from('roi_sessions')
      .update({ is_favorite: !currentFavorite })
      .eq('id', sessionId)

    if (error) {
      alert('お気に入りの更新に失敗しました: ' + error.message)
      return
    }

    // Update local state
    setSessions(
      sessions.map((s) => (s.id === sessionId ? { ...s, is_favorite: !currentFavorite } : s))
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">Forter ROI Calculator</h1>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={handleLogout}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                ログアウト
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">ROI計算セッション</h2>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  showFavoritesOnly
                    ? 'bg-yellow-500 text-white hover:bg-yellow-600'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {showFavoritesOnly ? '★ お気に入りのみ' : '☆ すべて表示'}
              </button>
              <button
                onClick={() => setShowCreateModal(true)}
                disabled={loading}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                + 新規作成
              </button>
            </div>
          </div>

          {sessions.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">セッションがありません</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                最初のセッションを作成
              </button>
            </div>
          ) : filteredSessions.length === 0 && showFavoritesOnly ? (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">お気に入りのセッションがありません</p>
              <button
                onClick={() => setShowFavoritesOnly(false)}
                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
              >
                すべてのセッションを表示
              </button>
            </div>
          ) : (
            <div className="space-y-8">
              {sortedCompanies.map((companyName) => (
                <div key={companyName}>
                  <h3 className="text-xl font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-300">
                    {companyName}
                  </h3>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {groupedSessions[companyName].map((session) => (
                      <div
                        key={session.id}
                        className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <Link href={`/roi/${session.id}`} className="flex-1">
                            <h4 className="text-lg font-semibold text-gray-900 mb-2">
                              {session.title}
                            </h4>
                            <p className="text-sm text-gray-500">
                              更新: {new Date(session.updated_at).toLocaleDateString('ja-JP')}
                            </p>
                            {session.creator_email && (
                              <p className="text-xs text-gray-400 mt-1">
                                作成者: {session.creator_email}
                              </p>
                            )}
                          </Link>
                          <button
                            onClick={() => handleToggleFavorite(session.id, session.is_favorite || false)}
                            className="ml-2 text-2xl hover:scale-110 transition-transform"
                            title={session.is_favorite ? 'お気に入りから削除' : 'お気に入りに追加'}
                          >
                            {session.is_favorite ? '★' : '☆'}
                          </button>
                        </div>
                        <div className="mt-4 flex justify-end space-x-2">
                          <button
                            onClick={() => handleDuplicateSession(session)}
                            className="text-sm text-blue-600 hover:text-blue-800"
                            title="セッションを複製"
                          >
                            複製
                          </button>
                          <button
                            onClick={() => handleDeleteSession(session.id)}
                            className="text-sm text-red-600 hover:text-red-800"
                          >
                            削除
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Create Session Modal */}
          {showCreateModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 w-full max-w-md">
                <h3 className="text-xl font-bold text-gray-900 mb-4">新しいROI計算セッション</h3>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="company-name" className="block text-sm font-medium text-gray-700 mb-1">
                      企業名
                    </label>
                    <input
                      id="company-name"
                      type="text"
                      value={newCompanyName}
                      onChange={(e) => setNewCompanyName(e.target.value)}
                      placeholder="例: 株式会社ABC"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="session-title" className="block text-sm font-medium text-gray-700 mb-1">
                      タイトル <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="session-title"
                      type="text"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      placeholder="例: 2024年度ROI試算"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>
                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    onClick={() => {
                      setShowCreateModal(false)
                      setNewTitle('')
                      setNewCompanyName('')
                    }}
                    className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
                  >
                    キャンセル
                  </button>
                  <button
                    onClick={handleCreateSession}
                    disabled={loading || !newTitle.trim()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {loading ? '作成中...' : '作成'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

