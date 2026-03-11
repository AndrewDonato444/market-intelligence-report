"use client";

import { useState, useEffect, useMemo } from "react";
import type { RunSummary, RegressionAlert } from "@/lib/eval/report-eval/history";

const CRITERION_COLORS: Record<string, string> = {
  "data-accuracy": "#059669",     // emerald-600
  "completeness": "#2563EB",      // blue-600
  "narrative-quality": "#7C3AED", // violet-600
  "formatting": "#CA8A04",        // yellow-600
  "actionability": "#DC2626",     // red-600
  "persona-alignment": "#0891B2", // cyan-600
};

const CRITERION_LABELS: Record<string, string> = {
  "data-accuracy": "Data Accuracy",
  "completeness": "Completeness",
  "narrative-quality": "Narrative Quality",
  "formatting": "Formatting",
  "actionability": "Actionability",
  "persona-alignment": "Persona Alignment",
};

interface TrendDataPoint {
  runId: string;
  timestamp: string;
  criterion: string;
  avgScore: number;
}

function buildTrendData(runs: RunSummary[]): TrendDataPoint[] {
  const points: TrendDataPoint[] = [];
  // Reverse so oldest is first (left side of chart)
  const chronological = [...runs].reverse();
  for (const run of chronological) {
    for (const [criterion, data] of Object.entries(run.byCriterion)) {
      points.push({
        runId: run.runId,
        timestamp: run.timestamp,
        criterion,
        avgScore: data.avgScore,
      });
    }
  }
  return points;
}

interface Props {
  runs: RunSummary[];
  regression: RegressionAlert | null;
  loading: boolean;
}

