-- Add company_name column to roi_sessions table
ALTER TABLE roi_sessions 
ADD COLUMN IF NOT EXISTS company_name TEXT;

-- Create index for company_name for better query performance
CREATE INDEX IF NOT EXISTS idx_roi_sessions_company_name ON roi_sessions(company_name);

