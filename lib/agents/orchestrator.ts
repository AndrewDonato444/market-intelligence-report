/**
 * Agent Orchestration Framework
 *
 * Coordinates specialized AI agents through a dependency-ordered pipeline
 * to generate market intelligence report sections.
 *
 * Each agent receives typed input (market data, upstream results) and produces
 * typed output (report sections + metadata) that flows to downstream agents.
 */

import {
  computeInputHash,
  getCachedAgentResult,
  cacheAgentResult,
} from "@/lib/services/agent-cache";

// --- Types ---

export interface AgentDefinition {
  name: string;
  description: string;
  dependencies: string[];
  execute: (context: AgentContext) => Promise<AgentResult>;
}

export interface AgentContext {
  reportId: string;
  userId: string;
  market: MarketData;
  reportConfig: ReportConfig;
  upstreamResults: Record<string, AgentResult>;
  abortSignal: AbortSignal;
  /** Pre-computed analytics from Layer 1 (available in v2 pipeline) */
  computedAnalytics?: import("@/lib/services/market-analytics").ComputedAnalytics;
}

export interface MarketData {
  name: string;
  geography: {
    city: string;
    state: string;
    county?: string;
    region?: string;
    zipCodes?: string[];
  };
  luxuryTier: "luxury" | "high_luxury" | "ultra_luxury";
  priceFloor: number;
  priceCeiling?: number | null;
  segments?: string[];
  propertyTypes?: string[];
  focusAreas?: string[];
  peerMarkets?: Array<{
    name: string;
    geography: { city: string; state: string };
  }>;
}

export interface ReportConfig {
  sections?: string[];
  dateRange?: { start: string; end: string };
  customPrompts?: Record<string, string>;
}

export interface AgentResult {
  agentName: string;
  sections: SectionOutput[];
  metadata: Record<string, unknown>;
  durationMs: number;
}

export interface SectionOutput {
  sectionType: string;
  title: string;
  content: unknown;
}

// --- Events ---

export type PipelineEvent =
  | { type: "agent_started"; agentName: string; timestamp: Date }
  | { type: "agent_completed"; agentName: string; durationMs: number; timestamp: Date }
  | { type: "agent_failed"; agentName: string; error: string; retriable: boolean; timestamp: Date }
  | { type: "agent_retrying"; agentName: string; attempt: number; maxRetries: number; timestamp: Date }
  | { type: "pipeline_completed"; totalDurationMs: number; timestamp: Date }
  | { type: "pipeline_failed"; error: string; failedAgent: string; timestamp: Date };

// --- Progress ---

export interface PipelineProgress {
  reportId: string;
  status: "idle" | "running" | "completed" | "failed" | "cancelled";
  totalAgents: number;
  completedAgents: number;
  currentAgents: string[];
  percentComplete: number;
  events: PipelineEvent[];
}

// --- Options & Result ---

export interface PipelineOptions {
  userId: string;
  market: MarketData;
  reportConfig: ReportConfig;
  maxRetries?: number;
  retryDelayMs?: number;
  onEvent?: (event: PipelineEvent) => void;
  /** Pre-computed analytics from Layer 1 (v2 pipeline passes this through to agents) */
  computedAnalytics?: import("@/lib/services/market-analytics").ComputedAnalytics;
  /** When true, skip agent output cache and always call Claude */
  bypassAgentCache?: boolean;
}

export interface PipelineResult {
  reportId: string;
  status: "completed" | "failed";
  sections: SectionOutput[];
  totalDurationMs: number;
  agentTimings: Record<string, number>;
  agentResults?: Record<string, AgentResult>;
  error?: string;
}

// --- Runner Interface ---

export interface PipelineRunner {
  run(reportId: string, options: PipelineOptions): Promise<PipelineResult>;
  cancel(reportId: string): void;
  getProgress(reportId: string): PipelineProgress;
}

// --- Validation ---

