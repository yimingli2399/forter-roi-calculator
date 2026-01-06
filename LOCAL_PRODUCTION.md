# ローカルで本番環境を再現する手順

Vercelにデプロイした内容をローカルで再現する方法です。

## 前提条件

1. Node.jsがインストールされていること（推奨: v18以上）
2. Gitリポジトリがクローンされていること
3. 環境変数が設定されていること（`.env.local`）

## 手順

### 1. リポジトリをクローン（初回のみ）

```bash
git clone https://github.com/yimingli2399/forter-roi-calculator.git
cd forter-roi-calculator
```

### 2. 依存関係をインストール

```bash
npm install
```

### 3. 環境変数を設定

`.env.local` ファイルを作成し、Vercelで設定した環境変数を設定します：

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

**環境変数の取得方法：**
- Vercelダッシュボード → プロジェクト → Settings → Environment Variables
- または、Supabaseダッシュボード → Settings → API

### 4. 本番ビルドを実行

```bash
npm run build
```

このコマンドは以下を実行します：
- 型チェック（`npm run type-check`）
- Next.jsの本番ビルド（`next build`）

### 5. 本番モードで起動

```bash
npm start
```

サーバーが起動したら、ブラウザで以下にアクセス：
- http://localhost:3002

## 開発モード vs 本番モード

### 開発モード（`npm run dev`）

- **用途**: 開発中に使用
- **特徴**:
  - ホットリロード（コード変更が自動反映）
  - 詳細なエラーメッセージ
  - 型チェックが緩い（警告のみ）
  - ビルド時間が短い

### 本番モード（`npm run build && npm start`）

- **用途**: 本番環境を再現、デプロイ前の確認
- **特徴**:
  - 最適化されたビルド
  - 本番と同じ動作
  - 型チェックが厳格（エラーで停止）
  - パフォーマンスが最適化されている

## よくある問題と解決方法

### ビルドエラーが発生する

```bash
# 型チェックのみ実行してエラーを確認
npm run type-check

# エラーがあれば修正してから再ビルド
npm run build
```

### 環境変数が読み込まれない

1. `.env.local` ファイルが正しい場所にあるか確認（`package.json`と同じ階層）
2. 環境変数の名前が正しいか確認（`NEXT_PUBLIC_` プレフィックスが必要）
3. サーバーを再起動

```bash
# サーバーを停止（Ctrl+C）してから再起動
npm start
```

### ポートが既に使用されている

```bash
# 別のポートで起動（例: 3003）
npm start -- -p 3003
```

または、`package.json` の `start` スクリプトを変更：

```json
"start": "next start -p 3003"
```

## デプロイ前のチェックリスト

本番環境にデプロイする前に、ローカルで以下を確認：

- [ ] `npm run type-check` でエラーがない
- [ ] `npm run build` が成功する
- [ ] `npm start` でアプリが正常に起動する
- [ ] ログイン・ログアウトが動作する
- [ ] セッションの作成・編集・削除が動作する
- [ ] エクスポート機能（PDF/HTML）が動作する

## クイックリファレンス

```bash
# 開発モードで起動
npm run dev

# 本番ビルド
npm run build

# 本番モードで起動
npm start

# 型チェックのみ
npm run type-check

# リンター実行
npm run lint
```

## 注意事項

- `.env.local` はGitにコミットされません（`.gitignore`に含まれています）
- 本番環境の環境変数はVercelダッシュボードで管理します
- ローカルと本番で異なるSupabaseプロジェクトを使用することを推奨します


