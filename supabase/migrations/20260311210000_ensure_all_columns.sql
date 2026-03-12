-- Comprehensive catch-all migration: ensure ALL columns and enums from Drizzle schema exist
-- Every statement is idempotent (IF NOT EXISTS / DO $$ EXCEPTION WHEN $$)
-- Safe to run multiple times, even if all previous migrations were already applied

-- ============================================================
-- ENUMS
-- ============================================================

DO $$ BEGIN
  CREATE TYPE report_status AS ENUM ('queued', 'generating', 'completed', 'failed');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE luxury_tier AS ENUM ('luxury', 'high_luxury', 'ultra_luxury');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('user', 'admin');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE user_account_status AS ENUM ('active', 'suspended', 'deleted');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE report_section_type AS ENUM (
    'market_overview', 'executive_summary', 'second_homes', 'key_drivers',
    'competitive_analysis', 'trending_insights', 'forecasts', 'methodology',
    'strategic_summary',
    'executive_briefing', 'market_insights_index', 'luxury_market_dashboard',
    'neighborhood_intelligence', 'the_narrative', 'forward_look',
    'comparative_positioning', 'strategic_benchmark', 'disclaimer_methodology',
    'persona_intelligence'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================
-- USERS TABLE — extra columns
-- ============================================================

ALTER TABLE users ADD COLUMN IF NOT EXISTS status user_account_status NOT NULL DEFAULT 'active';
ALTER TABLE users ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ;
CREATE INDEX IF NOT EXISTS users_status_idx ON users (status);

-- ============================================================
-- REPORTS TABLE — all non-initial columns
-- ============================================================

ALTER TABLE reports ADD COLUMN IF NOT EXISTS output_url TEXT;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS pdf_url TEXT;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS version INTEGER NOT NULL DEFAULT 1;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS parent_report_id UUID;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS generation_started_at TIMESTAMPTZ;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS generation_completed_at TIMESTAMPTZ;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS error_message TEXT;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS error_details JSONB;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS retried_at TIMESTAMPTZ;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS retried_by TEXT;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS share_token VARCHAR(64);
ALTER TABLE reports ADD COLUMN IF NOT EXISTS share_token_expires_at TIMESTAMPTZ;

-- share_token unique constraint (may already exist)
DO $$ BEGIN
  ALTER TABLE reports ADD CONSTRAINT reports_share_token_unique UNIQUE (share_token);
EXCEPTION WHEN duplicate_table THEN NULL;
  WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS reports_share_token_idx ON reports (share_token);

-- ============================================================
-- MISSING TABLES (idempotent)
-- ============================================================

CREATE TABLE IF NOT EXISTS user_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id UUID,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS user_activity_user_id_idx ON user_activity(user_id);
CREATE INDEX IF NOT EXISTS user_activity_created_at_idx ON user_activity(created_at);
CREATE INDEX IF NOT EXISTS user_activity_user_created_idx ON user_activity(user_id, created_at);

CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  stripe_customer_id VARCHAR(255) NOT NULL,
  stripe_subscription_id VARCHAR(255),
  plan VARCHAR(50) NOT NULL DEFAULT 'free',
  status VARCHAR(50) NOT NULL DEFAULT 'inactive',
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS report_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  market_id UUID NOT NULL REFERENCES markets(id) ON DELETE CASCADE,
  config JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS report_templates_user_id_idx ON report_templates(user_id);

CREATE TABLE IF NOT EXISTS report_edit_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  section_id UUID NOT NULL REFERENCES report_sections(id) ON DELETE CASCADE,
  section_title VARCHAR(500),
  section_type VARCHAR(100),
  previous_content JSONB,
  edited_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS report_edit_history_report_id_idx ON report_edit_history(report_id);

CREATE TABLE IF NOT EXISTS buyer_personas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) NOT NULL,
  tagline TEXT NOT NULL,
  display_order INTEGER NOT NULL,
  profile_overview TEXT NOT NULL,
  primary_motivation VARCHAR(255) NOT NULL,
  buying_lens VARCHAR(255) NOT NULL,
  what_wins_them VARCHAR(500) NOT NULL,
  biggest_fear VARCHAR(255) NOT NULL,
  demographics JSONB NOT NULL,
  decision_drivers JSONB NOT NULL,
  report_metrics JSONB NOT NULL,
  property_filters JSONB NOT NULL,
  narrative_framing JSONB NOT NULL,
  talking_point_templates JSONB NOT NULL,
  sample_benchmarks JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS buyer_personas_slug_idx ON buyer_personas(slug);
CREATE INDEX IF NOT EXISTS buyer_personas_display_order_idx ON buyer_personas(display_order);

CREATE TABLE IF NOT EXISTS report_personas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  buyer_persona_id UUID NOT NULL REFERENCES buyer_personas(id) ON DELETE CASCADE,
  selection_order INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS report_personas_report_id_idx ON report_personas(report_id);
CREATE INDEX IF NOT EXISTS report_personas_buyer_persona_id_idx ON report_personas(buyer_persona_id);

CREATE TABLE IF NOT EXISTS report_eval_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL,
  test_case_id VARCHAR(100) NOT NULL,
  criterion VARCHAR(50) NOT NULL,
  score INTEGER NOT NULL,
  breakdown JSONB NOT NULL,
  judge_reason TEXT,
  duration_ms INTEGER,
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS report_eval_results_run_id_idx ON report_eval_results(run_id);
CREATE INDEX IF NOT EXISTS report_eval_results_test_case_id_idx ON report_eval_results(test_case_id);
CREATE INDEX IF NOT EXISTS report_eval_results_created_at_idx ON report_eval_results(created_at);
CREATE INDEX IF NOT EXISTS report_eval_results_criterion_idx ON report_eval_results(criterion);
