/**
 * Social Media Agent Tests
 *
 * Tests for the standalone Social Media Agent that generates
 * social media content kits from finalized reports.
 */

import type { SocialMediaKitContent } from "@/lib/db/schema";

// --- Mocks ---

jest.mock("@anthropic-ai/sdk", () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    messages: { create: jest.fn() },
  })),
}));
jest.mock("@/lib/config/env", () => ({
  env: { ANTHROPIC_API_KEY: "test-key" },
}));

// --- Test Data ---

function buildMockKitContent(options: { withPersonas?: boolean } = {}): SocialMediaKitContent {
  return {
    postIdeas: [
      { title: "Ultra-Luxury Market Surges", body: "Naples ultra-luxury market posts 12.4% YoY growth.", platforms: ["linkedin", "facebook"], reportSection: "executive_summary", insightRef: "yoy_median_price_change" },
      { title: "Estate Segment Leads", body: "With a median of $22M, the estate segment commands attention.", platforms: ["linkedin", "instagram"], reportSection: "market_overview", insightRef: "segment_estate_median" },
      { title: "Cash Is King", body: "87% of ultra-luxury transactions close in cash.", platforms: ["x", "linkedin"], reportSection: "key_drivers", insightRef: "cash_transaction_ratio" },
      { title: "Price Per Square Foot Climbs", body: "At $2,150/sqft with 6% YoY growth, value expansion continues.", platforms: ["linkedin"], reportSection: "market_overview", insightRef: "price_per_sqft" },
      { title: "Market Volume Expands", body: "Transaction volume up 12% signals real demand.", platforms: ["linkedin", "facebook"], reportSection: "trending_insights", insightRef: "volume_change" },
    ],
    captions: [
      { platform: "linkedin", caption: "Our latest Naples Ultra-Luxury report reveals 12.4% YoY growth and $558M volume.", hashtags: ["#LuxuryRealEstate", "#Naples"], characterCount: 198 },
      { platform: "instagram", caption: "Naples ultra-luxury: $22M median estates, 12.4% growth, 87% cash.", hashtags: ["#LuxuryRealEstate", "#Naples", "#UltraLuxury", "#RealEstateData", "#FloridaLuxury", "#NaplesFL", "#LuxuryHomes", "#MarketInsights", "#RealEstateInvesting", "#CoastalLiving"], characterCount: 95 },
      { platform: "x", caption: "Naples ultra-luxury: 12.4% YoY growth, $22M median estates, 87% cash.", hashtags: ["#LuxuryRealEstate"], characterCount: 95 },
      { platform: "facebook", caption: "Just released our Naples Ultra-Luxury report. Estate segment at $22M median, 12.4% YoY growth.", hashtags: ["#LuxuryRealEstate", "#Naples"], characterCount: 221 },
    ],
    personaPosts: options.withPersonas
      ? [
          { personaSlug: "the-business-mogul", personaName: "The Business Mogul", post: "Naples ultra-luxury delivered 12.4% YoY alpha.", platform: "linkedin", vocabularyUsed: ["alpha", "basis", "capital allocation"] },
          { personaSlug: "the-business-mogul", personaName: "The Business Mogul", post: "Total return: $22M median, A+ rating, 87% cash.", platform: "x", vocabularyUsed: ["total return"] },
          { personaSlug: "the-coastal-escape-seeker", personaName: "The Coastal Escape Seeker", post: "Finding your coastal sanctuary: Naples estates offer turnkey luxury.", platform: "instagram", vocabularyUsed: ["sanctuary", "turnkey", "coastal"] },
          { personaSlug: "the-coastal-escape-seeker", personaName: "The Coastal Escape Seeker", post: "The Naples retreat market grew 12.4%. The data confirms the lifestyle.", platform: "facebook", vocabularyUsed: ["retreat", "sanctuary", "waterfront"] },
        ]
      : [],
    polls: [
      { question: "What matters most in ultra-luxury markets?", options: ["Price appreciation", "Volume trends", "Price per sqft", "Cash buyer %"], dataContext: "Naples: 12.4% YoY, 12% volume increase, $2,150/sqft, 87% cash", platform: "linkedin" },
      { question: "Naples estates hit $22M median — new normal?", options: ["Yes", "No", "Depends", "Too early"], dataContext: "Estate segment rated A+ at $22M median", platform: "linkedin" },
      { question: "Ultra-luxury: overheated or undervalued?", options: ["Still undervalued", "Fairly priced"], dataContext: "12.4% YoY growth, high confidence", platform: "x" },
    ],
    conversationStarters: [
      { context: "When asked about market timing in Naples", template: "Our data shows Naples ultra-luxury grew 12.4% YoY with +12% volume expansion." },
      { context: "When discussing estate properties", template: "The estate segment: $22M median with an A+ rating." },
      { context: "When asked about price per square foot", template: "Naples ultra-luxury: $2,150/sqft, up 6% YoY." },
    ],
    calendarSuggestions: [
      { week: 1, theme: "Headline Stats", postIdeas: ["12.4% YoY stat", "$22M estate reveal", "87% cash insight"], platforms: ["linkedin", "x", "instagram"] },
      { week: 2, theme: "Segment Deep Dive", postIdeas: ["Single family vs condo", "Estate spotlight", "Price per sqft"], platforms: ["linkedin", "facebook"] },
      { week: 3, theme: "Buyer Intelligence", postIdeas: ["Cash buyer poll", "Volume story", "Who is buying"], platforms: ["linkedin", "x"] },
      { week: 4, theme: "Strategic Outlook", postIdeas: ["Market timing Q&A", "Forecast highlights", "Report invite"], platforms: ["linkedin", "facebook", "instagram"] },
    ],
    statCallouts: [
      { stat: "12.4%", context: "YoY median price growth", source: "executive_summary", suggestedCaption: "Naples ultra-luxury prices surged 12.4% YoY." },
      { stat: "$22M", context: "Estate segment median price", source: "market_overview", suggestedCaption: "Estate-level Naples: $22M median, A+ rating." },
      { stat: "87%", context: "Cash transaction percentage", source: "key_drivers", suggestedCaption: "87% cash closings in Naples ultra-luxury." },
      { stat: "$2,150/sqft", context: "Median price per sqft, up 6% YoY", source: "market_overview", suggestedCaption: "$2,150/sqft (+6% YoY), value climbs." },
      { stat: "$558M", context: "Total transaction volume", source: "trending_insights", suggestedCaption: "Over half a billion in Naples ultra-luxury." },
    ],
  };
}

