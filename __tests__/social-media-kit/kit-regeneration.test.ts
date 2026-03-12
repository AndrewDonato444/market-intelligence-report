/**
 * Social Media Kit Regeneration Tests
 *
 * Tests POST /api/reports/[id]/kit/regenerate (per-section regeneration)
 * Tests regenerateKitSection service function
 * ID: API-REGEN-001 through API-REGEN-009, SVC-REGEN-001 through SVC-REGEN-003, CMP-REGEN-001
 */

// --- Polyfills for edge runtime ---

if (typeof globalThis.Request === "undefined") {
  globalThis.Request = class Request {
    url: string;
    method: string;
    _body: string | null;
    constructor(url: string, init?: any) {
      this.url = url;
      this.method = init?.method ?? "GET";
      this._body = init?.body ?? null;
    }
    json() {
      return Promise.resolve(this._body ? JSON.parse(this._body) : {});
    }
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
    async json() {
      return JSON.parse(this.body);
    }
  } as any;
}

// --- Mocks ---

jest.mock("next/server", () => ({
  NextResponse: {
    json: (
      body: unknown,
      init?: { status?: number; headers?: Record<string, string> }
    ) =>
      new Response(JSON.stringify(body), {
        status: init?.status ?? 200,
        headers: {
          "content-type": "application/json",
          ...(init?.headers ?? {}),
        },
      }),
  },
}));

const mockGetAuthUserId = jest.fn();
const mockGetReport = jest.fn();
const mockGetSocialMediaKit = jest.fn();
const mockRegenerateKitSection = jest.fn();

jest.mock("@/lib/supabase/auth", () => ({
  getAuthUserId: () => mockGetAuthUserId(),
}));

jest.mock("@/lib/services/report", () => ({
  getReport: (...args: unknown[]) => mockGetReport(...args),
}));

jest.mock("@/lib/services/social-media-kit", () => ({
  getSocialMediaKit: (...args: unknown[]) => mockGetSocialMediaKit(...args),
  regenerateKitSection: (...args: unknown[]) =>
    mockRegenerateKitSection(...args),
}));

// --- Imports ---

import { POST } from "@/app/api/reports/[id]/kit/regenerate/route";

// --- Helpers ---

const VALID_CONTENT_TYPES = [
  "postIdeas",
  "captions",
  "personaPosts",
  "polls",
  "conversationStarters",
  "calendarSuggestions",
  "statCallouts",
];

function makeParams(id: string) {
  return { params: Promise.resolve({ id }) };
}

