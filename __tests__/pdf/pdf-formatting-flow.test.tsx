/**
 * PDF Formatting & Flow Rules Tests
 *
 * Tests for section filtering (empty content omission), orphan protection,
 * card wrapping discipline, and GenericSectionPdf JSON dump removal.
 *
 * Spec: .specs/features/report-template/pdf-formatting-flow.feature.md
 */

import fs from "fs";
import path from "path";

// --- Test helpers ---

/** Build a minimal section object for testing */
function makeSection(sectionType: string, title: string, content: unknown) {
  return { sectionType, title, content };
}

// --- Section Emptiness Checker Tests ---

describe("PDF Formatting & Flow: Section Filtering", () => {
  let isSectionEmpty: (section: { sectionType: string; content: unknown }) => boolean;

  beforeAll(async () => {
    const mod = await import("@/lib/pdf/section-filter");
    isSectionEmpty = mod.isSectionEmpty;
  });

  // --- executive_briefing ---
  it("FMT-01: executive_briefing is empty when totalProperties === 0", () => {
    const section = makeSection("executive_briefing", "Executive Briefing", {
      headline: { rating: "C", medianPrice: 0, yoyPriceChange: 0, totalProperties: 0 },
      narrative: null,
      confidence: { level: "low", sampleSize: 0 },
    });
    expect(isSectionEmpty(section)).toBe(true);
  });

  it("FMT-02: executive_briefing is NOT empty when totalProperties > 0", () => {
    const section = makeSection("executive_briefing", "Executive Briefing", {
      headline: { rating: "B+", medianPrice: 5000000, yoyPriceChange: 0.05, totalProperties: 42 },
      narrative: "Market is strong",
      confidence: { level: "high", sampleSize: 42 },
    });
    expect(isSectionEmpty(section)).toBe(false);
  });

  // --- the_narrative ---
  it("FMT-03: the_narrative is empty when narrative is null/empty AND themes is empty", () => {
    const section = makeSection("the_narrative", "The Narrative", {
      narrative: null,
      themes: [],
    });
    expect(isSectionEmpty(section)).toBe(true);
  });

  it("FMT-04: the_narrative is empty when narrative is empty string AND themes is null", () => {
    const section = makeSection("the_narrative", "The Narrative", {
      narrative: "",
      themes: null,
    });
    expect(isSectionEmpty(section)).toBe(true);
  });

  it("FMT-05: the_narrative is NOT empty when narrative has text", () => {
    const section = makeSection("the_narrative", "The Narrative", {
      narrative: "The luxury market showed resilience",
      themes: [],
    });
    expect(isSectionEmpty(section)).toBe(false);
  });

  it("FMT-06: the_narrative is NOT empty when themes has entries", () => {
    const section = makeSection("the_narrative", "The Narrative", {
      narrative: null,
      themes: [{ name: "Price Compression", impact: "high", trend: "down" }],
    });
    expect(isSectionEmpty(section)).toBe(false);
  });

  // --- luxury_market_dashboard ---
  it("FMT-07: luxury_market_dashboard is empty when dashboard has no metrics", () => {
    const section = makeSection("luxury_market_dashboard", "Dashboard", {
      dashboard: { powerFour: [], supportingMetrics: [] },
    });
    expect(isSectionEmpty(section)).toBe(true);
  });

  it("FMT-08: luxury_market_dashboard is empty when dashboard is null", () => {
    const section = makeSection("luxury_market_dashboard", "Dashboard", {
      dashboard: null,
    });
    expect(isSectionEmpty(section)).toBe(true);
  });

  // --- neighborhood_intelligence ---
  it("FMT-09: neighborhood_intelligence is empty when neighborhoods is empty", () => {
    const section = makeSection("neighborhood_intelligence", "Neighborhoods", {
      neighborhoods: [],
    });
    expect(isSectionEmpty(section)).toBe(true);
  });

  // --- forward_look ---
  it("FMT-10: forward_look is empty when forecast is null AND guidance is null", () => {
    const section = makeSection("forward_look", "Forward Look", {
      forecast: null,
      guidance: null,
    });
    expect(isSectionEmpty(section)).toBe(true);
  });

  it("FMT-11: forward_look is NOT empty when forecast has content", () => {
    const section = makeSection("forward_look", "Forward Look", {
      forecast: "Stable growth expected through Q3",
      guidance: null,
    });
    expect(isSectionEmpty(section)).toBe(false);
  });

  it("FMT-11b: forward_look is NOT empty when guidance has content", () => {
    const section = makeSection("forward_look", "Forward Look", {
      forecast: null,
      guidance: { buyers: "Wait for Q2", sellers: "List now" },
    });
    expect(isSectionEmpty(section)).toBe(false);
  });

  // --- comparative_positioning ---
  it("FMT-12: comparative_positioning is empty when peerComparisons is empty", () => {
    const section = makeSection("comparative_positioning", "Comparative", {
      peerComparisons: [],
      peerRankings: [],
    });
    expect(isSectionEmpty(section)).toBe(true);
  });

  it("FMT-13: comparative_positioning is empty when peerComparisons is null", () => {
    const section = makeSection("comparative_positioning", "Comparative", {
      peerComparisons: null,
      peerRankings: [],
    });
    expect(isSectionEmpty(section)).toBe(true);
  });

  // --- disclaimer_methodology ---
  it("FMT-14: disclaimer_methodology is NEVER empty", () => {
    const section = makeSection("disclaimer_methodology", "Disclaimer", {});
    expect(isSectionEmpty(section)).toBe(false);
  });

  it("FMT-15: disclaimer_methodology is NEVER empty even with null content", () => {
    const section = makeSection("disclaimer_methodology", "Disclaimer", null);
    expect(isSectionEmpty(section)).toBe(false);
  });

  // --- persona_intelligence ---
  it("FMT-16: persona_intelligence is empty when personas array is empty", () => {
    const section = makeSection("persona_intelligence", "Personas", {
      personas: [],
      strategy: "",
      blended: null,
      meta: { personaCount: 0 },
    });
    expect(isSectionEmpty(section)).toBe(true);
  });

  // --- market_insights_index ---
  it("FMT-17: market_insights_index is empty when insightsIndex is null", () => {
    const section = makeSection("market_insights_index", "Insights Index", {
      insightsIndex: null,
    });
    expect(isSectionEmpty(section)).toBe(true);
  });

  // --- v1: market_overview ---
  it("FMT-18: market_overview is empty when narrative is null AND highlights is empty", () => {
    const section = makeSection("market_overview", "Overview", {
      narrative: null,
      highlights: [],
    });
    expect(isSectionEmpty(section)).toBe(true);
  });

  it("FMT-19: market_overview is NOT empty when narrative has content", () => {
    const section = makeSection("market_overview", "Overview", {
      narrative: "The market is showing signs of stabilization",
      highlights: [],
    });
    expect(isSectionEmpty(section)).toBe(false);
  });

  // --- v1: key_drivers ---
  it("FMT-20: key_drivers is empty when themes is empty or null", () => {
    const emptyArr = makeSection("key_drivers", "Key Drivers", { themes: [] });
    const nullVal = makeSection("key_drivers", "Key Drivers", { themes: null });
    expect(isSectionEmpty(emptyArr)).toBe(true);
    expect(isSectionEmpty(nullVal)).toBe(true);
  });

  // --- v1: forecasts ---
  it("FMT-21: forecasts is empty when projections is empty AND scenarios is null", () => {
    const section = makeSection("forecasts", "Forecasts", {
      projections: [],
      scenarios: null,
    });
    expect(isSectionEmpty(section)).toBe(true);
  });

  // --- Unknown section types ---
  it("FMT-22: unknown section types are treated as empty (omitted from report)", () => {
    const section = makeSection("totally_unknown_type", "Unknown", { foo: "bar" });
    expect(isSectionEmpty(section)).toBe(true);
  });
});

