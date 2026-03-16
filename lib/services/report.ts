/**
 * Report service — CRUD operations for reports.
 */

import { db, schema } from "@/lib/db";
import { eq, and, desc, asc, sql, or, lt } from "drizzle-orm";
import { recordSectionEdit } from "./report-history";
import { setReportPersonas } from "./buyer-personas";

export {
  validateReportConfig,
  REPORT_SECTIONS,
  REQUIRED_SECTIONS,
} from "./report-validation";

const STALE_THRESHOLD_MINUTES = 15;

/**
 * Mark reports stuck in "queued" or "generating" for longer than
 * STALE_THRESHOLD_MINUTES as "failed". Called before loading reports
 * so users always see accurate status.
 */
export async function reapStaleReports() {
  try {
    const cutoff = new Date(Date.now() - STALE_THRESHOLD_MINUTES * 60 * 1000);

    await db
      .update(schema.reports)
      .set({
        status: "failed",
        errorMessage: "Generation timed out. Please retry.",
      })
      .where(
        and(
          or(
            eq(schema.reports.status, "queued"),
            eq(schema.reports.status, "generating")
          ),
          lt(schema.reports.generationStartedAt, cutoff)
        )
      );
  } catch (error) {
    console.error("[reapStaleReports] Database query failed:", error);
  }
}

export async function getReports(authId: string) {
  try {
    const [user] = await db
      .select({ id: schema.users.id })
      .from(schema.users)
      .where(eq(schema.users.authId, authId))
      .limit(1);

    if (!user) return [];

    return await db
      .select({
        id: schema.reports.id,
        title: schema.reports.title,
        status: schema.reports.status,
        marketId: schema.reports.marketId,
        marketName: schema.markets.name,
        createdAt: schema.reports.createdAt,
        updatedAt: schema.reports.updatedAt,
      })
      .from(schema.reports)
      .innerJoin(schema.markets, eq(schema.reports.marketId, schema.markets.id))
      .where(eq(schema.reports.userId, user.id))
      .orderBy(desc(schema.reports.createdAt));
  } catch (error) {
    console.error("[getReports] Database query failed:", error);
    return [];
  }
}

export async function getReport(authId: string, reportId: string) {
  const [user] = await db
    .select({ id: schema.users.id })
    .from(schema.users)
    .where(eq(schema.users.authId, authId))
    .limit(1);

  if (!user) return null;

  const [report] = await db
    .select()
    .from(schema.reports)
    .where(
      and(
        eq(schema.reports.id, reportId),
        eq(schema.reports.userId, user.id)
      )
    )
    .limit(1);

  return report || null;
}

export async function getReportWithMarket(authId: string, reportId: string) {
  const [user] = await db
    .select({ id: schema.users.id })
    .from(schema.users)
    .where(eq(schema.users.authId, authId))
    .limit(1);

  if (!user) return null;

  const [result] = await db
    .select({
      id: schema.reports.id,
      title: schema.reports.title,
      status: schema.reports.status,
      marketName: schema.markets.name,
      marketGeography: schema.markets.geography,
      config: schema.reports.config,
      createdAt: schema.reports.createdAt,
      generationStartedAt: schema.reports.generationStartedAt,
      generationCompletedAt: schema.reports.generationCompletedAt,
      errorMessage: schema.reports.errorMessage,
      shareToken: schema.reports.shareToken,
      shareTokenExpiresAt: schema.reports.shareTokenExpiresAt,
    })
    .from(schema.reports)
    .innerJoin(schema.markets, eq(schema.reports.marketId, schema.markets.id))
    .where(
      and(
        eq(schema.reports.id, reportId),
        eq(schema.reports.userId, user.id)
      )
    )
    .limit(1);

  if (!result) return null;

  // Build full market name with state if available
  const geo = result.marketGeography as { city?: string; state?: string } | null;
  const fullMarketName =
    geo?.state && !result.marketName.includes(geo.state)
      ? `${result.marketName}, ${geo.state}`
      : result.marketName;

  return { ...result, marketName: fullMarketName };
}

