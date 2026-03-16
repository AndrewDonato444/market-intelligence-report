-- =============================================================================
-- CONSOLIDATED MIGRATION: Apply all pending changes (0004–0010)
-- =============================================================================
--
-- Migrations 0001–0003 are already covered by the initial schema (0000).
-- This script applies everything that's missing in production.
--
-- Safe to run multiple times: uses IF NOT EXISTS / IF EXISTS guards.
-- Run this in Supabase SQL Editor or via psql.
--
-- =============================================================================

-- ─── 0004: Subscription Tiers ───────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS subscription_tiers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(100) NOT NULL UNIQUE,
  slug varchar(100) NOT NULL UNIQUE,
  description text,
  entitlements jsonb NOT NULL,
  display_price varchar(50) NOT NULL,
  monthly_price_in_cents integer,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS subscription_tiers_slug_idx ON subscription_tiers (slug);
CREATE INDEX IF NOT EXISTS subscription_tiers_sort_order_idx ON subscription_tiers (sort_order);

-- Make stripe_customer_id nullable (was NOT NULL in 0000)
ALTER TABLE subscriptions ALTER COLUMN stripe_customer_id DROP NOT NULL;

-- Add tier_id FK column to subscriptions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'subscriptions' AND column_name = 'tier_id'
  ) THEN
    ALTER TABLE subscriptions ADD COLUMN tier_id uuid
      REFERENCES subscription_tiers(id) ON DELETE SET NULL;
  END IF;
END $$;

-- ─── 0005: Social Media Kits ────────────────────────────────────────────────

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'social_media_kit_status') THEN
    CREATE TYPE social_media_kit_status AS ENUM ('queued', 'generating', 'completed', 'failed');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS social_media_kits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status social_media_kit_status NOT NULL DEFAULT 'queued',
  content JSONB,
  error_message TEXT,
  generated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (report_id)
);

CREATE INDEX IF NOT EXISTS social_media_kits_report_id_idx ON social_media_kits(report_id);
CREATE INDEX IF NOT EXISTS social_media_kits_user_id_idx ON social_media_kits(user_id);
CREATE INDEX IF NOT EXISTS social_media_kits_status_idx ON social_media_kits(status);

-- ─── 0006: Entitlement Overrides ────────────────────────────────────────────

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

CREATE INDEX IF NOT EXISTS entitlement_overrides_user_id_idx
  ON entitlement_overrides (user_id);

CREATE INDEX IF NOT EXISTS entitlement_overrides_user_type_idx
  ON entitlement_overrides (user_id, entitlement_type);

-- ─── 0007: Usage Records ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS usage_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  entitlement_type VARCHAR(100) NOT NULL,
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ,
  count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS usage_records_user_id_idx
  ON usage_records (user_id);

CREATE UNIQUE INDEX IF NOT EXISTS usage_records_user_type_period_idx
  ON usage_records (user_id, entitlement_type, period_start);

-- ─── 0008: Email Campaigns ──────────────────────────────────────────────────

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'email_campaign_status') THEN
    CREATE TYPE email_campaign_status AS ENUM ('queued', 'generating', 'completed', 'failed');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS email_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status email_campaign_status NOT NULL DEFAULT 'queued',
  content JSONB,
  error_message TEXT,
  generated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (report_id)
);

CREATE INDEX IF NOT EXISTS email_campaigns_report_id_idx ON email_campaigns(report_id);
CREATE INDEX IF NOT EXISTS email_campaigns_user_id_idx ON email_campaigns(user_id);
CREATE INDEX IF NOT EXISTS email_campaigns_status_idx ON email_campaigns(status);

-- ─── 0009: Market archived_at ───────────────────────────────────────────────

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'markets' AND column_name = 'archived_at'
  ) THEN
    ALTER TABLE "markets" ADD COLUMN "archived_at" timestamp with time zone;
  END IF;
END $$;

-- ─── 0010: ToS accepted_at ─────────────────────────────────────────────────

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'tos_accepted_at'
  ) THEN
    ALTER TABLE "users" ADD COLUMN "tos_accepted_at" timestamp with time zone;
  END IF;
END $$;

-- =============================================================================
-- DONE. Verify with:
--   SELECT table_name FROM information_schema.tables
--   WHERE table_schema = 'public' ORDER BY table_name;
-- =============================================================================
