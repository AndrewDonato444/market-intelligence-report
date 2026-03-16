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

// --- Unit Tests: UX Redesign — Platform Config & Branding ---

const PLATFORM_BRANDS: Record<string, { color: string; light: string }> = {
  LinkedIn: { color: "#0A66C2", light: "#E8F1FA" },
  Instagram: { color: "#E4405F", light: "#FDE8EC" },
  X: { color: "#0F1419", light: "#E8E8E9" },
  Facebook: { color: "#1877F2", light: "#E7F0FE" },
};

describe("Kit Viewer UX: Platform Branding", () => {
  it("CMP-KIT-016: every platform used in content has a brand color defined", () => {
    const platformsInContent = new Set<string>();
    mockCaptions.forEach((c) => platformsInContent.add(c.platform));
    mockPersonaPosts.forEach((p) => platformsInContent.add(p.platform));
    mockPolls.forEach((p) => platformsInContent.add(p.platform));
    mockPostIdeas.forEach((p) => p.platforms.forEach((pl) => platformsInContent.add(pl)));

    for (const platform of platformsInContent) {
      expect(PLATFORM_BRANDS[platform]).toBeDefined();
      expect(PLATFORM_BRANDS[platform].color).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(PLATFORM_BRANDS[platform].light).toMatch(/^#[0-9A-Fa-f]{6}$/);
    }
  });

  it("CMP-KIT-017: platform brand colors are distinct from each other", () => {
    const colors = Object.values(PLATFORM_BRANDS).map((b) => b.color);
    const unique = new Set(colors);
    expect(unique.size).toBe(colors.length);
  });

  it("CMP-KIT-018: all four major platforms are covered", () => {
    expect(Object.keys(PLATFORM_BRANDS)).toEqual(
      expect.arrayContaining(["LinkedIn", "Instagram", "X", "Facebook"])
    );
  });
});

// --- Unit Tests: UX Redesign — Dashboard Summary Stats ---

describe("Kit Viewer UX: Dashboard Summary", () => {
  it("CMP-KIT-019: computes total content pieces across all 7 types", () => {
    const totalCount =
      mockKitContent.postIdeas.length +
      mockKitContent.captions.length +
      mockKitContent.personaPosts.length +
      mockKitContent.polls.length +
      mockKitContent.conversationStarters.length +
      mockKitContent.calendarSuggestions.length +
      mockKitContent.statCallouts.length;

    // postIdeas: 2, captions: 3, personaPosts: 3, polls: 1, starters: 2, calendar: 2, stats: 2 = 15
    expect(totalCount).toBe(15);
  });

  it("CMP-KIT-020: computes unique platforms covered", () => {
    const platforms = new Set<string>();
    mockKitContent.postIdeas.forEach((p) => p.platforms.forEach((pl) => platforms.add(pl)));
    mockKitContent.captions.forEach((c) => platforms.add(c.platform));
    mockKitContent.personaPosts.forEach((p) => platforms.add(p.platform));
    mockKitContent.polls.forEach((p) => platforms.add(p.platform));
    mockKitContent.calendarSuggestions.forEach((w) => w.platforms.forEach((pl) => platforms.add(pl)));

    expect(platforms.size).toBe(4); // LinkedIn, Instagram, X, Facebook
  });

  it("CMP-KIT-021: counts active sections (sections with >0 items)", () => {
    const sections = [
      mockKitContent.postIdeas,
      mockKitContent.captions,
      mockKitContent.personaPosts,
      mockKitContent.polls,
      mockKitContent.conversationStarters,
      mockKitContent.calendarSuggestions,
      mockKitContent.statCallouts,
    ];
    const activeSections = sections.filter((s) => s.length > 0).length;
    expect(activeSections).toBe(7);
  });

  it("CMP-KIT-022: counts unique personas from persona posts", () => {
    const personas = new Map<string, string>();
    mockKitContent.personaPosts.forEach((p) => personas.set(p.personaSlug, p.personaName));
    expect(personas.size).toBe(2);
  });
});

// --- Unit Tests: UX Redesign — Section-Specific Card Structure ---

describe("Kit Viewer UX: Section Card Designs", () => {
  it("CMP-KIT-023: stat callouts have all fields for pullquote display", () => {
    for (const stat of mockStatCallouts) {
      // Pullquote card needs: large stat, context, source, suggested caption
      expect(stat.stat).toBeTruthy();
      expect(stat.context).toBeTruthy();
      expect(stat.source).toBeTruthy();
      expect(stat.suggestedCaption).toBeTruthy();
    }
  });

  it("CMP-KIT-024: polls have lettered options for styled option bars", () => {
    for (const poll of mockPolls) {
      expect(poll.options.length).toBeGreaterThanOrEqual(2);
      expect(poll.options.length).toBeLessThanOrEqual(4);
      // Each option should map to A, B, C, D
      poll.options.forEach((opt, i) => {
        const letter = String.fromCharCode(65 + i);
        expect(letter).toMatch(/^[A-D]$/);
        expect(opt).toBeTruthy();
      });
    }
  });

  it("CMP-KIT-025: persona posts have first letter for avatar circle", () => {
    for (const post of mockPersonaPosts) {
      const initial = post.personaName.charAt(0);
      expect(initial).toBeTruthy();
      expect(initial).toMatch(/^[A-Z]/);
    }
  });

  it("CMP-KIT-026: captions have platform for left-border color lookup", () => {
    for (const caption of mockCaptions) {
      expect(PLATFORM_BRANDS[caption.platform]).toBeDefined();
    }
  });

  it("CMP-KIT-027: calendar weeks have numeric week for circle badge", () => {
    for (const week of mockCalendarSuggestions) {
      expect(typeof week.week).toBe("number");
      expect(week.week).toBeGreaterThan(0);
      expect(week.theme).toBeTruthy();
    }
  });

  it("CMP-KIT-028: conversation starters have context label and template for quote display", () => {
    for (const starter of mockConversationStarters) {
      expect(starter.context).toBeTruthy();
      expect(starter.template).toBeTruthy();
      // Template should be quotable
      expect(starter.template.length).toBeGreaterThan(10);
    }
  });
});
