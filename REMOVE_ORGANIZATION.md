# 組織概念の完全削除ガイド

## 🎯 目的

社内専用ツールなので、組織（organization）の概念を完全に削除します。

## 📋 実行手順

### 1. SupabaseでSQLを実行

1. Supabaseダッシュボード → 「SQL Editor」
2. `supabase/remove_organization.sql` の内容をすべてコピー
3. SQL Editorに貼り付けて「Run」をクリック

このSQLは以下を行います：
- ✅ すべての組織関連ポリシーを削除
- ✅ `users`テーブルから`organization_id`カラムを削除
- ✅ `roi_sessions`テーブルから`organization_id`カラムを削除
- ✅ `organizations`テーブル自体を削除
- ✅ シンプルな認証ベースのポリシーを再作成

### 2. アプリケーションコードの変更

以下のファイルが既に更新されています：
- ✅ `app/register/page.tsx` - 組織作成処理を削除
- ✅ `app/dashboard/page.tsx` - 組織参照を削除
- ✅ `app/dashboard/DashboardClient.tsx` - 組織表示を削除
- ✅ `app/roi/[id]/page.tsx` - 組織ベースのアクセスチェックを削除
- ✅ `lib/supabase/database.types.ts` - 型定義から組織を削除

### 3. 確認

1. ブラウザで http://localhost:3002/register を開く
2. メールアドレスとパスワードのみで登録
3. エラーなく登録できることを確認
4. ダッシュボードが正常に表示されることを確認

## ✅ 変更内容の詳細

### データベース
- ❌ `organizations`テーブル → 削除
- ❌ `users.organization_id` → 削除
- ❌ `roi_sessions.organization_id` → 削除

### アプリケーション
- ❌ 組織名入力欄 → 削除
- ❌ 組織作成処理 → 削除
- ❌ 組織表示 → 削除
- ❌ 組織ベースのアクセス制御 → 削除

### セキュリティ
- ✅ 認証ベースのアクセス制御のみ
- ✅ 認証されたユーザーは全員、すべてのデータにアクセス可能

## 🎓 メリット

1. **シンプル化**
   - 不要な概念を削除
   - コードが簡潔になる

2. **エラー解消**
   - 組織関連のエラーが発生しない
   - 無限再帰の問題も解決

3. **社内専用に最適**
   - 認証だけで十分
   - 組織の概念が不要

## ⚠️ 注意事項

既存のデータがある場合：
- `organization_id`カラムが削除されるため、既存のデータは影響を受けます
- テスト環境で実行することを推奨します

