-- Add is_favorite column to roi_sessions table
ALTER TABLE roi_sessions 
ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN DEFAULT FALSE;

-- Create index for is_favorite for better query performance
CREATE INDEX IF NOT EXISTS idx_roi_sessions_is_favorite ON roi_sessions(is_favorite);