function validateAgents(agents: AgentDefinition[]): void {
  const names = new Set<string>();

  for (const agent of agents) {
    if (names.has(agent.name)) {
      throw new Error(`Duplicate agent name: "${agent.name}"`);
    }
    names.add(agent.name);
  }

  for (const agent of agents) {
    for (const dep of agent.dependencies) {
      if (!names.has(dep)) {
        throw new Error(
          `Agent "${agent.name}" has unknown dependency: "${dep}"`
        );
      }
    }
  }

  // Detect circular dependencies via topological sort
  detectCycles(agents);
}

function detectCycles(agents: AgentDefinition[]): void {
  const visited = new Set<string>();
  const visiting = new Set<string>();
  const agentMap = new Map(agents.map((a) => [a.name, a]));

  function dfs(name: string): void {
    if (visited.has(name)) return;
    if (visiting.has(name)) {
      throw new Error(`Circular dependency detected involving agent: "${name}"`);
    }

    visiting.add(name);
    const agent = agentMap.get(name)!;
    for (const dep of agent.dependencies) {
      dfs(dep);
    }
    visiting.delete(name);
    visited.add(name);
  }

  for (const agent of agents) {
    dfs(agent.name);
  }
}

// --- Topological sort for execution order ---

function getExecutionLayers(agents: AgentDefinition[]): string[][] {
  const agentMap = new Map(agents.map((a) => [a.name, a]));
  const completed = new Set<string>();
  const layers: string[][] = [];
  const remaining = new Set(agents.map((a) => a.name));

  while (remaining.size > 0) {
    const layer: string[] = [];

    for (const name of remaining) {
      const agent = agentMap.get(name)!;
      const depsReady = agent.dependencies.every((d) => completed.has(d));
      if (depsReady) {
        layer.push(name);
      }
    }

    if (layer.length === 0) {
      // Should not happen after validation, but guard anyway
      throw new Error("Unable to resolve execution order — possible deadlock");
    }

    for (const name of layer) {
      remaining.delete(name);
      completed.add(name);
    }

    layers.push(layer);
  }

  return layers;
}

// --- Retry logic ---

async function executeWithRetry(
  agent: AgentDefinition,
  context: AgentContext,
  maxRetries: number,
  retryDelayMs: number,
  emitEvent: (event: PipelineEvent) => void
): Promise<AgentResult> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      if (attempt > 0) {
        emitEvent({
          type: "agent_retrying",
          agentName: agent.name,
          attempt,
          maxRetries,
          timestamp: new Date(),
        });

        // Exponential backoff
        const delay = retryDelayMs * Math.pow(2, attempt - 1);
        await new Promise((r) => setTimeout(r, delay));
      }

      const start = Date.now();
      const result = await agent.execute(context);
      result.durationMs = Date.now() - start;
      return result;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      const retriable = (err as any)?.retriable !== false;

      emitEvent({
        type: "agent_failed",
        agentName: agent.name,
        error: lastError.message,
        retriable,
        timestamp: new Date(),
      });

      if (!retriable) {
        throw lastError;
      }
    }
  }

  throw lastError!;
}

// --- Pipeline Runner Implementation ---

