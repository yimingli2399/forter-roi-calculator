# クイック修正：メール確認エラー

## エラー内容
「Email not confirmed」エラーが発生

## 最も簡単な解決方法

### Supabase設定を変更（1分で完了）

1. **Supabaseダッシュボードを開く**
   - https://supabase.com にログイン
   - プロジェクトを選択

2. **Authentication設定を開く**
   - 左メニュー → 「Authentication」
   - 「Settings」タブをクリック

3. **メール確認を無効化**
   - 「Email Auth」セクションを探す
   - 「Confirm email」のトグルを**OFF**にする
   - 「Save」をクリック

4. **完了！**
   - これで新規登録したユーザーはすぐにログインできます

## 既存ユーザーを確認済みにする

既に登録済みのユーザーがある場合：

### 方法A: ダッシュボードから（簡単）

1. Supabaseダッシュボード → 「Authentication」→「Users」
2. 該当ユーザーのメールアドレスをクリック
3. 「Confirm email」ボタンをクリック

### 方法B: SQLで一括処理（複数ユーザーがある場合）

Supabase SQL Editorで実行：

```sql
-- すべてのユーザーを確認済みにする
UPDATE auth.users
SET email_confirmed_at = COALESCE(email_confirmed_at, NOW())
WHERE email_confirmed_at IS NULL;
```

## 確認

設定変更後：
1. ブラウザで http://localhost:3002/login を開く
2. 登録したメールアドレスとパスワードでログイン
3. エラーなくログインできることを確認

