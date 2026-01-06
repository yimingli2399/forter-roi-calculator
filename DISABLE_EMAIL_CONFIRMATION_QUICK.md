# メール認証を無効化する（クイックガイド）

## 最も簡単な方法

### ステップ1: Authenticationメニューを開く

Supabaseダッシュボードで：
1. 左メニューの **「Authentication」** をクリック

### ステップ2: Email設定を開く

以下のいずれかを試してください：

#### 方法A: 「Sign In / Providers」から
1. **「Sign In / Providers」** をクリック
2. **「Email」** セクションを探す
3. **「Enable email confirmations」** のトグルを **OFF** にする

#### 方法B: 「Email」が直接メニューにある場合
1. **「Email」** をクリック
2. **「Enable email confirmations」** のトグルを **OFF** にする

### ステップ3: 保存

- 自動保存される場合：何もする必要はありません
- **「Save」** ボタンがある場合：クリックしてください

### ステップ4: 既存ユーザーを確認済みにする（既存ユーザーがある場合）

Supabase SQL Editorで以下を実行：

```sql
UPDATE auth.users
SET email_confirmed_at = COALESCE(email_confirmed_at, NOW())
WHERE email_confirmed_at IS NULL;
```

## 確認

1. 新しいメールアドレスで登録を試す
2. 登録後、すぐにダッシュボードにリダイレクトされることを確認
3. エラーなくログインできることを確認

## 見つからない場合

設定が見つからない場合は、以下を確認してください：

1. **Authentication** メニュー内のすべての項目を確認
2. **「Sign In / Providers」** を開いて、Emailセクションを探す
3. **「Email」** が直接メニューに表示されているか確認
4. SupabaseのバージョンによってUIが異なる場合があります

## 代替方法: SQLで直接設定

Supabaseの設定UIが見つからない場合、SQLで直接設定することはできませんが、既存ユーザーを確認済みにすることはできます：

```sql
-- すべての未確認ユーザーを確認済みにする
UPDATE auth.users
SET email_confirmed_at = COALESCE(email_confirmed_at, NOW())
WHERE email_confirmed_at IS NULL;
```

ただし、新規登録時のメール確認を無効化するには、Supabaseダッシュボードの設定を変更する必要があります。


