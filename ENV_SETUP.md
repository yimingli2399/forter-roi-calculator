# 環境変数の設定手順

## ステップ1: Supabaseから認証情報を取得

1. Supabaseダッシュボードにログイン
2. 左メニューから **「Settings」**（歯車アイコン）をクリック
3. **「API」** タブをクリック

以下の2つの情報をコピーします：

### 1. Project URL
- **場所**: 「Project URL」セクション
- **形式**: `https://xxxxxxxxxxxxx.supabase.co`
- **コピー方法**: URLをクリックしてコピー

### 2. anon public key
- **場所**: 「Project API keys」セクション
- **ラベル**: `anon` `public`
- **形式**: 長い文字列（例: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`）
- **コピー方法**: 「Reveal」ボタンをクリックして表示し、コピー

⚠️ **重要**: `service_role` keyは**絶対に**コピーしないでください。これは秘密キーです。

## ステップ2: .env.local ファイルを作成

プロジェクトのルートディレクトリ（`package.json`がある場所）に `.env.local` ファイルを作成します。

### 方法1: ターミナルから作成（推奨）

```bash
# プロジェクトのルートディレクトリで実行
cd "/Users/yimingli/Desktop/Forter ROI"

# .env.localファイルを作成
cat > .env.local << 'EOF'
NEXT_PUBLIC_SUPABASE_URL=ここにProject_URLを貼り付け
NEXT_PUBLIC_SUPABASE_ANON_KEY=ここにanon_public_keyを貼り付け
EOF
```

その後、エディタで `.env.local` を開いて、実際の値を貼り付けます。

### 方法2: エディタから直接作成

1. VS Codeやテキストエディタでプロジェクトを開く
2. ルートディレクトリに新しいファイルを作成
3. ファイル名を `.env.local` とする（先頭のドットを忘れずに）
4. 以下の内容をコピー＆ペースト：

```env
NEXT_PUBLIC_SUPABASE_URL=ここにProject_URLを貼り付け
NEXT_PUBLIC_SUPABASE_ANON_KEY=ここにanon_public_keyを貼り付け
```

5. `ここにProject_URLを貼り付け` の部分を、ステップ1でコピーしたProject URLに置き換え
6. `ここにanon_public_keyを貼り付け` の部分を、ステップ1でコピーしたanon public keyに置き換え

## 完成例

正しく設定されると、`.env.local` ファイルは以下のようになります：

```env
NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYxNjIzOTAyMiwiZXhwIjoxOTMxODE1MDIyfQ.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

⚠️ **注意**:
- 値の前後に余分なスペースや引用符を入れないでください
- `=` の前後にスペースは不要です
- ファイル名は必ず `.env.local` です（`.env.local.txt` などではない）

## ステップ3: 設定の確認

1. `.env.local` ファイルを保存
2. 開発サーバーを起動（まだ起動していない場合）:
   ```bash
   npm run dev
   ```
3. ブラウザで http://localhost:3000 を開く
4. エラーが表示されないことを確認

## トラブルシューティング

### エラー: "Invalid API key"
- `.env.local` の値が正しく設定されているか確認
- 余分なスペースや引用符がないか確認
- Supabaseダッシュボードで正しいキーをコピーしたか確認

### エラー: "Failed to fetch"
- `NEXT_PUBLIC_SUPABASE_URL` が正しいか確認（`https://` で始まる）
- Supabaseプロジェクトがアクティブか確認（ダッシュボードで確認）

### 環境変数が読み込まれない
- 開発サーバーを再起動してください：
  ```bash
  # Ctrl+C で停止してから
  npm run dev
  ```
- `.env.local` ファイルがプロジェクトルートにあるか確認（`package.json`と同じ階層）

## セキュリティ注意事項

- ✅ `.env.local` は `.gitignore` に含まれているので、Gitにコミットされません
- ✅ このファイルはローカルでのみ使用します
- ❌ このファイルをGitHubや他の場所に共有しないでください
- ❌ `service_role` keyは絶対に使用しないでください（サーバーサイド専用）

