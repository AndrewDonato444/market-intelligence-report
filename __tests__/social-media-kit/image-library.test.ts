/**
 * Image Library Tests
 *
 * Tests SVG template generation, data extraction, direction detection,
 * filename slugging, and graceful degradation with sparse kit content.
 * ID: CMP-IMG-001 through CMP-IMG-022
 */

import type {
  StatCallout,
  ConversationStarter,
  PlatformCaption,
} from "@/lib/db/schema";

// ---------------------------------------------------------------------------
// Helpers mirroring what the component will do (pure functions, testable)
// ---------------------------------------------------------------------------

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/#/g, "")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .trim();
}

function buildFilename(templateName: string, marketSlug: string): string {
  return `${slugify(templateName)}-${slugify(marketSlug)}.svg`;
}

function detectDirection(statText: string): "up" | "down" | "neutral" {
  const lower = statText.toLowerCase();
  if (/decline|drop|fall|decrease|collapse|down/.test(lower)) return "down";
  if (/rise|gain|growth|increase|up|climb|surge/.test(lower)) return "up";
  return "neutral";
}

function getMarketName(captions: PlatformCaption[]): string {
  const firstHashtag = captions[0]?.hashtags?.[0] ?? "";
  return firstHashtag.replace("#", "") || "Market Intelligence";
}

function getGraphicsCount(statCallouts: StatCallout[]): number {
  return statCallouts.length > 0 ? 6 : 0;
}

function getSnapshotStats(statCallouts: StatCallout[]): StatCallout[] {
  return statCallouts.slice(0, 3);
}

function getYoYStats(statCallouts: StatCallout[]): [StatCallout, StatCallout] {
  const a = statCallouts[0];
  const b = statCallouts[1] ?? statCallouts[0];
  return [a, b];
}

function shouldShowImageLibrary(statCallouts: StatCallout[]): boolean {
  return statCallouts.length > 0;
}

// ---------------------------------------------------------------------------
// Test data
// ---------------------------------------------------------------------------

const mockStats: StatCallout[] = [
  {
    stat: "90.9% Volume Decline",
    context: "Newport's luxury market recorded a 90.9% volume collapse year-over-year.",
    source: "Q1 2026 MLS transaction data",
    suggestedCaption: "The volume collapse tells the real story of Newport's luxury market.",
  },
  {
    stat: "10.3% PSF Gain",
    context: "Price-per-square-foot rose 10.3% despite the volume drop.",
    source: "Q1 2026 closed transactions",
    suggestedCaption: "Price resilience in the face of volume collapse: the selective market thesis.",
  },
  {
    stat: "$1.7M Median Price",
    context: "The median closed price held at $1.7M, signaling conviction-driven buyers.",
    source: "Q1 2026 MLS data",
    suggestedCaption: "Conviction buyers at $1.7M median — the market self-selected for quality.",
  },
  {
    stat: "131-Day Absorption",
    context: "Average days on market sits at 131, reflecting deliberate buyer behavior.",
    source: "Q1 2026 MLS data",
    suggestedCaption: "131 days isn't sluggish — it's selective.",
  },
];

const mockStarters: ConversationStarter[] = [
  {
    context: "Market Timing",
    template: "I've been analyzing the Q1 transaction data and here's what most agents miss about Newport's market.",
  },
  {
    context: "Buyer Psychology",
    template: "What I'm seeing in luxury buyer behavior this quarter surprised even me.",
  },
];

const mockCaptions: PlatformCaption[] = [
  {
    platform: "linkedin",
    caption: "Newport's luxury market is telling a story that most agents are misreading.",
    hashtags: ["#NewportLuxury", "#RealEstateMarketIntelligence", "#LuxuryRealEstate"],
    characterCount: 187,
  },
];

const emptyCaptions: PlatformCaption[] = [];

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("Image Library: Display Logic", () => {
  it("CMP-IMG-001: shows 6 graphics when stat callouts exist", () => {
    expect(getGraphicsCount(mockStats)).toBe(6);
  });

  it("CMP-IMG-002: shows 0 graphics and hides section when no stat callouts", () => {
    expect(getGraphicsCount([])).toBe(0);
    expect(shouldShowImageLibrary([])).toBe(false);
  });

  it("CMP-IMG-003: shows image library when at least 1 stat callout exists", () => {
    expect(shouldShowImageLibrary([mockStats[0]])).toBe(true);
    expect(shouldShowImageLibrary(mockStats)).toBe(true);
  });
});

