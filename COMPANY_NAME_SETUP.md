# 企業名機能のセットアップ

企業名を保存するには、データベースに`company_name`カラムを追加する必要があります。

## セットアップ手順

1. Supabaseダッシュボードにログイン
2. SQL Editorを開く
3. 以下のSQLを実行してください：

```sql
-- Add company_name column to roi_sessions table
ALTER TABLE roi_sessions 
ADD COLUMN IF NOT EXISTS company_name TEXT;

-- Create index for company_name for better query performance
CREATE INDEX IF NOT EXISTS idx_roi_sessions_company_name ON roi_sessions(company_name);
```

または、`supabase/add_company_name.sql`ファイルの内容をコピーして実行してください。

## 確認方法

SQL Editorで以下のクエリを実行して、カラムが追加されたことを確認できます：

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'roi_sessions' 
AND column_name = 'company_name';
```

`company_name`カラムが表示されれば、セットアップは完了です。

