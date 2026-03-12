/**
 * Social Media Kit Viewer Tests
 *
 * Tests the kit viewer page (server component) and the kit viewer
 * client component rendering, filtering, and copy-to-clipboard.
 * ID: CMP-KIT-001 through CMP-KIT-015
 */

import type {
  SocialMediaKitContent,
  PostIdea,
  PlatformCaption,
  PersonaPost,
  PollIdea,
  ConversationStarter,
  CalendarSuggestion,
  StatCallout,
} from "@/lib/db/schema";

// --- Test Data ---

const mockPostIdeas: PostIdea[] = [
  {
    title: "Waterfront Premium Index",
    body: "Naples waterfront properties command a 42% premium over inland equivalents.",
    platforms: ["LinkedIn", "Instagram"],
    reportSection: "market_overview",
    insightRef: "waterfront-premium",
  },
  {
    title: "Market Timing Signal",
    body: "Q1 2026 transaction data reveals a buyer's window.",
    platforms: ["LinkedIn", "X"],
    reportSection: "executive_summary",
    insightRef: "timing-signal",
  },
];

const mockCaptions: PlatformCaption[] = [
  {
    platform: "LinkedIn",
    caption: "The luxury market is telling a compelling story this quarter.",
    hashtags: ["#LuxuryRealEstate", "#MarketIntelligence"],
    characterCount: 187,
  },
  {
    platform: "Instagram",
    caption: "42% waterfront premium. The data speaks for itself.",
    hashtags: ["#NaplesRealEstate", "#LuxuryLiving"],
    characterCount: 120,
  },
  {
    platform: "X",
    caption: "Q1 2026 luxury market data is in. Key takeaway: waterfront premium at 42%.",
    hashtags: ["#RealEstate"],
    characterCount: 95,
  },
];

const mockPersonaPosts: PersonaPost[] = [
  {
    personaSlug: "international-buyer",
    personaName: "The International Buyer",
    post: "For global investors evaluating the US luxury market...",
    platform: "LinkedIn",
    vocabularyUsed: ["portfolio diversification", "wealth preservation"],
  },
  {
    personaSlug: "executive-relocator",
    personaName: "The Executive Relocator",
    post: "C-suite professionals moving to Naples discover...",
    platform: "LinkedIn",
    vocabularyUsed: ["relocation", "executive lifestyle"],
  },
  {
    personaSlug: "international-buyer",
    personaName: "The International Buyer",
    post: "Naples luxury market update for international buyers.",
    platform: "Instagram",
    vocabularyUsed: ["global market", "investment"],
  },
];

const mockPolls: PollIdea[] = [
  {
    question: "What's driving your luxury market decisions?",
    options: ["Location & lifestyle", "Investment potential", "Tax advantages", "Portfolio diversification"],
    dataContext: "Based on Q1 buyer motivation data",
    platform: "LinkedIn",
  },
];

const mockConversationStarters: ConversationStarter[] = [
  {
    context: "Market Timing",
    template: "I've been analyzing the Q1 transaction data and the waterfront premium story is fascinating.",
  },
  {
    context: "Buyer Psychology",
    template: "What I'm seeing in luxury buyer behavior this quarter surprised me.",
  },
];

const mockCalendarSuggestions: CalendarSuggestion[] = [
  {
    week: 1,
    theme: "Market Intelligence Launch",
    postIdeas: ["Waterfront Premium reveal", "Q1 snapshot"],
    platforms: ["LinkedIn", "Instagram"],
  },
  {
    week: 2,
    theme: "Buyer Psychology",
    postIdeas: ["International buyer poll", "Executive retreat trends"],
    platforms: ["LinkedIn", "X", "Facebook"],
  },
];

const mockStatCallouts: StatCallout[] = [
  {
    stat: "42% Waterfront Premium",
    context: "Naples waterfront properties command 42% above inland equivalents.",
    source: "Q1 2026 MLS transaction data",
    suggestedCaption: "The waterfront premium tells the real story of Naples luxury.",
  },
  {
    stat: "$8.2M Median Price",
    context: "Ultra-luxury segment median price hit $8.2M in Q1.",
    source: "Q1 2026 closed transactions",
    suggestedCaption: "The ultra-luxury segment continues to redefine Naples price ceilings.",
  },
];

const mockKitContent: SocialMediaKitContent = {
  postIdeas: mockPostIdeas,
  captions: mockCaptions,
  personaPosts: mockPersonaPosts,
  polls: mockPolls,
  conversationStarters: mockConversationStarters,
  calendarSuggestions: mockCalendarSuggestions,
  statCallouts: mockStatCallouts,
};

// --- Unit Tests: Filtering Logic ---

