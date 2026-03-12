-- Social Media Kit Data Model (#160)

-- Create enum for social media kit status
CREATE TYPE social_media_kit_status AS ENUM ('queued', 'generating', 'completed', 'failed');

-- Create social_media_kits table
CREATE TABLE social_media_kits (
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

-- Create indexes
CREATE INDEX social_media_kits_report_id_idx ON social_media_kits(report_id);
CREATE INDEX social_media_kits_user_id_idx ON social_media_kits(user_id);
CREATE INDEX social_media_kits_status_idx ON social_media_kits(status);
