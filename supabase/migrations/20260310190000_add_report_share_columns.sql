-- Add share_token and share_token_expires_at columns to reports table
-- These columns were defined in the Drizzle schema but missing from the initial migration.

ALTER TABLE reports ADD COLUMN IF NOT EXISTS share_token VARCHAR(64) UNIQUE;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS share_token_expires_at TIMESTAMPTZ;
