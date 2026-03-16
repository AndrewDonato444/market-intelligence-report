/**
 * Social Media Kit Service
 *
 * Orchestrates the full flow of generating a social media kit:
 * validates the report, loads data, calls the Social Media Agent,
 * stores the result in the social_media_kits table.
 */

import { db, schema } from "@/lib/db";
import { eq, and, asc, inArray } from "drizzle-orm";
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
 * Regenerate a single content type in an existing social media kit.
 *
 * 1. Loads the existing kit and validates it's completed
 * 2. Loads report data (same as full generation)
 * 3. Calls Social Media Agent with sectionOnly flag
 * 4. Merges the new content into the existing kit JSONB
 * 5. Updates the kit row (content + updatedAt) without changing status
 */
export async function regenerateKitSection(
  reportId: string,
  userId: string,
  contentType: keyof SocialMediaKitContent
): Promise<SocialMediaKitContent> {
  // 1. Load existing kit
  const [kit] = await db
    .select()
    .from(schema.socialMediaKits)
    .where(
      and(
        eq(schema.socialMediaKits.reportId, reportId),
        eq(schema.socialMediaKits.userId, userId)
      )
    )
    .limit(1);

  if (!kit || !kit.content) {
    throw new Error("Kit not found or has no content");
  }

  // 2. Load report sections + market + personas (same data as full generation)
  const [report] = await db
    .select({
      id: schema.reports.id,
      marketId: schema.reports.marketId,
      config: schema.reports.config,
    })
    .from(schema.reports)
    .where(and(eq(schema.reports.id, reportId), eq(schema.reports.userId, userId)))
    .limit(1);

  if (!report) {
    throw new Error(`Report ${reportId} not found`);
  }

  const sections = await db
    .select({
      sectionType: schema.reportSections.sectionType,
      title: schema.reportSections.title,
      content: schema.reportSections.content,
    })
    .from(schema.reportSections)
    .where(eq(schema.reportSections.reportId, reportId))
    .orderBy(asc(schema.reportSections.sortOrder));

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

  const personas = await getReportPersonas(reportId);

  const analyticsSection = sections.find(
    (s) => s.sectionType === "luxury_market_dashboard" || s.sectionType === "market_overview"
  );
  const computedAnalytics = (report.config as any)?.computedAnalytics
    ?? analyticsSection?.content
    ?? null;

  // 3. Call the Social Media Agent with sectionOnly
  const agentInput: SocialMediaAgentInput = {
    reportSections: sections,
    computedAnalytics,
    market: market as SocialMediaAgentInput["market"],
    personas: personas.map((p) => ({
      selectionOrder: p.selectionOrder,
      persona: p.persona as SocialMediaAgentInput["personas"][number]["persona"],
    })),
    sectionOnly: contentType,
  };

  const result = await executeSocialMediaAgent(agentInput);

  // 4. Merge: replace only the requested content type, preserve the rest
  const mergedContent: SocialMediaKitContent = {
    ...kit.content,
    [contentType]: result.content[contentType],
  };

  // 5. Update the kit row (content + updatedAt only — status stays "completed")
  await db
    .update(schema.socialMediaKits)
    .set({
      content: mergedContent,
      updatedAt: new Date(),
    })
    .where(eq(schema.socialMediaKits.id, kit.id));

  return mergedContent;
}

/**
 * Get the social media kit for a report.
 */
export async function getSocialMediaKit(reportId: string) {
  try {
    const [kit] = await db
      .select()
      .from(schema.socialMediaKits)
      .where(eq(schema.socialMediaKits.reportId, reportId))
      .limit(1);

    return kit ?? null;
  } catch (error) {
    console.error("[getSocialMediaKit] Database query failed:", error);
    return null;
  }
}

/**
 * Delete a social media kit by ID.
 * Used before regeneration or retry.
 */
export async function deleteSocialMediaKit(kitId: string) {
  await db
    .delete(schema.socialMediaKits)
    .where(eq(schema.socialMediaKits.id, kitId));
}

/**
 * Get kit statuses for multiple reports (batch query for dashboard).
 * Returns a map of reportId -> { status, errorMessage }.
 */
export async function getKitStatusesForReports(
  reportIds: string[]
): Promise<Map<string, { status: string; errorMessage: string | null }>> {
  if (reportIds.length === 0) return new Map();

  try {
    const kits = await db
      .select({
        reportId: schema.socialMediaKits.reportId,
        status: schema.socialMediaKits.status,
        errorMessage: schema.socialMediaKits.errorMessage,
      })
      .from(schema.socialMediaKits)
      .where(inArray(schema.socialMediaKits.reportId, reportIds));

    const map = new Map<string, { status: string; errorMessage: string | null }>();
    for (const kit of kits) {
      map.set(kit.reportId, { status: kit.status, errorMessage: kit.errorMessage });
    }
    return map;
  } catch (error) {
    console.error("[getKitStatusesForReports] Database query failed:", error);
    return new Map();
  }
}