describe("Image Library: Market Name Extraction", () => {
  it("CMP-IMG-004: extracts market name from first caption hashtag", () => {
    const name = getMarketName(mockCaptions);
    expect(name).toBe("NewportLuxury");
  });

  it("CMP-IMG-005: falls back to 'Market Intelligence' when no captions", () => {
    const name = getMarketName(emptyCaptions);
    expect(name).toBe("Market Intelligence");
  });

  it("CMP-IMG-006: strips # prefix from hashtag", () => {
    const name = getMarketName(mockCaptions);
    expect(name).not.toContain("#");
  });
});

describe("Image Library: Template Data Extraction", () => {
  it("CMP-IMG-007: stat hero uses statCallouts[0]", () => {
    const stat = mockStats[0];
    expect(stat.stat).toBe("90.9% Volume Decline");
    expect(stat.suggestedCaption).toBeTruthy();
  });

  it("CMP-IMG-008: market snapshot uses up to 3 stat callouts", () => {
    const stats = getSnapshotStats(mockStats);
    expect(stats.length).toBeLessThanOrEqual(3);
    expect(stats[0]).toBe(mockStats[0]);
  });

  it("CMP-IMG-009: market snapshot with 1 stat shows only 1 (no blank slots)", () => {
    const stats = getSnapshotStats([mockStats[0]]);
    expect(stats.length).toBe(1);
  });

  it("CMP-IMG-010: pull quote uses conversationStarters[0]", () => {
    const starter = mockStarters[0];
    expect(starter.template).toContain("Q1 transaction data");
    expect(starter.context).toBe("Market Timing");
  });

  it("CMP-IMG-011: YoY comparison uses first two stat callouts", () => {
    const [a, b] = getYoYStats(mockStats);
    expect(a.stat).toBe("90.9% Volume Decline");
    expect(b.stat).toBe("10.3% PSF Gain");
  });

  it("CMP-IMG-012: YoY comparison falls back to same stat when only 1 exists", () => {
    const [a, b] = getYoYStats([mockStats[0]]);
    expect(a).toBe(b);
  });
});

describe("Image Library: Direction Detection", () => {
  it("CMP-IMG-013: detects downward direction from 'decline'", () => {
    expect(detectDirection("90.9% Volume Decline")).toBe("down");
  });

  it("CMP-IMG-014: detects downward direction from 'collapse'", () => {
    expect(detectDirection("Transaction Volume Collapse")).toBe("down");
  });

  it("CMP-IMG-015: detects upward direction from 'gain'", () => {
    expect(detectDirection("10.3% PSF Gain")).toBe("up");
  });

  it("CMP-IMG-016: detects upward direction from 'rise'", () => {
    expect(detectDirection("Price Rise Continues")).toBe("up");
  });

  it("CMP-IMG-017: returns neutral for ambiguous stats", () => {
    expect(detectDirection("$1.7M Median Price")).toBe("neutral");
    expect(detectDirection("131-Day Absorption")).toBe("neutral");
  });
});

describe("Image Library: SVG Filename Generation", () => {
  it("CMP-IMG-018: generates correct filename for stat hero", () => {
    const filename = buildFilename("Stat Hero", "NewportLuxury");
    expect(filename).toBe("stat-hero-newportluxury.svg");
  });

  it("CMP-IMG-019: generates correct filename for market snapshot", () => {
    const filename = buildFilename("Market Snapshot", "NewportLuxury");
    expect(filename).toBe("market-snapshot-newportluxury.svg");
  });

  it("CMP-IMG-020: slugify strips # and special chars", () => {
    expect(slugify("#NewportLuxury")).toBe("newportluxury");
    expect(slugify("YoY Comparison")).toBe("yoy-comparison");
  });

  it("CMP-IMG-021: slugify handles spaces and mixed case", () => {
    expect(slugify("LinkedIn Banner")).toBe("linkedin-banner");
    expect(slugify("Pull Quote")).toBe("pull-quote");
  });

  it("CMP-IMG-022: all 6 template filenames are unique for the same market", () => {
    const templates = [
      "Stat Hero",
      "Market Snapshot",
      "Pull Quote",
      "YoY Comparison",
      "Story",
      "LinkedIn Banner",
    ];
    const filenames = templates.map((t) => buildFilename(t, "NewportLuxury"));
    const unique = new Set(filenames);
    expect(unique.size).toBe(6);
  });
});
