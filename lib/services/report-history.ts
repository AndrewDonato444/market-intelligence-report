/**
 * Report edit history service — tracks section edits for versioning.
 */

import { db, schema } from "@/lib/db";
import { eq, and, desc } from "drizzle-orm";

/**
 * Record a section edit in the history table.
 */
export async function recordSectionEdit(
  reportId: string,
  sectionId: string,
  sectionTitle: string,
  sectionType: string,
  previousContent: unknown
) {
  await db.insert(schema.reportEditHistory).values({
    reportId,
    sectionId,
    sectionTitle,
    sectionType,
    previousContent,
  });
}

/**
 * Get edit history for a report, ordered by most recent.
 */
export async function getReportHistory(authId: string, reportId: string) {
  const [user] = await db
    .select({ id: schema.users.id })
    .from(schema.users)
    .where(eq(schema.users.authId, authId))
    .limit(1);

  if (!user) return [];

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

  if (!report) return [];

  return db
    .select({
      id: schema.reportEditHistory.id,
      sectionTitle: schema.reportEditHistory.sectionTitle,
      sectionType: schema.reportEditHistory.sectionType,
      editedAt: schema.reportEditHistory.editedAt,
    })
    .from(schema.reportEditHistory)
    .where(eq(schema.reportEditHistory.reportId, reportId))
    .orderBy(desc(schema.reportEditHistory.editedAt))
    .limit(50);
}
