/**
 * Content Studio service — fetches content studio items for the listing page.
 */

import { db, schema } from "@/lib/db";
import { eq, desc } from "drizzle-orm";

export interface ContentStudioListItem {
  reportId: string;
  reportTitle: string;
  marketId: string;
  marketName: string;
  marketCity: string;
  marketState: string;
  kitStatus: "queued" | "generating" | "completed" | "failed" | null;
  kitGeneratedAt: string | null;
  emailStatus: "queued" | "generating" | "completed" | "failed" | null;
  emailGeneratedAt: string | null;
  latestActivityAt: Date;
}

/**
 * Get all content studios for a user (reports that have at least one
 * social media kit or email campaign record).
 */
export async function getContentStudios(
  authId: string
): Promise<ContentStudioListItem[]> {
  try {
    const [user] = await db
      .select({ id: schema.users.id })
      .from(schema.users)
      .where(eq(schema.users.authId, authId))
      .limit(1);

    if (!user) return [];

    const rows = await db
      .select({
        reportId: schema.reports.id,
        reportTitle: schema.reports.title,
        marketId: schema.reports.marketId,
        marketName: schema.markets.name,
        marketGeography: schema.markets.geography,
        kitStatus: schema.socialMediaKits.status,
        kitGeneratedAt: schema.socialMediaKits.generatedAt,
        kitUpdatedAt: schema.socialMediaKits.updatedAt,
        emailStatus: schema.emailCampaigns.status,
        emailGeneratedAt: schema.emailCampaigns.generatedAt,
        emailUpdatedAt: schema.emailCampaigns.updatedAt,
      })
      .from(schema.reports)
      .innerJoin(schema.markets, eq(schema.reports.marketId, schema.markets.id))
      .leftJoin(
        schema.socialMediaKits,
        eq(schema.reports.id, schema.socialMediaKits.reportId)
      )
      .leftJoin(
        schema.emailCampaigns,
        eq(schema.reports.id, schema.emailCampaigns.reportId)
      )
      .where(eq(schema.reports.userId, user.id))
      .orderBy(desc(schema.reports.createdAt));

    // Filter to only reports that have at least one content type
    return rows
      .filter((r) => r.kitStatus !== null || r.emailStatus !== null)
      .map((r) => {
        const geo = r.marketGeography as {
          city?: string;
          state?: string;
        } | null;

        // Determine the latest activity timestamp
        const timestamps = [
          r.kitGeneratedAt,
          r.kitUpdatedAt,
          r.emailGeneratedAt,
          r.emailUpdatedAt,
        ].filter(Boolean) as Date[];

        const latestActivityAt =
          timestamps.length > 0
            ? new Date(Math.max(...timestamps.map((t) => new Date(t).getTime())))
            : new Date();

        return {
          reportId: r.reportId,
          reportTitle: r.reportTitle,
          marketId: r.marketId,
          marketName: r.marketName,
          marketCity: geo?.city ?? "",
          marketState: geo?.state ?? "",
          kitStatus: r.kitStatus as ContentStudioListItem["kitStatus"],
          kitGeneratedAt: r.kitGeneratedAt
            ? new Date(r.kitGeneratedAt).toISOString()
            : null,
          emailStatus: r.emailStatus as ContentStudioListItem["emailStatus"],
          emailGeneratedAt: r.emailGeneratedAt
            ? new Date(r.emailGeneratedAt).toISOString()
            : null,
          latestActivityAt,
        };
      });
  } catch (error) {
    console.error("[getContentStudios] Database query failed:", error);
    return [];
  }
}
