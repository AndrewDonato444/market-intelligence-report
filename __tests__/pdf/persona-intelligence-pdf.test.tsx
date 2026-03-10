import "@testing-library/jest-dom";

// --- Test data factories ---

function makeTalkingPoint(overrides: Partial<{ headline: string; detail: string; dataSource: string; relevance: string }> = {}) {
  return {
    headline: overrides.headline ?? "Ultra-luxury volume surged 23% YoY",
    detail: overrides.detail ?? "The $10M+ segment saw 47 transactions in 2025, up from 38 in 2024.",
    dataSource: overrides.dataSource ?? "yoy.volumeChange",
    relevance: overrides.relevance ?? "high",
  };
}

function makeMetricEmphasis(overrides: Partial<{ metricName: string; currentValue: string; interpretation: string; priority: "primary" | "secondary" }> = {}) {
  return {
    metricName: overrides.metricName ?? "CAGR by Micro-Market",
    currentValue: overrides.currentValue ?? "8.4%",
    interpretation: overrides.interpretation ?? "Outpacing S&P — alpha play",
    priority: overrides.priority ?? ("primary" as const),
  };
}

function makePersonaContent(overrides: Partial<{
  personaSlug: string;
  personaName: string;
  selectionOrder: number;
  talkingPoints: ReturnType<typeof makeTalkingPoint>[];
  narrativeOverlay: { perspective: string; emphasis: string[]; deEmphasis: string[]; toneGuidance: string };
  metricEmphasis: ReturnType<typeof makeMetricEmphasis>[];
  vocabulary: { preferred: string[]; avoid: string[] };
}> = {}) {
  return {
    personaSlug: overrides.personaSlug ?? "business-mogul",
    personaName: overrides.personaName ?? "The Business Mogul",
    selectionOrder: overrides.selectionOrder ?? 1,
    talkingPoints: overrides.talkingPoints ?? [
      makeTalkingPoint(),
      makeTalkingPoint({ headline: "Waterfront premium commands 34%", detail: "Waterfront properties sell at 34% premium.", dataSource: "waterfrontPremium.index" }),
      makeTalkingPoint({ headline: "Cash buyers dominate at 87%", detail: "Cash transactions signal institutional confidence.", dataSource: "cashBuyer.percentage" }),
      makeTalkingPoint({ headline: "DOM compressed to 34 days", detail: "Days on market dropped 15% YoY.", dataSource: "dom.average" }),
      makeTalkingPoint({ headline: "Price per sqft climbed to $1,247", detail: "Up 12% YoY across luxury segments.", dataSource: "priceSqft.trend" }),
    ],
    narrativeOverlay: overrides.narrativeOverlay ?? {
      perspective: "Frame all insights through capital allocation and total return.",
      emphasis: ["CAGR", "Price/SqFt", "Cash %", "DOM vs Price"],
      deEmphasis: ["Lifestyle", "Design"],
      toneGuidance: "Direct, data-forward, institutional language",
    },
    metricEmphasis: overrides.metricEmphasis ?? [
      makeMetricEmphasis(),
      makeMetricEmphasis({ metricName: "Price/SqFt Trends", currentValue: "$1,247", interpretation: "12% YoY — compression risk", priority: "primary" }),
      makeMetricEmphasis({ metricName: "DOM vs Sold Price", currentValue: "34 / 97%", interpretation: "Tight market — leverage low", priority: "secondary" }),
      makeMetricEmphasis({ metricName: "Waterfront Premium", currentValue: "34%", interpretation: "Stable premium", priority: "secondary" }),
    ],
    vocabulary: overrides.vocabulary ?? {
      preferred: ["basis", "alpha", "total return", "cap rate", "liquidity"],
      avoid: ["dream home", "cozy", "charming", "starter"],
    },
  };
}

function makeBlendedContent() {
  return {
    metricUnion: ["CAGR", "Price/SqFt", "Cash %", "Waterfront Premium", "Furnished %"],
    filterIntersection: {
      priceRange: { min: 8000000, max: 25000000 },
      propertyTypes: ["Single Family", "Estate"],
      communityTypes: ["Waterfront", "Golf"],
    },
    blendedTalkingPoints: [
      makeTalkingPoint({ headline: "Combined: Ultra-luxury across personas", detail: "Blended insight for both buyer types.", dataSource: "blended.combined" }),
      makeTalkingPoint({ headline: "Shared waterfront appeal", detail: "Both personas value waterfront.", dataSource: "blended.waterfront" }),
    ],
    conflicts: [
      { metric: "Days on Market", emphasizedBy: "The Business Mogul", deEmphasizedBy: "The Coastal Escape Seeker", resolution: "Included as secondary context." },
      { metric: "Furnished Percentage", emphasizedBy: "The Coastal Escape Seeker", deEmphasizedBy: "The Business Mogul", resolution: "Noted for lifestyle-oriented personas only." },
    ],
  };
}

