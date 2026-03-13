/**
 * @file Agent Orchestration Framework Tests
 * @id SVC-ORCH-001 through SVC-ORCH-015
 *
 * Tests the pipeline runner that coordinates specialized agents
 * through a dependency-ordered execution pipeline.
 */

jest.mock("@/lib/db", () => ({
  db: {},
  schema: {
    reports: {},
    reportSections: {},
    cache: {},
    apiUsage: {},
  },
}));

import {
  PipelineRunner,
  createPipelineRunner,
  type AgentDefinition,
  type AgentContext,
  type AgentResult,
  type PipelineEvent,
  type PipelineProgress,
  type PipelineOptions,
} from "@/lib/agents/orchestrator";

// --- Test Helpers ---

function createMockAgent(
  name: string,
  deps: string[] = [],
  opts?: {
    delayMs?: number;
    shouldFail?: boolean;
    failMessage?: string;
    retriable?: boolean;
    result?: Partial<AgentResult>;
  }
): AgentDefinition {
  const { delayMs = 0, shouldFail = false, failMessage = "Agent failed", retriable = true, result } = opts ?? {};

  return {
    name,
    description: `Mock ${name} agent`,
    dependencies: deps,
    execute: jest.fn(async (ctx: AgentContext): Promise<AgentResult> => {
      if (delayMs > 0) {
        await new Promise((r) => setTimeout(r, delayMs));
      }

      // Check for abort
      if (ctx.abortSignal?.aborted) {
        const err = new Error("Cancelled");
        (err as any).retriable = false;
        throw err;
      }

      if (shouldFail) {
        const err = new Error(failMessage);
        (err as any).retriable = retriable;
        throw err;
      }

      return {
        agentName: name,
        sections: result?.sections ?? [
          {
            sectionType: name.replace("-", "_"),
            title: `${name} output`,
            content: { generated: true, agent: name },
          },
        ],
        metadata: result?.metadata ?? { agent: name },
        durationMs: result?.durationMs ?? delayMs,
      };
    }),
  };
}

const mockMarket = {
  name: "Naples, FL - Ultra Luxury",
  geography: { city: "Naples", state: "FL", county: "Collier" },
  luxuryTier: "ultra_luxury" as const,
  priceFloor: 10000000,
  priceCeiling: null,
  segments: ["waterfront", "golf course"],
  propertyTypes: ["single_family", "estate"],
};

const mockReportConfig = {
  sections: ["market_overview", "executive_summary", "key_drivers"],
  dateRange: { start: "2025-01-01", end: "2025-12-31" },
};

