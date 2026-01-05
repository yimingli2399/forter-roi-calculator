-- メール確認を無効化するSQL
-- 注意: このSQLは既存のユーザーを確認済みにするだけで、
-- 新規登録時のメール確認を無効化するには、Supabaseダッシュボードの設定を変更する必要があります

-- すべての未確認ユーザーを確認済みにする
UPDATE auth.users
SET email_confirmed_at = COALESCE(email_confirmed_at, NOW())
WHERE email_confirmed_at IS NULL;

-- 確認: 確認済みユーザーの数を確認
SELECT 
  COUNT(*) as total_users,
  COUNT(email_confirmed_at) as confirmed_users,
  COUNT(*) - COUNT(email_confirmed_at) as unconfirmed_users
FROM auth.users;

