import fs from "fs";
import path from "path";
import "@testing-library/jest-dom";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const React = require("react");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { render, screen, fireEvent, waitFor, act } = require("@testing-library/react");

// Mock next/navigation
const mockPush = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => "/reports/new",
}));

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

const mockMarkets = [
  {
    id: "market-1",
    name: "Naples Luxury",
    geography: { city: "Naples", state: "Florida" },
    luxuryTier: "ultra_luxury",
    isDefault: 1,
  },
];

const mockPersonas = [
  {
    id: "10000000-0000-0000-0000-000000000001",
    name: "The Business Mogul",
    slug: "business-mogul",
    tagline: "Treats real estate as an asset class.",
    displayOrder: 1,
    primaryMotivation: "Status + Asset Strategy",
    buyingLens: "Investment returns and prestige",
    whatWinsThem: "Data, market intelligence, exclusivity",
    biggestFear: "Overpaying",
    profileOverview:
      "Founder, CEO, PE partner, hedge fund manager. Treats real estate as an asset class. Every purchase is underwritten.",
    reportMetrics: [
      { metric: "CAGR by Micro-Market", priority: "critical" },
      { metric: "Price Per Square Foot Trends", priority: "critical" },
      { metric: "Days on Market vs Sold Price", priority: "high" },
    ],
    narrativeFraming: {
      languageTone: "Institutional and precise",
      keyVocabulary: ["basis", "alpha", "total return", "replacement cost", "cap rate"],
      avoid: ["dream home", "paradise"],
    },
    talkingPointTemplates: [
      {
        template:
          "In [period], ultra-luxury volume ($10M+) reached [value], representing...",
      },
    ],
    demographics: { ageRange: "45-65", netWorth: "$20M-$200M+" },
    decisionDrivers: [],
    propertyFilters: {},
    sampleBenchmarks: [],
  },
  {
    id: "10000000-0000-0000-0000-000000000002",
    name: "The Legacy Builder",
    slug: "legacy-builder",
    tagline: "Multi-generational wealth and family legacy.",
    displayOrder: 2,
    primaryMotivation: "Meaning + Legacy",
    buyingLens: "Family and heritage",
    whatWinsThem: "History, craftsmanship, provenance",
    biggestFear: "A property without soul",
    profileOverview: "Values multi-generational wealth and family legacy.",
    reportMetrics: [
      { metric: "Historical Price Appreciation", priority: "critical" },
    ],
    narrativeFraming: {
      languageTone: "Warm and narrative",
      keyVocabulary: ["estate", "legacy", "heritage"],
      avoid: ["flip", "speculation"],
    },
    talkingPointTemplates: [
      { template: "The [community] has attracted families for [decades]..." },
    ],
    demographics: { ageRange: "55-75", netWorth: "$10M-$100M" },
    decisionDrivers: [],
    propertyFilters: {},
    sampleBenchmarks: [],
  },
  {
    id: "10000000-0000-0000-0000-000000000003",
    name: "The Coastal Escape Seeker",
    slug: "coastal-escape-seeker",
    tagline: "Lifestyle, design, and tranquility.",
    displayOrder: 3,
    primaryMotivation: "Lifestyle + Escape",
    buyingLens: "Beauty and tranquility",
    whatWinsThem: "Views, design, lifestyle amenities",
    biggestFear: "Overcrowded tourist area",
    profileOverview: "Seeks beauty, tranquility, and escape.",
    reportMetrics: [],
    narrativeFraming: {
      languageTone: "Evocative and descriptive",
      keyVocabulary: ["waterfront", "sunset", "serenity"],
      avoid: ["investment vehicle"],
    },
    talkingPointTemplates: [
      { template: "The [area] offers unmatched waterfront living..." },
    ],
    demographics: { ageRange: "40-60", netWorth: "$5M-$50M" },
    decisionDrivers: [],
    propertyFilters: {},
    sampleBenchmarks: [],
  },
  {
    id: "10000000-0000-0000-0000-000000000004",
    name: "The Tech Founder",
    slug: "tech-founder",
    tagline: "Smart home, fast close, data first.",
    displayOrder: 4,
    primaryMotivation: "Innovation + Privacy",
    buyingLens: "Tech and efficiency",
    whatWinsThem: "Smart home tech, fast process",
    biggestFear: "Outdated infrastructure",
    profileOverview: "Tech-forward buyer who values efficiency and data.",
    reportMetrics: [],
    narrativeFraming: {
      languageTone: "Direct and data-driven",
      keyVocabulary: ["metrics", "data", "smart"],
      avoid: ["traditional"],
    },
    talkingPointTemplates: [],
    demographics: { ageRange: "30-50", netWorth: "$10M-$500M" },
    decisionDrivers: [],
    propertyFilters: {},
    sampleBenchmarks: [],
  },
];