const MOCK_REPORT_SECTIONS = [
  { sectionType: "executive_summary", title: "Executive Summary", content: { narrative: "Naples ultra-luxury shows 12.4% YoY growth." } },
  { sectionType: "market_overview", title: "Market Overview", content: { narrative: "45 properties, $8.2M median, $2,150/sqft, estate at $22M." } },
  { sectionType: "key_drivers", title: "Key Drivers", content: { narrative: "Cash transactions at 87%, waterfront demand." } },
  { sectionType: "competitive_analysis", title: "Competitive Analysis", content: { narrative: "Naples outperforms peer markets." } },
  { sectionType: "trending_insights", title: "Trending Insights", content: { narrative: "Volume up 12%, total $558M." } },
  { sectionType: "forecasts", title: "Forecasts", content: { narrative: "Positive outlook." } },
  { sectionType: "methodology", title: "Methodology", content: { narrative: "Data-driven approach, 45 property sample." } },
  { sectionType: "strategic_summary", title: "Strategic Summary", content: { narrative: "Act with conviction." } },
];

const MOCK_COMPUTED_ANALYTICS = {
  market: { totalProperties: 45, medianPrice: 8200000, averagePrice: 12400000, medianPricePerSqft: 2150, totalVolume: 558000000, rating: "A" },
  segments: [
    { name: "single_family", count: 25, medianPrice: 9500000, medianPricePerSqft: 2300, rating: "A" },
    { name: "condo", count: 15, medianPrice: 6200000, medianPricePerSqft: 1850, rating: "B+" },
    { name: "estate", count: 5, medianPrice: 22000000, medianPricePerSqft: 3100, rating: "A+" },
  ],
  yoy: { medianPriceChange: 0.124, volumeChange: 0.12, pricePerSqftChange: 0.06 },
  confidence: { level: "high", sampleSize: 45 },
};

