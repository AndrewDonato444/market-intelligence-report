/**
 * Report sharing service — share token generation and validation.
 */

import crypto from "crypto";
import { db, schema } from "@/lib/db";
import { eq, and, gt } from "drizzle-orm";

/**
 * Generate a crypto-secure share token (32 bytes = 64 hex chars).
 */
export function generateShareToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Create or refresh a share token for a report.
 * Default expiration: 7 days from now.
 */
export async function createShareLink(
  authId: string,
  reportId: string,
  expiresInDays = 7
) {
  const [user] = await db
    .select({ id: schema.users.id })
    .from(schema.users)
    .where(eq(schema.users.authId, authId))
    .limit(1);

  if (!user) return null;

  const token = generateShareToken();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + expiresInDays);

  const [updated] = await db
    .update(schema.reports)
    .set({
      shareToken: token,
      shareTokenExpiresAt: expiresAt,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(schema.reports.id, reportId),
        eq(schema.reports.userId, user.id)
      )
    )
    .returning({
      id: schema.reports.id,
      shareToken: schema.reports.shareToken,
      shareTokenExpiresAt: schema.reports.shareTokenExpiresAt,
    });

  return updated || null;
}

/**
 * Revoke (clear) the share token for a report.
 */
export async function revokeShareLink(authId: string, reportId: string) {
  const [user] = await db
    .select({ id: schema.users.id })
    .from(schema.users)
    .where(eq(schema.users.authId, authId))
    .limit(1);

  if (!user) return false;

  const result = await db
    .update(schema.reports)
    .set({
      shareToken: null,
      shareTokenExpiresAt: null,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(schema.reports.id, reportId),
        eq(schema.reports.userId, user.id)
      )
    );

  return !!result;
}

/**
 * Retrieve a report by its share token (public — no auth required).
 * Returns null if token is invalid or expired.
 */
export async function getReportByShareToken(token: string) {
  const [report] = await db
    .select({
      id: schema.reports.id,
      title: schema.reports.title,
      status: schema.reports.status,
      marketName: schema.markets.name,
      shareTokenExpiresAt: schema.reports.shareTokenExpiresAt,
      generationCompletedAt: schema.reports.generationCompletedAt,
    })
    .from(schema.reports)
    .innerJoin(schema.markets, eq(schema.reports.marketId, schema.markets.id))
    .where(
      and(
        eq(schema.reports.shareToken, token),
        gt(schema.reports.shareTokenExpiresAt, new Date())
      )
    )
    .limit(1);

  return report || null;
}
