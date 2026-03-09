/**
 * Report service — CRUD operations for reports.
 */

import { db, schema } from "@/lib/db";
import { eq, and, desc, asc } from "drizzle-orm";

export {
  validateReportConfig,
  REPORT_SECTIONS,
  REQUIRED_SECTIONS,
} from "./report-validation";

export async function getReports(authId: string) {
  const [user] = await db
    .select({ id: schema.users.id })
    .from(schema.users)
    .where(eq(schema.users.authId, authId))
    .limit(1);

  if (!user) return [];

  return db
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

  return result || null;
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

  return report;
}