function makePersonaIntelligenceSection(personaCount: number = 2, includeBlended: boolean = true) {
  const personas = [];
  const names = [
    { slug: "business-mogul", name: "The Business Mogul" },
    { slug: "coastal-escape-seeker", name: "The Coastal Escape Seeker" },
    { slug: "legacy-builder", name: "The Legacy Builder" },
  ];
  for (let i = 0; i < personaCount; i++) {
    personas.push(makePersonaContent({ personaSlug: names[i].slug, personaName: names[i].name, selectionOrder: i + 1 }));
  }
  return {
    sectionType: "persona_intelligence",
    title: "Persona Intelligence Briefing",
    content: {
      strategy: "hybrid" as const,
      personas,
      blended: includeBlended && personaCount >= 2 ? makeBlendedContent() : null,
      meta: { personaCount, primaryPersona: names[0].name, modelUsed: "claude-sonnet-4-5-20250514", promptTokens: 12000, completionTokens: 3500 },
    },
  };
}

// eslint-disable-next-line @typescript-eslint/no-require-imports
const React = require("react");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { render, screen } = require("@testing-library/react");

describe("Persona Intelligence PDF Renderer", () => {
  describe("Renderer registration", () => {
    it("exports PersonaIntelligencePdf renderer", async () => {
      const mod = await import("@/lib/pdf/templates/renderers");
      expect(mod.PersonaIntelligencePdf).toBeDefined();
      expect(typeof mod.PersonaIntelligencePdf).toBe("function");
    });

    it("dispatches persona_intelligence to PersonaIntelligencePdf", async () => {
      const mod = await import("@/lib/pdf/templates/renderers");
      const renderer = mod.getSectionRenderer("persona_intelligence");
      expect(renderer).toBe(mod.PersonaIntelligencePdf);
      expect(renderer).not.toBe(mod.GenericSectionPdf);
    });
  });

  describe("Persona cards", () => {
    it("renders a card for each persona", async () => {
      const { PersonaIntelligencePdf } = await import("@/lib/pdf/templates/renderers");
      render(React.createElement(PersonaIntelligencePdf, { section: makePersonaIntelligenceSection(2) }));
      expect(screen.getByText("The Business Mogul")).toBeInTheDocument();
      expect(screen.getByText("The Coastal Escape Seeker")).toBeInTheDocument();
    });

    it("marks primary persona with PRIMARY PERSONA label", async () => {
      const { PersonaIntelligencePdf } = await import("@/lib/pdf/templates/renderers");
      render(React.createElement(PersonaIntelligencePdf, { section: makePersonaIntelligenceSection(2) }));
      expect(screen.getByText("PRIMARY PERSONA")).toBeInTheDocument();
    });
  });

  describe("Talking points", () => {
    it("renders talking point headlines", async () => {
      const { PersonaIntelligencePdf } = await import("@/lib/pdf/templates/renderers");
      render(React.createElement(PersonaIntelligencePdf, { section: makePersonaIntelligenceSection(1, false) }));
      expect(screen.getByText("Ultra-luxury volume surged 23% YoY")).toBeInTheDocument();
      expect(screen.getByText("Waterfront premium commands 34%")).toBeInTheDocument();
    });

    it("renders talking point detail text", async () => {
      const { PersonaIntelligencePdf } = await import("@/lib/pdf/templates/renderers");
      render(React.createElement(PersonaIntelligencePdf, { section: makePersonaIntelligenceSection(1, false) }));
      expect(screen.getByText("The $10M+ segment saw 47 transactions in 2025, up from 38 in 2024.")).toBeInTheDocument();
    });

    it("renders humanized data source tag", async () => {
      const { PersonaIntelligencePdf } = await import("@/lib/pdf/templates/renderers");
      render(React.createElement(PersonaIntelligencePdf, { section: makePersonaIntelligenceSection(1, false) }));
      expect(screen.getByText("Source: YoY Volume Change")).toBeInTheDocument();
    });
  });

  describe("Narrative overlay", () => {
    it("renders Narrative Lens with perspective", async () => {
      const { PersonaIntelligencePdf } = await import("@/lib/pdf/templates/renderers");
      render(React.createElement(PersonaIntelligencePdf, { section: makePersonaIntelligenceSection(1, false) }));
      expect(screen.getByText("NARRATIVE LENS")).toBeInTheDocument();
      expect(screen.getByText("Frame all insights through capital allocation and total return.")).toBeInTheDocument();
    });

    it("renders emphasis and de-emphasis items", async () => {
      const { PersonaIntelligencePdf } = await import("@/lib/pdf/templates/renderers");
      render(React.createElement(PersonaIntelligencePdf, { section: makePersonaIntelligenceSection(1, false) }));
      // Multiple elements may match — use getAllByText
      expect(screen.getAllByText(/CAGR/).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Lifestyle/).length).toBeGreaterThan(0);
    });

    it("renders tone guidance", async () => {
      const { PersonaIntelligencePdf } = await import("@/lib/pdf/templates/renderers");
      render(React.createElement(PersonaIntelligencePdf, { section: makePersonaIntelligenceSection(1, false) }));
      expect(screen.getByText("Direct, data-forward, institutional language")).toBeInTheDocument();
    });
  });

  describe("Metric emphasis table", () => {
    it("renders Key Metrics with names, values, interpretations", async () => {
      const { PersonaIntelligencePdf } = await import("@/lib/pdf/templates/renderers");
      render(React.createElement(PersonaIntelligencePdf, { section: makePersonaIntelligenceSection(1, false) }));
      expect(screen.getByText("KEY METRICS")).toBeInTheDocument();
      expect(screen.getByText("CAGR by Micro-Market")).toBeInTheDocument();
      expect(screen.getByText("8.4%")).toBeInTheDocument();
      expect(screen.getByText("Outpacing S&P — alpha play")).toBeInTheDocument();
    });

    it("renders secondary priority metrics", async () => {
      const { PersonaIntelligencePdf } = await import("@/lib/pdf/templates/renderers");
      render(React.createElement(PersonaIntelligencePdf, { section: makePersonaIntelligenceSection(1, false) }));
      expect(screen.getByText("DOM vs Sold Price")).toBeInTheDocument();
      expect(screen.getByText("Waterfront Premium")).toBeInTheDocument();
    });
  });

  describe("Vocabulary guide", () => {
    it("renders preferred terms", async () => {
      const { PersonaIntelligencePdf } = await import("@/lib/pdf/templates/renderers");
      render(React.createElement(PersonaIntelligencePdf, { section: makePersonaIntelligenceSection(1, false) }));
      expect(screen.getByText("VOCABULARY GUIDE")).toBeInTheDocument();
      expect(screen.getByText("basis")).toBeInTheDocument();
      expect(screen.getByText("alpha")).toBeInTheDocument();
    });

    it("renders avoid terms", async () => {
      const { PersonaIntelligencePdf } = await import("@/lib/pdf/templates/renderers");
      render(React.createElement(PersonaIntelligencePdf, { section: makePersonaIntelligenceSection(1, false) }));
      expect(screen.getByText("dream home")).toBeInTheDocument();
      expect(screen.getByText("cozy")).toBeInTheDocument();
    });
  });

  describe("Blended intelligence", () => {
    it("renders BLENDED INTELLIGENCE with 2+ personas", async () => {
      const { PersonaIntelligencePdf } = await import("@/lib/pdf/templates/renderers");
      render(React.createElement(PersonaIntelligencePdf, { section: makePersonaIntelligenceSection(2, true) }));
      expect(screen.getByText("BLENDED INTELLIGENCE")).toBeInTheDocument();
    });

    it("renders blended talking points", async () => {
      const { PersonaIntelligencePdf } = await import("@/lib/pdf/templates/renderers");
      render(React.createElement(PersonaIntelligencePdf, { section: makePersonaIntelligenceSection(2, true) }));
      expect(screen.getByText("Combined: Ultra-luxury across personas")).toBeInTheDocument();
    });

    it("renders metric union", async () => {
      const { PersonaIntelligencePdf } = await import("@/lib/pdf/templates/renderers");
      render(React.createElement(PersonaIntelligencePdf, { section: makePersonaIntelligenceSection(2, true) }));
      expect(screen.getByText("METRIC UNION")).toBeInTheDocument();
    });

    it("renders filter overlap", async () => {
      const { PersonaIntelligencePdf } = await import("@/lib/pdf/templates/renderers");
      render(React.createElement(PersonaIntelligencePdf, { section: makePersonaIntelligenceSection(2, true) }));
      expect(screen.getByText("FILTER OVERLAP")).toBeInTheDocument();
      expect(screen.getByText(/Single Family/)).toBeInTheDocument();
    });
  });

  describe("Blended conflicts", () => {
    it("renders conflicts with attributions and resolution", async () => {
      const { PersonaIntelligencePdf } = await import("@/lib/pdf/templates/renderers");
      render(React.createElement(PersonaIntelligencePdf, { section: makePersonaIntelligenceSection(2, true) }));
      // Conflicts section renders attributions — multiple elements may match across personas
      expect(screen.getAllByText(/Days on Market/).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/emphasized by The Business Mogul/).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/de-emphasized by The Coastal Escape Seeker/).length).toBeGreaterThan(0);
      expect(screen.getByText("Included as secondary context.")).toBeInTheDocument();
    });
  });

  describe("Single persona (no blended)", () => {
    it("renders one persona card, no blended section", async () => {
      const { PersonaIntelligencePdf } = await import("@/lib/pdf/templates/renderers");
      render(React.createElement(PersonaIntelligencePdf, { section: makePersonaIntelligenceSection(1, false) }));
      expect(screen.getByText("The Business Mogul")).toBeInTheDocument();
      expect(screen.queryByText("BLENDED INTELLIGENCE")).not.toBeInTheDocument();
    });
  });

  describe("Data source humanization", () => {
    it("humanizes yoy.volumeChange to Source: YoY Volume Change", async () => {
      const { PersonaIntelligencePdf } = await import("@/lib/pdf/templates/renderers");
      render(React.createElement(PersonaIntelligencePdf, { section: makePersonaIntelligenceSection(1, false) }));
      expect(screen.getByText("Source: YoY Volume Change")).toBeInTheDocument();
    });

    it("humanizes camelCase keys to title case", async () => {
      const { PersonaIntelligencePdf } = await import("@/lib/pdf/templates/renderers");
      const section = makePersonaIntelligenceSection(1, false);
      // Use a unique dataSource that isn't already present in the defaults
      section.content.personas[0].talkingPoints[0].dataSource = "neighborhoodGrowth.annual";
      render(React.createElement(PersonaIntelligencePdf, { section }));
      expect(screen.getByText("Source: Neighborhood Growth Annual")).toBeInTheDocument();
    });
  });
});

