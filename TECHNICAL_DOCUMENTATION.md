# Forter ROI Calculator - 技術ドキュメント

このドキュメントでは、Forter ROI Calculatorアプリケーションの構造、コード、使用技術について詳しく説明します。

---

## 📋 目次

1. [アプリケーション概要](#アプリケーション概要)
2. [技術スタック](#技術スタック)
3. [プロジェクト構造](#プロジェクト構造)
4. [アーキテクチャ](#アーキテクチャ)
5. [主要コンポーネント](#主要コンポーネント)
6. [データフロー](#データフロー)
7. [セキュリティ機能](#セキュリティ機能)
8. [デプロイメント](#デプロイメント)

---

## 🎯 アプリケーション概要

**Forter ROI Calculator**は、Forter導入によるビジネスインパクトを試算するためのWebアプリケーションです。

### 主な機能
- ユーザー認証（ログイン/登録）
- ROI計算（2つのシナリオを比較）
- セッション管理（複数の試算を保存・管理）
- データの永続化（データベースに保存）
- PDF/HTMLエクスポート
- お気に入り機能
- セッション複製機能
- 未保存変更の警告

---

## 🛠 技術スタック

### フロントエンド
- **Next.js 14** - Reactベースのフレームワーク
  - サーバーサイドレンダリング（SSR）
  - ルーティング
  - API Routes
- **React 18** - UIライブラリ
- **TypeScript** - 型安全性
- **Tailwind CSS** - スタイリング

### バックエンド・データベース
- **Supabase** - バックエンドサービス
  - PostgreSQLデータベース
  - 認証機能
  - Row Level Security (RLS)
  - リアルタイム機能

### その他のライブラリ
- **html2canvas** - HTMLから画像への変換（PDFエクスポート用）
- **jspdf** - PDF生成
- **@supabase/auth-helpers-nextjs** - Supabase認証ヘルパー

### デプロイメント
- **Vercel** - ホスティングプラットフォーム

---

## 📁 プロジェクト構造

```
forter-roi-calculator/
├── app/                          # Next.js App Router
│   ├── api/                      # API Routes
│   │   └── auth/
│   │       └── login/            # ログインAPI（レート制限付き）
│   ├── dashboard/                # ダッシュボードページ
│   │   ├── page.tsx              # サーバーコンポーネント
│   │   └── DashboardClient.tsx  # クライアントコンポーネント
│   ├── login/                    # ログインページ
│   ├── register/                 # 登録ページ
│   ├── roi/
│   │   └── [id]/                 # 動的ルート（セッションID）
│   │       ├── page.tsx          # サーバーコンポーネント
│   │       └── ROICalculatorClient.tsx  # メインの計算画面
│   ├── layout.tsx                # ルートレイアウト
│   ├── page.tsx                  # ホームページ
│   └── globals.css               # グローバルスタイル
│
├── components/                   # Reactコンポーネント
│   ├── InputField.tsx            # 入力フィールド
│   ├── InputFormSection.tsx      # 入力フォームセクション
│   ├── ResultsDisplay.tsx        # 計算結果表示
│   └── ScenarioInputs.tsx        # シナリオ入力
│
├── lib/                          # ユーティリティとライブラリ
│   ├── supabase/
│   │   ├── client.ts             # クライアント側Supabaseクライアント
│   │   ├── server.ts             # サーバー側Supabaseクライアント
│   │   └── database.types.ts     # データベース型定義
│   └── utils/
│       ├── audit.ts              # 監査ログ機能
│       ├── calculations.ts       # ROI計算ロジック
│       ├── export.ts             # PDF/HTMLエクスポート
│       ├── formatters.ts         # 数値フォーマット
│       ├── rateLimit.ts          # ログイン試行制限
│       └── translations.ts       # 多言語対応
│
├── supabase/                     # データベーススキーマ
│   ├── schema.sql                # メインスキーマ
│   ├── add_login_rate_limit.sql  # ログイン制限テーブル
│   └── ...                       # その他のSQLファイル
│
├── public/                       # 静的ファイル
│   └── template.html             # HTMLエクスポート用テンプレート
│
├── middleware.ts                 # Next.jsミドルウェア（認証チェック）
├── next.config.js                # Next.js設定
├── package.json                  # 依存関係
└── tsconfig.json                 # TypeScript設定
```

---

## 🏗 アーキテクチャ

### 全体アーキテクチャ図

```
┌─────────────────────────────────────────────────────────┐
│                     ブラウザ（クライアント）              │
│  ┌──────────────────────────────────────────────────┐  │
│  │         React Components (Client Components)      │  │
│  │  - ROICalculatorClient                            │  │
│  │  - DashboardClient                                │  │
│  │  - InputFormSection                               │  │
│  └──────────────────────────────────────────────────┘  │
└────────────────────┬────────────────────────────────────┘
                     │ HTTP/HTTPS
                     │
┌────────────────────▼────────────────────────────────────┐
│              Next.js (Vercel)                           │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Server Components                                │  │
│  │  - page.tsx (Server-side rendering)              │  │
│  │  - API Routes (/api/auth/login)                 │  │
│  └──────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Middleware                                      │  │
│  │  - 認証チェック                                   │  │
│  │  - ルート保護                                     │  │
│  └──────────────────────────────────────────────────┘  │
└────────────────────┬────────────────────────────────────┘
                     │
                     │ Supabase Client
                     │
┌────────────────────▼────────────────────────────────────┐
│              Supabase                                    │
│  ┌──────────────────────────────────────────────────┐  │
│  │  PostgreSQL Database                             │  │
│  │  - roi_sessions (セッションデータ)                │  │
│  │  - users (ユーザーデータ)                        │  │
│  │  - login_attempts (ログイン試行記録)             │  │
│  │  - audit_logs (監査ログ)                          │  │
│  └──────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Authentication                                  │  │
│  │  - JWT認証                                       │  │
│  │  - セッション管理                                 │  │
│  └──────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Row Level Security (RLS)                        │  │
│  │  - データアクセス制御                             │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### レンダリング戦略

このアプリケーションは**Next.js App Router**を使用し、以下の2つのレンダリング方式を組み合わせています：

1. **Server Components** (`page.tsx`)
   - サーバー側でデータを取得
   - 認証チェック
   - 初期データのロード

2. **Client Components** (`*Client.tsx`)
   - インタラクティブなUI
   - 状態管理（React Hooks）
   - リアルタイム更新

---

## 🧩 主要コンポーネント

### 1. 認証システム

#### `middleware.ts` - ルート保護
```typescript
// 認証が必要なルートを保護
if (req.nextUrl.pathname.startsWith('/roi') || 
    req.nextUrl.pathname.startsWith('/dashboard')) {
  if (!session) {
    return NextResponse.redirect('/login')
  }
}
```

#### `app/api/auth/login/route.ts` - ログインAPI
- レート制限機能付きログイン
- メールアドレスとIPアドレスで試行回数を制限
- 5回失敗で30分間ブロック

### 2. ダッシュボード

#### `app/dashboard/page.tsx` (Server Component)
```typescript
// サーバー側でデータを取得
const { data: sessionsData } = await supabase
  .from('roi_sessions')
  .select('*')
  .order('updated_at', { ascending: false })
```

#### `app/dashboard/DashboardClient.tsx` (Client Component)
- セッション一覧表示
- セッション作成・削除・複製
- お気に入り機能

### 3. ROI計算画面

#### `app/roi/[id]/ROICalculatorClient.tsx`
メインの計算画面コンポーネント：

**主要な状態管理:**
```typescript
const [inputs, setInputs] = useState<CalculationInputs>(...)
const [results, setResults] = useState<CalculationResults>(...)
const [title, setTitle] = useState(...)
const [companyName, setCompanyName] = useState(...)
const [isFavorite, setIsFavorite] = useState(...)
const [saving, setSaving] = useState(false)
const [lastSavedData, setLastSavedData] = useState(...) // 未保存変更検出用
```

**主要な機能:**
- 入力値の管理
- ROI計算の実行
- データの保存
- エクスポート（PDF/HTML）
- 未保存変更の警告

#### `components/InputFormSection.tsx`
入力フォームのセクション：
- 共通の事実（両シナリオ共通）
- ベースシナリオ
- 比較シナリオ
- 非表示フィールドの管理

#### `components/ResultsDisplay.tsx`
計算結果の表示：
- ファネル表示
- 取扱高の変化
- コストの変化
- ROIサマリー

### 4. 計算ロジック

#### `lib/utils/calculations.ts`
ROI計算の核心ロジック：

```typescript
export function calculateROI(inputs: CalculationInputs): CalculationResults {
  // 1. ファネル計算
  const baseFunnel = calculateFunnel(inputs.baseScenario, inputs)
  const comparisonFunnel = calculateFunnel(inputs.comparisonScenario, inputs)
  
  // 2. 収益計算
  const baseRevenue = calculateRevenue(baseFunnel, inputs)
  const comparisonRevenue = calculateRevenue(comparisonFunnel, inputs)
  
  // 3. コスト計算
  const baseCosts = calculateCosts(inputs.baseScenario, baseFunnel, inputs)
  const comparisonCosts = calculateCosts(inputs.comparisonScenario, comparisonFunnel, inputs)
  
  // 4. ROI計算
  return {
    base: { funnel: baseFunnel, revenue: baseRevenue, costs: baseCosts },
    comparison: { funnel: comparisonFunnel, revenue: comparisonRevenue, costs: comparisonCosts }
  }
}
```

### 5. エクスポート機能

#### `lib/utils/export.ts`

**PDFエクスポート:**
```typescript
export async function exportToPDF(element: HTMLElement, title: string) {
  // 1. html2canvasでHTMLを画像に変換
  const canvas = await html2canvas(element, {...})
  
  // 2. jsPDFでPDFを生成
  const pdf = new jsPDF({...})
  pdf.addImage(canvas.toDataURL('image/png'), 'PNG', ...)
  
  // 3. PDFをダウンロード
  pdf.save(`${title}.pdf`)
}
```

**HTMLエクスポート:**
```typescript
export async function exportToHTML(...) {
  // 1. テンプレートHTMLを読み込み
  let htmlString = await fetch('/template.html').then(r => r.text())
  
  // 2. 現在の値をテンプレートに注入
  htmlString = htmlString.replace(/value="([^"]*)"/g, (match, oldValue) => {
    // 新しい値に置き換え
  })
  
  // 3. HTMLファイルとしてダウンロード
  const blob = new Blob([htmlString], { type: 'text/html' })
  // ...
}
```

### 6. データベース接続

#### `lib/supabase/client.ts` - クライアント側
```typescript
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export const createClient = () => {
  return createClientComponentClient<Database>()
}
```

#### `lib/supabase/server.ts` - サーバー側
```typescript
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export const createServerClient = () => {
  return createServerComponentClient<Database>({ cookies })
}
```

---

## 🔄 データフロー

### 1. ログインフロー

```
ユーザー入力
    ↓
[LoginPage] → API Route (/api/auth/login)
    ↓
[rateLimit.ts] → レート制限チェック
    ↓
[Supabase Auth] → 認証
    ↓
成功 → セッション作成 → ダッシュボードへリダイレクト
失敗 → エラーメッセージ表示
```

### 2. セッション作成フロー

```
ダッシュボードで「新規作成」クリック
    ↓
[DashboardClient] → createSession()
    ↓
[Supabase] → roi_sessions テーブルにINSERT
    ↓
新しいセッションIDでROI計算画面へリダイレクト
```

### 3. データ保存フロー

```
ユーザーが入力値を変更
    ↓
[ROICalculatorClient] → setInputs()
    ↓
「保存」ボタンクリック
    ↓
handleManualSave()
    ↓
[Supabase] → roi_sessions テーブルをUPDATE
    ↓
保存成功 → ステータス更新
```

### 4. ROI計算フロー

```
ユーザーが「計算」ボタンをクリック
    ↓
[ROICalculatorClient] → handleCalculate()
    ↓
[calculations.ts] → calculateROI(inputs)
    ↓
計算結果を返す
    ↓
[ROICalculatorClient] → setResults()
    ↓
[ResultsDisplay] → 結果を表示
```

---

## 🔒 セキュリティ機能

### 1. 認証と認可

- **JWT認証**: Supabaseが提供するJWTトークンベースの認証
- **セッション管理**: サーバー側でセッションを検証
- **ルート保護**: Middlewareで認証が必要なルートを保護

### 2. Row Level Security (RLS)

SupabaseのRLSポリシーでデータアクセスを制御：

```sql
-- 認証されたユーザーは全セッションを閲覧可能
CREATE POLICY "Allow authenticated users to view all sessions"
  ON roi_sessions FOR SELECT
  USING (auth.role() = 'authenticated');
```

### 3. ログイン試行制限

- **レート制限**: メールアドレスとIPアドレスで試行回数を制限
- **ブロック機能**: 5回失敗で30分間ブロック
- **試行記録**: `login_attempts`テーブルに記録

### 4. セキュリティヘッダー

`next.config.js`でセキュリティヘッダーを設定：

```javascript
headers: [
  {
    key: 'X-Frame-Options',
    value: 'DENY',
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
]
```

### 5. 監査ログ

重要な操作を`audit_logs`テーブルに記録：
- セッション作成
- セッション削除
- データ更新

---

## 🚀 デプロイメント

### Vercelへのデプロイ

1. **GitHubリポジトリにプッシュ**
   ```bash
   git push origin main
   ```

2. **Vercelでプロジェクトをインポート**
   - GitHubリポジトリを選択
   - 自動的にビルド設定を検出

3. **環境変数を設定**
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

4. **デプロイ**
   - プッシュするたびに自動デプロイ
   - プレビューデプロイも自動生成

### ビルドプロセス

```bash
npm run build
```

ビルド時に実行される処理：
1. TypeScriptの型チェック (`prebuild`)
2. Next.jsのビルド
3. 最適化（コード分割、画像最適化など）

---

## 📊 データベーススキーマ

### 主要テーブル

#### `roi_sessions`
```sql
CREATE TABLE roi_sessions (
  id UUID PRIMARY KEY,
  title TEXT,
  company_name TEXT,
  data JSONB,              -- 入力データと計算結果
  created_by UUID,         -- 作成者ID
  is_favorite BOOLEAN,     -- お気に入りフラグ
  is_archived BOOLEAN,     -- アーカイブフラグ
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

#### `users`
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE,
  role TEXT,              -- 'admin' or 'user'
  created_at TIMESTAMP
);
```

#### `login_attempts`
```sql
CREATE TABLE login_attempts (
  id UUID PRIMARY KEY,
  identifier TEXT,        -- メールアドレスまたはIPアドレス
  attempted_at TIMESTAMP,
  success BOOLEAN,
  blocked_until TIMESTAMP
);
```

---

## 🎨 UI/UXの特徴

### レスポンシブデザイン
- Tailwind CSSでモバイルファーストデザイン
- スマートフォン、タブレット、デスクトップに対応

### ユーザビリティ
- **固定ヘッダー**: スクロールしても常に表示
- **未保存警告**: データ損失を防止
- **お気に入り**: よく使うセッションを簡単にアクセス
- **セッション複製**: 似た試算を素早く作成

---

## 🔧 開発ツールとワークフロー

### 開発環境
```bash
npm run dev        # 開発サーバー起動 (localhost:3002)
npm run build      # 本番ビルド
npm run type-check # TypeScript型チェック
npm run lint       # ESLintチェック
```

### コード品質
- **TypeScript**: 型安全性を確保
- **ESLint**: コードスタイルの統一
- **Pre-commit hooks**: ビルド前の型チェック

---

## 📝 まとめ

このアプリケーションは、以下の技術とパターンを使用して構築されています：

1. **Next.js App Router**: サーバー/クライアントコンポーネントの分離
2. **Supabase**: バックエンドとデータベースの統合
3. **React Hooks**: 状態管理とライフサイクル管理
4. **TypeScript**: 型安全性と開発体験の向上
5. **Tailwind CSS**: 効率的なスタイリング

これらの技術を組み合わせることで、セキュアで拡張性の高いWebアプリケーションを実現しています。

---

## 📚 参考資料

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [React Documentation](https://react.dev)
- [TypeScript Documentation](https://www.typescriptlang.org/docs)


