# クイックデプロイガイド

## 5分でVercelにデプロイ

### ステップ1: GitHubにプッシュ

```bash
# まだGitリポジトリでない場合
git init
git add .
git commit -m "Initial commit"

# GitHubにリポジトリを作成後
git remote add origin https://github.com/your-username/forter-roi-calculator.git
git push -u origin main
```

### ステップ2: Vercelにインポート

1. https://vercel.com にアクセス
2. 「Add New...」→「Project」
3. GitHubリポジトリを選択
4. プロジェクト名を入力（例: `forter-roi-calculator`）

### ステップ3: 環境変数を設定

Vercelのプロジェクト設定画面で以下を追加：

| 変数名 | 値の取得方法 |
|--------|------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Dashboard → Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Dashboard → Settings → API → anon public key |

### ステップ4: デプロイ

「Deploy」ボタンをクリック → 完了！

### デプロイ後の確認

1. デプロイされたURLにアクセス
2. ログインが動作するか確認
3. セッション作成が動作するか確認

## トラブルシューティング

### ビルドが失敗する

- Vercelのビルドログを確認
- 環境変数が正しく設定されているか確認

### ログインできない

- Supabaseの環境変数が正しいか確認
- SupabaseのAuthentication設定を確認

### データが表示されない

- SupabaseのRLSポリシーを確認
- ブラウザのコンソールでエラーを確認

## 次のステップ

- カスタムドメインの設定
- 本番環境と開発環境の分離
- 監視とアラートの設定

詳細は `DEPLOYMENT.md` を参照してください。

