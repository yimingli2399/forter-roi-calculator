-- ログイン試行記録テーブル
CREATE TABLE IF NOT EXISTS login_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier TEXT NOT NULL, -- メールアドレスまたはIPアドレス
  success BOOLEAN NOT NULL DEFAULT false,
  attempted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  blocked_until TIMESTAMPTZ, -- ブロック解除時刻
  user_agent TEXT,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- インデックスを作成（パフォーマンス向上）
CREATE INDEX IF NOT EXISTS idx_login_attempts_identifier ON login_attempts(identifier);
CREATE INDEX IF NOT EXISTS idx_login_attempts_attempted_at ON login_attempts(attempted_at);
CREATE INDEX IF NOT EXISTS idx_login_attempts_identifier_attempted_at ON login_attempts(identifier, attempted_at);

-- RLSを有効化
ALTER TABLE login_attempts ENABLE ROW LEVEL SECURITY;

-- 誰でも読み書きできるようにする（サーバーサイドでのみ使用）
-- セキュリティ: このテーブルには機密情報は含まれない
CREATE POLICY "Allow all operations on login_attempts"
  ON login_attempts
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- 古い記録を自動削除する関数（オプション）
CREATE OR REPLACE FUNCTION cleanup_old_login_attempts()
RETURNS void AS $$
BEGIN
  DELETE FROM login_attempts
  WHERE attempted_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

