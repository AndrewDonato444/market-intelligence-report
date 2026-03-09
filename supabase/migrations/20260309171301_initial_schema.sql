-- Initial schema for Modern Signal Advisory
-- This migration creates all Phase 1 tables, enums, and indexes.

-- Enums
CREATE TYPE report_status AS ENUM ('queued', 'generating', 'completed', 'failed');
CREATE TYPE report_section_type AS ENUM (
  'market_overview',
  'executive_summary',
  'second_homes',
  'key_drivers',
  'competitive_analysis',
  'trending_insights',
  'forecasts',
  'methodology',
  'strategic_summary'
);
CREATE TYPE luxury_tier AS ENUM ('luxury', 'high_luxury', 'ultra_luxury');

-- Users
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  company VARCHAR(255),
  logo_url TEXT,
  brand_colors JSONB,
  phone VARCHAR(50),
  title VARCHAR(255),
  bio TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Markets
CREATE TABLE IF NOT EXISTS markets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  geography JSONB NOT NULL,
  luxury_tier luxury_tier NOT NULL DEFAULT 'luxury',
  price_floor INTEGER NOT NULL DEFAULT 1000000,
  price_ceiling INTEGER,
  segments JSONB,
  property_types JSONB,
  focus_areas JSONB,
  peer_markets JSONB,
  is_default INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS markets_user_id_idx ON markets(user_id);

-- Reports
CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  market_id UUID NOT NULL REFERENCES markets(id) ON DELETE CASCADE,
  title VARCHAR(500) NOT NULL,
  status report_status NOT NULL DEFAULT 'queued',
  config JSONB,
  output_url TEXT,
  pdf_url TEXT,
  version INTEGER NOT NULL DEFAULT 1,
  parent_report_id UUID,
  generation_started_at TIMESTAMPTZ,
  generation_completed_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS reports_user_id_idx ON reports(user_id);
CREATE INDEX IF NOT EXISTS reports_market_id_idx ON reports(market_id);
CREATE INDEX IF NOT EXISTS reports_status_idx ON reports(status);

-- Report Sections
CREATE TABLE IF NOT EXISTS report_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  section_type report_section_type NOT NULL,
  title VARCHAR(500) NOT NULL,
  content JSONB NOT NULL,
  agent_name VARCHAR(100),
  sort_order INTEGER NOT NULL DEFAULT 0,
  generated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS report_sections_report_id_idx ON report_sections(report_id);

-- Cache
CREATE TABLE IF NOT EXISTS cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key VARCHAR(500) UNIQUE NOT NULL,
  source VARCHAR(100) NOT NULL,
  data JSONB NOT NULL,
  ttl_seconds INTEGER NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS cache_key_idx ON cache(key);
CREATE INDEX IF NOT EXISTS cache_expires_at_idx ON cache(expires_at);
CREATE INDEX IF NOT EXISTS cache_source_idx ON cache(source);

-- API Usage
CREATE TABLE IF NOT EXISTS api_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  report_id UUID REFERENCES reports(id) ON DELETE SET NULL,
  provider VARCHAR(100) NOT NULL,
  endpoint VARCHAR(500) NOT NULL,
  cost NUMERIC(10,6) NOT NULL DEFAULT 0,
  tokens_used INTEGER,
  response_time_ms INTEGER,
  status_code INTEGER,
  cached INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS api_usage_user_id_idx ON api_usage(user_id);
CREATE INDEX IF NOT EXISTS api_usage_report_id_idx ON api_usage(report_id);
CREATE INDEX IF NOT EXISTS api_usage_provider_idx ON api_usage(provider);
CREATE INDEX IF NOT EXISTS api_usage_created_at_idx ON api_usage(created_at);
