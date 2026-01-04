# RLSポリシーの無限再帰エラー修正

## 問題

新規ユーザー登録時に「infinite recursion detected in policy for relation "users"」エラーが発生していました。

## 原因

`users`テーブルのRLSポリシーが、`users`テーブル自体を参照しようとして無限再帰を引き起こしていました。

## 解決方法

### オプション1: 修正済みスキーマを再実行（推奨）

1. Supabaseダッシュボードで「SQL Editor」を開く
2. **既存のポリシーを削除**:
   ```sql
   DROP POLICY IF EXISTS "Users can view users in their organization" ON users;
   DROP POLICY IF EXISTS "Users can view their own organization" ON organizations;
   ```

3. **修正済みのスキーマファイルを再実行**:
   - `supabase/schema.sql` の「Users policies」と「Organizations policies」セクションをコピー
   - SQL Editorに貼り付けて実行

### オプション2: 修正SQLを実行

1. Supabaseダッシュボードで「SQL Editor」を開く
2. `supabase/fix_policies.sql` の内容をコピー
3. SQL Editorに貼り付けて実行

## 修正内容

### Before (問題のあるポリシー)
```sql
CREATE POLICY "Users can view users in their organization"
  ON users FOR SELECT
  USING (
    organization_id = (SELECT organization_id FROM users WHERE id = auth.uid())
  );
```

### After (修正後)
```sql
-- 自分自身のレコードは常にアクセス可能
CREATE POLICY "Users can view their own record"
  ON users FOR SELECT
  USING (id = auth.uid());

-- 組織内の他のユーザーも見られる（無限再帰を回避）
CREATE POLICY "Users can view users in their organization"
  ON users FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.organization_id IS NOT NULL
      AND users.organization_id = u.organization_id
    )
  );

-- 新規登録時に自分のレコードを挿入できる
CREATE POLICY "Users can insert their own record"
  ON users FOR INSERT
  WITH CHECK (id = auth.uid());
```

## 確認

修正後、再度新規登録を試してください：
1. http://localhost:3002/register にアクセス
2. 組織名、メールアドレス、パスワードを入力
3. エラーなく登録できることを確認

