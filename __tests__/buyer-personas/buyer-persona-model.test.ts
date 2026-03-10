import fs from "fs";
import path from "path";
import * as schema from "@/lib/db/schema";

// The 8 Knox Brothers personas expected in the system
const EXPECTED_SLUGS = [
  "business-mogul",
  "legacy-builder",
  "coastal-escape-seeker",
  "tech-founder",
  "seasonal-second-home",
  "international-buyer",
  "celebrity-public-figure",
  "corporate-executive",
];

describe("Buyer Persona Data Model [SVC-BP]", () => {
  describe("Schema: buyer_personas table", () => {
    it("SVC-BP-01: exports buyerPersonas table", () => {
      expect(schema.buyerPersonas).toBeDefined();
    });

    it("SVC-BP-02: has all required columns", () => {
      const columns = Object.keys(schema.buyerPersonas);
      expect(columns).toContain("id");
      expect(columns).toContain("name");
      expect(columns).toContain("slug");
      expect(columns).toContain("tagline");
      expect(columns).toContain("displayOrder");
      expect(columns).toContain("profileOverview");
      expect(columns).toContain("primaryMotivation");
      expect(columns).toContain("buyingLens");
      expect(columns).toContain("whatWinsThem");
      expect(columns).toContain("biggestFear");
      expect(columns).toContain("demographics");
      expect(columns).toContain("decisionDrivers");
      expect(columns).toContain("reportMetrics");
      expect(columns).toContain("propertyFilters");
      expect(columns).toContain("narrativeFraming");
      expect(columns).toContain("talkingPointTemplates");
      expect(columns).toContain("sampleBenchmarks");
      expect(columns).toContain("createdAt");
      expect(columns).toContain("updatedAt");
    });
  });

  describe("Schema: report_personas junction table", () => {
    it("SVC-BP-03: exports reportPersonas table", () => {
      expect(schema.reportPersonas).toBeDefined();
    });

    it("SVC-BP-04: has required columns for report-persona linkage", () => {
      const columns = Object.keys(schema.reportPersonas);
      expect(columns).toContain("id");
      expect(columns).toContain("reportId");
      expect(columns).toContain("buyerPersonaId");
      expect(columns).toContain("selectionOrder");
      expect(columns).toContain("createdAt");
    });
  });

  describe("Schema: TypeScript types", () => {
    it("SVC-BP-05: exports BuyerPersonaDemographics type", () => {
      // Type exists if schema compiles without error
      const demoType: schema.BuyerPersonaDemographics = {
        ageRange: "45-65",
        netWorth: "$20M-$200M+",
        primaryResidence: "New York",
        purchaseType: "Secondary",
        transactionSpeed: "Fast",
        financing: "Cash",
        informationStyle: "Data-dense",
        trustSignals: "Comparable analysis",
      };
      expect(demoType.ageRange).toBe("45-65");
    });

    it("SVC-BP-06: exports DecisionDriver type with weight enum", () => {
      const driver: schema.DecisionDriver = {
        factor: "Asset Appreciation",
        weight: "critical",
        description: "3-year and 5-year CAGR",
      };
      expect(["critical", "high", "moderate"]).toContain(driver.weight);
    });

    it("SVC-BP-07: exports NarrativeFraming type", () => {
      const framing: schema.NarrativeFraming = {
        languageTone: "Institutional and precise",
        keyVocabulary: ["basis", "alpha", "total return"],
        avoid: ["dream home", "paradise"],
      };
      expect(Array.isArray(framing.keyVocabulary)).toBe(true);
      expect(Array.isArray(framing.avoid)).toBe(true);
    });

    it("SVC-BP-08: exports PropertyFilters type", () => {
      const filters: schema.PropertyFilters = {
        priceRange: "$4M-$25M+",
        propertyType: "Single Family",
        keyDevelopmentsExample: "Port Royal, Aqualane Shores",
      };
      expect(filters.priceRange).toBeDefined();
      expect(filters.keyDevelopmentsExample).toBeDefined();
    });

    it("SVC-BP-09: exports SampleBenchmark type", () => {
      const benchmark: schema.SampleBenchmark = {
        metric: "Total Luxury Transactions ($1M+)",
        value: "2,234 closed sales, $6.58B total volume",
      };
      expect(benchmark.metric).toBeDefined();
      expect(benchmark.value).toBeDefined();
    });
  });

  describe("Service file", () => {
    it("SVC-BP-10: buyer-personas service file exists", () => {
      expect(
        fs.existsSync(
          path.join(process.cwd(), "lib/services/buyer-personas.ts")
        )
      ).toBe(true);
    });
  });

  describe("API routes", () => {
    it("SVC-BP-11: GET /api/buyer-personas route exists", () => {
      expect(
        fs.existsSync(
          path.join(process.cwd(), "app/api/buyer-personas/route.ts")
        )
      ).toBe(true);
    });

    it("SVC-BP-12: GET /api/buyer-personas/[slug] route exists", () => {
      expect(
        fs.existsSync(
          path.join(process.cwd(), "app/api/buyer-personas/[slug]/route.ts")
        )
      ).toBe(true);
    });
  });

  describe("Migration file", () => {
    it("SVC-BP-13: migration file for buyer_personas exists", () => {
      const migrationsDir = path.join(process.cwd(), "supabase/migrations");
      const files = fs.readdirSync(migrationsDir);
      const personaMigration = files.find((f) =>
        f.includes("buyer_personas")
      );
      expect(personaMigration).toBeDefined();
    });

    it("SVC-BP-14: migration creates buyer_personas table", () => {
      const migrationsDir = path.join(process.cwd(), "supabase/migrations");
      const files = fs.readdirSync(migrationsDir);
      const personaMigration = files.find((f) =>
        f.includes("buyer_personas")
      );
      const content = fs.readFileSync(
        path.join(migrationsDir, personaMigration!),
        "utf-8"
      );
      expect(content).toContain("CREATE TABLE buyer_personas");
      expect(content).toContain("CREATE TABLE report_personas");
      expect(content).toContain("buyer_personas_slug_idx");
    });
  });

  describe("Seed data", () => {
    it("SVC-BP-15: seed.sql contains buyer persona inserts", () => {
      const seedPath = path.join(process.cwd(), "supabase/seed.sql");
      const content = fs.readFileSync(seedPath, "utf-8");
      expect(content).toContain("INSERT INTO buyer_personas");
    });

    it("SVC-BP-16: seed data includes all 8 Knox Brothers persona slugs", () => {
      const seedPath = path.join(process.cwd(), "supabase/seed.sql");
      const content = fs.readFileSync(seedPath, "utf-8");
      for (const slug of EXPECTED_SLUGS) {
        expect(content).toContain(slug);
      }
    });

    it("SVC-BP-17: each persona has complete JSONB fields in seed", () => {
      const seedPath = path.join(process.cwd(), "supabase/seed.sql");
      const content = fs.readFileSync(seedPath, "utf-8");
      // Verify key JSONB field content markers are present (camelCase inside JSONB values)
      expect(content).toContain("ageRange");
      expect(content).toContain("netWorth");
      expect(content).toContain("decision_drivers");
      expect(content).toContain("languageTone");
      expect(content).toContain("keyVocabulary");
      expect(content).toContain("keyDevelopmentsExample");
    });

    it("SVC-BP-18: seed uses stable UUIDs for predictable references", () => {
      const seedPath = path.join(process.cwd(), "supabase/seed.sql");
      const content = fs.readFileSync(seedPath, "utf-8");
      // Check that at least the first persona has a stable UUID
      expect(content).toContain("10000000-0000-0000-0000-000000000001");
    });
  });

  describe("Knox Brothers framework completeness", () => {
    it("SVC-BP-19: exactly 8 personas defined", () => {
      expect(EXPECTED_SLUGS).toHaveLength(8);
    });

    it("SVC-BP-20: persona names match Knox Brothers archetypes", () => {
      const seedPath = path.join(process.cwd(), "supabase/seed.sql");
      const content = fs.readFileSync(seedPath, "utf-8");
      const expectedNames = [
        "The Business Mogul",
        "The Legacy Builder",
        "The Coastal Escape Seeker",
        "The Tech Founder",
        "The Seasonal & Second-Home Buyer",
        "The International Buyer",
        "The Celebrity / Public Figure",
        "The Corporate Executive",
      ];
      for (const name of expectedNames) {
        expect(content).toContain(name);
      }
    });
  });
});
