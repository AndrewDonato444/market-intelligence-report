CREATE TYPE deal_analysis_status AS ENUM ('queued', 'generating', 'completed', 'failed');

CREATE TABLE deal_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  market_id UUID NOT NULL REFERENCES markets(id) ON DELETE CASCADE,
  report_id UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  title VARCHAR(500) NOT NULL,
  address VARCHAR(500) NOT NULL,
  property_data JSONB,
  brief_content JSONB,
  motivated_seller_score INTEGER,
  motivated_seller_signals JSONB,
  status deal_analysis_status NOT NULL DEFAULT 'queued',
  error_message TEXT,
  generated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX deal_analyses_user_id_idx ON deal_analyses(user_id);
CREATE INDEX deal_analyses_market_id_idx ON deal_analyses(market_id);
CREATE INDEX deal_analyses_report_id_idx ON deal_analyses(report_id);
CREATE INDEX deal_analyses_status_idx ON deal_analyses(status);
CREATE INDEX deal_analyses_user_created_idx ON deal_analyses(user_id, created_at DESC);
