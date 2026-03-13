-- Migration: Add advisor_conversations table
-- Feature: #190 Advisor Data Model

CREATE TABLE IF NOT EXISTS advisor_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  messages JSONB NOT NULL DEFAULT '[]'::jsonb,
  turn_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS advisor_conversations_report_id_idx
  ON advisor_conversations (report_id);
CREATE INDEX IF NOT EXISTS advisor_conversations_user_id_idx
  ON advisor_conversations (user_id);