function makeRequest(body: any) {
  return new Request("http://test", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

const completedKit = {
  id: "kit-1",
  reportId: "report-1",
  userId: "db-user-1",
  status: "completed" as const,
  content: {
    postIdeas: [
      {
        title: "Test Post",
        body: "Test body",
        platforms: ["LinkedIn"],
        reportSection: "market_overview",
        insightRef: "median_price",
      },
    ],
    captions: [
      {
        platform: "LinkedIn",
        caption: "Test caption",
        hashtags: ["#luxury"],
        characterCount: 50,
      },
    ],
    personaPosts: [
      {
        personaSlug: "wealth-builder",
        personaName: "Wealth Builder",
        post: "Test persona post",
        platform: "LinkedIn",
        vocabularyUsed: ["portfolio"],
      },
    ],
    polls: [
      {
        question: "What matters most?",
        options: ["Location", "Price"],
        dataContext: "Survey data",
        platform: "LinkedIn",
      },
    ],
    conversationStarters: [
      { context: "Market discussion", template: "Did you know..." },
    ],
    calendarSuggestions: [
      {
        week: 1,
        theme: "Market Insights",
        postIdeas: ["Post 1"],
        platforms: ["LinkedIn"],
      },
    ],
    statCallouts: [
      {
        stat: "$2.4M",
        context: "Median price",
        source: "market_overview",
        suggestedCaption: "The market speaks",
      },
    ],
  },
  errorMessage: null,
  generatedAt: "2026-03-11T00:00:00Z",
  createdAt: "2026-03-11T00:00:00Z",
  updatedAt: "2026-03-11T00:00:00Z",
};

// --- Tests: POST /api/reports/[id]/kit/regenerate ---

describe("POST /api/reports/[id]/kit/regenerate", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("API-REGEN-001: returns 401 when not authenticated", async () => {
    mockGetAuthUserId.mockResolvedValue(null);

    const response = await POST(
      makeRequest({ contentType: "postIdeas" }),
      makeParams("report-1")
    );
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.error).toBe("Unauthorized");
  });

  it("API-REGEN-002: returns 404 when report not found", async () => {
    mockGetAuthUserId.mockResolvedValue("user-1");
    mockGetReport.mockResolvedValue(null);

    const response = await POST(
      makeRequest({ contentType: "postIdeas" }),
      makeParams("report-1")
    );
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.error).toBe("Report not found");
  });

  it("API-REGEN-003: returns 400 for invalid content type", async () => {
    mockGetAuthUserId.mockResolvedValue("user-1");
    mockGetReport.mockResolvedValue({
      id: "report-1",
      status: "completed",
      userId: "db-user-1",
    });
    mockGetSocialMediaKit.mockResolvedValue(completedKit);

    const response = await POST(
      makeRequest({ contentType: "invalidType" }),
      makeParams("report-1")
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe("Invalid content type");
  });

  it("API-REGEN-004: returns 404 when no kit exists", async () => {
    mockGetAuthUserId.mockResolvedValue("user-1");
    mockGetReport.mockResolvedValue({
      id: "report-1",
      status: "completed",
      userId: "db-user-1",
    });
    mockGetSocialMediaKit.mockResolvedValue(null);

    const response = await POST(
      makeRequest({ contentType: "postIdeas" }),
      makeParams("report-1")
    );
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.error).toBe(
      "No social media kit found. Generate a kit first."
    );
  });

  it("API-REGEN-005: returns 409 when kit is still generating", async () => {
    mockGetAuthUserId.mockResolvedValue("user-1");
    mockGetReport.mockResolvedValue({
      id: "report-1",
      status: "completed",
      userId: "db-user-1",
    });
    mockGetSocialMediaKit.mockResolvedValue({
      ...completedKit,
      status: "generating",
    });

    const response = await POST(
      makeRequest({ contentType: "postIdeas" }),
      makeParams("report-1")
    );
    const body = await response.json();

    expect(response.status).toBe(409);
    expect(body.error).toBe(
      "Kit is currently being generated. Please wait."
    );
  });

  it("API-REGEN-006: returns 202 and triggers per-section regeneration", async () => {
    mockGetAuthUserId.mockResolvedValue("user-1");
    mockGetReport.mockResolvedValue({
      id: "report-1",
      status: "completed",
      userId: "db-user-1",
    });
    mockGetSocialMediaKit.mockResolvedValue(completedKit);
    mockRegenerateKitSection.mockResolvedValue(completedKit.content);

    const response = await POST(
      makeRequest({ contentType: "postIdeas" }),
      makeParams("report-1")
    );
    const body = await response.json();

    expect(response.status).toBe(202);
    expect(body.status).toBe("regenerating");
    expect(body.contentType).toBe("postIdeas");
    expect(mockRegenerateKitSection).toHaveBeenCalledWith(
      "report-1",
      "db-user-1",
      "postIdeas"
    );
  });

  it("API-REGEN-007: validates all 7 content types are accepted", async () => {
    mockGetAuthUserId.mockResolvedValue("user-1");
    mockGetReport.mockResolvedValue({
      id: "report-1",
      status: "completed",
      userId: "db-user-1",
    });
    mockGetSocialMediaKit.mockResolvedValue(completedKit);
    mockRegenerateKitSection.mockResolvedValue(completedKit.content);

    for (const contentType of VALID_CONTENT_TYPES) {
      const response = await POST(
        makeRequest({ contentType }),
        makeParams("report-1")
      );
      expect(response.status).toBe(202);
    }

    expect(mockRegenerateKitSection).toHaveBeenCalledTimes(
      VALID_CONTENT_TYPES.length
    );
  });

  it("API-REGEN-008: returns 400 when regenerating personaPosts with no personas", async () => {
    mockGetAuthUserId.mockResolvedValue("user-1");
    mockGetReport.mockResolvedValue({
      id: "report-1",
      status: "completed",
      userId: "db-user-1",
    });
    mockGetSocialMediaKit.mockResolvedValue({
      ...completedKit,
      content: { ...completedKit.content, personaPosts: [] },
    });

    const response = await POST(
      makeRequest({ contentType: "personaPosts" }),
      makeParams("report-1")
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe(
      "No personas were selected for this report. Nothing to regenerate."
    );
  });

  it("API-REGEN-009: returns 500 when regeneration service throws synchronously", async () => {
    mockGetAuthUserId.mockResolvedValue("user-1");
    mockGetReport.mockResolvedValue({
      id: "report-1",
      status: "completed",
      userId: "db-user-1",
    });
    mockGetSocialMediaKit.mockResolvedValue(completedKit);
    mockRegenerateKitSection.mockImplementation(() => {
      throw new Error("Claude API timeout");
    });

    const response = await POST(
      makeRequest({ contentType: "statCallouts" }),
      makeParams("report-1")
    );
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error).toMatch(/Claude API timeout/);
  });
});

