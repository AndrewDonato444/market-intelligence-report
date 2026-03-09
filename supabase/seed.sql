-- Seed data for Modern Signal Advisory local development
-- Runs automatically after `npm run db:reset`

-- Test user
INSERT INTO users (id, auth_id, email, name, company, title, brand_colors) VALUES
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'user_test_001', 'agent@luxuryrealty.com', 'Victoria Ashford', 'Ashford & Associates', 'Principal Broker',
   '{"primary": "#0F172A", "secondary": "#CA8A04", "accent": "#1E3A5F"}'),
  ('b2c3d4e5-f6a7-8901-bcde-f12345678901', 'user_test_002', 'demo@modernsignal.com', 'James Whitfield', 'Whitfield Luxury Group', 'Senior Advisor',
   '{"primary": "#1A1A2E", "secondary": "#D4AF37", "accent": "#16213E"}');

-- Test markets
INSERT INTO markets (id, user_id, name, geography, luxury_tier, price_floor, price_ceiling, is_default, segments, property_types) VALUES
  ('c3d4e5f6-a7b8-9012-cdef-123456789012', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
   'Palm Beach', '{"city": "Palm Beach", "state": "Florida", "county": "Palm Beach County"}',
   'ultra_luxury', 5000000, NULL, 1,
   '["waterfront", "golf course", "gated community"]',
   '["single_family", "estate", "penthouse"]'),
  ('d4e5f6a7-b8c9-0123-defa-234567890123', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
   'Aspen', '{"city": "Aspen", "state": "Colorado", "county": "Pitkin County"}',
   'high_luxury', 3000000, 25000000, 0,
   '["ski-in/ski-out", "mountain view"]',
   '["single_family", "chalet", "condo"]'),
  ('e5f6a7b8-c9d0-1234-efab-345678901234', 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
   'Manhattan', '{"city": "New York", "state": "New York", "county": "New York County"}',
   'ultra_luxury', 10000000, NULL, 1,
   '["trophy", "pre-war", "new development"]',
   '["condo", "co-op", "townhouse"]');

-- Test reports
INSERT INTO reports (id, user_id, market_id, title, status, version, config) VALUES
  ('f6a7b8c9-d0e1-2345-fabc-456789012345', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
   'c3d4e5f6-a7b8-9012-cdef-123456789012',
   'Palm Beach Q1 2026 Luxury Market Intelligence Report', 'completed', 1,
   '{"sections": ["market_overview", "executive_summary", "key_drivers", "forecasts"], "dateRange": {"start": "2026-01-01", "end": "2026-03-31"}}'),
  ('a7b8c9d0-e1f2-3456-abcd-567890123456', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
   'd4e5f6a7-b8c9-0123-defa-234567890123',
   'Aspen Winter 2026 Market Analysis', 'queued', 1,
   '{"sections": ["market_overview", "second_homes", "competitive_analysis"]}');

-- Test report sections (for the completed report)
INSERT INTO report_sections (report_id, section_type, title, content, sort_order, generated_at) VALUES
  ('f6a7b8c9-d0e1-2345-fabc-456789012345', 'executive_summary', 'Executive Summary',
   '{"text": "The Palm Beach luxury market continues to demonstrate exceptional resilience.", "highlights": ["Median sale price up 12% YoY", "Days on market decreased to 45", "Inventory remains historically low"]}',
   0, now()),
  ('f6a7b8c9-d0e1-2345-fabc-456789012345', 'market_overview', 'Market Overview',
   '{"text": "Palm Beach remains one of America''s most exclusive luxury real estate markets.", "metrics": {"median_price": 8750000, "avg_price_psf": 2150, "total_sales": 127, "dom_avg": 45}}',
   1, now()),
  ('f6a7b8c9-d0e1-2345-fabc-456789012345', 'key_drivers', 'Key Market Drivers',
   '{"drivers": [{"name": "Tax Migration", "impact": "high", "trend": "up"}, {"name": "Interest Rates", "impact": "medium", "trend": "neutral"}, {"name": "International Buyers", "impact": "medium", "trend": "up"}]}',
   2, now());

-- Test cache entries
INSERT INTO cache (key, source, data, ttl_seconds, expires_at) VALUES
  ('census:population:palm_beach', 'census', '{"population": 45780, "growth_rate": 0.032}', 604800, now() + interval '7 days');

-- Test API usage
INSERT INTO api_usage (user_id, provider, endpoint, cost, tokens_used, response_time_ms, status_code, cached) VALUES
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'anthropic', '/v1/messages', 0.045000, 3200, 2150, 200, 0);
