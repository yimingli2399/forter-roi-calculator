# 最終解決策：無限再帰エラーの完全修正

## 問題の根本原因

無限再帰が発生する理由：
1. `organizations`テーブルにINSERTする際、Supabaseが`users`テーブルのポリシーも評価する
2. `users`テーブルのポリシーが`users`テーブル自体を参照している
3. これにより無限再帰が発生

## 解決方法

**`supabase/definitive_fix.sql`** をSupabase SQL Editorで実行してください。

このSQLは以下を行います：
1. すべての既存ポリシーと関数を削除
2. `handle_new_user()`関数を再作成（RLSを完全にバイパス）
3. すべてのポリシーを再作成（再帰を防ぐ設計）

## 実行手順

### 1. Supabaseダッシュボードを開く
- https://supabase.com にログイン
- プロジェクトを選択

### 2. SQL Editorを開く
- 左メニューから「SQL Editor」をクリック
- 「New query」をクリック

### 3. 修正SQLを実行
1. `supabase/definitive_fix.sql` ファイルを開く
2. **すべての内容をコピー**
3. Supabase SQL Editorに貼り付け
4. **「Run」ボタンをクリック**（または `Cmd/Ctrl + Enter`）

### 4. 成功を確認
- 「Success」メッセージが表示されることを確認
- エラーが表示された場合は、エラーメッセージを確認

### 5. アプリで再試行
1. ブラウザで http://localhost:3002/register を開く
2. 組織名、メールアドレス、パスワードを入力
3. 「登録」ボタンをクリック
4. **エラーなく登録できることを確認**

## 重要なポイント

この修正では：
- ✅ `handle_new_user()`関数がRLSを完全にバイパス
- ✅ `organizations`テーブルのINSERTポリシーが`users`テーブルを参照しない
- ✅ `users`テーブルのポリシーが再帰を引き起こさない設計

## まだエラーが発生する場合

### エラー: "policy already exists"
- SQLを再度実行してください（`DROP POLICY IF EXISTS`が含まれているので安全です）

### エラー: "function already exists"
- SQLを再度実行してください（`DROP FUNCTION IF EXISTS`が含まれているので安全です）

### まだ無限再帰エラーが発生する場合
1. Supabaseダッシュボードで「Database」→「Policies」を確認
2. `users`と`organizations`テーブルのポリシー一覧を確認
3. 古いポリシーが残っていないか確認
4. 必要に応じて、手動で古いポリシーを削除してから再実行

## 確認方法

SQL実行後、以下を確認：
1. ✅ ポリシーが正しく作成されている（Database → Policies）
2. ✅ 関数が正しく作成されている（Database → Functions）
3. ✅ 新規登録が成功する