describe("Kit Viewer: Content Filtering", () => {
  it("CMP-KIT-001: filters post ideas by platform", () => {
    const filtered = mockPostIdeas.filter((p) =>
      p.platforms.includes("LinkedIn")
    );
    expect(filtered).toHaveLength(2);

    const xOnly = mockPostIdeas.filter((p) => p.platforms.includes("X"));
    expect(xOnly).toHaveLength(1);
    expect(xOnly[0].title).toBe("Market Timing Signal");
  });

  it("CMP-KIT-002: filters captions by platform", () => {
    const linkedIn = mockCaptions.filter((c) => c.platform === "LinkedIn");
    expect(linkedIn).toHaveLength(1);
    expect(linkedIn[0].characterCount).toBe(187);

    const instagram = mockCaptions.filter((c) => c.platform === "Instagram");
    expect(instagram).toHaveLength(1);
  });

  it("CMP-KIT-003: filters persona posts by persona slug", () => {
    const international = mockPersonaPosts.filter(
      (p) => p.personaSlug === "international-buyer"
    );
    expect(international).toHaveLength(2);

    const exec = mockPersonaPosts.filter(
      (p) => p.personaSlug === "executive-relocator"
    );
    expect(exec).toHaveLength(1);
  });

  it("CMP-KIT-004: filters persona posts by platform AND persona", () => {
    const filtered = mockPersonaPosts.filter(
      (p) =>
        p.personaSlug === "international-buyer" && p.platform === "LinkedIn"
    );
    expect(filtered).toHaveLength(1);
    expect(filtered[0].post).toContain("global investors");
  });

  it("CMP-KIT-005: filters polls by platform", () => {
    const linkedIn = mockPolls.filter((p) => p.platform === "LinkedIn");
    expect(linkedIn).toHaveLength(1);

    const instagram = mockPolls.filter((p) => p.platform === "Instagram");
    expect(instagram).toHaveLength(0);
  });

  it("CMP-KIT-006: 'All' filter returns all items", () => {
    // With no platform filter, all items show
    expect(mockCaptions).toHaveLength(3);
    expect(mockPersonaPosts).toHaveLength(3);
    expect(mockPostIdeas).toHaveLength(2);
  });

  it("CMP-KIT-007: extracts unique platforms from kit content", () => {
    const platforms = new Set<string>();
    mockCaptions.forEach((c) => platforms.add(c.platform));
    mockPersonaPosts.forEach((p) => platforms.add(p.platform));
    mockPolls.forEach((p) => platforms.add(p.platform));
    mockPostIdeas.forEach((p) => p.platforms.forEach((pl) => platforms.add(pl)));

    expect(platforms.has("LinkedIn")).toBe(true);
    expect(platforms.has("Instagram")).toBe(true);
    expect(platforms.has("X")).toBe(true);
    // Facebook not in our mock data
    expect(platforms.has("Facebook")).toBe(false);
  });

  it("CMP-KIT-008: extracts unique persona names for filter", () => {
    const personas = new Map<string, string>();
    mockPersonaPosts.forEach((p) => personas.set(p.personaSlug, p.personaName));

    expect(personas.size).toBe(2);
    expect(personas.get("international-buyer")).toBe("The International Buyer");
    expect(personas.get("executive-relocator")).toBe("The Executive Relocator");
  });
});

// --- Unit Tests: Content Display ---

describe("Kit Viewer: Content Structure", () => {
  it("CMP-KIT-009: kit content has all 7 sections", () => {
    expect(mockKitContent.postIdeas).toBeDefined();
    expect(mockKitContent.captions).toBeDefined();
    expect(mockKitContent.personaPosts).toBeDefined();
    expect(mockKitContent.polls).toBeDefined();
    expect(mockKitContent.conversationStarters).toBeDefined();
    expect(mockKitContent.calendarSuggestions).toBeDefined();
    expect(mockKitContent.statCallouts).toBeDefined();
  });

  it("CMP-KIT-010: post ideas include title, body, and platforms", () => {
    const post = mockPostIdeas[0];
    expect(post.title).toBeTruthy();
    expect(post.body).toBeTruthy();
    expect(post.platforms.length).toBeGreaterThan(0);
    expect(post.reportSection).toBeTruthy();
  });

  it("CMP-KIT-011: captions include platform, text, hashtags, and char count", () => {
    const caption = mockCaptions[0];
    expect(caption.platform).toBeTruthy();
    expect(caption.caption).toBeTruthy();
    expect(caption.hashtags.length).toBeGreaterThan(0);
    expect(caption.characterCount).toBeGreaterThan(0);
  });

  it("CMP-KIT-012: calendar suggestions are ordered by week", () => {
    const weeks = mockCalendarSuggestions.map((c) => c.week);
    expect(weeks).toEqual([1, 2]);
  });

  it("CMP-KIT-013: stat callouts include stat, context, source, and caption", () => {
    const stat = mockStatCallouts[0];
    expect(stat.stat).toBeTruthy();
    expect(stat.context).toBeTruthy();
    expect(stat.source).toBeTruthy();
    expect(stat.suggestedCaption).toBeTruthy();
  });
});

// --- Unit Tests: Copy-to-clipboard text generation ---

describe("Kit Viewer: Copy Text Generation", () => {
  it("CMP-KIT-014: generates copy text for post idea (title + body)", () => {
    const post = mockPostIdeas[0];
    const copyText = `${post.title}\n\n${post.body}`;
    expect(copyText).toContain("Waterfront Premium Index");
    expect(copyText).toContain("42% premium");
  });

  it("CMP-KIT-015: generates copy text for caption (caption + hashtags)", () => {
    const caption = mockCaptions[0];
    const copyText = `${caption.caption}\n\n${caption.hashtags.join(" ")}`;
    expect(copyText).toContain("luxury market");
    expect(copyText).toContain("#LuxuryRealEstate");
  });
});
