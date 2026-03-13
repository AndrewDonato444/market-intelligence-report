/**
 * Email Campaign Service
 *
 * Orchestrates the full flow of generating an email campaign:
 * validates the report, loads data, calls the Email Campaign Agent,
 * stores the result in the email_campaigns table.
 */

import { db, schema } from "@/lib/db";
import { eq, and, asc, inArray } from "drizzle-orm";
import {
  executeEmailCampaignAgent,
  type EmailCampaignAgentInput,
} from "@/lib/agents/email-campaign";
import { getReportPersonas } from "@/lib/services/buyer-personas";
import type { EmailCampaignContent } from "@/lib/db/schema";

/**
 * Generate an email campaign for a completed report.
 *
 * 1. Validates report exists and is completed
 * 2. Loads report sections + computed analytics
 * 3. Loads selected personas (if any)
 * 4. Creates email_campaigns row (queued → generating)
 * 5. Calls Email Campaign Agent
 * 6. Stores result (completed) or error (failed)
 */
export async function generateEmailCampaign(
  reportId: string,
  userId: string
): Promise<{ campaignId: string; content: EmailCampaignContent }> {
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
      `Report ${reportId} is not completed (status: ${report.status}). Cannot generate email campaign.`
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
  const analyticsSection = sections.find(
    (s) => s.sectionType === "luxury_market_dashboard" || s.sectionType === "market_overview"
  );
  const computedAnalytics = (report.config as any)?.computedAnalytics
    ?? analyticsSection?.content
    ?? null;

  // 6. Create campaign row (queued)
  const [campaign] = await db
    .insert(schema.emailCampaigns)
    .values({
      reportId,
      userId,
      status: "queued",
    })
    .returning({ id: schema.emailCampaigns.id });

  // 7. Update to generating
  await db
    .update(schema.emailCampaigns)
    .set({ status: "generating" })
    .where(eq(schema.emailCampaigns.id, campaign.id));

  try {
    // 8. Call the Email Campaign Agent
    const agentInput: EmailCampaignAgentInput = {
      reportSections: sections,
      computedAnalytics,
      market: market as EmailCampaignAgentInput["market"],
      personas: personas.map((p) => ({
        selectionOrder: p.selectionOrder,
        persona: p.persona as EmailCampaignAgentInput["personas"][number]["persona"],
      })),
    };

    const result = await executeEmailCampaignAgent(agentInput);

    // 9. Store result
    await db
      .update(schema.emailCampaigns)
      .set({
        status: "completed",
        content: result.content,
        generatedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(schema.emailCampaigns.id, campaign.id));

    return { campaignId: campaign.id, content: result.content };
  } catch (error: unknown) {
    // Update status to failed
    const message = error instanceof Error ? error.message : "Unknown error";
    await db
      .update(schema.emailCampaigns)
      .set({
        status: "failed",
        errorMessage: message,
        updatedAt: new Date(),
      })
      .where(eq(schema.emailCampaigns.id, campaign.id));

    throw error;
  }
}

/**
 * Regenerate a single content type in an existing email campaign.
 *
 * 1. Loads the existing campaign and validates it's completed
 * 2. Loads report data (same as full generation)
 * 3. Calls Email Campaign Agent with sectionOnly flag
 * 4. Merges the new content into the existing campaign JSONB
 * 5. Updates the campaign row (content + updatedAt) without changing status
 */
export async function regenerateCampaignSection(
  reportId: string,
  userId: string,
  contentType: keyof EmailCampaignContent
): Promise<EmailCampaignContent> {
  // 1. Load existing campaign
  const [campaign] = await db
    .select()
    .from(schema.emailCampaigns)
    .where(
      and(
        eq(schema.emailCampaigns.reportId, reportId),
        eq(schema.emailCampaigns.userId, userId)
      )
    )
    .limit(1);

  if (!campaign || !campaign.content) {
    throw new Error("Email campaign not found or has no content");
  }

  // 2. Load report sections + market + personas
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

  // 3. Call the Email Campaign Agent with sectionOnly
  const agentInput: EmailCampaignAgentInput = {
    reportSections: sections,
    computedAnalytics,
    market: market as EmailCampaignAgentInput["market"],
    personas: personas.map((p) => ({
      selectionOrder: p.selectionOrder,
      persona: p.persona as EmailCampaignAgentInput["personas"][number]["persona"],
    })),
    sectionOnly: contentType,
  };

  const result = await executeEmailCampaignAgent(agentInput);

  // 4. Merge: replace only the requested content type
  const mergedContent: EmailCampaignContent = {
    ...campaign.content,
    [contentType]: result.content[contentType],
  };

  // 5. Update the campaign row
  await db
    .update(schema.emailCampaigns)
    .set({
      content: mergedContent,
      updatedAt: new Date(),
    })
    .where(eq(schema.emailCampaigns.id, campaign.id));

  return mergedContent;
}

/**
 * Get the email campaign for a report.
 */
export async function getEmailCampaign(reportId: string) {
  const [campaign] = await db
    .select()
    .from(schema.emailCampaigns)
    .where(eq(schema.emailCampaigns.reportId, reportId))
    .limit(1);

  return campaign ?? null;
}

/**
 * Delete an email campaign by ID.
 * Used before regeneration or retry.
 */
export async function deleteEmailCampaign(campaignId: string) {
  await db
    .delete(schema.emailCampaigns)
    .where(eq(schema.emailCampaigns.id, campaignId));
}

/**
 * Get campaign statuses for multiple reports (batch query for dashboard).
 * Returns a map of reportId -> { status, errorMessage }.
 */
export async function getCampaignStatusesForReports(
  reportIds: string[]
): Promise<Map<string, { status: string; errorMessage: string | null }>> {
  if (reportIds.length === 0) return new Map();

  const campaigns = await db
    .select({
      reportId: schema.emailCampaigns.reportId,
      status: schema.emailCampaigns.status,
      errorMessage: schema.emailCampaigns.errorMessage,
    })
    .from(schema.emailCampaigns)
    .where(inArray(schema.emailCampaigns.reportId, reportIds));

  const map = new Map<string, { status: string; errorMessage: string | null }>();
  for (const c of campaigns) {
    map.set(c.reportId, { status: c.status, errorMessage: c.errorMessage });
  }
  return map;
}
