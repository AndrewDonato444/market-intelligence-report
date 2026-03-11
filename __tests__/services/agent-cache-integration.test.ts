/**
 * Integration tests for agent output cache within the pipeline orchestrator.
 * Tests that the orchestrator checks cache before executing agents.
 */

jest.mock("@/lib/db", () => ({
  db: {},
  schema: { cache: {}, apiUsage: {} },
}));
jest.mock("@/lib/services/cache");
jest.mock("@/lib/services/agent-cache");

import {
  createPipelineRunner,
  type AgentDefinition,
  type AgentResult,
  type PipelineOptions,
} from "@/lib/agents/orchestrator";
import * as agentCache from "@/lib/services/agent-cache";

const mockComputeInputHash = agentCache.computeInputHash as jest.MockedFunction<
  typeof agentCache.computeInputHash
>;
const mockGetCachedAgentResult = agentCache.getCachedAgentResult as jest.MockedFunction<
  typeof agentCache.getCachedAgentResult
>;
const mockCacheAgentResult = agentCache.cacheAgentResult as jest.MockedFunction<
  typeof agentCache.cacheAgentResult
>;

// --- Fixtures ---

function makeResult(name: string): AgentResult {
  return {
    agentName: name,
    sections: [{ sectionType: `${name}_section`, title: `${name} Title`, content: {} }],
    metadata: {},
    durationMs: 100,
  };
}

const mockExecute = jest.fn();

function makeAgent(name: string, deps: string[] = []): AgentDefinition {
  return {
    name,
    description: `Test ${name}`,
    dependencies: deps,
    execute: mockExecute.mockImplementation(async () => makeResult(name)),
  };
}

const baseOptions: PipelineOptions = {
  userId: "user-1",
  market: {
    name: "Test Market",
    geography: { city: "Test", state: "FL" },
    luxuryTier: "ultra_luxury",
    priceFloor: 5000000,
  },
  reportConfig: {},
};

// --- Tests ---

describe("Agent Cache — Orchestrator Integration", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockComputeInputHash.mockReturnValue("test-hash-123");
    mockGetCachedAgentResult.mockResolvedValue(null); // default: cache miss
    mockCacheAgentResult.mockResolvedValue(undefined);
  });

  it("SVC-AOC-INT-01 | skips agent execution on cache hit", async () => {
    const cachedResult = makeResult("agent-a");
    cachedResult.metadata = { cached: true };
    mockGetCachedAgentResult.mockResolvedValue(cachedResult);

    const agents = [makeAgent("agent-a")];
    const runner = createPipelineRunner(agents);
    const result = await runner.run("report-1", baseOptions);

    expect(result.status).toBe("completed");
    // Agent execute should NOT have been called
    expect(mockExecute).not.toHaveBeenCalled();
    // Result should contain the cached sections
    expect(result.sections).toHaveLength(1);
    expect(result.sections[0].sectionType).toBe("agent-a_section");
  });

  it("SVC-AOC-INT-02 | calls agent and caches result on cache miss", async () => {
    const agents = [makeAgent("agent-a")];
    const runner = createPipelineRunner(agents);
    const result = await runner.run("report-1", baseOptions);

    expect(result.status).toBe("completed");
    // Agent execute SHOULD have been called
    expect(mockExecute).toHaveBeenCalledTimes(1);
    // Result should be cached
    expect(mockCacheAgentResult).toHaveBeenCalledWith(
      "agent-a",
      "test-hash-123",
      expect.objectContaining({ agentName: "agent-a" })
    );
  });

  it("SVC-AOC-INT-03 | bypasses cache when bypassAgentCache is true", async () => {
    const cachedResult = makeResult("agent-a");
    mockGetCachedAgentResult.mockResolvedValue(cachedResult);

    const agents = [makeAgent("agent-a")];
    const runner = createPipelineRunner(agents);
    const result = await runner.run("report-1", {
      ...baseOptions,
      bypassAgentCache: true,
    });

    expect(result.status).toBe("completed");
    // Should NOT check cache
    expect(mockGetCachedAgentResult).not.toHaveBeenCalled();
    // Agent execute SHOULD have been called
    expect(mockExecute).toHaveBeenCalledTimes(1);
    // But should still store the new result
    expect(mockCacheAgentResult).toHaveBeenCalled();
  });

  it("SVC-AOC-INT-04 | caches each agent independently in multi-agent pipeline", async () => {
    // Agent A: cache hit, Agent B: cache miss
    // computeInputHash is called: once for A lookup, once for B lookup, once for B store
    const cachedA = makeResult("agent-a");
    mockComputeInputHash.mockImplementation((name: string) =>
      name === "agent-a" ? "hash-a" : "hash-b"
    );
    mockGetCachedAgentResult
      .mockResolvedValueOnce(cachedA)  // agent-a: hit
      .mockResolvedValueOnce(null);     // agent-b: miss

    const agentA: AgentDefinition = {
      name: "agent-a",
      description: "Agent A",
      dependencies: [],
      execute: jest.fn().mockResolvedValue(makeResult("agent-a")),
    };
    const agentB: AgentDefinition = {
      name: "agent-b",
      description: "Agent B",
      dependencies: [],
      execute: jest.fn().mockResolvedValue(makeResult("agent-b")),
    };

    const runner = createPipelineRunner([agentA, agentB]);
    const result = await runner.run("report-1", baseOptions);

    expect(result.status).toBe("completed");
    // Agent A should NOT execute (cached)
    expect(agentA.execute).not.toHaveBeenCalled();
    // Agent B SHOULD execute (cache miss)
    expect(agentB.execute).toHaveBeenCalledTimes(1);
    // Agent B's result should be cached with hash-b
    expect(mockCacheAgentResult).toHaveBeenCalledWith(
      "agent-b",
      "hash-b",
      expect.objectContaining({ agentName: "agent-b" })
    );
  });

  it("SVC-AOC-INT-05 | emits agent_completed events for cached results", async () => {
    const cachedResult = makeResult("agent-a");
    mockGetCachedAgentResult.mockResolvedValue(cachedResult);

    const events: any[] = [];
    const agents = [makeAgent("agent-a")];
    const runner = createPipelineRunner(agents);
    await runner.run("report-1", {
      ...baseOptions,
      onEvent: (e) => events.push(e),
    });

    const completedEvent = events.find(
      (e) => e.type === "agent_completed" && e.agentName === "agent-a"
    );
    expect(completedEvent).toBeDefined();
    // Cached results should have near-zero duration
    expect(completedEvent.durationMs).toBeLessThan(100);
  });
});
