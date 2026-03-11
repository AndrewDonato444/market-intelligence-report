"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { fadeVariant, staggerContainer } from "@/lib/animations";
import { PIPELINE_STAGES } from "../pipeline-status";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

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

export interface StepGeneratingProps {
  reportId: string;
  reportTitle: string;
  onStepComplete: () => void;
  onValidationChange?: (valid: boolean) => void;
}

// ---------------------------------------------------------------------------
// Contextual descriptions for active stages
// ---------------------------------------------------------------------------

const STAGE_ACTIVE_DESCRIPTIONS: Record<string, string> = {
  "data-fetch": "Fetching property data and computing market analytics...",
  "insight-generator": "Crafting strategic narratives and market themes...",
  "forecast-modeler": "Building projections and scenario analysis...",
  "polish-agent": "Applying editorial polish and consistency checks...",
  "persona-intelligence": "Tailoring insights for your buyer personas...",
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const POLL_INTERVAL = 3000;
const ESTIMATED_TOTAL_SECONDS = 180; // 3 minutes average

function estimateTimeRemaining(percentComplete: number): string {
  if (percentComplete >= 100) return "";
  if (percentComplete <= 0) return "~3 min remaining";
  const remainingFraction = (100 - percentComplete) / 100;
  const remainingSeconds = Math.round(ESTIMATED_TOTAL_SECONDS * remainingFraction);
  if (remainingSeconds < 60) return `~${remainingSeconds}s remaining`;
  const minutes = Math.ceil(remainingSeconds / 60);
  return `~${minutes} min remaining`;
}

function getStageStatus(
  stage: (typeof PIPELINE_STAGES)[number],
  stageIndex: number,
  progress: ProgressResponse | null
): "pending" | "running" | "completed" | "failed" {
  if (!progress) return "pending";

  const { reportStatus, pipeline } = progress;

  if (reportStatus === "completed") return "completed";

  // "data-fetch" is a virtual stage for Layers 0+1 (not tracked by the orchestrator).
  // It's "running" when the report is generating but no agents have started,
  // and "completed" once any agent activity begins.
  if (stage.agentName === "data-fetch") {
    if (reportStatus === "queued") return "pending";
    if (reportStatus === "failed" && pipeline.completedAgents === 0 && pipeline.currentAgents.length === 0) return "failed";
    if (reportStatus === "failed") return "completed";
    // generating — complete once any agent has started or finished
    if (pipeline.completedAgents > 0 || pipeline.currentAgents.length > 0) return "completed";
    return "running";
  }

  if (reportStatus === "failed") {
    // Offset by 1 to account for data-fetch virtual stage at index 0
    const agentIndex = stageIndex - 1;
    if (agentIndex < pipeline.completedAgents) return "completed";
    if (agentIndex === pipeline.completedAgents) return "failed";
    return "pending";
  }

  // generating or queued — match against real agent names
  if (pipeline.currentAgents.includes(stage.agentName)) return "running";
  // Offset by 1 for the virtual data-fetch stage
  const agentIndex = stageIndex - 1;
  if (agentIndex < pipeline.completedAgents) return "completed";
  return "pending";
}

// ---------------------------------------------------------------------------
// StepGenerating
// ---------------------------------------------------------------------------

export function StepGenerating({
  reportId,
  reportTitle,
  onStepComplete,
  onValidationChange,
}: StepGeneratingProps) {
  const router = useRouter();
  const [progress, setProgress] = useState<ProgressResponse | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Report step as always valid
  useEffect(() => {
    onValidationChange?.(true);
  }, [onValidationChange]);

  // Poll for progress
  const fetchProgress = useCallback(async () => {
    try {
      const res = await fetch(`/api/reports/${reportId}/progress`);
      if (!res.ok) return;
      const data: ProgressResponse = await res.json();
      setProgress(data);

      // Stop polling if terminal state
      if (data.reportStatus === "completed" || data.reportStatus === "failed") {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      }
    } catch {
      // Silently retry on next interval
    }
  }, [reportId]);

  // Start polling on mount
  useEffect(() => {
    fetchProgress();
    intervalRef.current = setInterval(fetchProgress, POLL_INTERVAL);
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [fetchProgress]);

  const isCompleted = progress?.reportStatus === "completed";
  const isFailed = progress?.reportStatus === "failed";
  // Progress API tracks 4 agents (0-100%). We have 5 visual stages (data-fetch + 4 agents).
  // data-fetch = first 20%, then agents split the remaining 80%.
  const rawAgentPercent = progress?.pipeline.percentComplete ?? 0;
  const hasAgentActivity = (progress?.pipeline.completedAgents ?? 0) > 0 || (progress?.pipeline.currentAgents?.length ?? 0) > 0;
  const percentComplete = progress?.reportStatus === "generating"
    ? hasAgentActivity
      ? Math.round(20 + rawAgentPercent * 0.8)
      : Math.min(18, rawAgentPercent || 10) // data-fetch phase: show 10-18%
    : rawAgentPercent;

  const handleViewReport = useCallback(() => {
    router.push(`/reports/${reportId}`);
    onStepComplete();
  }, [router, reportId, onStepComplete]);

  const handleRetry = useCallback(async () => {
    setIsRetrying(true);
    try {
      await fetch(`/api/reports/${reportId}/generate`, { method: "POST" });
      // Reset progress and resume polling
      setProgress(null);
      intervalRef.current = setInterval(fetchProgress, POLL_INTERVAL);
      // Immediate poll
      await fetchProgress();
    } catch {
      // Error handled silently
    } finally {
      setIsRetrying(false);
    }
  }, [reportId, fetchProgress]);

  // Heading changes based on state
  const heading = isCompleted ? "Your Report Is Ready" : "Generating Your Report";
  const subtitle = isCompleted
    ? `"${reportTitle}" has been generated successfully.`
    : "Sit back \u2014 our AI agents are analyzing your market.";

  return (
    <div className="py-4">
      {/* Heading */}
      <h2 className="font-[family-name:var(--font-serif)] text-2xl font-bold text-[var(--color-primary)]">
        {heading}
      </h2>
      <p className="mt-2 font-[family-name:var(--font-sans)] text-sm text-[var(--color-text-secondary)]">
        {subtitle}
      </p>
      <div className="w-12 h-0.5 bg-[var(--color-accent)] mt-3 mb-6" />

      {/* Progress bar */}
      <div className="mb-6">
        <div className="w-full h-2.5 bg-[var(--color-border)] rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ${
              !isCompleted && !isFailed ? "animate-pulse" : ""
            }`}
            style={{
              width: `${isCompleted ? 100 : percentComplete}%`,
              backgroundColor: isFailed
                ? "var(--color-error)"
                : "var(--color-accent)",
            }}
          />
        </div>
        <div className="flex justify-between mt-1.5">
          <p className="font-[family-name:var(--font-sans)] text-xs text-[var(--color-text-tertiary)]">
            {isCompleted ? "100" : percentComplete}% complete
          </p>
          {!isCompleted && !isFailed && (
            <p className="font-[family-name:var(--font-sans)] text-xs text-[var(--color-text-tertiary)]">
              {estimateTimeRemaining(percentComplete)}
            </p>
          )}
        </div>
      </div>

      {/* Pipeline stages */}
      <motion.div
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        className="space-y-2 mb-6"
      >
        <p className="font-[family-name:var(--font-sans)] text-xs font-semibold text-[var(--color-text-tertiary)] uppercase mb-3">
          Pipeline Stages
        </p>
        {PIPELINE_STAGES.map((stage, idx) => {
          const stageStatus = getStageStatus(stage, idx, progress);
          const isActive = stageStatus === "running";
          const description = isActive
            ? STAGE_ACTIVE_DESCRIPTIONS[stage.agentName] || stage.description
            : stage.description;

          return (
            <motion.div
              key={stage.agentName}
              variants={fadeVariant}
              className={`flex items-center gap-3 p-3 rounded-[var(--radius-sm)] border transition-colors duration-200 ${
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
                  {description}
                </p>
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Status messages and CTAs */}
      {isCompleted && (
        <motion.div variants={fadeVariant} initial="initial" animate="animate" className="text-center space-y-4">
          <p className="font-[family-name:var(--font-sans)] text-sm text-[var(--color-success)] font-medium">
            Your report is ready
          </p>
          <button
            type="button"
            onClick={handleViewReport}
            className="w-full py-3 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-[var(--color-primary)] font-[family-name:var(--font-sans)] font-semibold text-sm rounded-[var(--radius-sm)] shadow-[var(--shadow-sm)] transition-colors duration-[var(--duration-default)]"
          >
            View Report
          </button>
        </motion.div>
      )}

      {isFailed && (
        <motion.div variants={fadeVariant} initial="initial" animate="animate" className="text-center space-y-4">
          <p className="font-[family-name:var(--font-sans)] text-sm text-[var(--color-error)] font-medium">
            Report generation failed
          </p>
          <button
            type="button"
            onClick={handleRetry}
            disabled={isRetrying}
            className="w-full py-3 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-[var(--color-primary)] font-[family-name:var(--font-sans)] font-semibold text-sm rounded-[var(--radius-sm)] shadow-[var(--shadow-sm)] transition-colors duration-[var(--duration-default)] disabled:opacity-50"
          >
            {isRetrying ? "Retrying..." : "Try Again"}
          </button>
        </motion.div>
      )}
    </div>
  );
}
