"use client";

import { useState, useEffect, useRef, useCallback } from "react";

export interface PipelineStage {
  agentName: string;
  label: string;
  description: string;
}

export const PIPELINE_STAGES: PipelineStage[] = [
  {
    agentName: "data-fetch",
    label: "Data Collection",
    description: "Fetching property data, comps, and market indicators",
  },
  {
    agentName: "insight-generator",
    label: "Insight Generation",
    description: "Strategic narratives and market themes",
  },
  {
    agentName: "forecast-modeler",
    label: "Forecast Modeling",
    description: "Projections and scenario analysis",
  },
  {
    agentName: "polish-agent",
    label: "Editorial Polish",
    description: "Consistency, pull quotes, methodology",
  },
  {
    agentName: "persona-intelligence",
    label: "Persona Intelligence",
    description: "Tailoring insights for your buyer personas",
  },
];

interface ReportStatusData {
  id: string;
  title: string;
  status: "queued" | "generating" | "completed" | "failed";
  marketName: string;
  config: {
    sections?: string[];
  } | null;
  createdAt: string | null;
  generationStartedAt: string | null;
  generationCompletedAt: string | null;
  errorMessage: string | null;
}

interface PipelineProgress {
  status: string;
  totalAgents: number;
  completedAgents: number;
  currentAgents: string[];
  percentComplete: number;
}

interface ProgressResponse {
  reportId: string;
  reportStatus: "queued" | "generating" | "completed" | "failed";
  pipeline: PipelineProgress;
}

interface PipelineStatusDashboardProps {
  report: ReportStatusData;
}

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; bgColor: string }
> = {
  queued: {
    label: "Queued",
    color: "var(--color-text-secondary)",
    bgColor: "var(--color-background)",
  },
  generating: {
    label: "Generating",
    color: "var(--color-accent)",
    bgColor: "var(--color-accent-light)",
  },
  completed: {
    label: "Completed",
    color: "var(--color-success)",
    bgColor: "var(--color-background)",
  },
  failed: {
    label: "Failed",
    color: "var(--color-error)",
    bgColor: "var(--color-background)",
  },
};

const POLL_INTERVAL = 3000;

