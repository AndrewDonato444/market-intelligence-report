-- Migration: Add subscription_tiers table and modify subscriptions
-- Feature: Subscription Tier Data Model (#170)

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

ALTER TABLE subscriptions ALTER COLUMN stripe_customer_id DROP NOT NULL;

ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS tier_id uuid
  REFERENCES subscription_tiers(id) ON DELETE SET NULL;
