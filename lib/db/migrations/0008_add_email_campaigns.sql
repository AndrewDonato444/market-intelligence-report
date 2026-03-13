-- Email Campaigns Data Model (#166)
CREATE TYPE email_campaign_status AS ENUM ('queued', 'generating', 'completed', 'failed');

CREATE TABLE email_campaigns (
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

CREATE INDEX email_campaigns_report_id_idx ON email_campaigns(report_id);
CREATE INDEX email_campaigns_user_id_idx ON email_campaigns(user_id);
CREATE INDEX email_campaigns_status_idx ON email_campaigns(status);
