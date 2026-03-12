/**
 * Social Media Kit Generation Trigger Tests
 *
 * Tests POST /api/reports/[id]/kit/generate and GET /api/reports/[id]/kit/status
 * ID: API-KIT-001 through API-KIT-012
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
const mockGenerateSocialMediaKit = jest.fn();
const mockGetSocialMediaKit = jest.fn();
const mockDeleteSocialMediaKit = jest.fn();

jest.mock("@/lib/supabase/auth", () => ({
  getAuthUserId: () => mockGetAuthUserId(),
}));

jest.mock("@/lib/services/report", () => ({
  getReport: (...args: unknown[]) => mockGetReport(...args),
}));

jest.mock("@/lib/services/social-media-kit", () => ({
  generateSocialMediaKit: (...args: unknown[]) => mockGenerateSocialMediaKit(...args),
  getSocialMediaKit: (...args: unknown[]) => mockGetSocialMediaKit(...args),
  deleteSocialMediaKit: (...args: unknown[]) => mockDeleteSocialMediaKit(...args),
}));

jest.mock("@/lib/services/entitlement-check", () => ({
  checkEntitlement: jest.fn(async () => ({
    allowed: true,
    limit: -1,
    used: 0,
    remaining: -1,
  })),
}));

jest.mock("@/lib/services/usage-tracking", () => ({
  incrementUsage: jest.fn(async () => {}),
}));

// --- Imports ---

import { POST } from "@/app/api/reports/[id]/kit/generate/route";
import { GET } from "@/app/api/reports/[id]/kit/status/route";

// --- Helpers ---

function makeParams(id: string) {
  return { params: Promise.resolve({ id }) };
}

// --- Tests: POST /api/reports/[id]/kit/generate ---

describe("POST /api/reports/[id]/kit/generate", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("API-KIT-001: returns 401 when not authenticated", async () => {
    mockGetAuthUserId.mockResolvedValue(null);

    const response = await POST(new Request("http://test"), makeParams("report-1"));
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.error).toBe("Unauthorized");
  });

  it("API-KIT-002: returns 404 when report not found", async () => {
    mockGetAuthUserId.mockResolvedValue("user-1");
    mockGetReport.mockResolvedValue(null);

    const response = await POST(new Request("http://test"), makeParams("report-1"));
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.error).toBe("Report not found");
  });

  it("API-KIT-003: returns 409 when report is not completed", async () => {
    mockGetAuthUserId.mockResolvedValue("user-1");
    mockGetReport.mockResolvedValue({ id: "report-1", status: "generating", userId: "db-user-1" });

    const response = await POST(new Request("http://test"), makeParams("report-1"));
    const body = await response.json();

    expect(response.status).toBe(409);
    expect(body.error).toMatch(/not completed/i);
  });

  it("API-KIT-004: returns 409 when kit is already generating", async () => {
    mockGetAuthUserId.mockResolvedValue("user-1");
    mockGetReport.mockResolvedValue({ id: "report-1", status: "completed", userId: "db-user-1" });
    mockGetSocialMediaKit.mockResolvedValue({ id: "kit-1", status: "generating" });

    const response = await POST(new Request("http://test"), makeParams("report-1"));
    const body = await response.json();

    expect(response.status).toBe(409);
    expect(body.error).toMatch(/already being generated/i);
  });

  it("API-KIT-005: returns 202 and triggers generation for completed report with no existing kit", async () => {
    mockGetAuthUserId.mockResolvedValue("user-1");
    mockGetReport.mockResolvedValue({ id: "report-1", status: "completed", userId: "db-user-1" });
    mockGetSocialMediaKit.mockResolvedValue(null);
    mockGenerateSocialMediaKit.mockResolvedValue({ kitId: "kit-1", content: {} });

    const response = await POST(new Request("http://test"), makeParams("report-1"));
    const body = await response.json();

    expect(response.status).toBe(202);
    expect(body.status).toBe("generating");
    expect(body.reportId).toBe("report-1");
    expect(mockGenerateSocialMediaKit).toHaveBeenCalledWith("report-1", "db-user-1");
  });

  it("API-KIT-006: deletes existing completed kit and regenerates", async () => {
    mockGetAuthUserId.mockResolvedValue("user-1");
    mockGetReport.mockResolvedValue({ id: "report-1", status: "completed", userId: "db-user-1" });
    mockGetSocialMediaKit.mockResolvedValue({ id: "kit-1", status: "completed" });
    mockDeleteSocialMediaKit.mockResolvedValue(undefined);
    mockGenerateSocialMediaKit.mockResolvedValue({ kitId: "kit-2", content: {} });

    const response = await POST(new Request("http://test"), makeParams("report-1"));
    const body = await response.json();

    expect(response.status).toBe(202);
    expect(mockDeleteSocialMediaKit).toHaveBeenCalledWith("kit-1");
    expect(mockGenerateSocialMediaKit).toHaveBeenCalledWith("report-1", "db-user-1");
  });

  it("API-KIT-007: deletes existing failed kit and retries", async () => {
    mockGetAuthUserId.mockResolvedValue("user-1");
    mockGetReport.mockResolvedValue({ id: "report-1", status: "completed", userId: "db-user-1" });
    mockGetSocialMediaKit.mockResolvedValue({ id: "kit-1", status: "failed", errorMessage: "timeout" });
    mockDeleteSocialMediaKit.mockResolvedValue(undefined);
    mockGenerateSocialMediaKit.mockResolvedValue({ kitId: "kit-2", content: {} });

    const response = await POST(new Request("http://test"), makeParams("report-1"));

    expect(response.status).toBe(202);
    expect(mockDeleteSocialMediaKit).toHaveBeenCalledWith("kit-1");
    expect(mockGenerateSocialMediaKit).toHaveBeenCalledWith("report-1", "db-user-1");
  });

  it("API-KIT-008: returns 202 even for queued kit (deletes stale queued)", async () => {
    mockGetAuthUserId.mockResolvedValue("user-1");
    mockGetReport.mockResolvedValue({ id: "report-1", status: "completed", userId: "db-user-1" });
    mockGetSocialMediaKit.mockResolvedValue({ id: "kit-1", status: "queued" });
    mockDeleteSocialMediaKit.mockResolvedValue(undefined);
    mockGenerateSocialMediaKit.mockResolvedValue({ kitId: "kit-2", content: {} });

    const response = await POST(new Request("http://test"), makeParams("report-1"));

    expect(response.status).toBe(202);
    expect(mockDeleteSocialMediaKit).toHaveBeenCalledWith("kit-1");
  });
});

// --- Tests: GET /api/reports/[id]/kit/status ---

describe("GET /api/reports/[id]/kit/status", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("API-KIT-009: returns 401 when not authenticated", async () => {
    mockGetAuthUserId.mockResolvedValue(null);

    const response = await GET(new Request("http://test"), makeParams("report-1"));

    expect(response.status).toBe(401);
  });

  it("API-KIT-010: returns 404 when no kit exists", async () => {
    mockGetAuthUserId.mockResolvedValue("user-1");
    mockGetSocialMediaKit.mockResolvedValue(null);

    const response = await GET(new Request("http://test"), makeParams("report-1"));
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.error).toMatch(/not found/i);
  });

  it("API-KIT-011: returns kit status when generating", async () => {
    mockGetAuthUserId.mockResolvedValue("user-1");
    mockGetSocialMediaKit.mockResolvedValue({
      id: "kit-1",
      reportId: "report-1",
      status: "generating",
      content: null,
      errorMessage: null,
    });

    const response = await GET(new Request("http://test"), makeParams("report-1"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.kit.status).toBe("generating");
    expect(body.kit.content).toBeNull();
  });

  it("API-KIT-012: returns kit with content when completed", async () => {
    const mockContent = { postIdeas: [], platformCaptions: [] };
    mockGetAuthUserId.mockResolvedValue("user-1");
    mockGetSocialMediaKit.mockResolvedValue({
      id: "kit-1",
      reportId: "report-1",
      status: "completed",
      content: mockContent,
      errorMessage: null,
      generatedAt: "2026-03-11T00:00:00Z",
    });

    const response = await GET(new Request("http://test"), makeParams("report-1"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.kit.status).toBe("completed");
    expect(body.kit.content).toEqual(mockContent);
  });
});
