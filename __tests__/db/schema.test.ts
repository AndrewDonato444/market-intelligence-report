import fs from "fs";
import path from "path";

// Import schema to verify it compiles and exports correctly
import * as schema from "@/lib/db/schema";

describe("Database Schema", () => {
  describe("Schema file structure", () => {
    it("has lib/db/schema.ts", () => {
      expect(fs.existsSync(path.join(process.cwd(), "lib/db/schema.ts"))).toBe(
        true
      );
    });

    it("has lib/db/index.ts", () => {
      expect(fs.existsSync(path.join(process.cwd(), "lib/db/index.ts"))).toBe(
        true
      );
    });

    it("has drizzle.config.ts", () => {
      expect(
        fs.existsSync(path.join(process.cwd(), "drizzle.config.ts"))
      ).toBe(true);
    });
  });

  describe("Users table", () => {
    it("exports users table", () => {
      expect(schema.users).toBeDefined();
    });

    it("has required columns", () => {
      const columns = Object.keys(schema.users);
      expect(columns).toContain("id");
      expect(columns).toContain("clerkId");
      expect(columns).toContain("email");
      expect(columns).toContain("name");
      expect(columns).toContain("company");
      expect(columns).toContain("logoUrl");
      expect(columns).toContain("brandColors");
      expect(columns).toContain("createdAt");
      expect(columns).toContain("updatedAt");
    });
  });

  describe("Markets table", () => {
    it("exports markets table", () => {
      expect(schema.markets).toBeDefined();
    });

    it("has required columns", () => {
      const columns = Object.keys(schema.markets);
      expect(columns).toContain("id");
      expect(columns).toContain("userId");
      expect(columns).toContain("name");
      expect(columns).toContain("geography");
      expect(columns).toContain("luxuryTier");
      expect(columns).toContain("priceFloor");
      expect(columns).toContain("segments");
      expect(columns).toContain("peerMarkets");
    });
  });

  describe("Reports table", () => {
    it("exports reports table", () => {
      expect(schema.reports).toBeDefined();
    });

    it("has required columns", () => {
      const columns = Object.keys(schema.reports);
      expect(columns).toContain("id");
      expect(columns).toContain("userId");
      expect(columns).toContain("marketId");
      expect(columns).toContain("title");
      expect(columns).toContain("status");
      expect(columns).toContain("config");
      expect(columns).toContain("outputUrl");
      expect(columns).toContain("pdfUrl");
      expect(columns).toContain("version");
      expect(columns).toContain("errorMessage");
    });
  });

  describe("Report sections table", () => {
    it("exports reportSections table", () => {
      expect(schema.reportSections).toBeDefined();
    });

    it("has required columns", () => {
      const columns = Object.keys(schema.reportSections);
      expect(columns).toContain("id");
      expect(columns).toContain("reportId");
      expect(columns).toContain("sectionType");
      expect(columns).toContain("title");
      expect(columns).toContain("content");
      expect(columns).toContain("agentName");
      expect(columns).toContain("sortOrder");
    });
  });

  describe("Cache table", () => {
    it("exports cache table", () => {
      expect(schema.cache).toBeDefined();
    });

    it("has required columns", () => {
      const columns = Object.keys(schema.cache);
      expect(columns).toContain("id");
      expect(columns).toContain("key");
      expect(columns).toContain("source");
      expect(columns).toContain("data");
      expect(columns).toContain("ttlSeconds");
      expect(columns).toContain("expiresAt");
    });
  });

  describe("API usage table", () => {
    it("exports apiUsage table", () => {
      expect(schema.apiUsage).toBeDefined();
    });

    it("has required columns", () => {
      const columns = Object.keys(schema.apiUsage);
      expect(columns).toContain("id");
      expect(columns).toContain("userId");
      expect(columns).toContain("provider");
      expect(columns).toContain("endpoint");
      expect(columns).toContain("cost");
      expect(columns).toContain("tokensUsed");
      expect(columns).toContain("cached");
    });
  });

  describe("Enums", () => {
    it("exports report status enum", () => {
      expect(schema.reportStatusEnum).toBeDefined();
    });

    it("exports report section type enum", () => {
      expect(schema.reportSectionTypeEnum).toBeDefined();
    });

    it("exports luxury tier enum", () => {
      expect(schema.luxuryTierEnum).toBeDefined();
    });
  });
});