function buildEightPersonas() {
  const extra = [
    { id: "10000000-0000-0000-0000-000000000005", name: "The Seasonal & Second-Home Buyer", slug: "seasonal-second-home", displayOrder: 5, tagline: "Splits time between primary and vacation.", primaryMotivation: "Seasonal Comfort" },
    { id: "10000000-0000-0000-0000-000000000006", name: "The International Buyer", slug: "international-buyer", displayOrder: 6, tagline: "Cross-border wealth diversification.", primaryMotivation: "Global Diversification" },
    { id: "10000000-0000-0000-0000-000000000007", name: "The Celebrity / Public Figure", slug: "celebrity-public-figure", displayOrder: 7, tagline: "Privacy and prestige above all.", primaryMotivation: "Privacy + Status" },
    { id: "10000000-0000-0000-0000-000000000008", name: "The Corporate Executive", slug: "corporate-executive", displayOrder: 8, tagline: "Strategic relocation, executive lifestyle.", primaryMotivation: "Convenience + Status" },
  ].map((p) => ({
    ...mockPersonas[0],
    ...p,
    buyingLens: "N/A",
    whatWinsThem: "N/A",
    biggestFear: "N/A",
    profileOverview: "Overview text.",
    reportMetrics: [],
    narrativeFraming: { languageTone: "Neutral", keyVocabulary: [], avoid: [] },
    talkingPointTemplates: [],
    demographics: {},
    decisionDrivers: [],
    propertyFilters: {},
    sampleBenchmarks: [],
  }));
  return [...mockPersonas, ...extra];
}

function setupFetchMock(personas = buildEightPersonas()) {
  mockFetch.mockImplementation((url: string, opts?: RequestInit) => {
    if (url === "/api/buyer-personas") {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ personas }),
      });
    }
    if (url === "/api/reports" && opts?.method === "POST") {
      return Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            report: { id: "report-1", title: "Test Report", status: "queued" },
          }),
      });
    }
    return Promise.resolve({
      ok: false,
      json: () => Promise.resolve({ error: "Not found" }),
    });
  });
}

