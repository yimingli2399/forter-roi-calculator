# デプロイ手順

## Vercelへのデプロイ

### 前提条件

1. [Vercelアカウント](https://vercel.com)を作成（GitHubアカウントでログイン推奨）
2. [Supabaseプロジェクト](https://supabase.com)が作成済み
3. GitHubリポジトリにコードがプッシュ済み（推奨）

### 手順

#### 1. GitHubにプッシュ（推奨）

```bash
# Gitリポジトリを初期化（まだの場合）
git init
git add .
git commit -m "Initial commit"

# GitHubにリポジトリを作成し、プッシュ
git remote add origin https://github.com/your-username/forter-roi-calculator.git
git branch -M main
git push -u origin main
```

#### 2. Vercelにプロジェクトをインポート

1. [Vercel Dashboard](https://vercel.com/dashboard)にログイン
2. 「Add New...」→「Project」をクリック
3. GitHubリポジトリを選択（または「Import Git Repository」でURLを入力）
4. プロジェクト名を設定（例: `forter-roi-calculator`）
5. Framework Preset: **Next.js** を選択
6. Root Directory: `./` を確認

#### 3. 環境変数の設定

Vercelのプロジェクト設定画面で、以下の環境変数を追加：

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

**環境変数の取得方法：**
1. Supabase Dashboard → プロジェクトを選択
2. Settings → API
3. `Project URL` を `NEXT_PUBLIC_SUPABASE_URL` に設定
4. `anon public` キーを `NEXT_PUBLIC_SUPABASE_ANON_KEY` に設定

#### 4. デプロイ

1. 「Deploy」ボタンをクリック
2. ビルドが完了するまで待つ（通常2-3分）
3. デプロイが完了すると、URLが表示されます（例: `https://forter-roi-calculator.vercel.app`）

#### 5. カスタムドメインの設定（オプション）

1. Vercelプロジェクト → Settings → Domains
2. ドメインを追加
3. DNS設定を更新（Vercelの指示に従う）

### トラブルシューティング

#### ビルドエラー

- **エラー**: `Module not found`
  - `package.json`の依存関係を確認
  - Vercelのビルドログを確認

- **エラー**: `Environment variable not found`
  - Vercelの環境変数設定を確認
  - 変数名が正しいか確認（`NEXT_PUBLIC_`プレフィックスが必要）

#### ランタイムエラー

- **エラー**: Supabase接続エラー
  - 環境変数が正しく設定されているか確認
  - SupabaseのRLSポリシーを確認
  - Supabaseのログを確認

#### パフォーマンス

- Vercelの無料プランでは、サーバーレス関数の実行時間に制限があります
- 大量のデータを扱う場合は、Vercel Proプランを検討

### 継続的デプロイ（CI/CD）

GitHubにプッシュすると、自動的にデプロイされます：

- `main`ブランチへのプッシュ → 本番環境にデプロイ
- その他のブランチへのプッシュ → プレビュー環境にデプロイ

### 環境の分離

本番環境と開発環境を分ける場合：

1. Vercelで2つのプロジェクトを作成
   - `forter-roi-calculator` (本番)
   - `forter-roi-calculator-dev` (開発)
2. それぞれに異なるSupabaseプロジェクトを接続
3. 環境変数を個別に設定

### セキュリティチェックリスト

デプロイ前に確認：

- [ ] 環境変数が正しく設定されている
- [ ] SupabaseのRLSポリシーが有効
- [ ] 認証が正しく動作する
- [ ] HTTPSが有効（Vercelは自動で有効）
- [ ] 機密情報がコードに含まれていない

### その他のホスティングオプション

Vercel以外の選択肢：

1. **Netlify**
   - Next.js対応
   - 無料プランあり
   - 設定はVercelと類似

2. **AWS Amplify**
   - AWSエコシステムとの統合
   - より細かい制御が可能

3. **自社サーバー**
   - Dockerコンテナとしてデプロイ
   - `npm run build && npm start` で実行