describe("Agent Orchestration Framework", () => {
  describe("Pipeline Creation", () => {
    // SVC-ORCH-001
    it("should create a pipeline runner with agents", () => {
      const agents = [
        createMockAgent("data-analyst"),
        createMockAgent("insight-generator", ["data-analyst"]),
      ];

      const runner = createPipelineRunner(agents);
      expect(runner).toBeDefined();
      expect(runner.run).toBeInstanceOf(Function);
      expect(runner.cancel).toBeInstanceOf(Function);
      expect(runner.getProgress).toBeInstanceOf(Function);
    });

    // SVC-ORCH-002
    it("should reject duplicate agent names", () => {
      const agents = [
        createMockAgent("data-analyst"),
        createMockAgent("data-analyst"),
      ];

      expect(() => createPipelineRunner(agents)).toThrow(/duplicate/i);
    });

    // SVC-ORCH-003
    it("should reject agents with unknown dependencies", () => {
      const agents = [
        createMockAgent("insight-generator", ["nonexistent-agent"]),
      ];

      expect(() => createPipelineRunner(agents)).toThrow(/unknown dependency/i);
    });

    // SVC-ORCH-004
    it("should detect circular dependencies", () => {
      const agents = [
        createMockAgent("a", ["b"]),
        createMockAgent("b", ["a"]),
      ];

      expect(() => createPipelineRunner(agents)).toThrow(/circular/i);
    });
  });

  describe("Pipeline Execution", () => {
    // SVC-ORCH-005
    it("should run a single agent pipeline", async () => {
      const agent = createMockAgent("data-analyst");
      const runner = createPipelineRunner([agent]);

      const result = await runner.run("report-1", {
        userId: "user-1",
        market: mockMarket,
        reportConfig: mockReportConfig,
      });

      expect(result.status).toBe("completed");
      expect(result.sections).toHaveLength(1);
      expect(result.sections[0].sectionType).toBe("data_analyst");
      expect(agent.execute).toHaveBeenCalledTimes(1);
    });

    // SVC-ORCH-006
    it("should pass upstream results to downstream agents", async () => {
      const dataAnalyst = createMockAgent("data-analyst", [], {
        result: {
          sections: [{ sectionType: "executive_summary", title: "Analysis", content: { metrics: [1, 2, 3] } }],
          metadata: { totalTransactions: 500 },
        },
      });
      const insightGen = createMockAgent("insight-generator", ["data-analyst"]);

      const runner = createPipelineRunner([dataAnalyst, insightGen]);
      await runner.run("report-1", {
        userId: "user-1",
        market: mockMarket,
        reportConfig: mockReportConfig,
      });

      // insight-generator should have received data-analyst's result
      const insightCall = (insightGen.execute as jest.Mock).mock.calls[0][0] as AgentContext;
      expect(insightCall.upstreamResults).toHaveProperty("data-analyst");
      expect(insightCall.upstreamResults["data-analyst"].metadata).toEqual({ totalTransactions: 500 });
    });

    // SVC-ORCH-007
    it("should run independent agents in parallel", async () => {
      const startTimes: Record<string, number> = {};

      const dataAnalyst = createMockAgent("data-analyst", [], { delayMs: 50 });
      const original1 = dataAnalyst.execute;
      dataAnalyst.execute = jest.fn(async (ctx) => {
        startTimes["data-analyst"] = Date.now();
        return original1(ctx);
      });

      const insightGen = createMockAgent("insight-generator", ["data-analyst"], { delayMs: 50 });
      const original2 = insightGen.execute;
      insightGen.execute = jest.fn(async (ctx) => {
        startTimes["insight-generator"] = Date.now();
        return original2(ctx);
      });

      const competitive = createMockAgent("competitive-analyst", ["data-analyst"], { delayMs: 50 });
      const original3 = competitive.execute;
      competitive.execute = jest.fn(async (ctx) => {
        startTimes["competitive-analyst"] = Date.now();
        return original3(ctx);
      });

      const runner = createPipelineRunner([dataAnalyst, insightGen, competitive]);
      await runner.run("report-1", {
        userId: "user-1",
        market: mockMarket,
        reportConfig: mockReportConfig,
      });

      // insight-generator and competitive-analyst should start at roughly the same time
      // (both depend on data-analyst, which completes first)
      const timeDiff = Math.abs(
        startTimes["insight-generator"] - startTimes["competitive-analyst"]
      );
      expect(timeDiff).toBeLessThan(40); // started within 40ms of each other
    });

    // SVC-ORCH-008
    it("should respect dependency ordering", async () => {
      const executionOrder: string[] = [];

      const makeTracked = (name: string, deps: string[]) => {
        const agent = createMockAgent(name, deps);
        const orig = agent.execute;
        agent.execute = jest.fn(async (ctx) => {
          executionOrder.push(name);
          return orig(ctx);
        });
        return agent;
      };

      const a = makeTracked("data-analyst", []);
      const b = makeTracked("insight-generator", ["data-analyst"]);
      const c = makeTracked("polish", ["insight-generator"]);

      const runner = createPipelineRunner([a, b, c]);
      await runner.run("report-1", {
        userId: "user-1",
        market: mockMarket,
        reportConfig: mockReportConfig,
      });

      expect(executionOrder.indexOf("data-analyst")).toBeLessThan(
        executionOrder.indexOf("insight-generator")
      );
      expect(executionOrder.indexOf("insight-generator")).toBeLessThan(
        executionOrder.indexOf("polish")
      );
    });

    // SVC-ORCH-009
    it("should collect all sections from all agents", async () => {
      const agents = [
        createMockAgent("data-analyst", [], {
          result: {
            sections: [
              { sectionType: "executive_summary", title: "Summary", content: {} },
              { sectionType: "market_overview", title: "Overview", content: {} },
            ],
          },
        }),
        createMockAgent("insight-generator", ["data-analyst"], {
          result: {
            sections: [
              { sectionType: "key_drivers", title: "Key Drivers", content: {} },
            ],
          },
        }),
      ];

      const runner = createPipelineRunner(agents);
      const result = await runner.run("report-1", {
        userId: "user-1",
        market: mockMarket,
        reportConfig: mockReportConfig,
      });

      expect(result.sections).toHaveLength(3);
      const types = result.sections.map((s) => s.sectionType);
      expect(types).toContain("executive_summary");
      expect(types).toContain("market_overview");
      expect(types).toContain("key_drivers");
    });
  });

  describe("Error Handling and Retries", () => {
    // SVC-ORCH-010
    it("should retry retriable failures with backoff", async () => {
      let callCount = 0;
      const agent = createMockAgent("data-analyst");
      agent.execute = jest.fn(async () => {
        callCount++;
        if (callCount < 3) {
          const err = new Error("Rate limit exceeded");
          (err as any).retriable = true;
          throw err;
        }
        return {
          agentName: "data-analyst",
          sections: [{ sectionType: "data", title: "Analysis", content: {} }],
          metadata: {},
          durationMs: 10,
        };
      });

      const runner = createPipelineRunner([agent]);
      const result = await runner.run("report-1", {
        userId: "user-1",
        market: mockMarket,
        reportConfig: mockReportConfig,
        maxRetries: 3,
        retryDelayMs: 10, // Short for tests
      });

      expect(result.status).toBe("completed");
      expect(callCount).toBe(3); // 1 initial + 2 retries
    });

    // SVC-ORCH-011
    it("should fail pipeline on non-retriable error", async () => {
      const agent = createMockAgent("data-analyst", [], {
        shouldFail: true,
        failMessage: "Invalid data format",
        retriable: false,
      });

      const runner = createPipelineRunner([agent]);
      const result = await runner.run("report-1", {
        userId: "user-1",
        market: mockMarket,
        reportConfig: mockReportConfig,
      });

      expect(result.status).toBe("failed");
      expect(result.error).toContain("Invalid data format");
    });

    // SVC-ORCH-012
    it("should fail pipeline when retries are exhausted", async () => {
      const agent = createMockAgent("data-analyst", [], {
        shouldFail: true,
        failMessage: "API timeout",
        retriable: true,
      });

      const runner = createPipelineRunner([agent]);
      const result = await runner.run("report-1", {
        userId: "user-1",
        market: mockMarket,
        reportConfig: mockReportConfig,
        maxRetries: 2,
        retryDelayMs: 10,
      });

      expect(result.status).toBe("failed");
      expect(result.error).toContain("API timeout");
      expect(agent.execute).toHaveBeenCalledTimes(3); // 1 initial + 2 retries
    });
  });

  describe("Progress Tracking", () => {
    // SVC-ORCH-013
    it("should emit progress events", async () => {
      const events: PipelineEvent[] = [];
      const agents = [
        createMockAgent("data-analyst"),
        createMockAgent("insight-generator", ["data-analyst"]),
      ];

      const runner = createPipelineRunner(agents);
      await runner.run("report-1", {
        userId: "user-1",
        market: mockMarket,
        reportConfig: mockReportConfig,
        onEvent: (event) => events.push(event),
      });

      const eventTypes = events.map((e) => e.type);
      expect(eventTypes).toContain("agent_started");
      expect(eventTypes).toContain("agent_completed");
      expect(eventTypes).toContain("pipeline_completed");

      // Verify order: data-analyst started before insight-generator
      const daStart = events.findIndex(
        (e) => e.type === "agent_started" && e.agentName === "data-analyst"
      );
      const igStart = events.findIndex(
        (e) => e.type === "agent_started" && e.agentName === "insight-generator"
      );
      expect(daStart).toBeLessThan(igStart);
    });

    // SVC-ORCH-014
    it("should track progress during execution", async () => {
      let capturedProgress: PipelineProgress | null = null;

      const slowAgent = createMockAgent("data-analyst", [], { delayMs: 100 });
      const fastFollower = createMockAgent("insight-generator", ["data-analyst"]);

      const runner = createPipelineRunner([slowAgent, fastFollower]);

      // Capture progress mid-execution
      const runPromise = runner.run("report-1", {
        userId: "user-1",
        market: mockMarket,
        reportConfig: mockReportConfig,
        onEvent: () => {
          capturedProgress = runner.getProgress("report-1");
        },
      });

      await runPromise;

      // At some point during execution, progress should have been non-zero
      expect(capturedProgress).not.toBeNull();
      expect(capturedProgress!.totalAgents).toBe(2);
    });
  });

  describe("Pipeline Cancellation", () => {
    // SVC-ORCH-015
    it("should cancel a running pipeline", async () => {
      const slowAgent = createMockAgent("data-analyst", [], { delayMs: 200 });
      const follower = createMockAgent("insight-generator", ["data-analyst"]);

      const runner = createPipelineRunner([slowAgent, follower]);

      const runPromise = runner.run("report-1", {
        userId: "user-1",
        market: mockMarket,
        reportConfig: mockReportConfig,
      });

      // Cancel shortly after start
      setTimeout(() => runner.cancel("report-1"), 50);

      const result = await runPromise;
      expect(result.status).toBe("failed");
      expect(result.error).toMatch(/cancel/i);
      // The follower should never have been called
      expect(follower.execute).not.toHaveBeenCalled();
    });
  });
});
