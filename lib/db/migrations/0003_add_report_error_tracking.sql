-- Migration: Add structured error tracking to reports table
-- Feature: Report Error Tracking Schema (#120)

-- 1. Add error_details JSONB column (nullable, no default)
ALTER TABLE reports ADD COLUMN IF NOT EXISTS error_details jsonb;

-- 2. Add retry tracking columns (nullable)
ALTER TABLE reports ADD COLUMN IF NOT EXISTS retried_at timestamptz;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS retried_by text;

-- 3. Migrate existing error_message data to structured error_details
-- For any report with error_message but no error_details, create a structured entry
UPDATE reports
SET error_details = jsonb_build_object(
  'agent', 'unknown',
  'message', error_message,
  'occurredAt', to_char(created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
)
WHERE error_message IS NOT NULL
  AND error_details IS NULL;

-- 4. Add comment marking error_message as deprecated
COMMENT ON COLUMN reports.error_message IS 'DEPRECATED: Use error_details for structured error data. Kept for backward compatibility with monitoring dashboard.';
