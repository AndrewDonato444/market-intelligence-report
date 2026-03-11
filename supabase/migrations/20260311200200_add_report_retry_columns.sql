-- Add retried_at and retried_by columns to reports table
-- These exist in the Drizzle schema but were missing from Supabase

ALTER TABLE reports ADD COLUMN IF NOT EXISTS retried_at TIMESTAMPTZ;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS retried_by TEXT;
