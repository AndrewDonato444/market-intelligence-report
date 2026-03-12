/**
 * Social Media Kit Service
 *
 * Orchestrates the full flow of generating a social media kit:
 * validates the report, loads data, calls the Social Media Agent,
 * stores the result in the social_media_kits table.
 */

import { db, schema } from "@/lib/db";
import { eq, and, asc } from "drizzle-orm";
import {
  executeSocialMediaAgent,
  type SocialMediaAgentInput,
} from "@/lib/agents/social-media";
import { getReportPersonas } from "@/lib/services/buyer-personas";
import type { SocialMediaKitContent } from "@/lib/db/schema";

/**
 * Generate a social media kit for a completed report.
 *
 * 1. Validates report exists and is completed
 * 2. Loads report sections + computed analytics
 * 3. Loads selected personas (if any)
 * 4. Creates social_media_kits row (queued → generating)
 * 5. Calls Social Media Agent
 * 6. Stores result (completed) or error (failed)
 */
export async function generateSocialMediaKit(
  reportId: string,
  userId: string
): Promise<{ kitId: string; content: SocialMediaKitContent }> {
  // 1. Validate report exists and belongs to user
  const [report] = await db
    .select({
      id: schema.reports.id,
      status: schema.reports.status,
      userId: schema.reports.userId,
      marketId: schema.reports.marketId,
      config: schema.reports.config,
    })
    .from(schema.reports)
    .where(and(eq(schema.reports.id, reportId), eq(schema.reports.userId, userId)))
    .limit(1);

  if (!report) {
    throw new Error(`Report ${reportId} not found or does not belong to user`);
  }

  if (report.status !== "completed") {
    throw new Error(
      `Report ${reportId} is not completed (status: ${report.status}). Cannot generate social media kit.`
    );
  }

  // 2. Load report sections
  const sections = await db
    .select({
      sectionType: schema.reportSections.sectionType,
      title: schema.reportSections.title,
      content: schema.reportSections.content,
    })
    .from(schema.reportSections)
    .where(eq(schema.reportSections.reportId, reportId))
    .orderBy(asc(schema.reportSections.sortOrder));

  if (sections.length === 0) {
    throw new Error(`Report ${reportId} has no sections`);
  }

  // 3. Load market data
  const [market] = await db
    .select({
      name: schema.markets.name,
      geography: schema.markets.geography,
      luxuryTier: schema.markets.luxuryTier,
      priceFloor: schema.markets.priceFloor,
      priceCeiling: schema.markets.priceCeiling,
    })
    .from(schema.markets)
    .where(eq(schema.markets.id, report.marketId))
    .limit(1);

  if (!market) {
    throw new Error(`Market not found for report ${reportId}`);
  }

  // 4. Load personas (if any)
  const personas = await getReportPersonas(reportId);

  // 5. Load computed analytics from the report config or sections
  // The computed analytics are stored in the report's assembled data
  const analyticsSection = sections.find(
    (s) => s.sectionType === "luxury_market_dashboard" || s.sectionType === "market_overview"
  );
  const computedAnalytics = (report.config as any)?.computedAnalytics
    ?? analyticsSection?.content
    ?? null;

  // 6. Create kit row (queued)
  const [kit] = await db
    .insert(schema.socialMediaKits)
    .values({
      reportId,
      userId,
      status: "queued",
    })
    .returning({ id: schema.socialMediaKits.id });

  // 7. Update to generating
  await db
    .update(schema.socialMediaKits)
    .set({ status: "generating" })
    .where(eq(schema.socialMediaKits.id, kit.id));

  try {
    // 8. Call the Social Media Agent
    const agentInput: SocialMediaAgentInput = {
      reportSections: sections,
      computedAnalytics,
      market: market as SocialMediaAgentInput["market"],
      personas: personas.map((p) => ({
        selectionOrder: p.selectionOrder,
        persona: p.persona as SocialMediaAgentInput["personas"][number]["persona"],
      })),
    };

    const result = await executeSocialMediaAgent(agentInput);

    // 9. Store result
    await db
      .update(schema.socialMediaKits)
      .set({
        status: "completed",
        content: result.content,
        generatedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(schema.socialMediaKits.id, kit.id));

    return { kitId: kit.id, content: result.content };
  } catch (error: unknown) {
    // Update status to failed
    const message = error instanceof Error ? error.message : "Unknown error";
    await db
      .update(schema.socialMediaKits)
      .set({
        status: "failed",
        errorMessage: message,
        updatedAt: new Date(),
      })
      .where(eq(schema.socialMediaKits.id, kit.id));

    throw error;
  }
}

/**
 * Get the social media kit for a report.
 */
export async function getSocialMediaKit(reportId: string) {
  const [kit] = await db
    .select()
    .from(schema.socialMediaKits)
    .where(eq(schema.socialMediaKits.reportId, reportId))
    .limit(1);

  return kit ?? null;
}
