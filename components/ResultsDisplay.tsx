'use client'

import { formatNumber, formatCurrency } from '@/lib/utils/formatters'
import type { ScenarioResults } from '@/lib/utils/calculations'
import type { Language } from '@/lib/utils/translations'
import { getTranslation, type Translations } from '@/lib/utils/translations'

interface ResultsDisplayProps {
  base: ScenarioResults
  comp: ScenarioResults
  lang: Language
  t: ReturnType<typeof getTranslation>
}

export default function ResultsDisplay({ base, comp, lang, t }: ResultsDisplayProps) {
  const completedDiff = comp.funnel.completed - base.funnel.completed
  const revenueDiff = comp.revenue.raw - base.revenue.raw
  const conservativeDiff = comp.revenue.conservative - base.revenue.conservative
  const costDiff = comp.costs.total - base.costs.total
  const roi = costDiff > 0 ? conservativeDiff / costDiff : 0

  return (
    <>
      {/* Revenue Section */}
      <div className="section-container mt-8">
        <h2 className="section-title">{t.revenueTitle}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div id="funnel1Container" className="p-4 bg-gray-50 rounded-lg">
            <h3 className="text-lg font-bold text-center text-gray-700 mb-4">{base.name}</h3>
            <div className="space-y-1">
              <div className="funnel-stage" style={{ width: '100%' }}>
                <strong>{t.funnel.totalAttempts}</strong>
                <br />
                <span className="funnel-number">{formatNumber(base.funnel.start)}</span>
              </div>
              <div className="funnel-decline">
                <span>{t.funnel.preAuthDecline}</span>: <span className="funnel-number">{formatNumber(base.funnel.preAuthDecline)}</span>
              </div>
              <div className="funnel-stage" style={{ width: '98%' }}>
                <strong>{t.funnel.afterPreAuth}</strong>
                <br />
                <span className="funnel-number">{formatNumber(base.funnel.afterPreAuth)}</span>
              </div>
              <div className="funnel-decline">
                <span>{t.funnel.threeDsDecline}</span>: <span className="funnel-number">{formatNumber(base.funnel.threeDsDecline)}</span>
              </div>
              <div className="funnel-stage" style={{ width: '96%' }}>
                <strong>{t.funnel.after3DS}</strong>
                <br />
                <span className="funnel-number">{formatNumber(base.funnel.after3DS)}</span>
              </div>
              <div className="funnel-decline">
                <span>{t.funnel.authDecline}</span>: <span className="funnel-number">{formatNumber(base.funnel.authDecline)}</span>
              </div>
              <div className="funnel-stage" style={{ width: '94%' }}>
                <strong>{t.funnel.afterAuth}</strong>
                <br />
                <span className="funnel-number">{formatNumber(base.funnel.afterAuth)}</span>
              </div>
              <div className="funnel-decline">
                <span>{t.funnel.postAuthDecline}</span>: <span className="funnel-number">{formatNumber(base.funnel.postAuthDecline)}</span>
              </div>
              <div className="funnel-stage success" style={{ width: '92%' }}>
                <strong>{t.funnel.completed}</strong>
                <br />
                <span className="funnel-number">{formatNumber(base.funnel.completed)}</span>
              </div>
              <hr className="my-4 border-dashed" />
              <div className="text-center p-2 rounded-lg bg-blue-100">
                <p className="font-semibold">{t.funnel.grossRevenue}</p>
                <p className="funnel-revenue-value text-blue-800">{formatCurrency(base.revenue.raw, lang)}</p>
              </div>
            </div>
          </div>
          <div id="funnel2Container" className="p-4 bg-gray-50 rounded-lg">
            <h3 className="text-lg font-bold text-center text-gray-700 mb-4">{comp.name}</h3>
            <div className="space-y-1">
              <div className="funnel-stage" style={{ width: '100%' }}>
                <strong>{t.funnel.totalAttempts}</strong>
                <br />
                <span className="funnel-number">{formatNumber(comp.funnel.start)}</span>
              </div>
              <div className="funnel-decline">
                <span>{t.funnel.preAuthDecline}</span>: <span className="funnel-number">{formatNumber(comp.funnel.preAuthDecline)}</span>
              </div>
              <div className="funnel-stage" style={{ width: '98%' }}>
                <strong>{t.funnel.afterPreAuth}</strong>
                <br />
                <span className="funnel-number">{formatNumber(comp.funnel.afterPreAuth)}</span>
              </div>
              <div className="funnel-decline">
                <span>{t.funnel.threeDsDecline}</span>: <span className="funnel-number">{formatNumber(comp.funnel.threeDsDecline)}</span>
              </div>
              <div className="funnel-stage" style={{ width: '96%' }}>
                <strong>{t.funnel.after3DS}</strong>
                <br />
                <span className="funnel-number">{formatNumber(comp.funnel.after3DS)}</span>
              </div>
              <div className="funnel-decline">
                <span>{t.funnel.authDecline}</span>: <span className="funnel-number">{formatNumber(comp.funnel.authDecline)}</span>
              </div>
              <div className="funnel-stage" style={{ width: '94%' }}>
                <strong>{t.funnel.afterAuth}</strong>
                <br />
                <span className="funnel-number">{formatNumber(comp.funnel.afterAuth)}</span>
              </div>
              <div className="funnel-decline">
                <span>{t.funnel.postAuthDecline}</span>: <span className="funnel-number">{formatNumber(comp.funnel.postAuthDecline)}</span>
              </div>
              <div className="funnel-stage success" style={{ width: '92%' }}>
                <strong>{t.funnel.completed}</strong>
                <br />
                <span className="funnel-number">{formatNumber(comp.funnel.completed)}</span>
              </div>
              <hr className="my-4 border-dashed" />
              <div className="text-center p-2 rounded-lg bg-blue-100">
                <p className="font-semibold">{t.funnel.grossRevenue}</p>
                <p className="funnel-revenue-value text-blue-800">{formatCurrency(comp.revenue.raw, lang)}</p>
              </div>
              <div className="text-center p-2 rounded-lg bg-indigo-100 mt-2">
                <p className="font-semibold">{t.funnel.conservativeRevenue}</p>
                <p className="funnel-revenue-value text-indigo-800">{formatCurrency(comp.revenue.conservative, lang)}</p>
              </div>
            </div>
          </div>
        </div>
        <div className="conclusion-box">
          <p
            dangerouslySetInnerHTML={{
              __html:
                lang === 'jp'
                  ? `コンバージョン率の改善により、支払い成功数が<strong>${formatNumber(Math.round(completedDiff))}</strong>件増加しました。`
                  : `Due to better conversion, completed transactions increased by <strong>${formatNumber(Math.round(completedDiff))}</strong>.`,
            }}
          />
          <p
            className="mt-2"
            dangerouslySetInnerHTML={{
              __html:
                lang === 'jp'
                  ? `これにより、取扱高は<strong>${formatCurrency(revenueDiff, lang)}</strong>増加します。`
                  : `This means the revenue will increase by <strong>${formatCurrency(revenueDiff, lang)}</strong>.`,
            }}
          />
          <p
            className="mt-4 text-lg font-bold text-green-700"
            dangerouslySetInnerHTML={{
              __html:
                lang === 'jp'
                  ? `再試行を考慮しても、取扱高は<strong class="text-green-700 text-xl">${formatCurrency(conservativeDiff, lang)}</strong>増加します。`
                  : `Even conservatively considering retries, revenue will still increase by ${formatCurrency(conservativeDiff, lang)}.`,
            }}
          />
        </div>
      </div>

      {/* Cost Section */}
      <div className="section-container mt-8">
        <h2 className="section-title">{t.costTitle}</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b">
                <th className="p-2">{t.costItem}</th>
                <th className="p-2">{base.name}</th>
                <th className="p-2">{comp.name}</th>
                <th className="p-2">{t.change}</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="p-2 font-medium">{t.toolCostItem}</td>
                <td className="p-2">{formatCurrency(base.costs.tool, lang)}</td>
                <td className="p-2">{formatCurrency(comp.costs.tool, lang)}</td>
                <td className={`p-2 ${comp.costs.tool - base.costs.tool >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {formatCurrency(comp.costs.tool - base.costs.tool, lang)}
                </td>
              </tr>
              {/* ベンダーコスト内訳 */}
              <tr className="border-b">
                <td className="p-2 pl-6 text-sm text-gray-600">{t.toolJudgmentCost}</td>
                <td className="p-2 text-sm">{formatCurrency(base.costs.toolJudgmentCost || 0, lang)}</td>
                <td className="p-2 text-sm">{formatCurrency(comp.costs.toolJudgmentCost || 0, lang)}</td>
                <td className={`p-2 text-sm ${(comp.costs.toolJudgmentCost || 0) - (base.costs.toolJudgmentCost || 0) >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {formatCurrency((comp.costs.toolJudgmentCost || 0) - (base.costs.toolJudgmentCost || 0), lang)}
                </td>
              </tr>
              <tr className="border-b">
                <td className="p-2 pl-6 text-sm text-gray-600">{t.toolCompensationCost}</td>
                <td className="p-2 text-sm">{formatCurrency(base.costs.toolCompensationCost || 0, lang)}</td>
                <td className="p-2 text-sm">{formatCurrency(comp.costs.toolCompensationCost || 0, lang)}</td>
                <td className={`p-2 text-sm ${(comp.costs.toolCompensationCost || 0) - (base.costs.toolCompensationCost || 0) >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {formatCurrency((comp.costs.toolCompensationCost || 0) - (base.costs.toolCompensationCost || 0), lang)}
                </td>
              </tr>
              <tr className="font-bold bg-gray-100 text-lg">
                <td className="p-2">{t.totalCost}</td>
                <td className="p-2">{formatCurrency(base.costs.total, lang)}</td>
                <td className="p-2">{formatCurrency(comp.costs.total, lang)}</td>
                <td className={`p-2 ${costDiff >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {formatCurrency(costDiff, lang)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="conclusion-box">
          <p
            dangerouslySetInnerHTML={{
              __html:
                lang === 'jp'
                  ? `<strong>${comp.name}</strong>シナリオに移行することで、年間総コストは<strong>${formatCurrency(Math.abs(costDiff), lang)}</strong>${costDiff >= 0 ? '増加' : '減少'}します。`
                  : `By moving to the <strong>${comp.name}</strong> scenario, the total annual cost will ${costDiff >= 0 ? 'increase' : 'decrease'} by <strong>${formatCurrency(Math.abs(costDiff), lang)}</strong>.`,
            }}
          />
        </div>
      </div>

      {/* ROI Section */}
      <div className="section-container mt-8">
        <h2 className="section-title">{t.roiTitle}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="roi-card">
            <h3 className="roi-label">{t.roiRevenue}</h3>
            <p className="roi-value text-green-600">{formatCurrency(conservativeDiff, lang)}</p>
          </div>
          <div className="roi-card">
            <h3 className="roi-label">{t.roiCost}</h3>
            <p className={`roi-value ${costDiff >= 0 ? 'text-red-600' : 'text-green-600'}`}>
              {formatCurrency(costDiff, lang)}
            </p>
          </div>
          {costDiff > 0 && (
            <div className="roi-card">
              <h3 className="roi-label">{t.roiPercent}</h3>
              <p className="roi-value text-purple-600">
                {roi.toFixed(1)}
                {lang === 'jp' ? '倍' : 'x'}
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

