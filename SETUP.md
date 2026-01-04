# セットアップ手順

## 1. 依存関係のインストール

```bash
npm install
```

## 2. Supabaseプロジェクトのセットアップ

### 2.1 Supabaseアカウントの作成

1. [Supabase](https://supabase.com)にアクセス
2. アカウントを作成（GitHubアカウントでログイン可能）
3. 「New Project」をクリック

### 2.2 プロジェクトの作成

- **Name**: `forter-roi-calculator`（任意）
- **Database Password**: 強力なパスワードを設定（後で必要）
- **Region**: 最寄りのリージョンを選択（例: `Tokyo (ap-northeast-1)`）
- **Pricing Plan**: Free tierで開始可能

### 2.3 データベーススキーマの実行

1. Supabaseダッシュボードで「SQL Editor」を開く
2. `supabase/schema.sql` の内容をコピー
3. SQL Editorに貼り付けて実行（「Run」ボタンをクリック）

### 2.4 認証設定

1. 「Authentication」→「Settings」を開く
2. 「Email Auth」が有効になっていることを確認
3. 「Site URL」を設定（開発時は `http://localhost:3000`）

### 2.5 API認証情報の取得

1. 「Settings」→「API」を開く
2. 以下の情報をコピー：
   - **Project URL** (`NEXT_PUBLIC_SUPABASE_URL`)
   - **anon public** key (`NEXT_PUBLIC_SUPABASE_ANON_KEY`)

## 3. 環境変数の設定

プロジェクトルートに `.env.local` ファイルを作成：

```bash
cp .env.local.example .env.local
```

`.env.local` を編集して、Supabaseの認証情報を設定：

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

## 4. 開発サーバーの起動

```bash
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開きます。

## 5. 初回ユーザーの登録

1. `/register` にアクセス
2. 組織名、メールアドレス、パスワードを入力
3. 登録後、自動的にダッシュボードにリダイレクトされます

## 6. テスト

### 基本的な動作確認

1. ✅ ログイン/ログアウトが動作する
2. ✅ ダッシュボードでセッション一覧が表示される
3. ✅ 新しいセッションを作成できる
4. ✅ セッションを開いて編集できる

### セキュリティの確認

1. ✅ 他の組織のセッションにアクセスできない（RLS）
2. ✅ 認証されていないユーザーは `/roi` にアクセスできない
3. ✅ 監査ログが記録される

## トラブルシューティング

### データベースエラー

- SQLスキーマが正しく実行されているか確認
- Supabaseのログを確認（「Logs」→「Postgres Logs」）

### 認証エラー

- 環境変数が正しく設定されているか確認
- Supabaseの「Authentication」設定を確認

### ビルドエラー

```bash
# 依存関係を再インストール
rm -rf node_modules package-lock.json
npm install
```

## 次のステップ

現在の実装状況：

- ✅ 認証機能（メール/パスワード）
- ✅ データベーススキーマとRLS
- ✅ ダッシュボード
- ✅ 基本的なROI計算ロジック
- ⏳ 完全な入力フォーム（実装中）
- ⏳ PDF/HTMLエクスポート機能
- ⏳ バージョン管理UI

完全な入力フォームとエクスポート機能は、次のステップで実装します。

