-- Add persona_intelligence to the report_section_type enum
-- Safe: ADD VALUE IF NOT EXISTS is idempotent
ALTER TYPE report_section_type ADD VALUE IF NOT EXISTS 'persona_intelligence';