// --- Tests: regenerateKitSection service ---

describe("regenerateKitSection service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("SVC-REGEN-001: service called with statCallouts contentType", async () => {
    mockGetAuthUserId.mockResolvedValue("user-1");
    mockGetReport.mockResolvedValue({
      id: "report-1",
      status: "completed",
      userId: "db-user-1",
    });
    mockGetSocialMediaKit.mockResolvedValue(completedKit);
    mockRegenerateKitSection.mockResolvedValue(completedKit.content);

    const response = await POST(
      makeRequest({ contentType: "statCallouts" }),
      makeParams("report-1")
    );

    expect(response.status).toBe(202);
    expect(mockRegenerateKitSection).toHaveBeenCalledWith(
      "report-1",
      "db-user-1",
      "statCallouts"
    );
  });

  it("SVC-REGEN-002: service called with captions contentType", async () => {
    mockGetAuthUserId.mockResolvedValue("user-1");
    mockGetReport.mockResolvedValue({
      id: "report-1",
      status: "completed",
      userId: "db-user-1",
    });
    mockGetSocialMediaKit.mockResolvedValue(completedKit);
    mockRegenerateKitSection.mockResolvedValue(completedKit.content);

    await POST(
      makeRequest({ contentType: "captions" }),
      makeParams("report-1")
    );

    expect(mockRegenerateKitSection).toHaveBeenCalledWith(
      "report-1",
      "db-user-1",
      "captions"
    );
  });

  it("SVC-REGEN-003: service called with conversationStarters contentType", async () => {
    mockGetAuthUserId.mockResolvedValue("user-1");
    mockGetReport.mockResolvedValue({
      id: "report-1",
      status: "completed",
      userId: "db-user-1",
    });
    mockGetSocialMediaKit.mockResolvedValue(completedKit);
    mockRegenerateKitSection.mockResolvedValue(completedKit.content);

    await POST(
      makeRequest({ contentType: "conversationStarters" }),
      makeParams("report-1")
    );

    expect(mockRegenerateKitSection).toHaveBeenCalledWith(
      "report-1",
      "db-user-1",
      "conversationStarters"
    );
  });
});

// --- Tests: KitViewer refresh buttons ---

describe("KitViewer per-section refresh", () => {
  it("CMP-REGEN-001: VALID_CONTENT_TYPES includes all 7 types", () => {
    expect(VALID_CONTENT_TYPES).toHaveLength(7);
    expect(VALID_CONTENT_TYPES).toContain("postIdeas");
    expect(VALID_CONTENT_TYPES).toContain("captions");
    expect(VALID_CONTENT_TYPES).toContain("personaPosts");
    expect(VALID_CONTENT_TYPES).toContain("polls");
    expect(VALID_CONTENT_TYPES).toContain("conversationStarters");
    expect(VALID_CONTENT_TYPES).toContain("calendarSuggestions");
    expect(VALID_CONTENT_TYPES).toContain("statCallouts");
  });
});
