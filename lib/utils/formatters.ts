// Number and currency formatting utilities

export function formatNumber(num: number): string {
  if (isNaN(num) || !isFinite(num)) return '0'
  // Round to nearest integer for transaction counts
  const rounded = Math.round(num)
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(rounded)
}

export function formatCurrency(num: number, lang: 'jp' | 'en' = 'jp'): string {
  const roundedNum = Math.round(num)
  if (isNaN(roundedNum)) {
    return lang === 'jp' ? 'NaN円' : 'NaN'
  }

  if (lang === 'jp') {
    if (Math.abs(roundedNum) >= 100000000) {
      return `${(roundedNum / 100000000).toLocaleString('ja-JP', { maximumFractionDigits: 1 })}億円`
    }
    if (Math.abs(roundedNum) >= 10000) {
      return `${(roundedNum / 10000).toLocaleString('ja-JP', { maximumFractionDigits: 0 })}万円`
    }
    return `${roundedNum.toLocaleString('ja-JP')}円`
  } else {
    return `¥${roundedNum.toLocaleString()}`
  }
}

export function formatPercentage(num: number): string {
  return `${num.toFixed(2)}%`
}

export function deformatNumber(str: string | number): number {
  if (typeof str === 'number') return str
  return parseFloat(str.replace(/,/g, '').replace(/%/g, '')) || 0
}

