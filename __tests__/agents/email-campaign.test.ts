/**
 * Email Campaign Agent Tests
 *
 * Tests for the standalone Email Campaign Agent that generates
 * email campaign content from finalized reports.
 */

import type { EmailCampaignContent } from "@/lib/db/schema";

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

function buildMockCampaignContent(options: { withPersonas?: boolean } = {}): EmailCampaignContent {
  return {
    dripSequence: [
      { sequenceOrder: 1, dayOffset: 0, subject: "Your Market Intelligence Brief", previewText: "Key findings from your latest market analysis", body: "Thank you for our recent conversation about the Naples luxury market. Our latest analysis reveals a compelling picture: median prices have surged 12.4% year-over-year, with total transaction volume reaching $558M.\n\nThis isn't just growth — it's a signal of sustained demand in the ultra-luxury segment.", cta: "View the full intelligence brief", reportSection: "executive_summary" },
      { sequenceOrder: 2, dayOffset: 3, subject: "The Key Driver Behind Naples Growth", previewText: "Cash transactions dominate at 87%", body: "Following up on the market intelligence brief I shared earlier — one data point stands out: 87% of ultra-luxury transactions in Naples are closing in cash.\n\nThis isn't just a statistic. It signals the caliber of buyer active in this market — principals with conviction, not leveraged speculators.", cta: "Schedule a market deep-dive", reportSection: "key_drivers" },
      { sequenceOrder: 3, dayOffset: 7, subject: "How Naples Compares to Peer Markets", previewText: "Competitive positioning data you should see", body: "In our ongoing market intelligence series, today I want to share how Naples ultra-luxury positions against peer markets.\n\nThe data is clear: Naples outperforms on both price appreciation and volume growth, while maintaining higher cash-transaction ratios than comparable coastal markets.", cta: "See the competitive analysis", reportSection: "competitive_analysis" },
      { sequenceOrder: 4, dayOffset: 10, subject: "Forward Outlook: What the Data Suggests", previewText: "Forecast highlights and timing signals", body: "As we near the end of our market intelligence series, I want to share the forward outlook. With 12.4% YoY growth, $2,150/sqft median, and a positive trajectory in transaction volume, the data supports a continued bullish positioning.\n\nThe 90-day window for Q2 activity is approaching — timing matters.", cta: "Discuss your positioning strategy", reportSection: "forecasts" },
      { sequenceOrder: 5, dayOffset: 14, subject: "A Specific Recommendation for You", previewText: "Based on the data, here is what I suggest", body: "Over the past two weeks, I have shared comprehensive market intelligence on the Naples ultra-luxury segment: 12.4% price growth, $558M volume, 87% cash closings, and a positive competitive position.\n\nBased on this data, I have a specific recommendation tailored to your portfolio. I would welcome 20 minutes to walk through it.", cta: "Book a market advisory session", reportSection: "strategic_summary" },
    ],
    newsletter: {
      headline: "Naples Ultra-Luxury Market Intelligence Brief",
      subheadline: "Q1 2026 Analysis: $558M in Transaction Volume, 12.4% YoY Growth",
      contentBlocks: [
        { heading: "Market Momentum Continues", body: "The Naples ultra-luxury market posted 12.4% year-over-year median price growth, with total transaction volume reaching $558M across 45 properties.\n\nThis growth is driven by sustained demand in the estate segment, where median prices reached $22M with an A+ rating.", keyMetric: "$558M total volume" },
        { heading: "Key Market Driver: Cash Dominance", body: "87% of ultra-luxury transactions closed in cash, signaling the caliber of buyer active in this market.\n\nWaterfront demand continues to be the primary driver, with the estate segment commanding $3,100/sqft.", keyMetric: "87% cash transactions" },
        { heading: "Competitive Position Strengthens", body: "Naples outperforms peer luxury markets on both price appreciation and volume growth metrics.\n\nWith $2,150/sqft median and 6% YoY growth in price-per-square-foot, value expansion continues across all segments.", keyMetric: "$2,150/sqft (+6% YoY)" },
      ],
      footerCta: "Schedule a market briefing to discuss what this means for your portfolio",
    },
    personaEmails: options.withPersonas
      ? [
          { personaSlug: "the-business-mogul", personaName: "The Business Mogul", subject: "Naples Alpha: 12.4% YoY Returns", previewText: "Capital allocation data for your portfolio review", body: "The Naples ultra-luxury market delivered 12.4% YoY alpha on a median price basis, with total transaction volume of $558M.\n\nOn a per-square-foot basis, the market is posting $2,150 median with 6% YoY appreciation — outperforming the basis of comparable coastal markets.", cta: "Review the full market analysis", vocabularyUsed: ["alpha", "capital allocation", "basis", "total return"] },
          { personaSlug: "the-business-mogul", personaName: "The Business Mogul", subject: "87% Cash: Signal Strength in Naples", previewText: "Transaction conviction data worth your time", body: "87% of ultra-luxury transactions in Naples are closing in cash. This isn't a soft market metric — it's a conviction indicator.\n\nThe estate segment at $22M median with A+ rating represents the strongest risk-adjusted positioning in the market.", cta: "Discuss portfolio positioning", vocabularyUsed: ["conviction", "risk-adjusted", "total return"] },
          { personaSlug: "the-coastal-escape-seeker", personaName: "The Coastal Escape Seeker", subject: "Your Naples Coastal Sanctuary Awaits", previewText: "The waterfront market data that matters most", body: "The Naples waterfront market continues to be a sanctuary for discerning buyers. With median prices at $8.2M and estate properties reaching $22M, the market offers the kind of turnkey luxury that defines a coastal retreat.\n\nWaterfront demand remains the primary driver — and for good reason. This is where lifestyle meets long-term value.", cta: "Explore your coastal options", vocabularyUsed: ["sanctuary", "retreat", "coastal", "turnkey", "waterfront"] },
        ]
      : [],
    subjectLines: [
      { emailContext: "Post-meeting follow-up (drip email 1)", variants: [
        { style: "data-forward", subject: "$558M in Naples Luxury Transactions", previewText: "Key findings from your market analysis" },
        { style: "curiosity-driven", subject: "What 87% Cash Closings Signal", previewText: "A data point worth your attention" },
        { style: "urgency-based", subject: "The 90-Day Window in Naples Luxury", previewText: "Timing matters in this market" },
      ]},
      { emailContext: "Market update newsletter", variants: [
        { style: "data-forward", subject: "12.4% YoY Growth in Naples Ultra-Luxury", previewText: "Your quarterly market intelligence brief" },
        { style: "curiosity-driven", subject: "Is Naples Outperforming Your Market?", previewText: "The competitive data may surprise you" },
        { style: "urgency-based", subject: "Q2 Positioning Window Opening Soon", previewText: "What the forward outlook suggests" },
      ]},
      { emailContext: "Re-engagement for dormant contacts", variants: [
        { style: "data-forward", subject: "Naples Hit $22M Median in Estates", previewText: "The market has moved since we last spoke" },
        { style: "curiosity-driven", subject: "Did You See What Happened in Naples?", previewText: "A market shift worth knowing about" },
        { style: "urgency-based", subject: "The Naples Data You Should See Now", previewText: "Before the next quarter closes" },
      ]},
    ],
    ctaBlocks: [
      { context: "End of intelligence brief email", buttonText: "View the Full Intelligence Brief", supportingCopy: "See the complete market analysis with segment breakdowns, YoY comparisons, and competitive positioning.", placement: "primary" },
      { context: "Mid-content after key metric", buttonText: "See Your Market's Forecast", supportingCopy: "Our forward outlook includes timing signals and confidence ratings.", placement: "inline" },
      { context: "End of competitive analysis email", buttonText: "Book a Market Advisory Session", supportingCopy: "20 minutes to discuss what this data means for your specific situation.", placement: "primary" },
      { context: "End of drip sequence", buttonText: "Download the Report", supportingCopy: "Get the full Naples Ultra-Luxury Intelligence Report as a PDF.", placement: "primary" },
    ],
    reEngagementEmails: [
      { hook: "While most luxury markets cooled last quarter, Naples posted 12.4% growth.", body: "It has been a while since we connected, and I thought you should see this: the Naples ultra-luxury market grew 12.4% YoY while many comparable markets pulled back.\n\nWith $558M in transaction volume and 87% cash closings, the data tells a compelling story.", cta: "Reply with 'interested' for the full briefing", tone: "warm" },
      { hook: "Naples estates just hit $22M median — a new benchmark.", body: "I noticed this data point in our latest analysis and wanted to share it with you specifically. The estate segment in Naples has reached a $22M median with an A+ rating — the highest in our tracking period.\n\nIf your real estate thinking has evolved since we last spoke, I would welcome the conversation.", cta: "Reply 'yes' and I will send the full report", tone: "curious" },
      { hook: "87% of Naples ultra-luxury deals are closing in cash. Here is what that means.", body: "This isn't just a statistic — it's a signal about who is buying and how they are buying in the Naples ultra-luxury market.\n\nI have a brief market intelligence report that puts this in context. Happy to share if useful.", cta: "Just reply 'send it' and it is yours", tone: "advisory" },
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

describe("Email Campaign Agent", () => {
  let mockCreate: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
    const Anthropic = require("@anthropic-ai/sdk").default;
    mockCreate = jest.fn();
    Anthropic.mockImplementation(() => ({ messages: { create: mockCreate } }));
  });

  describe("Scenario: Agent generates a complete email campaign", () => {
    it("produces EmailCampaignContent with all 6 content types", async () => {
      const { executeEmailCampaignAgent } = await import("@/lib/agents/email-campaign");
      mockCreate.mockResolvedValue({
        content: [{ type: "text", text: JSON.stringify(buildMockCampaignContent()) }],
        usage: { input_tokens: 6000, output_tokens: 12000 },
      });
      const result = await executeEmailCampaignAgent({ reportSections: MOCK_REPORT_SECTIONS, computedAnalytics: MOCK_COMPUTED_ANALYTICS, market: MOCK_MARKET, personas: [] });
      expect(result.content.dripSequence.length).toBeGreaterThanOrEqual(4);
      expect(result.content.newsletter.contentBlocks.length).toBeGreaterThanOrEqual(3);
      expect(result.content.subjectLines.length).toBeGreaterThanOrEqual(3);
      expect(result.content.ctaBlocks.length).toBeGreaterThanOrEqual(3);
      expect(result.content.reEngagementEmails.length).toBeGreaterThanOrEqual(2);
      expect(result.content.personaEmails).toEqual([]);
    });

    it("every drip email has required fields and tells a progressive story", async () => {
      const { executeEmailCampaignAgent } = await import("@/lib/agents/email-campaign");
      mockCreate.mockResolvedValue({ content: [{ type: "text", text: JSON.stringify(buildMockCampaignContent()) }], usage: { input_tokens: 6000, output_tokens: 12000 } });
      const result = await executeEmailCampaignAgent({ reportSections: MOCK_REPORT_SECTIONS, computedAnalytics: MOCK_COMPUTED_ANALYTICS, market: MOCK_MARKET, personas: [] });
      const drip = result.content.dripSequence;
      for (const email of drip) {
        expect(email.sequenceOrder).toBeGreaterThan(0);
        expect(email.dayOffset).toBeGreaterThanOrEqual(0);
        expect(email.subject).toBeTruthy();
        expect(email.previewText).toBeTruthy();
        expect(email.body).toBeTruthy();
        expect(email.cta).toBeTruthy();
        expect(email.reportSection).toBeTruthy();
      }
      // Verify progressive day offsets
      for (let i = 1; i < drip.length; i++) {
        expect(drip[i].dayOffset).toBeGreaterThan(drip[i - 1].dayOffset);
      }
    });
  });

  describe("Scenario: Agent generates a market update newsletter", () => {
    it("newsletter has headline, subheadline, content blocks, and footer CTA", async () => {
      const { executeEmailCampaignAgent } = await import("@/lib/agents/email-campaign");
      mockCreate.mockResolvedValue({ content: [{ type: "text", text: JSON.stringify(buildMockCampaignContent()) }], usage: { input_tokens: 6000, output_tokens: 12000 } });
      const result = await executeEmailCampaignAgent({ reportSections: MOCK_REPORT_SECTIONS, computedAnalytics: MOCK_COMPUTED_ANALYTICS, market: MOCK_MARKET, personas: [] });
      const nl = result.content.newsletter;
      expect(nl.headline).toBeTruthy();
      expect(nl.subheadline).toBeTruthy();
      expect(nl.footerCta).toBeTruthy();
      expect(nl.contentBlocks.length).toBeGreaterThanOrEqual(3);
      for (const block of nl.contentBlocks) {
        expect(block.heading).toBeTruthy();
        expect(block.body).toBeTruthy();
        expect(block.keyMetric).toBeTruthy();
      }
    });
  });

  describe("Scenario: Persona-targeted emails", () => {
    it("generates emails per persona using their vocabulary", async () => {
      const { executeEmailCampaignAgent } = await import("@/lib/agents/email-campaign");
      mockCreate.mockResolvedValue({ content: [{ type: "text", text: JSON.stringify(buildMockCampaignContent({ withPersonas: true })) }], usage: { input_tokens: 6000, output_tokens: 12000 } });
      const result = await executeEmailCampaignAgent({
        reportSections: MOCK_REPORT_SECTIONS, computedAnalytics: MOCK_COMPUTED_ANALYTICS, market: MOCK_MARKET,
        personas: [
          { selectionOrder: 1, persona: { slug: "the-business-mogul", name: "The Business Mogul", narrativeFraming: { keyVocabulary: ["alpha", "basis", "total return", "capital allocation"], avoid: ["dream home"] } } },
          { selectionOrder: 2, persona: { slug: "the-coastal-escape-seeker", name: "The Coastal Escape Seeker", narrativeFraming: { keyVocabulary: ["sanctuary", "retreat", "coastal", "turnkey", "waterfront"], avoid: ["cap rate"] } } },
        ],
      });
      expect(result.content.personaEmails.length).toBeGreaterThanOrEqual(2);
      for (const email of result.content.personaEmails) {
        expect(email.personaSlug).toBeTruthy();
        expect(email.personaName).toBeTruthy();
        expect(email.subject).toBeTruthy();
        expect(email.previewText).toBeTruthy();
        expect(email.body).toBeTruthy();
        expect(email.cta).toBeTruthy();
        expect(email.vocabularyUsed.length).toBeGreaterThan(0);
      }
      expect(result.content.personaEmails.filter((e) => e.personaSlug === "the-business-mogul").length).toBeGreaterThanOrEqual(2);
      expect(result.content.personaEmails.filter((e) => e.personaSlug === "the-coastal-escape-seeker").length).toBeGreaterThanOrEqual(1);
    });

    it("returns empty personaEmails when no personas", async () => {
      const { executeEmailCampaignAgent } = await import("@/lib/agents/email-campaign");
      mockCreate.mockResolvedValue({ content: [{ type: "text", text: JSON.stringify(buildMockCampaignContent()) }], usage: { input_tokens: 6000, output_tokens: 12000 } });
      const result = await executeEmailCampaignAgent({ reportSections: MOCK_REPORT_SECTIONS, computedAnalytics: MOCK_COMPUTED_ANALYTICS, market: MOCK_MARKET, personas: [] });
      expect(result.content.personaEmails).toEqual([]);
      expect(result.content.dripSequence.length).toBeGreaterThanOrEqual(4);
    });
  });

  describe("Scenario: Subject line variants", () => {
    it("each set has 3 variants: data-forward, curiosity-driven, urgency-based", async () => {
      const { executeEmailCampaignAgent } = await import("@/lib/agents/email-campaign");
      mockCreate.mockResolvedValue({ content: [{ type: "text", text: JSON.stringify(buildMockCampaignContent()) }], usage: { input_tokens: 6000, output_tokens: 12000 } });
      const result = await executeEmailCampaignAgent({ reportSections: MOCK_REPORT_SECTIONS, computedAnalytics: MOCK_COMPUTED_ANALYTICS, market: MOCK_MARKET, personas: [] });
      expect(result.content.subjectLines.length).toBeGreaterThanOrEqual(3);
      for (const set of result.content.subjectLines) {
        expect(set.emailContext).toBeTruthy();
        expect(set.variants.length).toBe(3);
        const styles = set.variants.map((v) => v.style);
        expect(styles).toContain("data-forward");
        expect(styles).toContain("curiosity-driven");
        expect(styles).toContain("urgency-based");
        for (const variant of set.variants) {
          expect(variant.subject).toBeTruthy();
          expect(variant.previewText).toBeTruthy();
        }
      }
    });
  });

  describe("Scenario: CTA blocks", () => {
    it("CTAs have context, buttonText, supportingCopy, placement", async () => {
      const { executeEmailCampaignAgent } = await import("@/lib/agents/email-campaign");
      mockCreate.mockResolvedValue({ content: [{ type: "text", text: JSON.stringify(buildMockCampaignContent()) }], usage: { input_tokens: 6000, output_tokens: 12000 } });
      const result = await executeEmailCampaignAgent({ reportSections: MOCK_REPORT_SECTIONS, computedAnalytics: MOCK_COMPUTED_ANALYTICS, market: MOCK_MARKET, personas: [] });
      expect(result.content.ctaBlocks.length).toBeGreaterThanOrEqual(3);
      for (const cta of result.content.ctaBlocks) {
        expect(cta.context).toBeTruthy();
        expect(cta.buttonText).toBeTruthy();
        expect(cta.supportingCopy).toBeTruthy();
        expect(["primary", "inline"]).toContain(cta.placement);
      }
    });
  });

  describe("Scenario: Re-engagement emails", () => {
    it("re-engagement emails have hook, body, cta, tone", async () => {
      const { executeEmailCampaignAgent } = await import("@/lib/agents/email-campaign");
      mockCreate.mockResolvedValue({ content: [{ type: "text", text: JSON.stringify(buildMockCampaignContent()) }], usage: { input_tokens: 6000, output_tokens: 12000 } });
      const result = await executeEmailCampaignAgent({ reportSections: MOCK_REPORT_SECTIONS, computedAnalytics: MOCK_COMPUTED_ANALYTICS, market: MOCK_MARKET, personas: [] });
      expect(result.content.reEngagementEmails.length).toBeGreaterThanOrEqual(2);
      for (const email of result.content.reEngagementEmails) {
        expect(email.hook).toBeTruthy();
        expect(email.body).toBeTruthy();
        expect(email.cta).toBeTruthy();
        expect(email.tone).toBeTruthy();
      }
    });
  });

  describe("Scenario: Schema validation", () => {
    it("all fields match expected types", async () => {
      const { executeEmailCampaignAgent } = await import("@/lib/agents/email-campaign");
      mockCreate.mockResolvedValue({ content: [{ type: "text", text: JSON.stringify(buildMockCampaignContent({ withPersonas: true })) }], usage: { input_tokens: 6000, output_tokens: 12000 } });
      const result = await executeEmailCampaignAgent({
        reportSections: MOCK_REPORT_SECTIONS, computedAnalytics: MOCK_COMPUTED_ANALYTICS, market: MOCK_MARKET,
        personas: [{ selectionOrder: 1, persona: { slug: "the-business-mogul", name: "The Business Mogul", narrativeFraming: { keyVocabulary: ["alpha"], avoid: [] } } }],
      });
      const c = result.content;
      for (const d of c.dripSequence) { expect(typeof d.sequenceOrder).toBe("number"); expect(typeof d.dayOffset).toBe("number"); expect(typeof d.subject).toBe("string"); expect(typeof d.body).toBe("string"); }
      expect(typeof c.newsletter.headline).toBe("string");
      expect(Array.isArray(c.newsletter.contentBlocks)).toBe(true);
      for (const pe of c.personaEmails) { expect(typeof pe.personaSlug).toBe("string"); expect(Array.isArray(pe.vocabularyUsed)).toBe(true); }
      for (const sl of c.subjectLines) { expect(typeof sl.emailContext).toBe("string"); expect(Array.isArray(sl.variants)).toBe(true); }
      for (const cta of c.ctaBlocks) { expect(typeof cta.buttonText).toBe("string"); expect(typeof cta.placement).toBe("string"); }
      for (const re of c.reEngagementEmails) { expect(typeof re.hook).toBe("string"); expect(typeof re.tone).toBe("string"); }
    });
  });

  describe("Scenario: Token usage and timing", () => {
    it("returns durationMs, promptTokens, completionTokens, modelUsed", async () => {
      const { executeEmailCampaignAgent } = await import("@/lib/agents/email-campaign");
      mockCreate.mockResolvedValue({ content: [{ type: "text", text: JSON.stringify(buildMockCampaignContent()) }], usage: { input_tokens: 6000, output_tokens: 12000 } });
      const result = await executeEmailCampaignAgent({ reportSections: MOCK_REPORT_SECTIONS, computedAnalytics: MOCK_COMPUTED_ANALYTICS, market: MOCK_MARKET, personas: [] });
      expect(result.durationMs).toBeGreaterThanOrEqual(0);
      expect(result.metadata.promptTokens).toBe(6000);
      expect(result.metadata.completionTokens).toBe(12000);
      expect(result.metadata.modelUsed).toBe("claude-haiku-4-5-20251001");
    });
  });

  describe("Scenario: API error handling", () => {
    it.each([[429, true], [500, true], [503, true], [400, false]])(
      "tags %d errors as retriable=%s", async (status, expected) => {
        const { executeEmailCampaignAgent } = await import("@/lib/agents/email-campaign");
        mockCreate.mockRejectedValue(Object.assign(new Error("API Error"), { status }));
        try {
          await executeEmailCampaignAgent({ reportSections: MOCK_REPORT_SECTIONS, computedAnalytics: MOCK_COMPUTED_ANALYTICS, market: MOCK_MARKET, personas: [] });
          fail("Should throw");
        } catch (e: any) { expect(e.retriable).toBe(expected); }
      }
    );

    it("handles malformed JSON as retriable", async () => {
      const { executeEmailCampaignAgent } = await import("@/lib/agents/email-campaign");
      mockCreate.mockResolvedValue({ content: [{ type: "text", text: "not json {{{" }], usage: { input_tokens: 100, output_tokens: 50 } });
      try {
        await executeEmailCampaignAgent({ reportSections: MOCK_REPORT_SECTIONS, computedAnalytics: MOCK_COMPUTED_ANALYTICS, market: MOCK_MARKET, personas: [] });
        fail("Should throw");
      } catch (e: any) { expect(e.message).toContain("parse"); expect(e.retriable).toBe(true); }
    });
  });

  describe("Scenario: Claude prompt construction", () => {
    it("system prompt establishes luxury email marketing strategist", async () => {
      const { executeEmailCampaignAgent } = await import("@/lib/agents/email-campaign");
      mockCreate.mockResolvedValue({ content: [{ type: "text", text: JSON.stringify(buildMockCampaignContent()) }], usage: { input_tokens: 6000, output_tokens: 12000 } });
      await executeEmailCampaignAgent({ reportSections: MOCK_REPORT_SECTIONS, computedAnalytics: MOCK_COMPUTED_ANALYTICS, market: MOCK_MARKET, personas: [] });
      const call = mockCreate.mock.calls[0][0];
      expect(call.system).toContain("luxury");
      expect(call.system).toContain("email");
      expect(call.model).toBe("claude-haiku-4-5-20251001");
    });

    it("user prompt includes report sections and market data", async () => {
      const { executeEmailCampaignAgent } = await import("@/lib/agents/email-campaign");
      mockCreate.mockResolvedValue({ content: [{ type: "text", text: JSON.stringify(buildMockCampaignContent()) }], usage: { input_tokens: 6000, output_tokens: 12000 } });
      await executeEmailCampaignAgent({ reportSections: MOCK_REPORT_SECTIONS, computedAnalytics: MOCK_COMPUTED_ANALYTICS, market: MOCK_MARKET, personas: [] });
      const userMsg = mockCreate.mock.calls[0][0].messages[0].content;
      expect(userMsg).toContain("Naples");
      expect(userMsg).toContain("$8.2M");
      expect(userMsg).toContain("Executive Summary");
      expect(userMsg).toContain("12.4%");
    });

    it("includes persona specs when provided", async () => {
      const { executeEmailCampaignAgent } = await import("@/lib/agents/email-campaign");
      mockCreate.mockResolvedValue({ content: [{ type: "text", text: JSON.stringify(buildMockCampaignContent({ withPersonas: true })) }], usage: { input_tokens: 6000, output_tokens: 12000 } });
      await executeEmailCampaignAgent({
        reportSections: MOCK_REPORT_SECTIONS, computedAnalytics: MOCK_COMPUTED_ANALYTICS, market: MOCK_MARKET,
        personas: [{ selectionOrder: 1, persona: { slug: "the-business-mogul", name: "The Business Mogul", narrativeFraming: { keyVocabulary: ["alpha", "basis", "total return"], avoid: ["dream home"] } } }],
      });
      const userMsg = mockCreate.mock.calls[0][0].messages[0].content;
      expect(userMsg).toContain("The Business Mogul");
      expect(userMsg).toContain("alpha");
      expect(userMsg).toContain("basis");
    });
  });
});
