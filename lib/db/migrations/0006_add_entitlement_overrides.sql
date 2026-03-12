-- Migration: Add entitlement_overrides table
-- Feature: #171 User Entitlement Model
-- Allows admins to grant per-user entitlement overrides beyond their tier

CREATE TABLE IF NOT EXISTS entitlement_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  entitlement_type VARCHAR(100) NOT NULL,
  value INTEGER NOT NULL,
  expires_at TIMESTAMPTZ,
  granted_by TEXT NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for querying all overrides for a user
CREATE INDEX IF NOT EXISTS entitlement_overrides_user_id_idx
  ON entitlement_overrides (user_id);

-- Composite index for querying a specific entitlement type for a user
CREATE INDEX IF NOT EXISTS entitlement_overrides_user_type_idx
  ON entitlement_overrides (user_id, entitlement_type);
