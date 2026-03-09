/**
 * Pipeline Generation API Route Tests
 *
 * Tests POST /api/reports/[id]/generate and GET /api/reports/[id]/progress
 * ID: API-PIPE-001 through API-PIPE-008
 */

// --- Polyfills for edge runtime ---

if (typeof globalThis.Request === "undefined") {
  globalThis.Request = class Request {
    url: string;
    method: string;
    constructor(url: string, init?: any) {
      this.url = url;
      this.method = init?.method ?? "GET";
    }
    json() { return Promise.resolve({}); }
  } as any;
}

if (typeof globalThis.Response === "undefined") {
  globalThis.Response = class Response {
    body: any;
    status: number;
    headers: Map<string, string>;
    constructor(body?: any, init?: any) {
      this.body = body;
      this.status = init?.status ?? 200;
      this.headers = new Map(Object.entries(init?.headers ?? {}));
    }
    async json() { return JSON.parse(this.body); }
  } as any;
}

// --- Mocks ---

jest.mock("next/server", () => ({
  NextResponse: {
    json: (body: unknown, init?: { status?: number; headers?: Record<string, string> }) =>
      new Response(JSON.stringify(body), {
        status: init?.status ?? 200,
        headers: { "content-type": "application/json", ...(init?.headers ?? {}) },
      }),
  },
}));

const mockGetAuthUserId = jest.fn();
const mockGetReport = jest.fn();
const mockExecutePipeline = jest.fn();
const mockGetExecutionProgress = jest.fn();

jest.mock("@/lib/supabase/auth", () => ({
  getAuthUserId: () => mockGetAuthUserId(),
}));

jest.mock("@/lib/services/report", () => ({
  getReport: (...args: unknown[]) => mockGetReport(...args),
}));

jest.mock("@/lib/services/pipeline-executor", () => ({
  executePipeline: (...args: unknown[]) => mockExecutePipeline(...args),
  getExecutionProgress: (...args: unknown[]) => mockGetExecutionProgress(...args),
}));

// --- Imports ---

import { POST } from "@/app/api/reports/[id]/generate/route";
import { GET } from "@/app/api/reports/[id]/progress/route";

// --- Helpers ---

function makeParams(id: string) {
  return { params: Promise.resolve({ id }) };
}

// --- Tests ---

describe("POST /api/reports/[id]/generate", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("API-PIPE-001: returns 401 when not authenticated", async () => {
    mockGetAuthUserId.mockResolvedValue(null);

    const response = await POST(new Request("http://test"), makeParams("report-1"));
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.error).toBe("Unauthorized");
  });

  it("API-PIPE-002: returns 404 when report not found", async () => {
    mockGetAuthUserId.mockResolvedValue("user-1");
    mockGetReport.mockResolvedValue(null);

    const response = await POST(new Request("http://test"), makeParams("report-1"));
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.error).toBe("Report not found");
  });

  it("API-PIPE-003: returns 409 when report is already generating", async () => {
    mockGetAuthUserId.mockResolvedValue("user-1");
    mockGetReport.mockResolvedValue({ id: "report-1", status: "generating" });

    const response = await POST(new Request("http://test"), makeParams("report-1"));
    const body = await response.json();

    expect(response.status).toBe(409);
    expect(body.error).toMatch(/already generating/i);
  });

  it("API-PIPE-004: returns 409 when report is already completed", async () => {
    mockGetAuthUserId.mockResolvedValue("user-1");
    mockGetReport.mockResolvedValue({ id: "report-1", status: "completed" });

    const response = await POST(new Request("http://test"), makeParams("report-1"));
    const body = await response.json();

    expect(response.status).toBe(409);
  });

  it("API-PIPE-005: returns 202 and triggers pipeline for queued report", async () => {
    mockGetAuthUserId.mockResolvedValue("user-1");
    mockGetReport.mockResolvedValue({ id: "report-1", status: "queued" });
    mockExecutePipeline.mockResolvedValue(undefined);

    const response = await POST(new Request("http://test"), makeParams("report-1"));
    const body = await response.json();

    expect(response.status).toBe(202);
    expect(body.status).toBe("generating");
    expect(body.reportId).toBe("report-1");
    expect(mockExecutePipeline).toHaveBeenCalledWith("report-1");
  });

  it("API-PIPE-006: allows retrigger for failed reports", async () => {
    mockGetAuthUserId.mockResolvedValue("user-1");
    mockGetReport.mockResolvedValue({ id: "report-1", status: "failed" });
    mockExecutePipeline.mockResolvedValue(undefined);

    const response = await POST(new Request("http://test"), makeParams("report-1"));

    expect(response.status).toBe(202);
    expect(mockExecutePipeline).toHaveBeenCalledWith("report-1");
  });
});

describe("GET /api/reports/[id]/progress", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("API-PIPE-007: returns 401 when not authenticated", async () => {
    mockGetAuthUserId.mockResolvedValue(null);

    const response = await GET(new Request("http://test"), makeParams("report-1"));

    expect(response.status).toBe(401);
  });

  it("API-PIPE-008: returns pipeline progress for valid report", async () => {
    mockGetAuthUserId.mockResolvedValue("user-1");
    mockGetReport.mockResolvedValue({ id: "report-1", status: "generating" });
    mockGetExecutionProgress.mockReturnValue({
      reportId: "report-1",
      status: "running",
      totalAgents: 5,
      completedAgents: 2,
      currentAgents: ["competitive-analyst"],
      percentComplete: 40,
      events: [],
    });

    const response = await GET(new Request("http://test"), makeParams("report-1"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.pipeline.status).toBe("running");
    expect(body.pipeline.percentComplete).toBe(40);
    expect(body.pipeline.completedAgents).toBe(2);
    expect(body.reportStatus).toBe("generating");
  });
});
