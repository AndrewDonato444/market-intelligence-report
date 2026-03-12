/**
 * Social Media Kit Data Model Tests
 *
 * Spec: .specs/features/social-media-kit/data-model.feature.md
 * ID: SMK-001 through SMK-033
 */

import fs from "fs";
import path from "path";
import * as schema from "@/lib/db/schema";

describe("Social Media Kit Data Model (#160)", () => {
  describe("Schema — socialMediaKits table", () => {
    it("SMK-001: exports socialMediaKits table", () => {
      expect(schema.socialMediaKits).toBeDefined();
    });

    const columns = Object.keys(schema.socialMediaKits ?? {});

    it("SMK-002: has 'id' column", () => { expect(columns).toContain("id"); });
    it("SMK-003: has 'reportId' column", () => { expect(columns).toContain("reportId"); });
    it("SMK-004: has 'userId' column", () => { expect(columns).toContain("userId"); });
    it("SMK-005: has 'status' column", () => { expect(columns).toContain("status"); });
    it("SMK-006: has 'content' column", () => { expect(columns).toContain("content"); });
    it("SMK-007: has 'errorMessage' column", () => { expect(columns).toContain("errorMessage"); });
    it("SMK-008: has 'generatedAt' column", () => { expect(columns).toContain("generatedAt"); });
    it("SMK-009: has 'createdAt' column", () => { expect(columns).toContain("createdAt"); });
    it("SMK-010: has 'updatedAt' column", () => { expect(columns).toContain("updatedAt"); });
  });

  describe("Schema — column constraints", () => {
    it("SMK-011: reportId is not nullable", () => { expect(schema.socialMediaKits.reportId.notNull).toBe(true); });
    it("SMK-012: userId is not nullable", () => { expect(schema.socialMediaKits.userId.notNull).toBe(true); });
    it("SMK-013: status is not nullable", () => { expect(schema.socialMediaKits.status.notNull).toBe(true); });
    it("SMK-014: content is nullable", () => { expect(schema.socialMediaKits.content.notNull).toBe(false); });
    it("SMK-015: errorMessage is nullable", () => { expect(schema.socialMediaKits.errorMessage.notNull).toBe(false); });
    it("SMK-016: generatedAt is nullable", () => { expect(schema.socialMediaKits.generatedAt.notNull).toBe(false); });
    it("SMK-017: createdAt is not nullable", () => { expect(schema.socialMediaKits.createdAt.notNull).toBe(true); });
    it("SMK-018: updatedAt is not nullable", () => { expect(schema.socialMediaKits.updatedAt.notNull).toBe(true); });
  });

  describe("Schema — socialMediaKitStatusEnum", () => {
    it("SMK-019: exports socialMediaKitStatusEnum", () => { expect(schema.socialMediaKitStatusEnum).toBeDefined(); });
    it("SMK-020: enum has 'queued' value", () => { expect(schema.socialMediaKitStatusEnum.enumValues).toContain("queued"); });
    it("SMK-021: enum has 'generating' value", () => { expect(schema.socialMediaKitStatusEnum.enumValues).toContain("generating"); });
    it("SMK-022: enum has 'completed' value", () => { expect(schema.socialMediaKitStatusEnum.enumValues).toContain("completed"); });
    it("SMK-023: enum has 'failed' value", () => { expect(schema.socialMediaKitStatusEnum.enumValues).toContain("failed"); });
    it("SMK-024: enum has exactly 4 values", () => { expect(schema.socialMediaKitStatusEnum.enumValues).toHaveLength(4); });
  });

  describe("Schema — content type exports", () => {
    it("SMK-025: SocialMediaKitContent type is structurally valid", () => {
      const validContent: schema.SocialMediaKitContent = {
        postIdeas: [{ title: "Test", body: "Test body", platforms: ["linkedin"], reportSection: "executive_briefing", insightRef: "test" }],
        captions: [{ platform: "linkedin", caption: "Test", hashtags: ["#test"], characterCount: 4 }],
        personaPosts: [{ personaSlug: "business-mogul", personaName: "Business Mogul", post: "Test", platform: "linkedin", vocabularyUsed: ["ROI"] }],
        polls: [{ question: "Test?", options: ["A", "B"], dataContext: "From report", platform: "linkedin" }],
        conversationStarters: [{ context: "When asked about market", template: "Great question..." }],
        calendarSuggestions: [{ week: 1, theme: "Headlines", postIdeas: ["Test"], platforms: ["linkedin"] }],
        statCallouts: [{ stat: "$6.58B", context: "Total volume", source: "executive_briefing", suggestedCaption: "Look at this" }],
      };
      expect(validContent.postIdeas).toHaveLength(1);
      expect(validContent.captions).toHaveLength(1);
      expect(validContent.personaPosts).toHaveLength(1);
      expect(validContent.polls).toHaveLength(1);
      expect(validContent.conversationStarters).toHaveLength(1);
      expect(validContent.calendarSuggestions).toHaveLength(1);
      expect(validContent.statCallouts).toHaveLength(1);
    });
  });

  describe("Migration file", () => {
    const migrationPath = path.join(process.cwd(), "supabase/migrations/20260311220000_add_social_media_kits.sql");

    it("SMK-026: migration file exists", () => { expect(fs.existsSync(migrationPath)).toBe(true); });
    it("SMK-027: migration creates social_media_kit_status enum", () => {
      const sql = fs.readFileSync(migrationPath, "utf-8");
      expect(sql).toContain("social_media_kit_status");
      expect(sql).toContain("queued");
      expect(sql).toContain("generating");
      expect(sql).toContain("completed");
      expect(sql).toContain("failed");
    });
    it("SMK-028: migration creates social_media_kits table", () => {
      const sql = fs.readFileSync(migrationPath, "utf-8");
      expect(sql).toContain("CREATE TABLE");
      expect(sql).toContain("social_media_kits");
    });
    it("SMK-029: migration has foreign keys with CASCADE", () => {
      const sql = fs.readFileSync(migrationPath, "utf-8");
      expect(sql).toContain("REFERENCES");
      expect(sql).toContain("ON DELETE CASCADE");
    });
    it("SMK-030: migration creates indexes", () => {
      const sql = fs.readFileSync(migrationPath, "utf-8");
      expect(sql).toContain("social_media_kits_report_id_idx");
      expect(sql).toContain("social_media_kits_user_id_idx");
      expect(sql).toContain("social_media_kits_status_idx");
    });
    it("SMK-031: migration has unique constraint on report_id", () => {
      const sql = fs.readFileSync(migrationPath, "utf-8");
      expect(sql).toContain("UNIQUE");
    });
  });

  describe("Drizzle migration file", () => {
    it("SMK-032: lib/db migration file exists", () => {
      expect(fs.existsSync(path.join(process.cwd(), "lib/db/migrations/0005_add_social_media_kits.sql"))).toBe(true);
    });
    it("SMK-033: lib/db migration creates table", () => {
      const sql = fs.readFileSync(path.join(process.cwd(), "lib/db/migrations/0005_add_social_media_kits.sql"), "utf-8");
      expect(sql).toContain("social_media_kits");
      expect(sql).toContain("CREATE");
    });
  });
});