const MOCK_MARKET = {
  name: "Naples",
  geography: { city: "Naples", state: "Florida" },
  luxuryTier: "ultra_luxury",
  priceFloor: 5000000,
  priceCeiling: null,
};

describe("Social Media Agent", () => {
  let mockCreate: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
    const Anthropic = require("@anthropic-ai/sdk").default;
    mockCreate = jest.fn();
    Anthropic.mockImplementation(() => ({ messages: { create: mockCreate } }));
  });

  describe("Scenario: Agent generates a complete kit", () => {
    it("produces SocialMediaKitContent with all 7 content types", async () => {
      const { executeSocialMediaAgent } = await import("@/lib/agents/social-media");
      mockCreate.mockResolvedValue({
        content: [{ type: "text", text: JSON.stringify(buildMockKitContent()) }],
        usage: { input_tokens: 5000, output_tokens: 8000 },
      });
      const result = await executeSocialMediaAgent({ reportSections: MOCK_REPORT_SECTIONS, computedAnalytics: MOCK_COMPUTED_ANALYTICS, market: MOCK_MARKET, personas: [] });
      expect(result.content.postIdeas.length).toBeGreaterThanOrEqual(5);
      expect(result.content.captions.length).toBeGreaterThanOrEqual(4);
      expect(result.content.polls.length).toBeGreaterThanOrEqual(2);
      expect(result.content.conversationStarters.length).toBeGreaterThanOrEqual(3);
      expect(result.content.calendarSuggestions.length).toBeGreaterThanOrEqual(4);
      expect(result.content.statCallouts.length).toBeGreaterThanOrEqual(4);
      expect(result.content.personaPosts).toEqual([]);
    });

    it("every post idea references a report section and insight", async () => {
      const { executeSocialMediaAgent } = await import("@/lib/agents/social-media");
      mockCreate.mockResolvedValue({ content: [{ type: "text", text: JSON.stringify(buildMockKitContent()) }], usage: { input_tokens: 5000, output_tokens: 8000 } });
      const result = await executeSocialMediaAgent({ reportSections: MOCK_REPORT_SECTIONS, computedAnalytics: MOCK_COMPUTED_ANALYTICS, market: MOCK_MARKET, personas: [] });
      for (const idea of result.content.postIdeas) {
        expect(idea.reportSection).toBeTruthy();
        expect(idea.insightRef).toBeTruthy();
        expect(idea.title).toBeTruthy();
        expect(idea.body).toBeTruthy();
        expect(idea.platforms.length).toBeGreaterThan(0);
      }
    });
  });

  describe("Scenario: Platform-specific captions", () => {
    it("generates captions for all 4 platforms", async () => {
      const { executeSocialMediaAgent } = await import("@/lib/agents/social-media");
      mockCreate.mockResolvedValue({ content: [{ type: "text", text: JSON.stringify(buildMockKitContent()) }], usage: { input_tokens: 5000, output_tokens: 8000 } });
      const result = await executeSocialMediaAgent({ reportSections: MOCK_REPORT_SECTIONS, computedAnalytics: MOCK_COMPUTED_ANALYTICS, market: MOCK_MARKET, personas: [] });
      const platforms = result.content.captions.map((c) => c.platform);
      expect(platforms).toContain("linkedin");
      expect(platforms).toContain("instagram");
      expect(platforms).toContain("x");
      expect(platforms).toContain("facebook");
      for (const caption of result.content.captions) {
        expect(caption.caption).toBeTruthy();
        expect(caption.characterCount).toBeGreaterThan(0);
        expect(Array.isArray(caption.hashtags)).toBe(true);
      }
    });
  });

  describe("Scenario: Persona-targeted posts", () => {
    it("generates posts per persona using their vocabulary", async () => {
      const { executeSocialMediaAgent } = await import("@/lib/agents/social-media");
      mockCreate.mockResolvedValue({ content: [{ type: "text", text: JSON.stringify(buildMockKitContent({ withPersonas: true })) }], usage: { input_tokens: 5000, output_tokens: 8000 } });
      const result = await executeSocialMediaAgent({
        reportSections: MOCK_REPORT_SECTIONS, computedAnalytics: MOCK_COMPUTED_ANALYTICS, market: MOCK_MARKET,
        personas: [
          { selectionOrder: 1, persona: { slug: "the-business-mogul", name: "The Business Mogul", narrativeFraming: { keyVocabulary: ["alpha", "basis", "total return"], avoid: ["dream home"] } } },
          { selectionOrder: 2, persona: { slug: "the-coastal-escape-seeker", name: "The Coastal Escape Seeker", narrativeFraming: { keyVocabulary: ["sanctuary", "retreat", "coastal"], avoid: ["cap rate"] } } },
        ],
      });
      expect(result.content.personaPosts.length).toBeGreaterThanOrEqual(2);
      for (const post of result.content.personaPosts) {
        expect(post.personaSlug).toBeTruthy();
        expect(post.personaName).toBeTruthy();
        expect(post.post).toBeTruthy();
        expect(post.platform).toBeTruthy();
        expect(post.vocabularyUsed.length).toBeGreaterThan(0);
      }
      expect(result.content.personaPosts.filter((p) => p.personaSlug === "the-business-mogul").length).toBeGreaterThanOrEqual(2);
      expect(result.content.personaPosts.filter((p) => p.personaSlug === "the-coastal-escape-seeker").length).toBeGreaterThanOrEqual(2);
    });

    it("returns empty personaPosts when no personas", async () => {
      const { executeSocialMediaAgent } = await import("@/lib/agents/social-media");
      mockCreate.mockResolvedValue({ content: [{ type: "text", text: JSON.stringify(buildMockKitContent()) }], usage: { input_tokens: 5000, output_tokens: 8000 } });
      const result = await executeSocialMediaAgent({ reportSections: MOCK_REPORT_SECTIONS, computedAnalytics: MOCK_COMPUTED_ANALYTICS, market: MOCK_MARKET, personas: [] });
      expect(result.content.personaPosts).toEqual([]);
      expect(result.content.postIdeas.length).toBeGreaterThanOrEqual(5);
    });
  });

  describe("Scenario: Polls, starters, calendar, stat callouts", () => {
    it("polls have question, options, dataContext, platform", async () => {
      const { executeSocialMediaAgent } = await import("@/lib/agents/social-media");
      mockCreate.mockResolvedValue({ content: [{ type: "text", text: JSON.stringify(buildMockKitContent()) }], usage: { input_tokens: 5000, output_tokens: 8000 } });
      const result = await executeSocialMediaAgent({ reportSections: MOCK_REPORT_SECTIONS, computedAnalytics: MOCK_COMPUTED_ANALYTICS, market: MOCK_MARKET, personas: [] });
      for (const poll of result.content.polls) {
        expect(poll.question).toBeTruthy();
        expect(poll.options.length).toBeGreaterThanOrEqual(2);
        expect(poll.dataContext).toBeTruthy();
        expect(poll.platform).toBeTruthy();
      }
    });

    it("conversation starters have context and template", async () => {
      const { executeSocialMediaAgent } = await import("@/lib/agents/social-media");
      mockCreate.mockResolvedValue({ content: [{ type: "text", text: JSON.stringify(buildMockKitContent()) }], usage: { input_tokens: 5000, output_tokens: 8000 } });
      const result = await executeSocialMediaAgent({ reportSections: MOCK_REPORT_SECTIONS, computedAnalytics: MOCK_COMPUTED_ANALYTICS, market: MOCK_MARKET, personas: [] });
      expect(result.content.conversationStarters.length).toBeGreaterThanOrEqual(3);
      for (const s of result.content.conversationStarters) { expect(s.context).toBeTruthy(); expect(s.template).toBeTruthy(); }
    });

    it("calendar spans 4 weeks", async () => {
      const { executeSocialMediaAgent } = await import("@/lib/agents/social-media");
      mockCreate.mockResolvedValue({ content: [{ type: "text", text: JSON.stringify(buildMockKitContent()) }], usage: { input_tokens: 5000, output_tokens: 8000 } });
      const result = await executeSocialMediaAgent({ reportSections: MOCK_REPORT_SECTIONS, computedAnalytics: MOCK_COMPUTED_ANALYTICS, market: MOCK_MARKET, personas: [] });
      expect(result.content.calendarSuggestions).toHaveLength(4);
      expect(result.content.calendarSuggestions.map((c) => c.week)).toEqual([1, 2, 3, 4]);
      for (const cal of result.content.calendarSuggestions) { expect(cal.theme).toBeTruthy(); expect(cal.postIdeas.length).toBeGreaterThanOrEqual(2); }
    });

    it("stat callouts have stat, context, source, suggestedCaption", async () => {
      const { executeSocialMediaAgent } = await import("@/lib/agents/social-media");
      mockCreate.mockResolvedValue({ content: [{ type: "text", text: JSON.stringify(buildMockKitContent()) }], usage: { input_tokens: 5000, output_tokens: 8000 } });
      const result = await executeSocialMediaAgent({ reportSections: MOCK_REPORT_SECTIONS, computedAnalytics: MOCK_COMPUTED_ANALYTICS, market: MOCK_MARKET, personas: [] });
      expect(result.content.statCallouts.length).toBeGreaterThanOrEqual(4);
      for (const c of result.content.statCallouts) { expect(c.stat).toBeTruthy(); expect(c.context).toBeTruthy(); expect(c.source).toBeTruthy(); expect(c.suggestedCaption).toBeTruthy(); }
    });
  });

  describe("Scenario: Schema validation", () => {
    it("all fields match expected types", async () => {
      const { executeSocialMediaAgent } = await import("@/lib/agents/social-media");
      mockCreate.mockResolvedValue({ content: [{ type: "text", text: JSON.stringify(buildMockKitContent({ withPersonas: true })) }], usage: { input_tokens: 5000, output_tokens: 8000 } });
      const result = await executeSocialMediaAgent({
        reportSections: MOCK_REPORT_SECTIONS, computedAnalytics: MOCK_COMPUTED_ANALYTICS, market: MOCK_MARKET,
        personas: [{ selectionOrder: 1, persona: { slug: "the-business-mogul", name: "The Business Mogul", narrativeFraming: { keyVocabulary: ["alpha"], avoid: [] } } }],
      });
      const c = result.content;
      for (const p of c.postIdeas) { expect(typeof p.title).toBe("string"); expect(Array.isArray(p.platforms)).toBe(true); }
      for (const cap of c.captions) { expect(typeof cap.platform).toBe("string"); expect(typeof cap.characterCount).toBe("number"); }
      for (const pp of c.personaPosts) { expect(typeof pp.personaSlug).toBe("string"); expect(Array.isArray(pp.vocabularyUsed)).toBe(true); }
      for (const poll of c.polls) { expect(Array.isArray(poll.options)).toBe(true); expect(typeof poll.dataContext).toBe("string"); }
      for (const cs of c.conversationStarters) { expect(typeof cs.context).toBe("string"); expect(typeof cs.template).toBe("string"); }
      for (const cal of c.calendarSuggestions) { expect(typeof cal.week).toBe("number"); expect(Array.isArray(cal.platforms)).toBe(true); }
      for (const sc of c.statCallouts) { expect(typeof sc.stat).toBe("string"); expect(typeof sc.suggestedCaption).toBe("string"); }
    });
  });

  describe("Scenario: Token usage and timing", () => {
    it("returns durationMs, promptTokens, completionTokens, modelUsed", async () => {
      const { executeSocialMediaAgent } = await import("@/lib/agents/social-media");
      mockCreate.mockResolvedValue({ content: [{ type: "text", text: JSON.stringify(buildMockKitContent()) }], usage: { input_tokens: 5000, output_tokens: 8000 } });
      const result = await executeSocialMediaAgent({ reportSections: MOCK_REPORT_SECTIONS, computedAnalytics: MOCK_COMPUTED_ANALYTICS, market: MOCK_MARKET, personas: [] });
      expect(result.durationMs).toBeGreaterThanOrEqual(0);
      expect(result.metadata.promptTokens).toBe(5000);
      expect(result.metadata.completionTokens).toBe(8000);
      expect(result.metadata.modelUsed).toBe("claude-haiku-4-5-20251001");
    });
  });

  describe("Scenario: API error handling", () => {
    it.each([[429, true], [500, true], [503, true], [400, false]])(
      "tags %d errors as retriable=%s", async (status, expected) => {
        const { executeSocialMediaAgent } = await import("@/lib/agents/social-media");
        mockCreate.mockRejectedValue(Object.assign(new Error("API Error"), { status }));
        try {
          await executeSocialMediaAgent({ reportSections: MOCK_REPORT_SECTIONS, computedAnalytics: MOCK_COMPUTED_ANALYTICS, market: MOCK_MARKET, personas: [] });
          fail("Should throw");
        } catch (e: any) { expect(e.retriable).toBe(expected); }
      }
    );

    it("handles malformed JSON as retriable", async () => {
      const { executeSocialMediaAgent } = await import("@/lib/agents/social-media");
      mockCreate.mockResolvedValue({ content: [{ type: "text", text: "not json {{{" }], usage: { input_tokens: 100, output_tokens: 50 } });
      try {
        await executeSocialMediaAgent({ reportSections: MOCK_REPORT_SECTIONS, computedAnalytics: MOCK_COMPUTED_ANALYTICS, market: MOCK_MARKET, personas: [] });
        fail("Should throw");
      } catch (e: any) { expect(e.message).toContain("parse"); expect(e.retriable).toBe(true); }
    });
  });

  describe("Scenario: Claude prompt construction", () => {
    it("system prompt establishes luxury social media strategist", async () => {
      const { executeSocialMediaAgent } = await import("@/lib/agents/social-media");
      mockCreate.mockResolvedValue({ content: [{ type: "text", text: JSON.stringify(buildMockKitContent()) }], usage: { input_tokens: 5000, output_tokens: 8000 } });
      await executeSocialMediaAgent({ reportSections: MOCK_REPORT_SECTIONS, computedAnalytics: MOCK_COMPUTED_ANALYTICS, market: MOCK_MARKET, personas: [] });
      const call = mockCreate.mock.calls[0][0];
      expect(call.system).toContain("luxury");
      expect(call.system).toContain("social media");
      expect(call.model).toBe("claude-haiku-4-5-20251001");
    });

    it("user prompt includes report sections and market data", async () => {
      const { executeSocialMediaAgent } = await import("@/lib/agents/social-media");
      mockCreate.mockResolvedValue({ content: [{ type: "text", text: JSON.stringify(buildMockKitContent()) }], usage: { input_tokens: 5000, output_tokens: 8000 } });
      await executeSocialMediaAgent({ reportSections: MOCK_REPORT_SECTIONS, computedAnalytics: MOCK_COMPUTED_ANALYTICS, market: MOCK_MARKET, personas: [] });
      const userMsg = mockCreate.mock.calls[0][0].messages[0].content;
      expect(userMsg).toContain("Naples");
      expect(userMsg).toContain("$8.2M");
      expect(userMsg).toContain("Executive Summary");
      expect(userMsg).toContain("12.4%");
    });

    it("handles null computedAnalytics gracefully", async () => {
      const { executeSocialMediaAgent } = await import("@/lib/agents/social-media");
      mockCreate.mockResolvedValue({ content: [{ type: "text", text: JSON.stringify(buildMockKitContent()) }], usage: { input_tokens: 5000, output_tokens: 8000 } });
      await executeSocialMediaAgent({ reportSections: MOCK_REPORT_SECTIONS, computedAnalytics: null, market: MOCK_MARKET, personas: [] });
      const userMsg = mockCreate.mock.calls[0][0].messages[0].content;
      expect(userMsg).toContain("Naples");
      expect(userMsg).toContain("No structured analytics data available");
      expect(userMsg).not.toContain("Total Properties");
    });

    it("handles non-structured analytics (section content) gracefully", async () => {
      const { executeSocialMediaAgent } = await import("@/lib/agents/social-media");
      mockCreate.mockResolvedValue({ content: [{ type: "text", text: JSON.stringify(buildMockKitContent()) }], usage: { input_tokens: 5000, output_tokens: 8000 } });
      // Pass section-style content (narrative string, not structured analytics)
      await executeSocialMediaAgent({ reportSections: MOCK_REPORT_SECTIONS, computedAnalytics: { narrative: "The luxury market is booming..." }, market: MOCK_MARKET, personas: [] });
      const userMsg = mockCreate.mock.calls[0][0].messages[0].content;
      expect(userMsg).toContain("No structured analytics data available");
      expect(userMsg).not.toContain("Total Properties");
    });

    it("includes persona specs when provided", async () => {
      const { executeSocialMediaAgent } = await import("@/lib/agents/social-media");
      mockCreate.mockResolvedValue({ content: [{ type: "text", text: JSON.stringify(buildMockKitContent({ withPersonas: true })) }], usage: { input_tokens: 5000, output_tokens: 8000 } });
      await executeSocialMediaAgent({
        reportSections: MOCK_REPORT_SECTIONS, computedAnalytics: MOCK_COMPUTED_ANALYTICS, market: MOCK_MARKET,
        personas: [{ selectionOrder: 1, persona: { slug: "the-business-mogul", name: "The Business Mogul", narrativeFraming: { keyVocabulary: ["alpha", "basis", "total return"], avoid: ["dream home"] } } }],
      });
      const userMsg = mockCreate.mock.calls[0][0].messages[0].content;
      expect(userMsg).toContain("The Business Mogul");
      expect(userMsg).toContain("alpha");
      expect(userMsg).toContain("basis");
    });

    it("appends section-only regeneration instruction when sectionOnly is set", async () => {
      const { executeSocialMediaAgent } = await import("@/lib/agents/social-media");
      mockCreate.mockResolvedValue({ content: [{ type: "text", text: JSON.stringify(buildMockKitContent()) }], usage: { input_tokens: 5000, output_tokens: 8000 } });
      await executeSocialMediaAgent({ reportSections: MOCK_REPORT_SECTIONS, computedAnalytics: MOCK_COMPUTED_ANALYTICS, market: MOCK_MARKET, personas: [], sectionOnly: "statCallouts" });
      const userMsg = mockCreate.mock.calls[0][0].messages[0].content;
      expect(userMsg).toContain("SECTION-ONLY REGENERATION");
      expect(userMsg).toContain('"statCallouts"');
      expect(userMsg).toContain("All other arrays should be empty");
    });
  });
});
