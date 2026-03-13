import type { AgentResult, SectionOutput } from "@/lib/agents/orchestrator";

describe("Agent Output Schema + Validation", () => {
  // Helper to build a full set of pipeline sections
  function buildFullSections(): Record<string, AgentResult> {
    return {
      "data-analyst": {
        agentName: "data-analyst",
        sections: [
          {
            sectionType: "market_overview",
            title: "Strategic Market Overview",
            content: {
              totalProperties: 45,
              medianPrice: 8750000,
              rating: "A",
              confidence: { level: "high", sampleSize: 45 },
            },
          },
          {
            sectionType: "executive_summary",
            title: "Market Analysis Matrix",
            content: {
              segments: [],
              yoy: { medianPriceChange: 0.08 },
              overallRating: "A",
            },
          },
        ],
        metadata: {
          analysis: {
            market: { totalProperties: 45, medianPrice: 8750000, rating: "A" },
            confidence: { level: "high", staleDataSources: [], sampleSize: 45 },
          },
        },
        durationMs: 500,
      },
      "insight-generator": {
        agentName: "insight-generator",
        sections: [
          {
            sectionType: "market_overview",
            title: "Market Overview & Insights",
            content: {
              narrative: "Strong market performance.",
              highlights: ["8% growth"],
              recommendations: ["Buy waterfront"],
            },
          },
          {
            sectionType: "key_drivers",
            title: "Key Market Drivers",
            content: {
              themes: [
                {
                  name: "Resilience",
                  impact: "high",
                  trend: "up",
                  narrative: "Demand persists.",
                },
              ],
            },
          },
          {
            sectionType: "executive_summary",
            title: "Executive Summary",
            content: {
              narrative: "Naples performed well.",
              highlights: ["A rating"],
              timing: { buyers: "Act now", sellers: "Strong market" },
            },
          },
        ],
        metadata: { insights: {} },
        durationMs: 1200,
      },
      "competitive-analyst": {
        agentName: "competitive-analyst",
        sections: [
          {
            sectionType: "competitive_market_analysis",
            title: "Competitive Market Analysis",
            content: {
              positioning: {
                narrative: "Naples outperforms peers.",
                strengths: ["Higher growth"],
                weaknesses: ["Lower volume"],
                opportunities: ["Waterfront"],
              },
              peerComparisons: [],
              rankings: [],
            },
          },
        ],
        metadata: { competitiveAnalysis: {}, peersFetched: 2 },
        durationMs: 1500,
      },
      "forecast-modeler": {
        agentName: "forecast-modeler",
        sections: [
          {
            sectionType: "forecasts",
            title: "Forecasts",
            content: {
              projections: [
                {
                  segment: "single_family",
                  sixMonth: { medianPrice: 9900000, confidence: "high" },
                  twelveMonth: { medianPrice: 10300000, confidence: "medium" },
                },
              ],
              scenarios: {
                base: {
                  narrative: "Continued growth.",
                  assumptions: ["Stable rates"],
                  medianPriceChange: 0.06,
                  volumeChange: 0.05,
                },
                bull: {
                  narrative: "Accelerated growth.",
                  assumptions: ["Tax migration"],
                  medianPriceChange: 0.12,
                  volumeChange: 0.15,
                },
                bear: {
                  narrative: "Moderation.",
                  assumptions: ["Rate hikes"],
                  medianPriceChange: -0.02,
                  volumeChange: -0.08,
                },
              },
            },
          },
          {
            sectionType: "strategic_summary",
            title: "Strategic Summary",
            content: {
              timing: {
                buyers: "Good entry point",
                sellers: "Strong position",
              },
              outlook: {
                narrative: "Positive outlook.",
                monitoringAreas: ["Interest rates"],
              },
            },
          },
        ],
        metadata: { forecast: {}, lowConfidence: false },
        durationMs: 1100,
      },
      "polish-agent": {
        agentName: "polish-agent",
        sections: [
          {
            sectionType: "polished_report",
            title: "Polished Report",
            content: {
              polishedSections: [],
              pullQuotes: [
                { text: "8% YoY appreciation", source: "market_overview" },
                { text: "A-rated performance", source: "executive_summary" },
              ],
              consistency: { contradictions: [], notes: [] },
            },
          },
          {
            sectionType: "methodology",
            title: "Methodology",
            content: {
              narrative: "Data sourced from RealEstateAPI.",
              sources: ["RealEstateAPI"],
              confidenceLevels: {
                dataConfidence: "high",
                sampleSize: 45,
                staleDataSources: [],
              },
            },
          },
        ],
        metadata: { polishOutput: {} },
        durationMs: 900,
      },
    };
  }

  describe("validatePipelineOutput", () => {
    it("validates a complete pipeline result", async () => {
      const { validatePipelineOutput } = await import(
        "@/lib/agents/schema"
      );
      const results = buildFullSections();

      const validation = validatePipelineOutput(results);

      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it("detects missing required sections", async () => {
      const { validatePipelineOutput } = await import(
        "@/lib/agents/schema"
      );
      const results = buildFullSections();
      // Remove insight-generator (provides key_drivers, which only it produces)
      delete results["insight-generator"];

      const validation = validatePipelineOutput(results);

      expect(validation.valid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
      // key_drivers is only produced by insight-generator
      expect(
        validation.errors.some((e) => e.includes("key_drivers"))
      ).toBe(true);
    });

    it("allows missing optional sections with allowPartial", async () => {
      const { validatePipelineOutput } = await import(
        "@/lib/agents/schema"
      );
      const results = buildFullSections();
      delete results["competitive-analyst"];
      delete results["forecast-modeler"];

      const validation = validatePipelineOutput(results, {
        allowPartial: true,
      });

      expect(validation.valid).toBe(true);
      expect(validation.warnings.length).toBeGreaterThan(0);
      expect(
        validation.warnings.some((w) =>
          w.includes("competitive_market_analysis")
        )
      ).toBe(true);
    });

    it("fails for missing optional sections without allowPartial", async () => {
      const { validatePipelineOutput } = await import(
        "@/lib/agents/schema"
      );
      const results = buildFullSections();
      delete results["competitive-analyst"];

      const validation = validatePipelineOutput(results);

      expect(validation.valid).toBe(false);
      expect(
        validation.errors.some((e) =>
          e.includes("competitive_market_analysis")
        )
      ).toBe(true);
    });
  });

  describe("assembleReport", () => {
    it("assembles sections in correct report order", async () => {
      const { assembleReport } = await import("@/lib/agents/schema");
      const results = buildFullSections();

      const report = assembleReport(results);

      expect(report.sections.length).toBeGreaterThanOrEqual(6);

      // Verify order: market_overview should come before key_drivers
      const overviewIdx = report.sections.findIndex(
        (s) => s.sectionType === "market_overview"
      );
      const driversIdx = report.sections.findIndex(
        (s) => s.sectionType === "key_drivers"
      );
      const competitiveIdx = report.sections.findIndex(
        (s) => s.sectionType === "competitive_market_analysis"
      );

      expect(overviewIdx).toBeLessThan(driversIdx);
      expect(driversIdx).toBeLessThan(competitiveIdx);
    });

    it("includes report metadata", async () => {
      const { assembleReport } = await import("@/lib/agents/schema");
      const results = buildFullSections();

      const report = assembleReport(results);

      expect(report.metadata).toHaveProperty("generatedAt");
      expect(report.metadata).toHaveProperty("totalDurationMs");
      expect(report.metadata).toHaveProperty("agentDurations");
      expect(report.metadata).toHaveProperty("confidence");
      expect(report.metadata.agentDurations).toHaveProperty("data-analyst");
    });

    it("includes pull quotes from polish agent", async () => {
      const { assembleReport } = await import("@/lib/agents/schema");
      const results = buildFullSections();

      const report = assembleReport(results);

      expect(report.pullQuotes).toBeInstanceOf(Array);
      expect(report.pullQuotes.length).toBeGreaterThanOrEqual(1);
      expect(report.pullQuotes[0]).toHaveProperty("text");
      expect(report.pullQuotes[0]).toHaveProperty("source");
    });

    it("handles missing polish agent (no pull quotes)", async () => {
      const { assembleReport } = await import("@/lib/agents/schema");
      const results = buildFullSections();
      delete results["polish-agent"];

      const report = assembleReport(results);

      expect(report.pullQuotes).toEqual([]);
    });

    it("collects confidence from data analyst metadata", async () => {
      const { assembleReport } = await import("@/lib/agents/schema");
      const results = buildFullSections();

      const report = assembleReport(results);

      expect(report.metadata.confidence).toEqual({
        level: "high",
        sampleSize: 45,
        staleDataSources: [],
      });
    });

    it("deduplicates sections (prefers insight-generator over data-analyst for narratives)", async () => {
      const { assembleReport } = await import("@/lib/agents/schema");
      const results = buildFullSections();

      const report = assembleReport(results);

      // market_overview should appear only once (from insight-generator, which has narratives)
      const overviews = report.sections.filter(
        (s) => s.sectionType === "market_overview"
      );
      expect(overviews).toHaveLength(1);
    });
  });

  describe("SECTION_REGISTRY", () => {
    it("defines all expected section types", async () => {
      const { SECTION_REGISTRY } = await import("@/lib/agents/schema");

      const sectionTypes = SECTION_REGISTRY.map((r) => r.sectionType);
      expect(sectionTypes).toContain("market_overview");
      expect(sectionTypes).toContain("executive_summary");
      expect(sectionTypes).toContain("key_drivers");
      expect(sectionTypes).toContain("competitive_market_analysis");
      expect(sectionTypes).toContain("forecasts");
      expect(sectionTypes).toContain("strategic_summary");
      expect(sectionTypes).toContain("polished_report");
      expect(sectionTypes).toContain("methodology");
    });

    it("marks required and optional sections correctly", async () => {
      const { SECTION_REGISTRY } = await import("@/lib/agents/schema");

      const required = SECTION_REGISTRY.filter((r) => r.required);
      const optional = SECTION_REGISTRY.filter((r) => !r.required);

      expect(required.length).toBeGreaterThanOrEqual(3);
      expect(optional.length).toBeGreaterThanOrEqual(3);

      const requiredTypes = required.map((r) => r.sectionType);
      expect(requiredTypes).toContain("market_overview");
      expect(requiredTypes).toContain("executive_summary");
      expect(requiredTypes).toContain("key_drivers");
    });
  });

  describe("SECTION_REGISTRY_V2", () => {
    it("defines all 9 v2 section types (strategic_benchmark removed)", async () => {
      const { SECTION_REGISTRY_V2 } = await import("@/lib/agents/schema");

      expect(SECTION_REGISTRY_V2).toHaveLength(9);
      const types = SECTION_REGISTRY_V2.map((r) => r.sectionType);
      expect(types).toEqual([
        "executive_briefing",
        "market_insights_index",
        "luxury_market_dashboard",
        "neighborhood_intelligence",
        "the_narrative",
        "forward_look",
        "comparative_positioning",
        "disclaimer_methodology",
        "persona_intelligence",
      ]);
      expect(types).not.toContain("strategic_benchmark");
    });

    it("has unique, sequential report orders 1-9", async () => {
      const { SECTION_REGISTRY_V2 } = await import("@/lib/agents/schema");

      const orders = SECTION_REGISTRY_V2.map((r) => r.reportOrder);
      expect(orders).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    });

    it("marks required vs optional correctly", async () => {
      const { SECTION_REGISTRY_V2 } = await import("@/lib/agents/schema");

      const required = SECTION_REGISTRY_V2.filter((r) => r.required).map(
        (r) => r.sectionType
      );
      const optional = SECTION_REGISTRY_V2.filter((r) => !r.required).map(
        (r) => r.sectionType
      );

      expect(required).toEqual([
        "executive_briefing",
        "market_insights_index",
        "luxury_market_dashboard",
        "neighborhood_intelligence",
        "the_narrative",
        "comparative_positioning",
        "disclaimer_methodology",
      ]);
      expect(optional).toEqual([
        "forward_look",
        "persona_intelligence",
      ]);
    });

    it("assigns correct source agents", async () => {
      const { SECTION_REGISTRY_V2 } = await import("@/lib/agents/schema");

      const byAgent = new Map<string, string[]>();
      for (const entry of SECTION_REGISTRY_V2) {
        const list = byAgent.get(entry.sourceAgent) ?? [];
        list.push(entry.sectionType);
        byAgent.set(entry.sourceAgent, list);
      }

      // assembler handles data-only sections
      expect(byAgent.get("assembler")).toEqual([
        "executive_briefing",
        "market_insights_index",
        "luxury_market_dashboard",
        "neighborhood_intelligence",
        "comparative_positioning",
        "disclaimer_methodology",
      ]);
      // narrative agents
      expect(byAgent.get("insight-generator")).toEqual(["the_narrative"]);
      expect(byAgent.get("forecast-modeler")).toEqual(["forward_look"]);
      // polish-agent no longer owns any section (strategic_benchmark removed)
      expect(byAgent.get("polish-agent")).toBeUndefined();
      // persona agent
      expect(byAgent.get("persona-intelligence")).toEqual([
        "persona_intelligence",
      ]);
    });
  });
});
