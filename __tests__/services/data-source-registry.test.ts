jest.mock("@/lib/db", () => ({
  db: {},
  schema: { cache: {}, apiUsage: {} },
}));
jest.mock("@/lib/services/cache");
jest.mock("@/lib/services/api-usage");
jest.mock("@/lib/config/env", () => ({
  env: {
    REALESTATEAPI_KEY: "test-reapi-key",
    SCRAPINGDOG_API_KEY: "test-sd-key",
  },
}));

// Mock global fetch for health checks
const mockFetch = jest.fn();
global.fetch = mockFetch;

import {
  DataSourceRegistry,
  registry,
  type DataSourceConnector,
  type ConnectorHealth,
} from "@/lib/services/data-source-registry";

beforeEach(() => {
  jest.clearAllMocks();
  mockFetch.mockReset();
});

// --- SVC-DSR-01: Registry initialization ---

describe("SVC-DSR-01: Registry initialization", () => {
  test("default registry has realestateapi and scrapingdog registered", () => {
    const sources = registry.getAll();
    expect(sources).toHaveLength(2);
    expect(sources.map((s) => s.name)).toContain("realestateapi");
    expect(sources.map((s) => s.name)).toContain("scrapingdog");
  });

  test("each connector has required metadata", () => {
    const reapi = registry.get("realestateapi");
    expect(reapi).toBeDefined();
    expect(reapi!.description).toBeTruthy();
    expect(reapi!.endpoints.length).toBeGreaterThan(0);
    expect(reapi!.cacheTtlSeconds).toBe(86400);
    expect(reapi!.requiredEnvVars).toContain("REALESTATEAPI_KEY");

    const sd = registry.get("scrapingdog");
    expect(sd).toBeDefined();
    expect(sd!.cacheTtlSeconds).toBe(604800);
    expect(sd!.requiredEnvVars).toContain("SCRAPINGDOG_API_KEY");
  });
});

// --- SVC-DSR-02: Register and unregister ---

describe("SVC-DSR-02: Register and unregister", () => {
  test("can register a new connector", () => {
    const testRegistry = new DataSourceRegistry();
    const connector: DataSourceConnector = {
      name: "test-source",
      description: "A test source",
      endpoints: ["/test"],
      cacheTtlSeconds: 3600,
      requiredEnvVars: ["TEST_KEY"],
      healthCheck: async () => ({
        status: "healthy" as const,
        latencyMs: 10,
        lastChecked: new Date(),
      }),
    };

    testRegistry.register(connector);
    expect(testRegistry.get("test-source")).toBeDefined();
    expect(testRegistry.getAll()).toHaveLength(1);
  });

  test("registering a connector with duplicate name overwrites", () => {
    const testRegistry = new DataSourceRegistry();
    const v1: DataSourceConnector = {
      name: "dup",
      description: "v1",
      endpoints: ["/v1"],
      cacheTtlSeconds: 100,
      requiredEnvVars: [],
      healthCheck: async () => ({
        status: "healthy" as const,
        latencyMs: 1,
        lastChecked: new Date(),
      }),
    };
    const v2: DataSourceConnector = {
      ...v1,
      description: "v2",
    };

    testRegistry.register(v1);
    testRegistry.register(v2);
    expect(testRegistry.getAll()).toHaveLength(1);
    expect(testRegistry.get("dup")!.description).toBe("v2");
  });
});

// --- SVC-DSR-03: Health checks ---

describe("SVC-DSR-03: Health checks", () => {
  test("healthy connector returns healthy status with latency", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ status: "ok" }),
    });

    const health = await registry.checkHealth("realestateapi");
    expect(health).toBeDefined();
    expect(health!.status).toBe("healthy");
    expect(typeof health!.latencyMs).toBe("number");
    expect(health!.lastChecked).toBeInstanceOf(Date);
  });

  test("connector with failed API call returns unhealthy", async () => {
    mockFetch.mockRejectedValueOnce(new Error("Connection refused"));

    const health = await registry.checkHealth("realestateapi");
    expect(health).toBeDefined();
    expect(health!.status).toBe("unhealthy");
    expect(health!.error).toContain("Connection refused");
  });

  test("checkHealth returns null for unknown connector", async () => {
    const health = await registry.checkHealth("nonexistent");
    expect(health).toBeNull();
  });

  test("checkAllHealth returns status for all connectors", async () => {
    // REAPI succeeds
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ status: "ok" }),
    });
    // ScrapingDog fails
    mockFetch.mockRejectedValueOnce(new Error("Unauthorized"));

    const results = await registry.checkAllHealth();
    expect(Object.keys(results)).toHaveLength(2);
    expect(results["realestateapi"].status).toBe("healthy");
    expect(results["scrapingdog"].status).toBe("unhealthy");
  });

  test("getHealthSnapshot returns last cached health", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ status: "ok" }),
    });

    await registry.checkHealth("realestateapi");
    const snapshot = registry.getHealthSnapshot("realestateapi");
    expect(snapshot).toBeDefined();
    expect(snapshot!.status).toBe("healthy");
  });

  test("getHealthSnapshot returns null if never checked", () => {
    const testRegistry = new DataSourceRegistry();
    const connector: DataSourceConnector = {
      name: "unchecked",
      description: "never checked",
      endpoints: [],
      cacheTtlSeconds: 0,
      requiredEnvVars: [],
      healthCheck: async () => ({
        status: "healthy" as const,
        latencyMs: 0,
        lastChecked: new Date(),
      }),
    };
    testRegistry.register(connector);
    expect(testRegistry.getHealthSnapshot("unchecked")).toBeNull();
  });
});

// --- SVC-DSR-04: Connector status with env var check ---

describe("SVC-DSR-04: Environment variable checks", () => {
  test("envVarsPresent returns true when all vars are set", () => {
    const present = registry.envVarsPresent("realestateapi");
    expect(present).toBe(true);
  });

  test("envVarsPresent returns false for connector with missing vars", () => {
    const testRegistry = new DataSourceRegistry();
    testRegistry.register({
      name: "needs-key",
      description: "test",
      endpoints: [],
      cacheTtlSeconds: 0,
      requiredEnvVars: ["NONEXISTENT_VAR_12345"],
      healthCheck: async () => ({
        status: "healthy" as const,
        latencyMs: 0,
        lastChecked: new Date(),
      }),
    });
    expect(testRegistry.envVarsPresent("needs-key")).toBe(false);
  });
});

// --- SVC-DSR-05: Serialization for API response ---

describe("SVC-DSR-05: Serialization", () => {
  test("toJSON returns serializable snapshot", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ status: "ok" }),
    });
    mockFetch.mockRejectedValueOnce(new Error("fail"));

    await registry.checkAllHealth();

    const json = registry.toJSON();
    expect(Array.isArray(json)).toBe(true);
    expect(json.length).toBe(2);

    const reapi = json.find((s) => s.name === "realestateapi");
    expect(reapi).toBeDefined();
    expect(reapi!.description).toBeTruthy();
    expect(reapi!.endpoints).toBeDefined();
    expect(reapi!.cacheTtlSeconds).toBeDefined();
    expect(reapi!.health).toBeDefined();
    expect(reapi!.health!.status).toBe("healthy");
    expect(reapi!.envVarsPresent).toBe(true);
  });
});