export function ReportEvalTrendPanel({ runs, regression, loading }: Props) {
  const [hoveredPoint, setHoveredPoint] = useState<{
    criterion: string;
    score: number;
    date: string;
    x: number;
    y: number;
  } | null>(null);

  const trendData = useMemo(() => buildTrendData(runs), [runs]);

  // Chart dimensions
  const chartWidth = 600;
  const chartHeight = 200;
  const padding = { top: 20, right: 30, bottom: 40, left: 40 };
  const innerWidth = chartWidth - padding.left - padding.right;
  const innerHeight = chartHeight - padding.top - padding.bottom;

  // Get unique timestamps (x-axis) and criteria
  const timestamps = useMemo(() => {
    const seen = new Set<string>();
    const result: string[] = [];
    for (const p of trendData) {
      if (!seen.has(p.timestamp)) {
        seen.add(p.timestamp);
        result.push(p.timestamp);
      }
    }
    return result;
  }, [trendData]);

  const criteria = useMemo(
    () => Object.keys(CRITERION_LABELS),
    []
  );

  // Scale functions
  const xScale = (idx: number) => {
    if (timestamps.length <= 1) return innerWidth / 2;
    return (idx / (timestamps.length - 1)) * innerWidth;
  };

  const yScale = (score: number) => {
    // Score 1-5, map to innerHeight (inverted — 5 at top)
    return innerHeight - ((score - 1) / 4) * innerHeight;
  };

  // Build SVG paths per criterion
  const paths = useMemo(() => {
    const result: Record<string, string> = {};
    for (const criterion of criteria) {
      const points: { x: number; y: number }[] = [];
      for (let i = 0; i < timestamps.length; i++) {
        const point = trendData.find(
          (p) => p.timestamp === timestamps[i] && p.criterion === criterion
        );
        if (point) {
          points.push({ x: xScale(i), y: yScale(point.avgScore) });
        }
      }
      if (points.length > 1) {
        result[criterion] = points
          .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
          .join(" ");
      }
    }
    return result;
  }, [trendData, timestamps, criteria]);

  if (loading) {
    return (
      <div className="bg-[var(--color-surface)] rounded-[var(--radius-md)] shadow-[var(--shadow-sm)] p-[var(--spacing-4)]">
        <p className="text-[var(--color-text-secondary)] text-xs font-medium uppercase tracking-wider mb-[var(--spacing-3)]">
          Quality Trends
        </p>
        <div className="flex items-center justify-center h-48">
          <span className="inline-block w-5 h-5 border-2 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (runs.length === 0) {
    return (
      <div className="bg-[var(--color-surface)] rounded-[var(--radius-md)] shadow-[var(--shadow-sm)] p-[var(--spacing-4)]">
        <p className="text-[var(--color-text-secondary)] text-xs font-medium uppercase tracking-wider mb-[var(--spacing-3)]">
          Quality Trends
        </p>
        <p className="text-[var(--color-text-secondary)] text-sm text-center py-8">
          No historical data yet. Run evaluations to start tracking quality trends.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-[var(--color-surface)] rounded-[var(--radius-md)] shadow-[var(--shadow-sm)] p-[var(--spacing-4)]">
      <p className="text-[var(--color-text-secondary)] text-xs font-medium uppercase tracking-wider mb-[var(--spacing-1)]">
        Quality Trends
      </p>
      <p className="text-[var(--color-text-secondary)] text-xs mb-[var(--spacing-3)]">
        Score history across evaluation runs
      </p>

      {regression && (
        <div className="border border-[var(--color-error)] bg-red-50 rounded-[var(--radius-sm)] p-[var(--spacing-3)] mb-[var(--spacing-3)]">
          <p className="text-[var(--color-error)] text-sm font-medium">
            {regression.message}
          </p>
        </div>
      )}

      <div className="relative">
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          className="w-full h-auto"
          role="img"
          aria-label="Quality score trends over time"
        >
          <g transform={`translate(${padding.left}, ${padding.top})`}>
            {/* Y-axis grid lines and labels */}
            {[1, 2, 3, 4, 5].map((score) => (
              <g key={score}>
                <line
                  x1={0}
                  y1={yScale(score)}
                  x2={innerWidth}
                  y2={yScale(score)}
                  stroke="var(--color-border)"
                  strokeDasharray="4 4"
                  opacity={0.5}
                />
                <text
                  x={-8}
                  y={yScale(score) + 4}
                  textAnchor="end"
                  fontSize="10"
                  fill="var(--color-text-secondary)"
                >
                  {score}
                </text>
              </g>
            ))}

            {/* X-axis labels */}
            {timestamps.map((ts, i) => {
              const date = new Date(ts);
              const label = `${date.getMonth() + 1}/${date.getDate()}`;
              return (
                <text
                  key={ts}
                  x={xScale(i)}
                  y={innerHeight + 20}
                  textAnchor="middle"
                  fontSize="10"
                  fill="var(--color-text-secondary)"
                >
                  {label}
                </text>
              );
            })}

            {/* Lines per criterion */}
            {criteria.map((criterion) =>
              paths[criterion] ? (
                <path
                  key={criterion}
                  d={paths[criterion]}
                  fill="none"
                  stroke={CRITERION_COLORS[criterion]}
                  strokeWidth={2}
                  opacity={0.85}
                />
              ) : null
            )}

            {/* Data points */}
            {trendData.map((point, idx) => {
              const tsIdx = timestamps.indexOf(point.timestamp);
              if (tsIdx === -1) return null;
              const cx = xScale(tsIdx);
              const cy = yScale(point.avgScore);
              return (
                <circle
                  key={`${point.criterion}-${point.timestamp}`}
                  cx={cx}
                  cy={cy}
                  r={4}
                  fill={CRITERION_COLORS[point.criterion] ?? "#888"}
                  stroke="white"
                  strokeWidth={1.5}
                  className="cursor-pointer"
                  onMouseEnter={() =>
                    setHoveredPoint({
                      criterion: point.criterion,
                      score: point.avgScore,
                      date: new Date(point.timestamp).toLocaleDateString(),
                      x: cx + padding.left,
                      y: cy + padding.top,
                    })
                  }
                  onMouseLeave={() => setHoveredPoint(null)}
                />
              );
            })}
          </g>
        </svg>

        {/* Tooltip */}
        {hoveredPoint && (
          <div
            className="absolute pointer-events-none bg-[var(--color-surface-elevated)] border border-[var(--color-border)] rounded-[var(--radius-sm)] shadow-[var(--shadow-md)] px-2 py-1 text-xs z-10"
            style={{
              left: `${(hoveredPoint.x / chartWidth) * 100}%`,
              top: `${(hoveredPoint.y / chartHeight) * 100}%`,
              transform: "translate(-50%, -120%)",
            }}
          >
            <p className="font-medium">{CRITERION_LABELS[hoveredPoint.criterion]}</p>
            <p>{hoveredPoint.date} &middot; Score: {hoveredPoint.score}</p>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-[var(--spacing-2)]">
        {criteria.map((criterion) => (
          <div key={criterion} className="flex items-center gap-1">
            <span
              className="inline-block w-3 h-[2px]"
              style={{ backgroundColor: CRITERION_COLORS[criterion] }}
            />
            <span className="text-[10px] text-[var(--color-text-secondary)]">
              {CRITERION_LABELS[criterion]}
            </span>
          </div>
        ))}
      </div>

      <p className="text-[var(--color-text-secondary)] text-xs mt-[var(--spacing-2)]">
        Showing last 90 days &middot; {runs.length} evaluation run{runs.length !== 1 ? "s" : ""}
      </p>
    </div>
  );
}
