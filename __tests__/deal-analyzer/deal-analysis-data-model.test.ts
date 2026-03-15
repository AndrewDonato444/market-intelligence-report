/**
 * Deal Analysis Data Model Tests
 *
 * Spec: .specs/features/deal-analyzer/deal-analysis-data-model.feature.md
 * ID: DA-001 through DA-045
 */

import fs from "fs";
import path from "path";
import * as schema from "@/lib/db/schema";

describe("Deal Analysis Data Model (#220)", () => {
  describe("Schema — dealAnalyses table", () => {
    it("DA-001: exports dealAnalyses table", () => {
      expect(schema.dealAnalyses).toBeDefined();
    });

    const columns = Object.keys(schema.dealAnalyses ?? {});

    it("DA-002: has 'id' column", () => { expect(columns).toContain("id"); });
    it("DA-003: has 'userId' column", () => { expect(columns).toContain("userId"); });
    it("DA-004: has 'marketId' column", () => { expect(columns).toContain("marketId"); });
    it("DA-005: has 'reportId' column", () => { expect(columns).toContain("reportId"); });
    it("DA-006: has 'title' column", () => { expect(columns).toContain("title"); });
    it("DA-007: has 'address' column", () => { expect(columns).toContain("address"); });
    it("DA-008: has 'propertyData' column", () => { expect(columns).toContain("propertyData"); });
    it("DA-009: has 'briefContent' column", () => { expect(columns).toContain("briefContent"); });
    it("DA-010: has 'motivatedSellerScore' column", () => { expect(columns).toContain("motivatedSellerScore"); });
    it("DA-011: has 'motivatedSellerSignals' column", () => { expect(columns).toContain("motivatedSellerSignals"); });
    it("DA-012: has 'status' column", () => { expect(columns).toContain("status"); });
    it("DA-013: has 'errorMessage' column", () => { expect(columns).toContain("errorMessage"); });
    it("DA-014: has 'generatedAt' column", () => { expect(columns).toContain("generatedAt"); });
    it("DA-015: has 'createdAt' column", () => { expect(columns).toContain("createdAt"); });
    it("DA-016: has 'updatedAt' column", () => { expect(columns).toContain("updatedAt"); });
  });

  describe("Schema — column constraints", () => {
    it("DA-017: userId is NOT NULL", () => { expect(schema.dealAnalyses.userId.notNull).toBe(true); });
    it("DA-018: marketId is NOT NULL", () => { expect(schema.dealAnalyses.marketId.notNull).toBe(true); });
    it("DA-019: reportId is NOT NULL", () => { expect(schema.dealAnalyses.reportId.notNull).toBe(true); });
    it("DA-020: title is NOT NULL", () => { expect(schema.dealAnalyses.title.notNull).toBe(true); });
    it("DA-021: address is NOT NULL", () => { expect(schema.dealAnalyses.address.notNull).toBe(true); });
    it("DA-022: status is NOT NULL", () => { expect(schema.dealAnalyses.status.notNull).toBe(true); });
    it("DA-023: createdAt is NOT NULL", () => { expect(schema.dealAnalyses.createdAt.notNull).toBe(true); });
    it("DA-024: updatedAt is NOT NULL", () => { expect(schema.dealAnalyses.updatedAt.notNull).toBe(true); });
    it("DA-025: propertyData is nullable", () => { expect(schema.dealAnalyses.propertyData.notNull).toBe(false); });
    it("DA-026: briefContent is nullable", () => { expect(schema.dealAnalyses.briefContent.notNull).toBe(false); });
    it("DA-027: motivatedSellerScore is nullable", () => { expect(schema.dealAnalyses.motivatedSellerScore.notNull).toBe(false); });
    it("DA-028: motivatedSellerSignals is nullable", () => { expect(schema.dealAnalyses.motivatedSellerSignals.notNull).toBe(false); });
    it("DA-029: errorMessage is nullable", () => { expect(schema.dealAnalyses.errorMessage.notNull).toBe(false); });
    it("DA-030: generatedAt is nullable", () => { expect(schema.dealAnalyses.generatedAt.notNull).toBe(false); });
  });

  describe("Schema — dealAnalysisStatusEnum", () => {
    it("DA-031: exports dealAnalysisStatusEnum", () => { expect(schema.dealAnalysisStatusEnum).toBeDefined(); });
    it("DA-032: enum has 'queued' value", () => { expect(schema.dealAnalysisStatusEnum.enumValues).toContain("queued"); });
    it("DA-033: enum has 'generating' value", () => { expect(schema.dealAnalysisStatusEnum.enumValues).toContain("generating"); });
    it("DA-034: enum has 'completed' value", () => { expect(schema.dealAnalysisStatusEnum.enumValues).toContain("completed"); });
    it("DA-035: enum has 'failed' value", () => { expect(schema.dealAnalysisStatusEnum.enumValues).toContain("failed"); });
    it("DA-036: enum has exactly 4 values", () => { expect(schema.dealAnalysisStatusEnum.enumValues).toHaveLength(4); });
  });

  describe("Schema — TypeScript type exports", () => {
    it("DA-037: DealPropertyData type is structurally valid", () => {
      const validData: schema.DealPropertyData = {
        id: "156786981",
        address: "4100 Gulf Shore Blvd N",
        city: "Naples",
        state: "FL",
        zip: "34103",
        county: "Collier",
        propertyType: "Condo",
        bedrooms: 4,
        bathrooms: 6,
        squareFeet: 8628,
        estimatedValue: 15800000,
        lastSaleDate: "2024-01-15",
        lastSaleAmount: 20000000,
        ownerOccupied: true,
        inherited: false,
        adjustableRate: false,
        saleHistory: [{ date: "2024-01-15", amount: 20000000, buyer: "Robert Linekin" }],
        mortgageHistory: [{ amount: 5000000, rate: 5.37, lender: "Cogent Bank" }],
      };
      expect(validData.id).toBe("156786981");
      expect(validData.city).toBe("Naples");
      expect(validData.saleHistory).toHaveLength(1);
    });

    it("DA-038: DealBriefContent type is structurally valid", () => {
      const validBrief: schema.DealBriefContent = {
        summary: "This property sits 12% above the segment median...",
        pricingAssessment: {
          narrative: "At $2,318/sqft, this property commands a premium...",
          vsMedian: "+12% above segment median",
          vsSegmentComps: "Top quartile for Park Shore waterfront",
          pricePerSqFtContext: "$2,318 vs. $2,067 segment median",
        },
        personaMatch: {
          bestFitPersona: "wealth-preserver",
          matchRationale: "Low-maintenance waterfront with strong equity...",
          talkingPoints: ["Tax basis advantage", "HOA-managed"],
        },
        negotiationPoints: {
          leverageItems: ["1,373 days on market before last sale"],
          dataBackedArguments: ["20% haircut from $25M ask to $20M close"],
          riskFactors: ["Flood zone AE"],
        },
        marketTiming: {
          signal: "buy",
          rationale: "Forecast modeler projects 3-5% appreciation...",
          forecastContext: "Based on Q1 2026 Naples market intelligence",
        },
      };
      expect(validBrief.marketTiming.signal).toBe("buy");
      expect(validBrief.negotiationPoints.leverageItems).toHaveLength(1);
    });

    it("DA-039: MotivatedSellerSignals type is structurally valid", () => {
      const validSignals: schema.MotivatedSellerSignals = {
        inherited: { fired: true, weight: 25 },
        nonOwnerOccupied: { fired: true, weight: 20 },
        adjustableRate: { fired: false, weight: 0 },
        longHoldPeriod: { fired: true, weight: 15, yearsHeld: 20 },
        helocPattern: { fired: true, weight: 10, mortgageCount: 4 },
        highEquity: { fired: true, weight: 15, equityPercent: 68 },
        totalScore: 85,
      };
      expect(validSignals.totalScore).toBe(85);
      expect(validSignals.inherited.fired).toBe(true);
      expect(validSignals.longHoldPeriod.yearsHeld).toBe(20);
    });

    it("DA-040: exports table types (DealAnalysesTable, NewDealAnalysis)", () => {
      expect(schema.dealAnalyses).toBeDefined();
      // Type assertion to verify inferred types exist
      type _Select = schema.DealAnalysesTable;
      type _Insert = schema.NewDealAnalysis;
    });
  });

  describe("Schema — entitlement type update", () => {
    it("DA-041: TierEntitlements includes deal_analyses_per_month", () => {
      const entitlements: schema.TierEntitlements = {
        reports_per_month: 5,
        markets_created: 3,
        social_media_kits: 1,
        email_campaigns: 1,
        personas_per_report: 3,
        transaction_limit: 100,
        deal_analyses_per_month: 10,
      };
      expect(entitlements.deal_analyses_per_month).toBe(10);
    });
  });

  describe("Migration — supabase", () => {
    const migrationDir = path.join(process.cwd(), "supabase/migrations");
    let migrationFile: string | undefined;
    let migrationSql: string;

    beforeAll(() => {
      const files = fs.readdirSync(migrationDir);
      migrationFile = files.find((f) => f.includes("deal_analyses"));
      if (migrationFile) {
        migrationSql = fs.readFileSync(path.join(migrationDir, migrationFile), "utf-8");
      }
    });

    it("DA-042: supabase migration file exists for deal_analyses", () => {
      expect(migrationFile).toBeDefined();
    });

    it("DA-043: migration creates deal_analysis_status enum", () => {
      expect(migrationSql).toContain("deal_analysis_status");
      expect(migrationSql).toContain("queued");
      expect(migrationSql).toContain("generating");
      expect(migrationSql).toContain("completed");
      expect(migrationSql).toContain("failed");
    });

    it("DA-044: migration creates deal_analyses table with correct columns", () => {
      expect(migrationSql).toContain("CREATE TABLE");
      expect(migrationSql).toContain("deal_analyses");
      expect(migrationSql).toContain("user_id");
      expect(migrationSql).toContain("market_id");
      expect(migrationSql).toContain("report_id");
      expect(migrationSql).toContain("title");
      expect(migrationSql).toContain("address");
      expect(migrationSql).toContain("property_data");
      expect(migrationSql).toContain("brief_content");
      expect(migrationSql).toContain("motivated_seller_score");
      expect(migrationSql).toContain("motivated_seller_signals");
      expect(migrationSql).toContain("error_message");
      expect(migrationSql).toContain("generated_at");
    });

    it("DA-045: migration has foreign keys with CASCADE on user_id, market_id, and report_id", () => {
      expect(migrationSql).toContain("REFERENCES users(id) ON DELETE CASCADE");
      expect(migrationSql).toContain("REFERENCES markets(id) ON DELETE CASCADE");
      expect(migrationSql).toContain("REFERENCES reports(id) ON DELETE CASCADE");
    });

    it("DA-046: migration creates indexes", () => {
      expect(migrationSql).toContain("deal_analyses_user_id_idx");
      expect(migrationSql).toContain("deal_analyses_market_id_idx");
      expect(migrationSql).toContain("deal_analyses_report_id_idx");
      expect(migrationSql).toContain("deal_analyses_status_idx");
      expect(migrationSql).toContain("deal_analyses_user_created_idx");
    });
  });

  describe("Migration — lib/db", () => {
    it("DA-047: lib/db migration file exists", () => {
      expect(fs.existsSync(path.join(process.cwd(), "lib/db/migrations/0010_add_deal_analyses.sql"))).toBe(true);
    });

    it("DA-048: lib/db migration creates deal_analyses table", () => {
      const sql = fs.readFileSync(path.join(process.cwd(), "lib/db/migrations/0010_add_deal_analyses.sql"), "utf-8");
      expect(sql).toContain("deal_analyses");
      expect(sql).toContain("CREATE");
    });
  });
});