export function createPipelineRunner(agents: AgentDefinition[]): PipelineRunner {
  validateAgents(agents);

  const executionLayers = getExecutionLayers(agents);
  const agentMap = new Map(agents.map((a) => [a.name, a]));

  // Track progress per pipeline run
  const progressMap = new Map<string, PipelineProgress>();
  const abortControllers = new Map<string, AbortController>();

  return {
    async run(reportId: string, options: PipelineOptions): Promise<PipelineResult> {
      const {
        userId,
        market,
        reportConfig,
        maxRetries = 2,
        retryDelayMs = 1000,
        onEvent,
      } = options;

      const abortController = new AbortController();
      abortControllers.set(reportId, abortController);

      const events: PipelineEvent[] = [];
      const emitEvent = (event: PipelineEvent) => {
        events.push(event);
        onEvent?.(event);
      };

      const progress: PipelineProgress = {
        reportId,
        status: "running",
        totalAgents: agents.length,
        completedAgents: 0,
        currentAgents: [],
        percentComplete: 0,
        events,
      };
      progressMap.set(reportId, progress);

      const allResults: Record<string, AgentResult> = {};
      const allSections: SectionOutput[] = [];
      const agentTimings: Record<string, number> = {};
      const pipelineStart = Date.now();

      try {
        for (const layer of executionLayers) {
          // Check cancellation before starting a new layer
          if (abortController.signal.aborted) {
            progress.status = "cancelled";
            const result: PipelineResult = {
              reportId,
              status: "failed",
              sections: allSections,
              totalDurationMs: Date.now() - pipelineStart,
              agentTimings,
              error: "Pipeline cancelled",
            };

            emitEvent({
              type: "pipeline_failed",
              error: "Pipeline cancelled",
              failedAgent: "",
              timestamp: new Date(),
            });

            return result;
          }

          progress.currentAgents = [...layer];

          // Run all agents in this layer in parallel
          const bypassCache = options.bypassAgentCache === true;

          const layerPromises = layer.map(async (agentName) => {
            const agent = agentMap.get(agentName)!;
            const upstreamSnapshot = { ...allResults };

            emitEvent({
              type: "agent_started",
              agentName,
              timestamp: new Date(),
            });

            // --- Agent output cache check ---
            if (!bypassCache) {
              const inputHash = computeInputHash(
                agentName,
                market,
                options.computedAnalytics,
                upstreamSnapshot
              );

              const cached = await getCachedAgentResult(agentName, inputHash);
              if (cached) {
                emitEvent({
                  type: "agent_completed",
                  agentName,
                  durationMs: 0,
                  timestamp: new Date(),
                });
                return cached;
              }
            }

            const context: AgentContext = {
              reportId,
              userId,
              market,
              reportConfig,
              upstreamResults: upstreamSnapshot,
              abortSignal: abortController.signal,
              computedAnalytics: options.computedAnalytics,
            };

            const result = await executeWithRetry(
              agent,
              context,
              maxRetries,
              retryDelayMs,
              emitEvent
            );

            // Cache the fresh result (even when bypassCache is true)
            const storeHash = computeInputHash(
              agentName,
              market,
              options.computedAnalytics,
              upstreamSnapshot
            );
            await cacheAgentResult(agentName, storeHash, result);

            emitEvent({
              type: "agent_completed",
              agentName,
              durationMs: result.durationMs,
              timestamp: new Date(),
            });

            return result;
          });

          const layerResults = await Promise.all(layerPromises);

          for (const result of layerResults) {
            allResults[result.agentName] = result;
            allSections.push(...result.sections);
            agentTimings[result.agentName] = result.durationMs;
            progress.completedAgents++;
            progress.percentComplete = Math.round(
              (progress.completedAgents / progress.totalAgents) * 100
            );
          }
        }

        const totalDurationMs = Date.now() - pipelineStart;
        progress.status = "completed";
        progress.currentAgents = [];

        emitEvent({
          type: "pipeline_completed",
          totalDurationMs,
          timestamp: new Date(),
        });

        return {
          reportId,
          status: "completed",
          sections: allSections,
          totalDurationMs,
          agentTimings,
          agentResults: allResults,
        };
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        const totalDurationMs = Date.now() - pipelineStart;
        const failedAgent = progress.currentAgents[0] ?? "";
        progress.status = "failed";
        progress.currentAgents = [];

        emitEvent({
          type: "pipeline_failed",
          error: error.message,
          failedAgent,
          timestamp: new Date(),
        });

        return {
          reportId,
          status: "failed",
          sections: allSections,
          totalDurationMs,
          agentTimings,
          error: error.message,
        };
      } finally {
        abortControllers.delete(reportId);
      }
    },

    cancel(reportId: string): void {
      const controller = abortControllers.get(reportId);
      if (controller) {
        controller.abort();
      }
    },

    getProgress(reportId: string): PipelineProgress {
      return (
        progressMap.get(reportId) ?? {
          reportId,
          status: "idle",
          totalAgents: agents.length,
          completedAgents: 0,
          currentAgents: [],
          percentComplete: 0,
          events: [],
        }
      );
    },
  };
}
