-- Migration: Add user_activity table
-- Feature: #111 Activity Log Schema
-- Depends on: users table (Phase 1)

-- Create the user_activity table
CREATE TABLE IF NOT EXISTS user_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id UUID,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index on user_id for per-user activity queries
CREATE INDEX IF NOT EXISTS user_activity_user_id_idx ON user_activity(user_id);

-- Index on created_at for time-range queries
CREATE INDEX IF NOT EXISTS user_activity_created_at_idx ON user_activity(created_at);

-- Composite index on (user_id, created_at) for efficient user timeline queries
CREATE INDEX IF NOT EXISTS user_activity_user_created_idx ON user_activity(user_id, created_at);