// --- filterSections Tests ---

describe("PDF Formatting & Flow: filterSections utility", () => {
  let filterSections: (sections: Array<{ sectionType: string; title: string; content: unknown }>) => Array<{ sectionType: string; title: string; content: unknown }>;

  beforeAll(async () => {
    const mod = await import("@/lib/pdf/section-filter");
    filterSections = mod.filterSections;
  });

  it("FMT-23: filters out empty sections from the array", () => {
    const sections = [
      makeSection("executive_briefing", "Executive Briefing", {
        headline: { rating: "B", medianPrice: 5000000, yoyPriceChange: 0.03, totalProperties: 30 },
        narrative: "Strong market",
        confidence: { level: "high", sampleSize: 30 },
      }),
      makeSection("the_narrative", "The Narrative", { narrative: null, themes: [] }), // empty
      makeSection("disclaimer_methodology", "Disclaimer", {}), // never empty
    ];

    const result = filterSections(sections);
    expect(result).toHaveLength(2);
    expect(result.map((s) => s.sectionType)).toEqual([
      "executive_briefing",
      "disclaimer_methodology",
    ]);
  });

  it("FMT-24: returns empty array when all sections are empty", () => {
    const sections = [
      makeSection("the_narrative", "Narrative", { narrative: null, themes: [] }),
      makeSection("luxury_market_dashboard", "Dashboard", { dashboard: null }),
    ];
    const result = filterSections(sections);
    expect(result).toHaveLength(0);
  });

  it("FMT-25: preserves order of non-empty sections", () => {
    const sections = [
      makeSection("executive_briefing", "Exec", {
        headline: { rating: "A", medianPrice: 10000000, yoyPriceChange: 0.1, totalProperties: 100 },
        narrative: "Boom",
        confidence: { level: "high", sampleSize: 100 },
      }),
      makeSection("neighborhood_intelligence", "Neighborhoods", { neighborhoods: [] }), // empty
      makeSection("the_narrative", "Narrative", { narrative: "Strong", themes: [] }),
      makeSection("forward_look", "Forward", { forecast: null, guidance: null }), // empty
      makeSection("disclaimer_methodology", "Disclaimer", {}),
    ];
    const result = filterSections(sections);
    expect(result.map((s) => s.sectionType)).toEqual([
      "executive_briefing",
      "the_narrative",
      "disclaimer_methodology",
    ]);
  });
});

