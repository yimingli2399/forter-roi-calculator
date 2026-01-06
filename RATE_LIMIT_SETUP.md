# ログインスロットリング機能のセットアップ

## 概要

ログイン試行回数を制限し、ブルートフォース攻撃を防ぐ機能です。

### 機能

- **メールアドレスごとの制限**: 同じメールアドレスからの連続した失敗試行を制限
- **IPアドレスごとの制限**: 同じIPアドレスからの連続した失敗試行を制限
- **時間窓**: 15分間で最大5回の失敗試行まで許可
- **ブロック期間**: 上限に達した場合、30分間ブロック
- **成功時のリセット**: ログイン成功でブロックが解除

## セットアップ手順

### 1. データベーステーブルの作成

SupabaseのSQL Editorで以下を実行：

```sql
-- supabase/add_login_rate_limit.sql の内容を実行
```

または、Supabaseダッシュボードで：
1. SQL Editorを開く
2. `supabase/add_login_rate_limit.sql` の内容をコピー＆ペースト
3. 実行

### 2. 設定の確認

デフォルト設定（`lib/utils/rateLimit.ts`）：
- **最大試行回数**: 5回
- **時間窓**: 15分間
- **ブロック期間**: 30分間

設定を変更する場合は、`lib/utils/rateLimit.ts` の `DEFAULT_CONFIG` を編集してください。

## 動作の流れ

1. **ユーザーがログインを試行**
   - ログインページでメールアドレスとパスワードを入力

2. **レート制限チェック**
   - `/api/auth/login` でメールアドレスとIPアドレスの両方をチェック
   - 制限に達している場合、エラーを返す

3. **Supabaseでログイン試行**
   - レート制限が通過した場合のみ、Supabaseでログインを試行

4. **結果の記録**
   - 成功/失敗に関わらず、`/api/auth/login/record` で記録
   - 失敗した場合、試行回数が増加
   - 成功した場合、ブロックが解除

## エラーメッセージ

### レート制限に達した場合

```
ログイン試行回数が上限に達しました。2024/01/01 12:00:00までお待ちください。
```

### 残り試行回数がある場合

```
Invalid login credentials（残り試行回数: 3回）
```

## カスタマイズ

### 設定を変更する

`lib/utils/rateLimit.ts` の `DEFAULT_CONFIG` を編集：

```typescript
const DEFAULT_CONFIG: RateLimitConfig = {
  maxAttempts: 5,        // 最大試行回数
  windowMs: 15 * 60 * 1000,      // 15分間
  blockDurationMs: 30 * 60 * 1000, // 30分間ブロック
}
```

### 特定のメールアドレス/IPアドレスを除外

`checkRateLimit` 関数内で除外リストを追加：

```typescript
// 管理者メールアドレスを除外
if (identifier.endsWith('@yourcompany.com')) {
  return {
    allowed: true,
    remainingAttempts: Infinity,
    resetTime: null,
    blockedUntil: null,
  }
}
```

## トラブルシューティング

### レート制限が機能しない

1. データベーステーブルが作成されているか確認
2. `login_attempts` テーブルにデータが記録されているか確認
3. ブラウザのコンソールでエラーを確認

### 正常なログインがブロックされる

1. データベースの `login_attempts` テーブルを確認
2. 古い記録を削除：
   ```sql
   DELETE FROM login_attempts 
   WHERE attempted_at < NOW() - INTERVAL '1 day';
   ```

### パフォーマンスの問題

- `login_attempts` テーブルにインデックスが作成されているか確認
- 古い記録が自動削除されているか確認（30日以上前の記録）

## セキュリティ考慮事項

1. **IPアドレスの取得**: Vercelなどのプロキシ経由の場合、`x-forwarded-for` ヘッダーを使用
2. **データの保持**: 30日以上前の記録は自動削除
3. **RLSポリシー**: `login_attempts` テーブルはサーバーサイドでのみ使用

## テスト

### レート制限のテスト

1. 間違ったパスワードで5回ログインを試行
2. 6回目でブロックされることを確認
3. 正しいパスワードでログイン成功後、ブロックが解除されることを確認

### データベースの確認

```sql
-- 最近のログイン試行を確認
SELECT * FROM login_attempts 
ORDER BY attempted_at DESC 
LIMIT 10;

-- ブロック中のメールアドレス/IPアドレスを確認
SELECT identifier, blocked_until 
FROM login_attempts 
WHERE blocked_until > NOW() 
ORDER BY blocked_until DESC;
```


