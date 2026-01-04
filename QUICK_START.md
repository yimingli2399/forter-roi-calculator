# クイックスタートガイド

## 5分でテスト開始

### 1. 依存関係のインストール

```bash
npm install
```

### 2. Supabaseのセットアップ（初回のみ）

#### 2.1 Supabaseアカウント作成
- https://supabase.com にアクセス
- GitHubアカウントでログイン（推奨）

#### 2.2 プロジェクト作成
1. 「New Project」をクリック
2. プロジェクト名を入力（例: `forter-roi-test`）
3. データベースパスワードを設定（**必ず保存してください**）
4. リージョン選択（`Tokyo (ap-northeast-1)` 推奨）
5. 「Create new project」をクリック

#### 2.3 データベーススキーマの実行
1. 左メニューから「SQL Editor」を開く
2. 「New query」をクリック
3. このファイルを開く: `supabase/schema.sql`
4. 内容をすべてコピーしてSQL Editorに貼り付け
5. 「Run」ボタンをクリック（または `Cmd/Ctrl + Enter`）
6. 成功メッセージを確認

#### 2.4 API認証情報の取得
1. 左メニューから「Settings」→「API」を開く
2. 以下の2つをコピー：
   - **Project URL**（`https://xxxxx.supabase.co` の形式）
   - **anon public** key（長い文字列）

### 3. 環境変数の設定

プロジェクトルートに `.env.local` ファイルを作成：

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

**重要**: `.env.local` は `.gitignore` に含まれているので、Gitにコミットされません。

### 4. 開発サーバーの起動

```bash
npm run dev
```

ブラウザで http://localhost:3000 を開きます。

### 5. 初回ユーザー登録

1. 自動的に `/register` にリダイレクトされます
2. 以下の情報を入力：
   - **組織名**: テスト用の組織名（例: `テスト企業`）
   - **メールアドレス**: テスト用メール（例: `test@example.com`）
   - **パスワード**: 8文字以上（例: `test1234`）
   - **パスワード（確認）**: 同じパスワード
3. 「登録」ボタンをクリック
4. 自動的にダッシュボードにリダイレクトされます

### 6. 動作確認

#### ✅ 基本動作
- [ ] ログイン/ログアウトが動作する
- [ ] ダッシュボードが表示される
- [ ] 「+ 新規作成」ボタンでセッションを作成できる
- [ ] セッションをクリックして開ける
- [ ] セッションのタイトルを編集できる

#### ✅ セキュリティ
- [ ] ログアウト後、`/roi` に直接アクセスできない
- [ ] 他の組織のセッションにアクセスできない（RLS）

## トラブルシューティング

### エラー: "Failed to fetch"
- `.env.local` の環境変数が正しく設定されているか確認
- Supabaseプロジェクトがアクティブか確認（ダッシュボードで確認）

### エラー: "relation does not exist"
- `supabase/schema.sql` が正しく実行されているか確認
- SQL Editorで再度実行してみる

### エラー: "Invalid API key"
- Supabaseの「Settings」→「API」から正しいキーをコピー
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` が正しく設定されているか確認

### ビルドエラー
```bash
# 依存関係を再インストール
rm -rf node_modules package-lock.json
npm install
```

## 次のステップ

基本的な動作が確認できたら：

1. **完全な入力フォームの実装** - ROI計算の全パラメータを入力できるように
2. **PDF/HTMLエクスポート** - 既存のエクスポート機能を移植
3. **バージョン管理UI** - 計算履歴の表示と比較

## サポート

問題が発生した場合：
1. ブラウザのコンソール（F12）でエラーを確認
2. Supabaseのログ（「Logs」→「Postgres Logs」）を確認
3. `SETUP.md` の詳細手順を参照

