/**
 * Report templates service — save/reuse market configurations.
 */

import { db, schema } from "@/lib/db";
import { eq, and, desc } from "drizzle-orm";

export async function getTemplates(authId: string) {
  const [user] = await db
    .select({ id: schema.users.id })
    .from(schema.users)
    .where(eq(schema.users.authId, authId))
    .limit(1);

  if (!user) return [];

  return db
    .select({
      id: schema.reportTemplates.id,
      name: schema.reportTemplates.name,
      marketId: schema.reportTemplates.marketId,
      marketName: schema.markets.name,
      config: schema.reportTemplates.config,
      createdAt: schema.reportTemplates.createdAt,
    })
    .from(schema.reportTemplates)
    .innerJoin(
      schema.markets,
      eq(schema.reportTemplates.marketId, schema.markets.id)
    )
    .where(eq(schema.reportTemplates.userId, user.id))
    .orderBy(desc(schema.reportTemplates.createdAt));
}

export async function createTemplate(
  authId: string,
  data: {
    name: string;
    marketId: string;
    config: {
      sections?: string[];
      dateRange?: { start: string; end: string };
      customPrompts?: Record<string, string>;
    };
  }
) {
  const [user] = await db
    .select({ id: schema.users.id })
    .from(schema.users)
    .where(eq(schema.users.authId, authId))
    .limit(1);

  if (!user) return null;

  const [template] = await db
    .insert(schema.reportTemplates)
    .values({
      userId: user.id,
      name: data.name,
      marketId: data.marketId,
      config: data.config,
    })
    .returning();

  return template;
}

export async function deleteTemplate(authId: string, templateId: string) {
  const [user] = await db
    .select({ id: schema.users.id })
    .from(schema.users)
    .where(eq(schema.users.authId, authId))
    .limit(1);

  if (!user) return false;

  await db
    .delete(schema.reportTemplates)
    .where(
      and(
        eq(schema.reportTemplates.id, templateId),
        eq(schema.reportTemplates.userId, user.id)
      )
    );

  return true;
}
