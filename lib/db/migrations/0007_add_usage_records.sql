-- Migration: Add usage_records table
-- Feature: #172 Usage Tracking
-- Tracks per-user, per-entitlement usage counts within billing periods

CREATE TABLE IF NOT EXISTS usage_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  entitlement_type VARCHAR(100) NOT NULL,
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ,
  count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for querying all usage records for a user
CREATE INDEX IF NOT EXISTS usage_records_user_id_idx
  ON usage_records (user_id);

-- Unique composite index: one record per user per entitlement per period
-- Also serves as the conflict target for atomic upsert (INSERT ... ON CONFLICT DO UPDATE)
CREATE UNIQUE INDEX IF NOT EXISTS usage_records_user_type_period_idx
  ON usage_records (user_id, entitlement_type, period_start);