describe("Persona Selection UI [CMP-PSU]", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupFetchMock();
  });

  describe("File structure", () => {
    it("CMP-PSU-01: PersonaCard component file exists", () => {
      expect(
        fs.existsSync(path.join(process.cwd(), "components/reports/persona-card.tsx"))
      ).toBe(true);
    });

    it("CMP-PSU-02: PersonaPreviewPanel component file exists", () => {
      expect(
        fs.existsSync(path.join(process.cwd(), "components/reports/persona-preview-panel.tsx"))
      ).toBe(true);
    });
  });

  describe("Wizard steps", () => {
    it("CMP-PSU-03: wizard shows 4 steps including Personas", async () => {
      const { ReportWizard } = await import("@/components/reports/report-wizard");
      await act(async () => {
        render(React.createElement(ReportWizard, { markets: mockMarkets }));
      });
      expect(screen.getByText("Market")).toBeInTheDocument();
      expect(screen.getByText("Sections")).toBeInTheDocument();
      expect(screen.getByText("Personas")).toBeInTheDocument();
      expect(screen.getByText("Review")).toBeInTheDocument();
    });

    it("CMP-PSU-04: steps are in correct order", async () => {
      const { ReportWizard } = await import("@/components/reports/report-wizard");
      await act(async () => {
        render(React.createElement(ReportWizard, { markets: mockMarkets }));
      });
      const stepTexts = screen.getAllByText(/^(Market|Sections|Personas|Review)$/);
      const labels = stepTexts.map((el: HTMLElement) => el.textContent);
      expect(labels).toEqual(["Market", "Sections", "Personas", "Review"]);
    });
  });

  describe("Persona card display", () => {
    async function renderAtPersonaStep() {
      const { ReportWizard } = await import("@/components/reports/report-wizard");
      await act(async () => {
        render(React.createElement(ReportWizard, { markets: mockMarkets }));
      });
      await act(async () => { fireEvent.click(screen.getByRole("button", { name: /next/i })); });
      await act(async () => { fireEvent.click(screen.getByRole("button", { name: /next/i })); });
      await waitFor(() => { expect(screen.getByText("The Business Mogul")).toBeInTheDocument(); });
    }

    it("CMP-PSU-05: displays all 8 persona cards", async () => {
      await renderAtPersonaStep();
      for (const p of buildEightPersonas()) {
        expect(screen.getByText(p.name)).toBeInTheDocument();
      }
    });

    it("CMP-PSU-06: each card shows name, tagline, and primary motivation", async () => {
      await renderAtPersonaStep();
      expect(screen.getByText("The Business Mogul")).toBeInTheDocument();
      expect(screen.getByText("Treats real estate as an asset class.")).toBeInTheDocument();
      expect(screen.getByText("Status + Asset Strategy")).toBeInTheDocument();
    });

    it("CMP-PSU-07: cards are ordered by display_order", async () => {
      await renderAtPersonaStep();
      const names = buildEightPersonas().map((p) => p.name);
      const renderedCards = screen.getAllByTestId("persona-card");
      const renderedNames = renderedCards.map(
        (card: HTMLElement) => card.querySelector("[data-testid='persona-name']")?.textContent
      );
      expect(renderedNames).toEqual(names);
    });

    it("CMP-PSU-08: no personas are pre-selected", async () => {
      await renderAtPersonaStep();
      const selectedCards = screen.getAllByTestId("persona-card")
        .filter((card: HTMLElement) => card.getAttribute("data-selected") === "true");
      expect(selectedCards).toHaveLength(0);
    });

    it("CMP-PSU-09: each card has a Preview button", async () => {
      await renderAtPersonaStep();
      const previewButtons = screen.getAllByRole("button", { name: /preview/i });
      expect(previewButtons.length).toBeGreaterThanOrEqual(8);
    });
  });

  describe("Persona selection", () => {
    async function renderAtPersonaStep() {
      const { ReportWizard } = await import("@/components/reports/report-wizard");
      await act(async () => {
        render(React.createElement(ReportWizard, { markets: mockMarkets }));
      });
      await act(async () => { fireEvent.click(screen.getByRole("button", { name: /next/i })); });
      await act(async () => { fireEvent.click(screen.getByRole("button", { name: /next/i })); });
      await waitFor(() => { expect(screen.getByText("The Business Mogul")).toBeInTheDocument(); });
    }

    it("CMP-PSU-10: clicking a card selects it", async () => {
      await renderAtPersonaStep();
      const card = screen.getAllByTestId("persona-card")[0];
      await act(async () => { fireEvent.click(card); });
      expect(card.getAttribute("data-selected")).toBe("true");
    });

    it("CMP-PSU-11: selected card shows numbered badge", async () => {
      await renderAtPersonaStep();
      const cards = screen.getAllByTestId("persona-card");
      await act(async () => { fireEvent.click(cards[0]); });
      expect(screen.getByTestId("selection-badge-1")).toBeInTheDocument();
    });

    it("CMP-PSU-12: clicking again deselects the card", async () => {
      await renderAtPersonaStep();
      const card = screen.getAllByTestId("persona-card")[0];
      await act(async () => { fireEvent.click(card); });
      expect(card.getAttribute("data-selected")).toBe("true");
      await act(async () => { fireEvent.click(card); });
      expect(card.getAttribute("data-selected")).toBe("false");
    });

    it("CMP-PSU-13: maximum 3 personas can be selected", async () => {
      await renderAtPersonaStep();
      const cards = screen.getAllByTestId("persona-card");
      await act(async () => { fireEvent.click(cards[0]); });
      await act(async () => { fireEvent.click(cards[1]); });
      await act(async () => { fireEvent.click(cards[2]); });
      await act(async () => { fireEvent.click(cards[3]); });
      expect(cards[3].getAttribute("data-selected")).toBe("false");
    });

    it("CMP-PSU-14: max selection message appears when 4th card clicked", async () => {
      await renderAtPersonaStep();
      const cards = screen.getAllByTestId("persona-card");
      await act(async () => { fireEvent.click(cards[0]); });
      await act(async () => { fireEvent.click(cards[1]); });
      await act(async () => { fireEvent.click(cards[2]); });
      await act(async () => { fireEvent.click(cards[3]); });
      expect(screen.getByText(/Maximum 3 personas/i)).toBeInTheDocument();
    });

    it("CMP-PSU-15: selection order determines badge numbers", async () => {
      await renderAtPersonaStep();
      const cards = screen.getAllByTestId("persona-card");
      await act(async () => { fireEvent.click(cards[1]); });
      await act(async () => { fireEvent.click(cards[0]); });
      expect(screen.getByTestId("selection-badge-1")).toBeInTheDocument();
      expect(screen.getByTestId("selection-badge-2")).toBeInTheDocument();
    });
  });

  describe("Validation", () => {
    async function renderAtPersonaStep() {
      const { ReportWizard } = await import("@/components/reports/report-wizard");
      await act(async () => {
        render(React.createElement(ReportWizard, { markets: mockMarkets }));
      });
      await act(async () => { fireEvent.click(screen.getByRole("button", { name: /next/i })); });
      await act(async () => { fireEvent.click(screen.getByRole("button", { name: /next/i })); });
      await waitFor(() => { expect(screen.getByText("The Business Mogul")).toBeInTheDocument(); });
    }

    it("CMP-PSU-16: cannot advance without selecting at least 1 persona", async () => {
      await renderAtPersonaStep();
      await act(async () => { fireEvent.click(screen.getByRole("button", { name: /next/i })); });
      expect(screen.getByText(/Select at least 1 buyer persona/i)).toBeInTheDocument();
      expect(screen.getByText("The Business Mogul")).toBeInTheDocument();
    });

    it("CMP-PSU-17: can advance after selecting a persona", async () => {
      await renderAtPersonaStep();
      const card = screen.getAllByTestId("persona-card")[0];
      await act(async () => { fireEvent.click(card); });
      await act(async () => { fireEvent.click(screen.getByRole("button", { name: /next/i })); });
      await waitFor(() => { expect(screen.getByText("Report Summary")).toBeInTheDocument(); });
    });
  });

  describe("Preview panel", () => {
    async function renderAtPersonaStep() {
      const { ReportWizard } = await import("@/components/reports/report-wizard");
      await act(async () => {
        render(React.createElement(ReportWizard, { markets: mockMarkets }));
      });
      await act(async () => { fireEvent.click(screen.getByRole("button", { name: /next/i })); });
      await act(async () => { fireEvent.click(screen.getByRole("button", { name: /next/i })); });
      await waitFor(() => { expect(screen.getByText("The Business Mogul")).toBeInTheDocument(); });
    }

    it("CMP-PSU-18: clicking Preview opens the preview panel", async () => {
      await renderAtPersonaStep();
      const previewButtons = screen.getAllByRole("button", { name: /preview/i });
      await act(async () => { fireEvent.click(previewButtons[0]); });
      expect(screen.getByTestId("persona-preview-panel")).toBeInTheDocument();
    });

    it("CMP-PSU-19: preview panel shows persona details", async () => {
      await renderAtPersonaStep();
      const previewButtons = screen.getAllByRole("button", { name: /preview/i });
      await act(async () => { fireEvent.click(previewButtons[0]); });
      expect(screen.getByText(/Founder, CEO, PE partner/)).toBeInTheDocument();
      expect(screen.getByText(/What Wins Them/i)).toBeInTheDocument();
      expect(screen.getByText(/Biggest Fear/i)).toBeInTheDocument();
      expect(screen.getByText("basis")).toBeInTheDocument();
    });

    it("CMP-PSU-20: preview panel shows top report metrics", async () => {
      await renderAtPersonaStep();
      const previewButtons = screen.getAllByRole("button", { name: /preview/i });
      await act(async () => { fireEvent.click(previewButtons[0]); });
      expect(screen.getByText("CAGR by Micro-Market")).toBeInTheDocument();
      expect(screen.getByText("Price Per Square Foot Trends")).toBeInTheDocument();
    });

    it("CMP-PSU-21: preview panel shows sample talking point", async () => {
      await renderAtPersonaStep();
      const previewButtons = screen.getAllByRole("button", { name: /preview/i });
      await act(async () => { fireEvent.click(previewButtons[0]); });
      expect(screen.getByText(/ultra-luxury volume/)).toBeInTheDocument();
    });

    it("CMP-PSU-22: preview panel can be closed", async () => {
      await renderAtPersonaStep();
      const previewButtons = screen.getAllByRole("button", { name: /preview/i });
      await act(async () => { fireEvent.click(previewButtons[0]); });
      expect(screen.getByTestId("persona-preview-panel")).toBeInTheDocument();
      await act(async () => { fireEvent.click(screen.getByRole("button", { name: /close preview/i })); });
      expect(screen.queryByTestId("persona-preview-panel")).not.toBeInTheDocument();
    });

    it("CMP-PSU-23: clicking Preview on different persona switches panel", async () => {
      await renderAtPersonaStep();
      const previewButtons = screen.getAllByRole("button", { name: /preview/i });
      await act(async () => { fireEvent.click(previewButtons[0]); });
      expect(screen.getByText(/Founder, CEO, PE partner/)).toBeInTheDocument();
      await act(async () => { fireEvent.click(previewButtons[1]); });
      expect(screen.getByText(/Multi-generational wealth/)).toBeInTheDocument();
    });
  });

  describe("Review step", () => {
    async function renderAtReviewStep() {
      const { ReportWizard } = await import("@/components/reports/report-wizard");
      await act(async () => {
        render(React.createElement(ReportWizard, { markets: mockMarkets }));
      });
      await act(async () => { fireEvent.click(screen.getByRole("button", { name: /next/i })); });
      await act(async () => { fireEvent.click(screen.getByRole("button", { name: /next/i })); });
      await waitFor(() => { expect(screen.getByText("The Business Mogul")).toBeInTheDocument(); });
      const cards = screen.getAllByTestId("persona-card");
      await act(async () => { fireEvent.click(cards[0]); });
      await act(async () => { fireEvent.click(cards[2]); });
      await act(async () => { fireEvent.click(screen.getByRole("button", { name: /next/i })); });
      await waitFor(() => { expect(screen.getByText("Report Summary")).toBeInTheDocument(); });
    }

    it("CMP-PSU-24: Review step shows Buyer Personas row", async () => {
      await renderAtReviewStep();
      expect(screen.getByText("Buyer Personas")).toBeInTheDocument();
    });

    it("CMP-PSU-25: Review step shows selected persona names in order", async () => {
      await renderAtReviewStep();
      expect(screen.getByText(/1\. The Business Mogul/)).toBeInTheDocument();
      expect(screen.getByText(/2\. The Coastal Escape Seeker/)).toBeInTheDocument();
    });
  });

  describe("Submit with personas", () => {
    it("CMP-PSU-26: report creation payload includes personaIds", async () => {
      const { ReportWizard } = await import("@/components/reports/report-wizard");
      await act(async () => {
        render(React.createElement(ReportWizard, { markets: mockMarkets }));
      });
      await act(async () => { fireEvent.click(screen.getByRole("button", { name: /next/i })); });
      await act(async () => { fireEvent.click(screen.getByRole("button", { name: /next/i })); });
      await waitFor(() => { expect(screen.getByText("The Business Mogul")).toBeInTheDocument(); });
      const cards = screen.getAllByTestId("persona-card");
      await act(async () => { fireEvent.click(cards[0]); });
      await act(async () => { fireEvent.click(cards[1]); });
      await act(async () => { fireEvent.click(screen.getByRole("button", { name: /next/i })); });
      await waitFor(() => { expect(screen.getByText("Report Summary")).toBeInTheDocument(); });
      await act(async () => { fireEvent.click(screen.getByRole("button", { name: /generate report/i })); });
      const postCall = mockFetch.mock.calls.find(
        (c: [string, RequestInit?]) => c[0] === "/api/reports" && c[1]?.method === "POST"
      );
      expect(postCall).toBeDefined();
      const body = JSON.parse(postCall[1].body);
      expect(body.personaIds).toEqual([
        "10000000-0000-0000-0000-000000000001",
        "10000000-0000-0000-0000-000000000002",
      ]);
    });
  });

  describe("Navigation preservation", () => {
    it("CMP-PSU-27: back then forward preserves persona selections", async () => {
      const { ReportWizard } = await import("@/components/reports/report-wizard");
      await act(async () => {
        render(React.createElement(ReportWizard, { markets: mockMarkets }));
      });
      await act(async () => { fireEvent.click(screen.getByRole("button", { name: /next/i })); });
      await act(async () => { fireEvent.click(screen.getByRole("button", { name: /next/i })); });
      await waitFor(() => { expect(screen.getByText("The Business Mogul")).toBeInTheDocument(); });
      const cards = screen.getAllByTestId("persona-card");
      await act(async () => { fireEvent.click(cards[0]); });
      await act(async () => { fireEvent.click(cards[1]); });
      await act(async () => { fireEvent.click(screen.getByRole("button", { name: /back/i })); });
      await act(async () => { fireEvent.click(screen.getByRole("button", { name: /next/i })); });
      await waitFor(() => { expect(screen.getByText("The Business Mogul")).toBeInTheDocument(); });
      const selectedCards = screen.getAllByTestId("persona-card")
        .filter((card: HTMLElement) => card.getAttribute("data-selected") === "true");
      expect(selectedCards).toHaveLength(2);
    });
  });

  describe("Empty personas state", () => {
    it("CMP-PSU-28: shows message when no personas exist", async () => {
      setupFetchMock([]);
      const { ReportWizard } = await import("@/components/reports/report-wizard");
      await act(async () => {
        render(React.createElement(ReportWizard, { markets: mockMarkets }));
      });
      await act(async () => { fireEvent.click(screen.getByRole("button", { name: /next/i })); });
      await act(async () => { fireEvent.click(screen.getByRole("button", { name: /next/i })); });
      await waitFor(() => {
        expect(screen.getByText(/No buyer personas available/i)).toBeInTheDocument();
      });
    });

    it("CMP-PSU-29: Next is enabled when no personas exist in system", async () => {
      setupFetchMock([]);
      const { ReportWizard } = await import("@/components/reports/report-wizard");
      await act(async () => {
        render(React.createElement(ReportWizard, { markets: mockMarkets }));
      });
      await act(async () => { fireEvent.click(screen.getByRole("button", { name: /next/i })); });
      await act(async () => { fireEvent.click(screen.getByRole("button", { name: /next/i })); });
      await waitFor(() => {
        expect(screen.getByText(/No buyer personas available/i)).toBeInTheDocument();
      });
      const nextBtn = screen.getByRole("button", { name: /next/i });
      expect(nextBtn).not.toBeDisabled();
    });
  });

  describe("Fetch error handling", () => {
    it("CMP-PSU-30: shows error with Retry button on fetch failure", async () => {
      mockFetch.mockImplementation((url: string) => {
        if (url === "/api/buyer-personas") {
          return Promise.resolve({
            ok: false,
            json: () => Promise.resolve({ error: "Server error" }),
          });
        }
        return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
      });
      const { ReportWizard } = await import("@/components/reports/report-wizard");
      await act(async () => {
        render(React.createElement(ReportWizard, { markets: mockMarkets }));
      });
      await act(async () => { fireEvent.click(screen.getByRole("button", { name: /next/i })); });
      await act(async () => { fireEvent.click(screen.getByRole("button", { name: /next/i })); });
      await waitFor(() => {
        expect(screen.getByRole("button", { name: /retry/i })).toBeInTheDocument();
      });
    });
  });

  describe("API route updates", () => {
    it("CMP-PSU-31: POST /api/reports route handles personaIds in body", () => {
      const routeContent = fs.readFileSync(
        path.join(process.cwd(), "app/api/reports/route.ts"), "utf8"
      );
      expect(routeContent).toContain("personaIds");
      expect(routeContent).toContain("setReportPersonas");
    });

    it("CMP-PSU-32: report service createReport accepts personaIds", () => {
      const serviceContent = fs.readFileSync(
        path.join(process.cwd(), "lib/services/report.ts"), "utf8"
      );
      expect(serviceContent).toContain("personaIds");
      expect(serviceContent).toContain("setReportPersonas");
    });
  });
});
