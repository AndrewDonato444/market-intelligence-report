"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { fadeVariant, staggerContainer } from "@/lib/animations";

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
// Branded Agent Roster
// ---------------------------------------------------------------------------

interface BrandedAgent {
  id: string;
  name: string;
  /** Backend pipeline stage this agent maps to, or null for virtual agents */
  backendStage: string | null;
  /** What this agent is doing while running */
  activeDescription: string;
  /** Short confirmation shown after completion */
  completedDescription: string;
  /** Static description shown when pending — explains the agent's role */
  pendingDescription: string;
  /** Whether to show a "Pro" badge */
  proFeature?: boolean;
}

const BRANDED_AGENTS: BrandedAgent[] = [
  {
    id: "chief-architect",
    name: "Chief Architect",
    backendStage: "data-fetch",
    pendingDescription: "Pulls live transaction data, coordinates all downstream agents, and sets the analytical framework for your market.",
    activeDescription: "Pulling live transaction records and computing market analytics for your geography...",
    completedDescription: "Transaction data collected and analytical framework established",
  },
  {
    id: "intelligence-analyst",
    name: "Intelligence Analyst",
    backendStage: "insight-generator",
    pendingDescription: "Identifies the strategic themes, market forces, and competitive dynamics that define your market right now.",
    activeDescription: "Analyzing transaction patterns to surface strategic narratives and market themes...",
    completedDescription: "Strategic insights and market themes identified",
  },
  {
    id: "market-strategist",
    name: "Market Strategist",
    backendStage: "forecast-modeler",
    pendingDescription: "Builds 90-day projections with explicit confidence ratings, scenario modeling, and supply-demand signals.",
    activeDescription: "Modeling forward-looking projections and building scenario analysis with confidence ratings...",
    completedDescription: "Forecasts modeled with confidence ratings",
  },
  {
    id: "editorial-director",
    name: "Editorial Director",
    backendStage: "polish-agent",
    pendingDescription: "Ensures every section reads like an institutional publication — consistent voice, sharp pull quotes, clean methodology.",
    activeDescription: "Applying editorial polish, tightening narratives, and ensuring publication-grade consistency...",
    completedDescription: "Editorial review complete — publication-grade quality",
  },
  {
    id: "communication-strategist",
    name: "Client Communication Strategist",
    backendStage: null, // virtual
    proFeature: true,
    pendingDescription: "Builds a full client communication suite — advisory emails, listing presentation talking points, and follow-up sequences that position you as the most informed agent in the room.",
    activeDescription: "Building your client communication suite — advisory briefings, talking points, and follow-up sequences...",
    completedDescription: "Client communication suite ready — emails, talking points, and follow-ups",
  },
  {
    id: "social-media-strategist",
    name: "Social Media Strategist",
    backendStage: null, // virtual
    proFeature: true,
    pendingDescription: "Designs a complete social media strategy around your report — platform-specific content, posting sequences, key stat callouts, and authority-building positioning that turns one report into weeks of market presence.",
    activeDescription: "Designing your social media strategy — platform-specific content, posting sequences, and authority positioning...",
    completedDescription: "Social media strategy complete — content calendar, posts, and positioning ready",
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const POLL_INTERVAL = 3000;
const ESTIMATED_TOTAL_SECONDS = 180;
const LOG_INTERVAL_MIN = 2000;
const LOG_INTERVAL_RANGE = 1000; // 2000-3000ms

// ---------------------------------------------------------------------------
// Activity log messages per agent
// ---------------------------------------------------------------------------

const AGENT_LOG_MESSAGES: Record<string, string[]> = {
  "chief-architect": [
    "Pulling transaction records from target geography...",
    "Computing median price per sqft across segments...",
    "Indexing waterfront vs inland segments...",
    "Mapping absorption rates by price band...",
    "Calculating days-on-market distribution...",
    "Aggregating year-over-year sales volume...",
    "Building price tier segmentation model...",
    "Cross-referencing active vs closed inventory...",
  ],
  "intelligence-analyst": [
    "Scoring market health across 4 dimensions...",
    "Identifying luxury segment outliers...",
    "Comparing YoY velocity shifts...",
    "Drafting strategic theme: supply-side compression...",
    "Analyzing buyer migration patterns...",
    "Evaluating seasonal demand curves...",
    "Benchmarking against peer market indicators...",
    "Synthesizing neighborhood-level insights...",
  ],
  "market-strategist": [
    "Modeling Q2 absorption scenario...",
    "Calibrating confidence intervals...",
    "Running bull/bear price projections...",
    "Stress-testing inventory drawdown rates...",
    "Projecting demand elasticity by segment...",
    "Evaluating interest rate sensitivity...",
    "Building 90-day supply forecast...",
    "Scoring forward-look conviction levels...",
  ],
  "editorial-director": [
    "Tightening executive briefing narrative...",
    "Generating pull quote candidates...",
    "Cross-referencing data citations...",
    "Ensuring consistent voice across 10 sections...",
    "Polishing market matrix commentary...",
    "Refining forward-look language...",
    "Validating methodology transparency section...",
    "Final consistency pass on all sections...",
  ],
  "communication-strategist": [
    "Building advisory email template...",
    "Extracting key talking points from report...",
    "Drafting follow-up sequence...",
    "Framing market narrative for client delivery...",
  ],
  "social-media-strategist": [
    "Selecting key stats for social content...",
    "Writing platform-specific captions...",
    "Designing weekly content calendar...",
    "Building authority-positioning hooks...",
  ],
};

function estimateTimeRemaining(percentComplete: number): string {
  if (percentComplete >= 100) return "";
  if (percentComplete <= 0) return "~3 min remaining";
  const remainingFraction = (100 - percentComplete) / 100;
  const remainingSeconds = Math.round(ESTIMATED_TOTAL_SECONDS * remainingFraction);
  if (remainingSeconds < 60) return `~${remainingSeconds}s remaining`;
  const minutes = Math.ceil(remainingSeconds / 60);
  return `~${minutes} min remaining`;
}

type AgentStatus = "pending" | "running" | "completed" | "failed";

function getAgentStatus(
  agent: BrandedAgent,
  agentIndex: number,
  progress: ProgressResponse | null
): AgentStatus {
  if (!progress) return agentIndex === 0 ? "running" : "pending";

  const { reportStatus, pipeline } = progress;

  // All completed
  if (reportStatus === "completed") return "completed";

  // Virtual agents (5 & 6) — pending during pipeline, running after polish-agent completes
  if (agent.backendStage === null) {
    if (reportStatus === "failed") {
      // Virtual agents stay pending on failure
      return "pending";
    }
    // Check if all 4 real pipeline agents are done (polish-agent is the last real one)
    if (pipeline.completedAgents >= 4) return "running";
    return "pending";
  }

  // data-fetch (Chief Architect) — virtual stage for Layers 0+1
  if (agent.backendStage === "data-fetch") {
    if (reportStatus === "queued") return "pending";
    if (reportStatus === "failed" && pipeline.completedAgents === 0 && pipeline.currentAgents.length === 0) return "failed";
    if (reportStatus === "failed") return "completed";
    // generating — complete once any agent has started or finished
    if (pipeline.completedAgents > 0 || pipeline.currentAgents.length > 0) return "completed";
    return "running";
  }

  // Real pipeline agents (insight-generator, forecast-modeler, polish-agent)
  if (reportStatus === "failed") {
    // Map agent to its index in the real pipeline (offset by 1 for data-fetch)
    const realIndex = agentIndex - 1;
    if (realIndex < pipeline.completedAgents) return "completed";
    if (realIndex === pipeline.completedAgents) return "failed";
    return "pending";
  }

  if (pipeline.currentAgents.includes(agent.backendStage)) return "running";
  const realIndex = agentIndex - 1;
  if (realIndex < pipeline.completedAgents) return "completed";
  return "pending";
}

// ---------------------------------------------------------------------------
// AgentCard
// ---------------------------------------------------------------------------

function AgentCard({
  agent,
  status,
  index,
}: {
  agent: BrandedAgent;
  status: AgentStatus;
  index: number;
}) {
  const borderColor = {
    pending: "var(--color-app-border)",
    running: "var(--color-app-accent)",
    completed: "var(--color-success)",
    failed: "var(--color-error)",
  }[status];

  const bgClass = {
    pending: "bg-[var(--color-app-surface)]",
    running: "bg-[var(--color-app-accent-light)]",
    completed: "bg-[var(--color-app-surface)]",
    failed: "bg-[var(--color-app-surface)]",
  }[status];

  const dotClass = {
    pending: "bg-[var(--color-app-border)]",
    running: "bg-[var(--color-app-accent)] animate-pulse",
    completed: "bg-[var(--color-success)]",
    failed: "bg-[var(--color-error)]",
  }[status];

  const statusIcon = {
    pending: "\u25CB", // ○
    running: "\u25CF", // ●
    completed: "\u2713", // ✓
    failed: "\u2717", // ✗
  }[status];

  const description =
    status === "running"
      ? agent.activeDescription
      : status === "completed"
        ? agent.completedDescription
        : agent.pendingDescription;

  return (
    <motion.div
      variants={fadeVariant}
      custom={index}
      data-agent-card={agent.id}
      data-status={status}
      className={`flex items-start gap-3 p-4 rounded-[var(--radius-md)] transition-colors duration-300 ${bgClass} ${
        status === "pending" ? "opacity-70" : ""
      }`}
      style={{ borderLeft: `4px solid ${borderColor}` }}
    >
      {/* Status indicator */}
      <div className="flex-shrink-0 mt-1">
        <div
          className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${dotClass}`}
          aria-hidden="true"
        />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-[family-name:var(--font-body)] text-sm font-semibold text-[var(--color-app-text)]">
            {agent.name}
          </span>
          {agent.proFeature && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded-[var(--radius-sm)] bg-[var(--color-app-accent-light)] text-[var(--color-app-accent-hover)] font-[family-name:var(--font-body)] text-[10px] font-semibold uppercase tracking-wider leading-none">
              Pro
            </span>
          )}
        </div>
        <p className={`font-[family-name:var(--font-body)] text-xs mt-1 leading-relaxed ${
          status === "running"
            ? "text-[var(--color-app-text-secondary)] italic"
            : status === "completed"
              ? "text-[var(--color-app-text-tertiary)]"
              : "text-[var(--color-app-text-secondary)]"
        }`}>
          {status === "completed" ? `${statusIcon} ${description}` : description}
        </p>
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Elapsed time hook
// ---------------------------------------------------------------------------

function useElapsedTime(isRunning: boolean) {
  const [elapsed, setElapsed] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setElapsed((prev) => prev + 1);
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isRunning]);

  // Reset on new run
  const reset = useCallback(() => setElapsed(0), []);

  return { elapsed, reset };
}

function formatElapsed(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

// ---------------------------------------------------------------------------
// ActivityLog
// ---------------------------------------------------------------------------

interface LogEntry {
  id: number;
  timestamp: string;
  message: string;
}

function ActivityLog({
  activeAgentId,
  elapsed,
}: {
  activeAgentId: string | null;
  elapsed: number;
}) {
  const [entries, setEntries] = useState<LogEntry[]>([]);
  const logRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const usedMessagesRef = useRef<Record<string, number[]>>({});
  const entryIdRef = useRef(0);
  const elapsedRef = useRef(elapsed);
  const activeAgentIdRef = useRef(activeAgentId);

  // Keep refs in sync
  elapsedRef.current = elapsed;
  activeAgentIdRef.current = activeAgentId;

  const addEntry = useCallback(() => {
    const agentId = activeAgentIdRef.current;
    if (!agentId) return;

    const messages = AGENT_LOG_MESSAGES[agentId];
    if (!messages || messages.length === 0) return;

    // Track used messages per agent
    if (!usedMessagesRef.current[agentId]) {
      usedMessagesRef.current[agentId] = [];
    }
    const used = usedMessagesRef.current[agentId];
    // Reset if all exhausted
    if (used.length >= messages.length) {
      usedMessagesRef.current[agentId] = [];
    }

    // Pick random unused message
    const available = messages
      .map((_, i) => i)
      .filter((i) => !usedMessagesRef.current[agentId].includes(i));
    const idx = available[Math.floor(Math.random() * available.length)];
    usedMessagesRef.current[agentId].push(idx);

    const entry: LogEntry = {
      id: entryIdRef.current++,
      timestamp: formatElapsed(elapsedRef.current),
      message: messages[idx],
    };

    setEntries((prev) => [...prev, entry]);
  }, []);

  const scheduleNext = useCallback(() => {
    const delay = LOG_INTERVAL_MIN + Math.random() * LOG_INTERVAL_RANGE;
    timerRef.current = setTimeout(() => {
      addEntry();
      scheduleNext();
    }, delay);
  }, [addEntry]);

  // Start log on mount, seed first entry
  useEffect(() => {
    addEntry();
    scheduleNext();
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [addEntry, scheduleNext]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [entries]);

  return (
    <div className="relative mb-4">
      {/* Top fade gradient */}
      <div className="absolute top-0 left-0 right-0 h-6 bg-gradient-to-b from-[var(--color-app-surface)] to-transparent z-10 pointer-events-none rounded-t-[var(--radius-md)]" />
      <div
        ref={logRef}
        data-testid="activity-log"
        className="h-[120px] overflow-y-auto border border-[var(--color-app-border)] rounded-[var(--radius-md)] bg-[var(--color-app-surface)] px-4 py-3"
      >
        {entries.map((entry) => (
          <div
            key={entry.id}
            data-testid="log-entry"
            className="flex gap-3 py-1 animate-fade-in"
          >
            <span className="font-mono text-xs text-[var(--color-app-text-tertiary)] flex-shrink-0 w-10 tabular-nums">
              {entry.timestamp}
            </span>
            <span className="font-[family-name:var(--font-body)] text-xs text-[var(--color-app-text-secondary)]">
              {entry.message}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
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

  const isCompleted = progress?.reportStatus === "completed";
  const isFailed = progress?.reportStatus === "failed";
  const isTerminal = isCompleted || isFailed;

  // Elapsed time counter
  const { elapsed, reset: resetElapsed } = useElapsedTime(!isTerminal);

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

  // Progress calculation — same logic as before
  const rawAgentPercent = progress?.pipeline.percentComplete ?? 0;
  const hasAgentActivity =
    (progress?.pipeline.completedAgents ?? 0) > 0 ||
    (progress?.pipeline.currentAgents?.length ?? 0) > 0;
  const percentComplete =
    progress?.reportStatus === "generating"
      ? hasAgentActivity
        ? Math.round(20 + rawAgentPercent * 0.8)
        : Math.min(18, rawAgentPercent || 10)
      : rawAgentPercent;

  // Find currently active agent for status line
  const activeAgent = BRANDED_AGENTS.find(
    (_, idx) => getAgentStatus(BRANDED_AGENTS[idx], idx, progress) === "running"
  );

  const handleViewReport = useCallback(() => {
    router.push(`/reports/${reportId}`);
    onStepComplete();
  }, [router, reportId, onStepComplete]);

  const handleRetry = useCallback(async () => {
    setIsRetrying(true);
    try {
      const res = await fetch(`/api/reports/${reportId}/generate`, { method: "POST" });
      if (!res.ok) return;
      setProgress(null);
      resetElapsed();
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = setInterval(fetchProgress, POLL_INTERVAL);
      await fetchProgress();
    } catch {
      // Error handled silently
    } finally {
      setIsRetrying(false);
    }
  }, [reportId, fetchProgress, resetElapsed]);

  // Heading changes based on state
  const heading = isCompleted
    ? "Your Report Is Ready"
    : isFailed
      ? "Generation Hit a Snag"
      : "Your Advisory Team Is On It";
  const subtitle = isCompleted
    ? `"${reportTitle}" has been generated successfully.`
    : isFailed
      ? "We ran into an issue generating your report."
      : "Six specialists are building your intelligence report.";

  return (
    <div className="py-4">
      {/* Heading */}
      <h2
        aria-live="polite"
        className="font-[family-name:var(--font-display)] text-2xl font-bold text-[var(--color-app-text)]"
      >
        {heading}
      </h2>
      <p className="mt-2 font-[family-name:var(--font-body)] text-sm text-[var(--color-app-text-secondary)]">
        {subtitle}
      </p>
      <div className="w-12 h-0.5 bg-[var(--color-app-accent)] mt-3 mb-6" />

      {/* Progress bar */}
      <div className="mb-4">
        <div
            role="progressbar"
            aria-valuenow={isCompleted ? 100 : percentComplete}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Report generation progress"
            className="w-full h-2.5 bg-[var(--color-app-border)] rounded-full overflow-hidden"
          >
          <div
            className="h-full rounded-full transition-all duration-700 relative overflow-hidden"
            style={{
              width: `${isCompleted ? 100 : percentComplete}%`,
              backgroundColor: isFailed
                ? "var(--color-error)"
                : "var(--color-app-accent)",
            }}
          >
            {/* Shimmer overlay */}
            {!isTerminal && (
              <div
                data-testid="progress-shimmer"
                className="absolute inset-0"
                style={{
                  background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%)",
                  animation: "shimmer 1.5s linear infinite",
                }}
              />
            )}
          </div>
        </div>
        <div className="flex justify-between mt-1.5">
          <div className="flex items-center gap-2">
            <span
              data-testid="elapsed-time"
              className="font-mono text-xs text-[var(--color-app-text-tertiary)] tabular-nums"
            >
              {formatElapsed(elapsed)}
            </span>
            <span className="text-[var(--color-app-border)]">&middot;</span>
            <span className="font-[family-name:var(--font-body)] text-xs text-[var(--color-app-text-tertiary)]">
              {isCompleted ? "100" : percentComplete}% complete
            </span>
          </div>
          {!isTerminal && (
            <p className="font-[family-name:var(--font-body)] text-xs text-[var(--color-app-text-tertiary)]">
              {estimateTimeRemaining(percentComplete)}
            </p>
          )}
        </div>
      </div>

      {/* Active agent status line */}
      {activeAgent && !isCompleted && !isFailed && (
        <p className="font-[family-name:var(--font-body)] text-xs text-[var(--color-app-text-secondary)] mb-4">
          <span className="font-medium">{activeAgent.name}</span>
          {" \u2014 "}
          {activeAgent.activeDescription.replace(/\.\.\.$/, "")}
        </p>
      )}

      {/* Agent cards */}
      <motion.div
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        className="space-y-2 mb-6"
      >
        {BRANDED_AGENTS.map((agent, idx) => (
          <AgentCard
            key={agent.id}
            agent={agent}
            status={getAgentStatus(agent, idx, progress)}
            index={idx}
          />
        ))}
      </motion.div>

      {/* Activity log — only during generation */}
      {!isTerminal && (
        <ActivityLog
          activeAgentId={activeAgent?.id ?? null}
          elapsed={elapsed}
        />
      )}

      {/* Completed state */}
      {isCompleted && (
        <motion.div variants={fadeVariant} initial="initial" animate="animate" className="text-center space-y-4">
          <button
            type="button"
            onClick={handleViewReport}
            className="w-full py-3 bg-[var(--color-app-accent)] hover:bg-[var(--color-app-accent-hover)] text-[var(--color-app-text)] font-[family-name:var(--font-body)] font-semibold text-sm rounded-[var(--radius-sm)] shadow-[var(--shadow-sm)] transition-colors duration-[var(--duration-default)]"
          >
            View Report
          </button>
        </motion.div>
      )}

      {/* Failed state */}
      {isFailed && (
        <motion.div variants={fadeVariant} initial="initial" animate="animate" className="text-center space-y-4">
          <button
            type="button"
            onClick={handleRetry}
            disabled={isRetrying}
            className="w-full py-3 bg-[var(--color-app-accent)] hover:bg-[var(--color-app-accent-hover)] text-[var(--color-app-text)] font-[family-name:var(--font-body)] font-semibold text-sm rounded-[var(--radius-sm)] shadow-[var(--shadow-sm)] transition-colors duration-[var(--duration-default)] disabled:opacity-50"
          >
            {isRetrying ? "Retrying..." : "Try Again"}
          </button>
        </motion.div>
      )}

      {/* Footer */}
      {!isCompleted && !isFailed && (
        <p className="font-[family-name:var(--font-body)] text-xs text-[var(--color-app-text-tertiary)] pt-3 border-t border-[var(--color-app-border)]">
          Reports can take up to 10 minutes. You&rsquo;ll be notified when it&rsquo;s ready.
        </p>
      )}
    </div>
  );
}
