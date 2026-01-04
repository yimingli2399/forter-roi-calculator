import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Forter ROI Calculator',
  description: 'セキュアなROI計算アプリケーション',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  )
}