function formatDuration(startIso: string, endIso: string): string {
  const start = new Date(startIso).getTime();
  const end = new Date(endIso).getTime();
  const ms = end - start;
  if (ms < 1000) return `${ms}ms`;
  const seconds = Math.round(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
}

function getStageStatus(
  stage: PipelineStage,
  stageIndex: number,
  reportStatus: string,
  pipeline: PipelineProgress | null
): "pending" | "running" | "completed" | "failed" {
  if (reportStatus === "completed") return "completed";

  // Virtual "data-fetch" stage — Layers 0+1, not tracked by orchestrator
  if (stage.agentName === "data-fetch") {
    if (reportStatus === "queued") return "pending";
    if (reportStatus === "failed" && pipeline && pipeline.completedAgents === 0 && pipeline.currentAgents.length === 0) return "failed";
    if (reportStatus === "failed") return "completed";
    // generating — complete once any agent has started
    if (pipeline && (pipeline.completedAgents > 0 || pipeline.currentAgents.length > 0)) return "completed";
    if (reportStatus === "generating") return "running";
    return "pending";
  }

  if (!pipeline) {
    // No pipeline data — fall back to simple status
    if (reportStatus === "generating" && stageIndex === 0) return "running";
    return "pending";
  }

  if (reportStatus === "failed") {
    const agentIndex = stageIndex - 1; // offset for data-fetch
    if (agentIndex < pipeline.completedAgents) return "completed";
    if (agentIndex === pipeline.completedAgents) return "failed";
    return "pending";
  }

  // generating or queued — match against real agent names
  if (pipeline.currentAgents.includes(stage.agentName)) return "running";
  const agentIndex = stageIndex - 1;
  if (agentIndex < pipeline.completedAgents) return "completed";
  return "pending";
}

export function PipelineStatusDashboard({
  report: initialReport,
}: PipelineStatusDashboardProps) {
  const [reportStatus, setReportStatus] = useState(initialReport.status);
  const [pipeline, setPipeline] = useState<PipelineProgress | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isTerminal = reportStatus === "completed" || reportStatus === "failed";

  const fetchProgress = useCallback(async () => {
    try {
      const res = await fetch(`/api/reports/${initialReport.id}/progress`);
      if (!res.ok) return;
      const data: ProgressResponse = await res.json();
      setReportStatus(data.reportStatus);
      setPipeline(data.pipeline);

      if (data.reportStatus === "completed" || data.reportStatus === "failed") {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        // Reload to get full report data (sections, durations, etc.)
        if (data.reportStatus === "completed") {
          window.location.reload();
        }
      }
    } catch {
      // Silently retry on next interval
    }
  }, [initialReport.id]);

  // Start polling if report is in-progress
  useEffect(() => {
    if (isTerminal) return;

    fetchProgress();
    intervalRef.current = setInterval(fetchProgress, POLL_INTERVAL);
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [fetchProgress, isTerminal]);

  const statusConfig = STATUS_CONFIG[reportStatus] || STATUS_CONFIG.queued;

  // Compute percent with data-fetch offset
  const rawAgentPercent = pipeline?.percentComplete ?? 0;
  const hasAgentActivity = (pipeline?.completedAgents ?? 0) > 0 || (pipeline?.currentAgents?.length ?? 0) > 0;
  const percent =
    reportStatus === "completed"
      ? 100
      : reportStatus === "generating"
        ? hasAgentActivity
          ? Math.round(20 + rawAgentPercent * 0.8)
          : Math.min(18, rawAgentPercent || 10)
        : 0;

  const totalDuration =
    initialReport.generationStartedAt && initialReport.generationCompletedAt
      ? formatDuration(
          initialReport.generationStartedAt,
          initialReport.generationCompletedAt
        )
      : null;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-[var(--color-surface)] rounded-[var(--radius-md)] shadow-[var(--shadow-sm)] p-6">
        <h2 className="font-[family-name:var(--font-serif)] text-2xl font-bold text-[var(--color-primary)]">
          {initialReport.title}
        </h2>
        <p className="font-[family-name:var(--font-sans)] text-sm text-[var(--color-text-secondary)] mt-1">
          {initialReport.marketName}
          {initialReport.createdAt && (
            <>
              {" "}
              &middot; Created{" "}
              {new Date(initialReport.createdAt).toLocaleDateString()}
            </>
          )}
        </p>
        <div className="w-12 h-0.5 bg-[var(--color-accent)] mt-3 mb-4" />

        {/* Status badge */}
        <div className="flex items-center gap-3">
          <span
            className="font-[family-name:var(--font-sans)] text-xs font-semibold px-2 py-1 rounded-[var(--radius-sm)] uppercase"
            style={{
              color: statusConfig.color,
              backgroundColor: statusConfig.bgColor,
            }}
          >
            {statusConfig.label}
          </span>
          {totalDuration && (
            <span className="font-[family-name:var(--font-sans)] text-xs text-[var(--color-text-secondary)]">
              Total time: {totalDuration}
            </span>
          )}
        </div>

        {/* Progress bar */}
        <div className="mt-4">
          <div className="w-full h-2 bg-[var(--color-border)] rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                reportStatus === "generating" ? "animate-pulse" : ""
              }`}
              style={{
                width: `${percent}%`,
                backgroundColor:
                  reportStatus === "failed"
                    ? "var(--color-error)"
                    : "var(--color-accent)",
              }}
            />
          </div>
          <p className="font-[family-name:var(--font-sans)] text-xs text-[var(--color-text-tertiary)] mt-1">
            {percent}% complete
          </p>
        </div>

        {/* Status messages */}
        {reportStatus === "queued" && (
          <p className="font-[family-name:var(--font-sans)] text-sm text-[var(--color-text-secondary)] mt-4">
            Report is queued and waiting to begin generation.
          </p>
        )}

        {reportStatus === "completed" && (
          <p className="font-[family-name:var(--font-sans)] text-sm text-[var(--color-success)] mt-4">
            Report generation completed successfully
            {totalDuration ? ` in ${totalDuration}` : ""}.
          </p>
        )}

        {reportStatus === "failed" && (
          <div className="mt-4">
            <p className="font-[family-name:var(--font-sans)] text-sm text-[var(--color-error)]">
              Report generation failed.
            </p>
            {initialReport.errorMessage && (
              <p className="font-[family-name:var(--font-sans)] text-xs text-[var(--color-error)] mt-1 bg-[var(--color-background)] p-2 rounded-[var(--radius-sm)]">
                {initialReport.errorMessage}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Pipeline stages */}
      {!isTerminal && (
        <div className="bg-[var(--color-surface)] rounded-[var(--radius-md)] shadow-[var(--shadow-sm)] p-6">
          <h3 className="font-[family-name:var(--font-sans)] text-sm font-semibold text-[var(--color-text)] mb-4">
            Pipeline Stages
          </h3>
          <div className="space-y-3">
            {PIPELINE_STAGES.map((stage, idx) => {
              const stageStatus = getStageStatus(stage, idx, reportStatus, pipeline);

              return (
                <div
                  key={stage.agentName}
                  className={`flex items-center gap-3 p-3 rounded-[var(--radius-sm)] border ${
                    stageStatus === "completed"
                      ? "border-[var(--color-success)] bg-[var(--color-background)]"
                      : stageStatus === "running"
                        ? "border-[var(--color-accent)] bg-[var(--color-accent-light)]"
                        : stageStatus === "failed"
                          ? "border-[var(--color-error)] bg-[var(--color-background)]"
                          : "border-[var(--color-border)]"
                  }`}
                >
                  {/* Status dot */}
                  <div
                    className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                      stageStatus === "completed"
                        ? "bg-[var(--color-success)]"
                        : stageStatus === "running"
                          ? "bg-[var(--color-accent)] animate-pulse"
                          : stageStatus === "failed"
                            ? "bg-[var(--color-error)]"
                            : "bg-[var(--color-border)]"
                    }`}
                  />

                  <div className="flex-1">
                    <span className="font-[family-name:var(--font-sans)] text-sm font-medium text-[var(--color-text)]">
                      {stage.label}
                    </span>
                    <p className="font-[family-name:var(--font-sans)] text-xs text-[var(--color-text-secondary)]">
                      {stage.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
