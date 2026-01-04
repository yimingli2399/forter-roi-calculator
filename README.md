# Forter ROI Calculator

セキュアなROI計算アプリケーション。顧客企業の機密情報を安全に管理しながら、Forter導入インパクトを試算できます。

## 機能

- 🔐 メール/パスワード認証
- 📊 リアルタイムROI計算
- 💾 自動保存機能
- 📝 バージョン管理
- 🔒 組織単位のデータ分離
- 📄 PDF/HTMLエクスポート
- 🌐 多言語対応（日本語/英語）

## セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. Supabaseプロジェクトの作成

1. [Supabase](https://supabase.com)でアカウントを作成
2. 新しいプロジェクトを作成
3. SQL Editorで `supabase/schema.sql` を実行

### 3. 環境変数の設定

`.env.local.example` を `.env.local` にコピーし、Supabaseの認証情報を設定：

```bash
cp .env.local.example .env.local
```

`.env.local` を編集：
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. 開発サーバーの起動

```bash
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開きます。

## デプロイ

### Vercelへのデプロイ

1. [Vercel](https://vercel.com)にプロジェクトをインポート
2. 環境変数を設定
3. デプロイ

詳細は [Next.js deployment documentation](https://nextjs.org/docs/deployment) を参照してください。

## セキュリティ

- Row Level Security (RLS) によるデータアクセス制御
- 組織単位のデータ分離
- 監査ログ機能
- HTTPS必須
- セキュリティヘッダー設定

## ライセンス

Private - Forter Internal Use Only