export async function getReportSections(authId: string, reportId: string) {
  const [user] = await db
    .select({ id: schema.users.id })
    .from(schema.users)
    .where(eq(schema.users.authId, authId))
    .limit(1);

  if (!user) return null;

  // Verify report belongs to user
  const [report] = await db
    .select({ id: schema.reports.id })
    .from(schema.reports)
    .where(
      and(
        eq(schema.reports.id, reportId),
        eq(schema.reports.userId, user.id)
      )
    )
    .limit(1);

  if (!report) return null;

  return db
    .select({
      id: schema.reportSections.id,
      sectionType: schema.reportSections.sectionType,
      title: schema.reportSections.title,
      content: schema.reportSections.content,
      agentName: schema.reportSections.agentName,
      sortOrder: schema.reportSections.sortOrder,
      generatedAt: schema.reportSections.generatedAt,
    })
    .from(schema.reportSections)
    .where(eq(schema.reportSections.reportId, reportId))
    .orderBy(asc(schema.reportSections.sortOrder));
}

export async function createReport(
  authId: string,
  data: {
    marketId: string;
    title: string;
    sections: string[];
    personaIds?: string[];
  }
) {
  const [user] = await db
    .select({ id: schema.users.id })
    .from(schema.users)
    .where(eq(schema.users.authId, authId))
    .limit(1);

  if (!user) {
    throw new Error("User not found. Complete your profile first.");
  }

  // Verify market belongs to user
  const [market] = await db
    .select({ id: schema.markets.id })
    .from(schema.markets)
    .where(
      and(
        eq(schema.markets.id, data.marketId),
        eq(schema.markets.userId, user.id)
      )
    )
    .limit(1);

  if (!market) {
    throw new Error("Market not found or does not belong to this user.");
  }

  const [report] = await db
    .insert(schema.reports)
    .values({
      userId: user.id,
      marketId: data.marketId,
      title: data.title,
      status: "queued",
      config: {
        sections: data.sections,
      },
    })
    .returning();

  // Link selected buyer personas to the report
  if (data.personaIds && data.personaIds.length > 0) {
    await setReportPersonas(report.id, data.personaIds);
  }

  return report;
}

export async function updateReportSection(
  authId: string,
  reportId: string,
  sectionId: string,
  data: {
    title?: string;
    content?: Record<string, unknown>;
  }
) {
  const [user] = await db
    .select({ id: schema.users.id })
    .from(schema.users)
    .where(eq(schema.users.authId, authId))
    .limit(1);

  if (!user) return null;

  // Verify report belongs to user
  const [report] = await db
    .select({ id: schema.reports.id })
    .from(schema.reports)
    .where(
      and(
        eq(schema.reports.id, reportId),
        eq(schema.reports.userId, user.id)
      )
    )
    .limit(1);

  if (!report) return null;

  // Read current section to record history
  const [currentSection] = await db
    .select()
    .from(schema.reportSections)
    .where(
      and(
        eq(schema.reportSections.id, sectionId),
        eq(schema.reportSections.reportId, reportId)
      )
    )
    .limit(1);

  if (!currentSection) return null;

  // Record edit history (previous content)
  await recordSectionEdit(
    reportId,
    sectionId,
    currentSection.title,
    currentSection.sectionType,
    currentSection.content
  );

  // Update the section
  const updateData: Record<string, unknown> = {
    updatedAt: new Date(),
  };
  if (data.title !== undefined) updateData.title = data.title;
  if (data.content !== undefined) updateData.content = data.content;

  const [updated] = await db
    .update(schema.reportSections)
    .set(updateData)
    .where(
      and(
        eq(schema.reportSections.id, sectionId),
        eq(schema.reportSections.reportId, reportId)
      )
    )
    .returning();

  // Increment report version
  await db
    .update(schema.reports)
    .set({
      version: sql`${schema.reports.version} + 1`,
      updatedAt: new Date(),
    })
    .where(eq(schema.reports.id, reportId));

  return updated || null;
}
