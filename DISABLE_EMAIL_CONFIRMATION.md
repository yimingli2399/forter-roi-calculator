# メール確認を無効にする方法

## 問題

新規登録後、「Email not confirmed」エラーが発生します。

## 原因

Supabaseのデフォルト設定で、メール確認が必要になっています。

## 解決方法

### 方法1: Supabase設定でメール確認を無効化（開発環境向け・推奨）

1. Supabaseダッシュボードを開く
2. 左メニューから「Authentication」→「Settings」を開く
3. 「Email Auth」セクションを探す
4. 「Confirm email」のトグルを**OFF**にする
5. 「Save」をクリック

これで、新規登録したユーザーはメール確認なしでログインできます。

### 方法2: 既存ユーザーを手動で確認済みにする

既に登録済みのユーザーを確認済みにする場合：

1. Supabaseダッシュボード → 「Authentication」→「Users」
2. 該当ユーザーを探す
3. ユーザーをクリック
4. 「Confirm email」ボタンをクリック

### 方法3: SQLで確認済みにする

Supabase SQL Editorで以下を実行：

```sql
-- 特定のメールアドレスを確認済みにする
UPDATE auth.users
SET email_confirmed_at = NOW()
WHERE email = 'your-email@example.com';

-- または、すべてのユーザーを確認済みにする（開発環境のみ）
UPDATE auth.users
SET email_confirmed_at = COALESCE(email_confirmed_at, NOW())
WHERE email_confirmed_at IS NULL;
```

## 推奨設定（開発環境）

開発環境では、以下を推奨します：

1. ✅ メール確認を無効化（方法1）
2. ✅ 既存ユーザーを確認済みにする（方法2または3）

本番環境では、メール確認を有効にしておくことを推奨します。