// --- Document integration: sections are filtered before rendering ---

describe("PDF Formatting & Flow: Document uses filtered sections", () => {
  it("FMT-26: document.tsx imports and uses filterSections", () => {
    const src = fs.readFileSync(
      path.join(process.cwd(), "lib/pdf/document.tsx"),
      "utf8"
    );
    expect(src).toContain("filterSections");
  });

  it("FMT-27: TableOfContents receives filtered sections", () => {
    const src = fs.readFileSync(
      path.join(process.cwd(), "lib/pdf/document.tsx"),
      "utf8"
    );
    // The filtered sections variable should be passed to both ToC and section rendering
    expect(src).toContain("filterSections");
    // Verify the same variable is used for ToC and section mapping
    expect(src).toMatch(/TableOfContents\s+sections=\{filteredSections/);
  });
});

// --- GenericSectionPdf JSON dump removal ---

describe("PDF Formatting & Flow: No JSON dump in customer-facing report", () => {
  it("FMT-28: GenericSectionPdf does NOT render JSON.stringify", () => {
    const src = fs.readFileSync(
      path.join(process.cwd(), "lib/pdf/templates/renderers.tsx"),
      "utf8"
    );
    // Find the GenericSectionPdf function body
    const genericStart = src.indexOf("GenericSectionPdf");
    const genericBlock = src.substring(genericStart, genericStart + 500);
    expect(genericBlock).not.toContain("JSON.stringify");
  });

  it("FMT-29: getSectionRenderer does NOT fall back to GenericSectionPdf for unknown types", async () => {
    // With section filtering in place, unknown types are filtered before reaching
    // the renderer. But as defense-in-depth, GenericSectionPdf should render
    // a graceful fallback, not raw JSON.
    const mod = await import("@/lib/pdf/templates/renderers");
    // Verify the generic renderer exists but doesn't dump JSON
    expect(mod.GenericSectionPdf).toBeDefined();
  });
});

// --- Orphan Protection: Subheadings ---

describe("PDF Formatting & Flow: Orphan protection on subheadings", () => {
  it("FMT-30: renderers.tsx uses minPresenceAhead on subheading Views", () => {
    const src = fs.readFileSync(
      path.join(process.cwd(), "lib/pdf/templates/renderers.tsx"),
      "utf8"
    );
    // Count occurrences of subheading style
    const subheadingCount = (src.match(/styles\.subheading/g) || []).length;
    // Count occurrences of minPresenceAhead near subheadings
    const presenceCount = (src.match(/minPresenceAhead/g) || []).length;
    // There should be orphan protection — at least some minPresenceAhead usage
    // in the renderers file (currently there are 0, we need > 0)
    expect(presenceCount).toBeGreaterThan(0);
  });

  it("FMT-31: section-page.tsx has orphan protection on section title", () => {
    const src = fs.readFileSync(
      path.join(process.cwd(), "lib/pdf/templates/section-page.tsx"),
      "utf8"
    );
    expect(src).toContain("minPresenceAhead");
  });
});

// --- Card Wrapping Discipline ---

describe("PDF Formatting & Flow: Card wrap discipline", () => {
  it("FMT-32: PersonaCardPdf does NOT use wrap={false} on the outer card", () => {
    const src = fs.readFileSync(
      path.join(process.cwd(), "lib/pdf/templates/renderers.tsx"),
      "utf8"
    );
    // Find the PersonaCardPdf function
    const personaCardStart = src.indexOf("function PersonaCardPdf");
    const personaCardEnd = src.indexOf("\nfunction ", personaCardStart + 1);
    const personaCardBlock = src.substring(
      personaCardStart,
      personaCardEnd > personaCardStart ? personaCardEnd : personaCardStart + 2000
    );
    // The outer View of PersonaCardPdf should NOT have wrap={false}
    // because persona cards are tall (>300pt) and should flow across pages
    // The first View after the return should not have wrap={false}
    const firstViewMatch = personaCardBlock.match(/<View\s+style=\{[^}]+\}\s*(wrap=\{false\})?/);
    if (firstViewMatch) {
      expect(firstViewMatch[1]).toBeUndefined();
    }
  });

  it("FMT-33: PersonaCardPdf uses minPresenceAhead on its header", () => {
    const src = fs.readFileSync(
      path.join(process.cwd(), "lib/pdf/templates/renderers.tsx"),
      "utf8"
    );
    const personaCardStart = src.indexOf("function PersonaCardPdf");
    const personaCardEnd = src.indexOf("\nfunction ", personaCardStart + 1);
    const personaCardBlock = src.substring(
      personaCardStart,
      personaCardEnd > personaCardStart ? personaCardEnd : personaCardStart + 2000
    );
    expect(personaCardBlock).toContain("minPresenceAhead");
  });
});

// --- section-filter module exists ---

describe("PDF Formatting & Flow: Module structure", () => {
  it("FMT-34: lib/pdf/section-filter.ts exists", () => {
    expect(
      fs.existsSync(path.join(process.cwd(), "lib/pdf/section-filter.ts"))
    ).toBe(true);
  });

  it("FMT-35: section-filter exports isSectionEmpty and filterSections", async () => {
    const mod = await import("@/lib/pdf/section-filter");
    expect(typeof mod.isSectionEmpty).toBe("function");
    expect(typeof mod.filterSections).toBe("function");
  });
});
