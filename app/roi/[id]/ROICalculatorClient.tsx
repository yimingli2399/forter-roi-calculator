'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { calculateROI, type CalculationInputs, type ScenarioInputs } from '@/lib/utils/calculations'
import { formatNumber, formatCurrency, formatPercentage, deformatNumber } from '@/lib/utils/formatters'
import { getTranslation, type Language } from '@/lib/utils/translations'
import { logAuditAction } from '@/lib/utils/audit'
import type { Database } from '@/lib/supabase/database.types'
import InputFormSection from '@/components/InputFormSection'
import ResultsDisplay from '@/components/ResultsDisplay'
import { exportToPDF, exportToHTML } from '@/lib/utils/export'

type SessionData = Database['public']['Tables']['roi_sessions']['Row']

interface ROICalculatorClientProps {
  sessionData: SessionData
}

export default function ROICalculatorClient({ sessionData }: ROICalculatorClientProps) {
  const router = useRouter()
  const supabase = createClient()
  const [lang, setLang] = useState<Language>('jp')
  const [title, setTitle] = useState(sessionData.title)
  const [companyName, setCompanyName] = useState(sessionData.company_name || '')
  const [isFavorite, setIsFavorite] = useState(sessionData.is_favorite || false)
  const [saving, setSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)

  // Update company name, title, and favorite status when sessionData changes (only on mount or when sessionData.id changes)
  useEffect(() => {
    setTitle(sessionData.title)
    setCompanyName(sessionData.company_name || '')
    setIsFavorite(sessionData.is_favorite || false)
  }, [sessionData.id])

  const t = getTranslation(lang)

  // Initialize form data from session or defaults
  const getInitialData = (): CalculationInputs => {
    if (
      sessionData.data &&
      typeof sessionData.data === 'object' &&
      sessionData.data !== null &&
      'annualAttempts' in sessionData.data
    ) {
      return sessionData.data as unknown as CalculationInputs
    }

    // Default values
    return {
      annualAttempts: 3182624,
      atvSuccess: 17302.00528,
      atvDecline: 55387.94297,
      threeDSCost: 0,
      retryRate: 0,
      s1: {
        name: t.scenario1,
        preAuthDecline: 0,
        postAuthAuto: 0,
        postAuthManual: 0,
        '3dsUsage': 100,
        '3dsError': 6,
        authRate: 97.41,
        chargebackRate: 0,
        fixedFee: 0,
        percentageFee: 0,
        perTransactionCost: 0,
        manualReviewCost: 0,
        applyToNon3DS: false,
      },
      s2: {
        name: t.scenario2,
        preAuthDecline: 0.5,
        postAuthAuto: 0,
        postAuthManual: 0,
        '3dsUsage': 5,
        '3dsError': 50,
        authRate: 97.81,
        chargebackRate: 0,
        fixedFee: 12000000,
        percentageFee: 0.25,
        perTransactionCost: 0,
        manualReviewCost: 0,
        applyToNon3DS: true,
      },
    }
  }

  const [inputs, setInputs] = useState<CalculationInputs>(getInitialData())
  const [results, setResults] = useState(() => calculateROI(inputs))

  // Auto-save function
  const saveSession = useCallback(
    async (data: CalculationInputs, newTitle?: string, newCompanyName?: string) => {
      setSaving(true)
      try {
        const updateData: any = {
          data: data as any,
          updated_at: new Date().toISOString(),
        }

        if (newTitle !== undefined) {
          updateData.title = newTitle
        } else {
          updateData.title = title
        }

        if (newCompanyName !== undefined) {
          updateData.company_name = newCompanyName.trim() || null
        } else {
          updateData.company_name = companyName.trim() || null
        }

        const { error } = await supabase
          .from('roi_sessions')
          // @ts-ignore - Supabase type inference issue
          .update(updateData)
          .eq('id', sessionData.id)

        if (error) {
          console.error('Save error:', error)
          const errorMessage = error.message || JSON.stringify(error, null, 2)
          throw new Error(errorMessage)
        }

        setLastSaved(new Date())
        await logAuditAction(sessionData.created_by, sessionData.id, 'edit')
      } catch (error) {
        console.error('Failed to save:', error)
        const errorMessage = error instanceof Error ? error.message : String(error)
        alert(`保存に失敗しました: ${errorMessage}\n\nデータベースにcompany_nameカラムが存在しない可能性があります。SupabaseのSQL Editorで以下を実行してください:\n\nALTER TABLE roi_sessions ADD COLUMN IF NOT EXISTS company_name TEXT;`)
      } finally {
        setSaving(false)
      }
    },
    [supabase, sessionData.id, sessionData.created_by, title, companyName]
  )

  // Manual save handler
  const handleManualSave = async () => {
    await saveSession(inputs, title, companyName)
  }

  // Toggle favorite handler
  const handleToggleFavorite = async () => {
    const newFavoriteStatus = !isFavorite
    setIsFavorite(newFavoriteStatus)

    try {
      const { error } = await supabase
        .from('roi_sessions')
        // @ts-ignore - Supabase type inference issue
        .update({ is_favorite: newFavoriteStatus })
        .eq('id', sessionData.id)

      if (error) {
        // Revert on error
        setIsFavorite(isFavorite)
        throw error
      }
    } catch (error) {
      console.error('Failed to update favorite:', error)
      const errorMessage = error instanceof Error ? error.message : String(error)
      alert(`お気に入りの更新に失敗しました: ${errorMessage}`)
      setIsFavorite(isFavorite) // Revert on error
    }
  }

  // Recalculate when inputs change
  useEffect(() => {
    setResults(calculateROI(inputs))
  }, [inputs])

  const handleExportPDF = async () => {
    try {
      // Try to find the main content area
      const mainContent = document.getElementById('export-content') || document.querySelector('main')
      if (!mainContent) {
        alert('エクスポートするコンテンツが見つかりません')
        return
      }

      const exportTitle = title || 'ROI計算'
      await exportToPDF(mainContent as HTMLElement, exportTitle)
      await logAuditAction(sessionData.created_by, sessionData.id, 'export')
    } catch (error) {
      console.error('PDF export failed:', error)
      alert(`PDFのエクスポートに失敗しました: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  const handleExportHTML = async () => {
    try {
      const exportTitle = title || 'ROI計算'
      // For HTML export, we use the template approach
      await exportToHTML(
        document.body,
        exportTitle,
        companyName,
        inputs,
        results
      )
      await logAuditAction(sessionData.created_by, sessionData.id, 'export')
    } catch (error) {
      console.error('HTML export failed:', error)
      alert(`HTMLのエクスポートに失敗しました: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  const handleDuplicateSession = async () => {
    if (!confirm('このセッションを複製しますか？')) {
      return
    }

    setSaving(true)
    try {
      // Build insert data without is_favorite if column doesn't exist
      const insertData: any = {
        title: `${title} (コピー)`,
        company_name: companyName || null,
        created_by: sessionData.created_by,
        data: inputs as any,
      }

      // Only include is_favorite if it exists in the schema
      // Try to insert without is_favorite first, if it fails due to missing column, retry
      const { data: duplicatedSession, error } = await supabase
        .from('roi_sessions')
        .insert(insertData as any)
        .select()
        .single()

      if (error) {
        // If error is about missing is_favorite column, try without it
        if (error.message.includes('is_favorite')) {
          const { data: retryData, error: retryError } = await supabase
            .from('roi_sessions')
            .insert({
              title: `${title} (コピー)`,
              company_name: companyName || null,
              created_by: sessionData.created_by,
              data: inputs as any,
            } as any)
            .select()
            .single()

          if (retryError) {
            throw retryError
          }

          const shouldSwitch = confirm(
            'セッションを複製しました。\n\n新しいセッションに切り替えますか？\n\n「はい」: 新しいセッションを開く\n「いいえ」: 現在のセッションのまま'
          )

          if (shouldSwitch && retryData) {
            type SessionRow = Database['public']['Tables']['roi_sessions']['Row']
            const typedRetryData = retryData as SessionRow
            router.push(`/roi/${typedRetryData.id}`)
            router.refresh()
          } else {
            setSaving(false)
          }
          return
        }
        throw error
      }

      const shouldSwitch = confirm(
        'セッションを複製しました。\n\n新しいセッションに切り替えますか？\n\n「はい」: 新しいセッションを開く\n「いいえ」: 現在のセッションのまま'
      )

      if (shouldSwitch && duplicatedSession) {
        type SessionRow = Database['public']['Tables']['roi_sessions']['Row']
        const typedDuplicatedSession = duplicatedSession as SessionRow
        router.push(`/roi/${typedDuplicatedSession.id}`)
        router.refresh()
      } else {
        setSaving(false)
      }
    } catch (error) {
      console.error('Failed to duplicate session:', error)
      const errorMessage = error instanceof Error ? error.message : String(error)
      alert(
        `セッションの複製に失敗しました: ${errorMessage}\n\nデータベースにis_favoriteカラムが存在しない可能性があります。SupabaseのSQL Editorで以下を実行してください:\n\nALTER TABLE roi_sessions ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN DEFAULT FALSE;`
      )
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="sticky top-0 z-50 bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left side: Navigation and document info */}
            <div className="flex items-center space-x-6 flex-1 min-w-0">
              {/* Back button */}
              <button
                onClick={() => router.push('/dashboard')}
                className="flex items-center text-gray-600 hover:text-gray-900 transition-colors shrink-0"
              >
                <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span className="text-sm font-medium">ダッシュボード</span>
              </button>

              {/* Divider */}
              <div className="h-6 w-px bg-gray-300" />

              {/* Document info: Company name and title stacked vertically */}
              <div className="flex flex-col space-y-1.5 flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-medium text-gray-500 shrink-0">企業名:</span>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => {
                      setCompanyName(e.target.value)
                    }}
                    placeholder="企業名を入力"
                    className="text-xs text-gray-700 bg-transparent border-none focus:outline-none focus:ring-0 px-0 placeholder-gray-400 flex-1 min-w-0"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-700 shrink-0">シナリオ名:</span>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => {
                      setTitle(e.target.value)
                    }}
                    placeholder="シナリオ名を入力"
                    className="text-lg font-semibold text-gray-900 bg-transparent border-none focus:outline-none focus:ring-0 px-0 placeholder-gray-400 flex-1 min-w-0"
                  />
                </div>
              </div>
            </div>

            {/* Right side: Status and action buttons */}
            <div className="flex items-center space-x-3 shrink-0">
              {/* Favorite button */}
              <button
                onClick={handleToggleFavorite}
                className={`flex items-center justify-center w-10 h-10 rounded-lg transition-colors ${
                  isFavorite
                    ? 'bg-yellow-100 text-yellow-600 hover:bg-yellow-200'
                    : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                }`}
                title={isFavorite ? 'お気に入りから削除' : 'お気に入りに追加'}
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              </button>

              {/* Save button and status */}
              <div className="flex items-center space-x-2 mr-2">
                {saving ? (
                  <div className="flex items-center text-sm text-gray-500">
                    <svg className="animate-spin h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>保存中...</span>
                  </div>
                ) : lastSaved ? (
                  <span className="text-xs text-gray-400">
                    {lastSaved.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                ) : null}
                <button
                  onClick={handleManualSave}
                  disabled={saving}
                  className="flex items-center px-3 py-2 text-sm font-medium text-white bg-gray-600 rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  title="セッションを保存"
                >
                  <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  保存
                </button>
              </div>

              {/* Action buttons */}
              <button
                onClick={handleDuplicateSession}
                disabled={saving}
                className="flex items-center px-3 py-2 text-sm font-medium text-purple-700 bg-purple-50 rounded-lg hover:bg-purple-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="セッションを複製"
              >
                <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                複製
              </button>
              <button
                onClick={handleExportPDF}
                className="flex items-center px-3 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
              >
                <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                PDF
              </button>
              <button
                onClick={handleExportHTML}
                className="flex items-center px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
                HTML
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <InputFormSection
            inputs={inputs}
            onInputsChange={setInputs}
            lang={lang}
            t={t}
          />

          <ResultsDisplay base={results.base} comp={results.comp} lang={lang} t={t} />
        </div>
      </main>
    </div>
  )
}

