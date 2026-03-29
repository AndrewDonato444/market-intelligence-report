-- Pipeline Test Suite: snapshot + test run tables
-- Allows replaying cached Layer 0 data through Layers 1→2→3 without API calls.

CREATE TABLE IF NOT EXISTS pipeline_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  market_name text NOT NULL,
  geography jsonb NOT NULL,
  compiled_data jsonb NOT NULL,
  property_count integer NOT NULL DEFAULT 0,
  has_x_sentiment boolean NOT NULL DEFAULT false,
  peer_market_count integer NOT NULL DEFAULT 0,
  is_golden boolean NOT NULL DEFAULT false,
  source_report_id uuid REFERENCES reports(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS pipeline_snapshots_market_name_idx ON pipeline_snapshots(market_name);

CREATE TABLE IF NOT EXISTS pipeline_test_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_id uuid NOT NULL REFERENCES pipeline_snapshots(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'running',
  layer_1_result jsonb,
  layer_2_result jsonb,
  layer_3_result jsonb,
  layer_durations jsonb,
  error jsonb,
  is_draft boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS pipeline_test_runs_snapshot_id_idx ON pipeline_test_runs(snapshot_id);
CREATE INDEX IF NOT EXISTS pipeline_test_runs_status_idx ON pipeline_test_runs(status);
