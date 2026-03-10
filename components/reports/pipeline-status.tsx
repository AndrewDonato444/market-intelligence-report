"use client";

export interface PipelineStage {
  agentName: string;
  label: string;
  description: string;
}

export const PIPELINE_STAGES: PipelineStage[] = [
  {
    agentName: "data-analyst",
    label: "Data Analysis",
    description: "Segment metrics, ratings, YoY calculations",
  },
  {
    agentName: "insight-generator",
    label: "Insight Generation",
    description: "Strategic narratives and market themes",
  },
  {
    agentName: "competitive-analyst",
    label: "Competitive Analysis",
    description: "Peer market comparisons",
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

function getProgressPercent(
  status: string
): number {
  switch (status) {
    case "queued":
      return 0;
    case "completed":
      return 100;
    case "failed":
      return 0;
    case "generating":
      return 50; // Indeterminate — will be refined when polling is added
    default:
      return 0;
  }
}

export function PipelineStatusDashboard({
  report,
}: PipelineStatusDashboardProps) {
  const statusConfig = STATUS_CONFIG[report.status] || STATUS_CONFIG.queued;
  const percent = getProgressPercent(report.status);

  const totalDuration =
    report.generationStartedAt && report.generationCompletedAt
      ? formatDuration(
          report.generationStartedAt,
          report.generationCompletedAt
        )
      : null;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-[var(--color-surface)] rounded-[var(--radius-md)] shadow-[var(--shadow-sm)] p-6">
        <h2 className="font-[family-name:var(--font-serif)] text-2xl font-bold text-[var(--color-primary)]">
          {report.title}
        </h2>
        <p className="font-[family-name:var(--font-sans)] text-sm text-[var(--color-text-secondary)] mt-1">
          {report.marketName}
          {report.createdAt && (
            <>
              {" "}
              &middot; Created{" "}
              {new Date(report.createdAt).toLocaleDateString()}
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
                report.status === "generating" ? "animate-pulse" : ""
              }`}
              style={{
                width: `${percent}%`,
                backgroundColor:
                  report.status === "failed"
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
        {report.status === "queued" && (
          <p className="font-[family-name:var(--font-sans)] text-sm text-[var(--color-text-secondary)] mt-4">
            Report is queued and waiting to begin generation.
          </p>
        )}

        {report.status === "completed" && (
          <p className="font-[family-name:var(--font-sans)] text-sm text-[var(--color-success)] mt-4">
            Report generation completed successfully
            {totalDuration ? ` in ${totalDuration}` : ""}.
          </p>
        )}

        {report.status === "failed" && (
          <div className="mt-4">
            <p className="font-[family-name:var(--font-sans)] text-sm text-[var(--color-error)]">
              Report generation failed.
            </p>
            {report.errorMessage && (
              <p className="font-[family-name:var(--font-sans)] text-xs text-[var(--color-error)] mt-1 bg-[var(--color-background)] p-2 rounded-[var(--radius-sm)]">
                {report.errorMessage}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Pipeline stages */}
      <div className="bg-[var(--color-surface)] rounded-[var(--radius-md)] shadow-[var(--shadow-sm)] p-6">
        <h3 className="font-[family-name:var(--font-sans)] text-sm font-semibold text-[var(--color-text)] mb-4">
          Pipeline Stages
        </h3>
        <div className="space-y-3">
          {PIPELINE_STAGES.map((stage, idx) => {
            // Determine stage status based on report status
            let stageStatus: "pending" | "running" | "completed" | "failed" =
              "pending";
            if (report.status === "completed") {
              stageStatus = "completed";
            } else if (report.status === "generating") {
              // First stage is running, rest are pending
              if (idx === 0) {
                stageStatus = "running";
              }
            } else if (report.status === "failed") {
              // Last stage is the failed one
              if (idx === PIPELINE_STAGES.length - 1) {
                stageStatus = "failed";
              } else {
                stageStatus = "pending";
              }
            }

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
    </div>
  );
}
