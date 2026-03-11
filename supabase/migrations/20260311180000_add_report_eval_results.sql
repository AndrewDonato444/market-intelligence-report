-- Report Eval Results — stores historical eval scores for regression tracking (#143)
CREATE TABLE IF NOT EXISTS report_eval_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL,
  test_case_id VARCHAR(100) NOT NULL,
  criterion VARCHAR(50) NOT NULL,
  score INTEGER NOT NULL,
  breakdown JSONB NOT NULL,
  judge_reason TEXT,
  duration_ms INTEGER,
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS report_eval_results_run_id_idx ON report_eval_results (run_id);
CREATE INDEX IF NOT EXISTS report_eval_results_test_case_id_idx ON report_eval_results (test_case_id);
CREATE INDEX IF NOT EXISTS report_eval_results_created_at_idx ON report_eval_results (created_at);
CREATE INDEX IF NOT EXISTS report_eval_results_criterion_idx ON report_eval_results (criterion);
