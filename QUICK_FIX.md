# クイック修正ガイド

## エラー: "infinite recursion detected in policy for relation 'users'"

このエラーを修正するには、Supabaseで以下のSQLを実行してください。

## 修正手順

### 1. Supabaseダッシュボードを開く
- https://supabase.com にログイン
- プロジェクトを選択

### 2. SQL Editorを開く
- 左メニューから「SQL Editor」をクリック
- 「New query」をクリック

### 3. 修正SQLを実行
以下のいずれかの方法で実行：

#### 方法A: 完全な修正SQL（推奨）
1. `supabase/complete_fix.sql` ファイルを開く
2. 内容をすべてコピー
3. Supabase SQL Editorに貼り付け
4. 「Run」ボタンをクリック（または `Cmd/Ctrl + Enter`）

#### 方法B: 手動で実行
以下のSQLをコピー＆ペーストして実行：

```sql
-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can view users in their organization" ON users;
DROP POLICY IF EXISTS "Users can view their own organization" ON organizations;

-- Fix users policies
CREATE POLICY "Users can view their own record"
  ON users FOR SELECT
  USING (id = auth.uid());

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

CREATE POLICY "Users can insert their own record"
  ON users FOR INSERT
  WITH CHECK (id = auth.uid());

-- Fix organizations policies
CREATE POLICY "Users can view their own organization"
  ON organizations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.organization_id = organizations.id
    )
  );

CREATE POLICY "Authenticated users can create organizations"
  ON organizations FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');
```

### 4. 確認
- SQL実行後、「Success. No rows returned」または類似のメッセージが表示されることを確認

### 5. アプリで再試行
1. ブラウザで http://localhost:3002/register を開く
2. 組織名、メールアドレス、パスワードを入力
3. 「登録」ボタンをクリック
4. エラーなく登録できることを確認

## トラブルシューティング

### エラー: "policy already exists"
- 既存のポリシーを削除してから再実行：
  ```sql
  DROP POLICY IF EXISTS "Users can view their own record" ON users;
  DROP POLICY IF EXISTS "Users can view users in their organization" ON users;
  DROP POLICY IF EXISTS "Users can insert their own record" ON users;
  DROP POLICY IF EXISTS "Users can view their own organization" ON organizations;
  DROP POLICY IF EXISTS "Authenticated users can create organizations" ON organizations;
  ```
- その後、`complete_fix.sql` を再実行

### まだエラーが発生する場合
1. Supabaseダッシュボードで「Database」→「Policies」を確認
2. `users`と`organizations`テーブルのポリシー一覧を確認
3. 問題のあるポリシーを手動で削除してから再実行

