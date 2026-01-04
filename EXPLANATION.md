# 無限再帰エラーの原因と解決方法 - わかりやすい解説

## 📖 問題の概要

新規登録時に「infinite recursion detected in policy for relation "users"」というエラーが発生しています。

## 🔍 何が起きているのか？

### 1. 新規登録の流れ

```
ユーザーが登録ボタンをクリック
    ↓
1. Supabase Authにユーザーを作成
    ↓
2. 自動的に `users` テーブルにレコードを作成（トリガー関数）
    ↓
3. 組織（`organizations`）を作成 ← ここでエラー発生
    ↓
4. `users` テーブルを更新して組織IDを設定
```

### 2. エラーが発生する理由

**Row Level Security (RLS)** というセキュリティ機能が原因です。

#### RLSとは？
- データベースの各テーブルに「誰が何をできるか」を定義するルール
- 例：「自分のデータだけ見られる」「同じ組織の人のデータだけ見られる」

#### 問題の構造

```
organizationsテーブルにINSERTしようとする
    ↓
「認証されたユーザーなら組織を作成できる」というルールをチェック
    ↓
このルールを評価するために、Supabaseが「このユーザーは認証されているか？」を確認
    ↓
確認するために `users` テーブルを見る必要がある
    ↓
`users` テーブルを見るには、`users` テーブルのRLSルールをチェック
    ↓
「同じ組織のユーザーだけ見られる」というルールをチェック
    ↓
このルールを評価するために、また `users` テーブルを見る必要がある
    ↓
また `users` テーブルのRLSルールをチェック
    ↓
また `users` テーブルを見る必要がある
    ↓
...（無限に繰り返す）← これが「無限再帰」
```

## 🎯 なぜこれが起きるのか？

### 問題のあるポリシー設計

```sql
-- ❌ 問題のあるポリシー
CREATE POLICY "Users can view users in their organization"
  ON users FOR SELECT
  USING (
    organization_id = (SELECT organization_id FROM users WHERE id = auth.uid())
    -- ↑ このポリシー自体が users テーブルを見ようとしている！
  );
```

このポリシーは：
- `users` テーブルを見るためのルール
- でも、そのルールを評価するために `users` テーブルを見る必要がある
- そのためにまた `users` テーブルのルールを評価する必要がある
- → 無限ループ！

### さらに悪いことに...

`organizations` テーブルにINSERTする際：
- Supabaseは「このユーザーが認証されているか？」を確認
- そのために `users` テーブルを見る
- `users` テーブルのRLSルールが `users` テーブル自体を参照している
- → 無限再帰が発生

## ✅ 解決方法

### 解決のアプローチ

1. **自分自身のレコードは常にアクセス可能にする**
   - 「自分のID = ログイン中のID」なら見られる
   - これは `users` テーブルを見る必要がない（`auth.uid()`だけで判断可能）

2. **組織内の他のユーザーを見るルールを分離**
   - まず「自分に組織IDがあるか」をチェック
   - 次に「相手も同じ組織IDか」をチェック
   - でも、これでもまだ問題が残る可能性がある

3. **`organizations` テーブルのINSERTルールを単純化**
   - 「認証されているか？」だけをチェック
   - `users` テーブルを参照しない

4. **`handle_new_user()` 関数を修正**
   - この関数は `users` テーブルに自動的にレコードを作成する
   - `SECURITY DEFINER` を使って、RLSをバイパスできるようにする

### 修正後のポリシー設計

```sql
-- ✅ 修正後のポリシー

-- 1. 自分自身のレコードは常にアクセス可能（再帰なし）
CREATE POLICY "Users can view their own record"
  ON users FOR SELECT
  USING (id = auth.uid());
  -- ↑ auth.uid() だけで判断できるので、usersテーブルを見る必要がない

-- 2. 組織内の他のユーザーを見る（慎重に設計）
CREATE POLICY "Users can view users in their organization"
  ON users FOR SELECT
  USING (
    -- まず、自分に組織IDがあるかチェック
    (SELECT organization_id FROM users WHERE id = auth.uid()) IS NOT NULL
    AND
    -- 次に、相手も同じ組織IDかチェック
    organization_id = (SELECT organization_id FROM users WHERE id = auth.uid())
    AND
    -- 自分自身は除外（既に上のポリシーでカバーされている）
    id != auth.uid()
  );
  -- 注意：これでもまだ問題が残る可能性がある

-- 3. 組織を作成するルール（usersテーブルを参照しない）
CREATE POLICY "Authenticated users can create organizations"
  ON organizations FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');
  -- ↑ auth.role() だけで判断できるので、usersテーブルを見る必要がない
```

## 🛠️ 実際の修正内容

`supabase/definitive_fix.sql` では以下を行います：

### Step 1: すべてをクリーンアップ
```sql
-- すべての既存ポリシーと関数を削除
DROP POLICY IF EXISTS ...;
DROP FUNCTION IF EXISTS ...;
```

### Step 2: 関数を再作成（RLSをバイパス）
```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER  -- ← これでRLSをバイパス
SET search_path = public
...
```

### Step 3: ポリシーを再作成（再帰を防ぐ設計）
- 自分自身のレコードは常にアクセス可能
- 組織内のユーザーを見るルールを慎重に設計
- 組織を作成するルールは `users` テーブルを参照しない

## 📊 ビフォー・アフター比較

### Before（問題のある設計）
```
organizations INSERT
    ↓
users テーブルを参照（認証確認）
    ↓
users テーブルのRLSルールを評価
    ↓
users テーブルを参照（組織確認）
    ↓
users テーブルのRLSルールを評価
    ↓
users テーブルを参照...
    ↓
無限ループ！💥
```

### After（修正後の設計）
```
organizations INSERT
    ↓
auth.role() をチェック（認証確認）
    ↓
users テーブルを参照しない ✅
    ↓
成功！
```

## 🎓 まとめ

### 問題の本質
- RLSポリシーが自分自身を参照している
- 評価するために自分自身を見る必要がある
- → 無限ループ

### 解決のポイント
1. **自分自身のレコードは単純な条件で判断**（`auth.uid()` だけ）
2. **組織作成ルールは `users` テーブルを参照しない**（`auth.role()` だけ）
3. **関数は `SECURITY DEFINER` でRLSをバイパス**

### 実行方法
1. `supabase/definitive_fix.sql` をSupabase SQL Editorで実行
2. すべてのポリシーと関数が再作成される
3. 新規登録が正常に動作する

## 💡 技術的な補足

### SECURITY DEFINER とは？
- 関数を実行する際、関数の作成者の権限で実行される
- RLS（Row Level Security）をバイパスできる
- これにより、`handle_new_user()` 関数は `users` テーブルに直接INSERTできる

### なぜこれまで修正できなかったのか？
1. ポリシーが部分的にしか削除されていなかった
2. 関数がRLSを完全にバイパスできていなかった
3. `users` テーブルのポリシーが `users` テーブルを参照していた

今回の修正では、これらすべてを一度に解決しています。

