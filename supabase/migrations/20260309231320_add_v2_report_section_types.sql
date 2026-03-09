-- Add v2 report section types to the report_section_type enum
-- These support the new 9-section report architecture

ALTER TYPE report_section_type ADD VALUE IF NOT EXISTS 'executive_briefing';
ALTER TYPE report_section_type ADD VALUE IF NOT EXISTS 'market_insights_index';
ALTER TYPE report_section_type ADD VALUE IF NOT EXISTS 'luxury_market_dashboard';
ALTER TYPE report_section_type ADD VALUE IF NOT EXISTS 'neighborhood_intelligence';
ALTER TYPE report_section_type ADD VALUE IF NOT EXISTS 'the_narrative';
ALTER TYPE report_section_type ADD VALUE IF NOT EXISTS 'forward_look';
ALTER TYPE report_section_type ADD VALUE IF NOT EXISTS 'comparative_positioning';
ALTER TYPE report_section_type ADD VALUE IF NOT EXISTS 'strategic_benchmark';
ALTER TYPE report_section_type ADD VALUE IF NOT EXISTS 'disclaimer_methodology';