describe("PersonaFraming Callout", () => {
  const personaFraming = {
    personaName: "The Business Mogul",
    perspective: "Frame this section through capital allocation and ROI.",
    emphasis: ["CAGR", "Price/SqFt", "Cash %", "DOM"],
    deEmphasis: ["Lifestyle", "Design"],
    toneGuidance: "Direct, data-forward, institutional language",
  };

  describe("Callout rendering", () => {
    it("exports PersonaFramingCallout", async () => {
      const mod = await import("@/lib/pdf/templates/renderers");
      expect(mod.PersonaFramingCallout).toBeDefined();
    });

    it("renders persona name label", async () => {
      const { PersonaFramingCallout } = await import("@/lib/pdf/templates/renderers");
      render(React.createElement(PersonaFramingCallout, { personaFraming }));
      expect(screen.getByText(/Persona Lens: The Business Mogul/)).toBeInTheDocument();
    });

    it("renders perspective text", async () => {
      const { PersonaFramingCallout } = await import("@/lib/pdf/templates/renderers");
      render(React.createElement(PersonaFramingCallout, { personaFraming }));
      expect(screen.getByText("Frame this section through capital allocation and ROI.")).toBeInTheDocument();
    });

    it("renders emphasis items", async () => {
      const { PersonaFramingCallout } = await import("@/lib/pdf/templates/renderers");
      render(React.createElement(PersonaFramingCallout, { personaFraming }));
      expect(screen.getByText(/CAGR/)).toBeInTheDocument();
      expect(screen.getByText(/DOM/)).toBeInTheDocument();
    });
  });

  describe("Callout absence", () => {
    it("renders nothing when personaFraming is null", async () => {
      const { PersonaFramingCallout } = await import("@/lib/pdf/templates/renderers");
      const { container } = render(React.createElement(PersonaFramingCallout, { personaFraming: null }));
      expect(container.innerHTML).toBe("");
    });

    it("renders nothing when personaFraming is undefined", async () => {
      const { PersonaFramingCallout } = await import("@/lib/pdf/templates/renderers");
      const { container } = render(React.createElement(PersonaFramingCallout, { personaFraming: undefined }));
      expect(container.innerHTML).toBe("");
    });
  });

  describe("Section integration", () => {
    it("SectionPage renders callout when personaFraming present", async () => {
      const { SectionPage } = await import("@/lib/pdf/templates/section-page");
      const section = {
        sectionType: "executive_briefing",
        title: "Executive Briefing",
        content: { headline: {}, narrative: null, confidence: {}, personaFraming },
      };
      render(React.createElement(SectionPage, { section, reportTitle: "Test Report", companyName: "Knox" }));
      expect(screen.getByText(/Persona Lens: The Business Mogul/)).toBeInTheDocument();
    });

    it("SectionPage does NOT render callout when personaFraming absent", async () => {
      const { SectionPage } = await import("@/lib/pdf/templates/section-page");
      const section = {
        sectionType: "executive_briefing",
        title: "Executive Briefing",
        content: { headline: {}, narrative: null, confidence: {} },
      };
      render(React.createElement(SectionPage, { section, reportTitle: "Test Report" }));
      expect(screen.queryByText(/Persona Lens/)).not.toBeInTheDocument();
    });
  });
});
