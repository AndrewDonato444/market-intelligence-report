-- Add buyer personas table (Knox Brothers framework - 8 luxury buyer archetypes)
CREATE TABLE buyer_personas (
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

CREATE UNIQUE INDEX buyer_personas_slug_idx ON buyer_personas (slug);
CREATE INDEX buyer_personas_display_order_idx ON buyer_personas (display_order);

-- Junction table: reports <-> buyer_personas (up to 3 per report)
CREATE TABLE report_personas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  buyer_persona_id UUID NOT NULL REFERENCES buyer_personas(id) ON DELETE CASCADE,
  selection_order INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX report_personas_report_id_idx ON report_personas (report_id);
CREATE INDEX report_personas_buyer_persona_id_idx ON report_personas (buyer_persona_id);
