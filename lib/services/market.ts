import { db, schema } from "@/lib/db";
import { eq, and } from "drizzle-orm";

export type { MarketData, MarketValidationResult } from "./market-validation";
export { validateMarketData, AVAILABLE_SEGMENTS, AVAILABLE_PROPERTY_TYPES } from "./market-validation";

export async function getMarkets(clerkId: string) {
  // First get the user's internal ID
  const [user] = await db
    .select({ id: schema.users.id })
    .from(schema.users)
    .where(eq(schema.users.clerkId, clerkId))
    .limit(1);

  if (!user) return [];

  return db
    .select()
    .from(schema.markets)
    .where(eq(schema.markets.userId, user.id))
    .orderBy(schema.markets.createdAt);
}

export async function createMarket(
  clerkId: string,
  data: {
    name: string;
    geography: { city: string; state: string; county?: string; region?: string; zipCodes?: string[] };
    luxuryTier: "luxury" | "high_luxury" | "ultra_luxury";
    priceFloor: number;
    priceCeiling?: number | null;
    segments?: string[];
    propertyTypes?: string[];
    focusAreas?: string[];
  }
) {
  // Get user internal ID
  const [user] = await db
    .select({ id: schema.users.id })
    .from(schema.users)
    .where(eq(schema.users.clerkId, clerkId))
    .limit(1);

  if (!user) {
    throw new Error("User not found. Complete your profile first.");
  }

  // Check if this is the user's first market
  const existingMarkets = await db
    .select({ id: schema.markets.id })
    .from(schema.markets)
    .where(eq(schema.markets.userId, user.id))
    .limit(1);

  const isFirst = existingMarkets.length === 0;

  const [market] = await db
    .insert(schema.markets)
    .values({
      userId: user.id,
      name: data.name,
      geography: data.geography,
      luxuryTier: data.luxuryTier,
      priceFloor: data.priceFloor,
      priceCeiling: data.priceCeiling || null,
      segments: data.segments || null,
      propertyTypes: data.propertyTypes || null,
      focusAreas: data.focusAreas || null,
      isDefault: isFirst ? 1 : 0,
    })
    .returning();

  return market;
}

export async function getMarket(clerkId: string, marketId: string) {
  const [user] = await db
    .select({ id: schema.users.id })
    .from(schema.users)
    .where(eq(schema.users.clerkId, clerkId))
    .limit(1);

  if (!user) return null;

  const [market] = await db
    .select()
    .from(schema.markets)
    .where(
      and(eq(schema.markets.id, marketId), eq(schema.markets.userId, user.id))
    )
    .limit(1);

  return market || null;
}

export async function updateMarket(
  clerkId: string,
  marketId: string,
  data: {
    name: string;
    geography: { city: string; state: string; county?: string; region?: string; zipCodes?: string[] };
    luxuryTier: "luxury" | "high_luxury" | "ultra_luxury";
    priceFloor: number;
    priceCeiling?: number | null;
    segments?: string[];
    propertyTypes?: string[];
    focusAreas?: string[];
  }
) {
  const [user] = await db
    .select({ id: schema.users.id })
    .from(schema.users)
    .where(eq(schema.users.clerkId, clerkId))
    .limit(1);

  if (!user) throw new Error("User not found");

  const [updated] = await db
    .update(schema.markets)
    .set({
      name: data.name,
      geography: data.geography,
      luxuryTier: data.luxuryTier,
      priceFloor: data.priceFloor,
      priceCeiling: data.priceCeiling || null,
      segments: data.segments || null,
      propertyTypes: data.propertyTypes || null,
      focusAreas: data.focusAreas || null,
      updatedAt: new Date(),
    })
    .where(
      and(eq(schema.markets.id, marketId), eq(schema.markets.userId, user.id))
    )
    .returning();

  if (!updated) throw new Error("Market not found");
  return updated;
}

export async function updateMarketPeers(
  clerkId: string,
  marketId: string,
  peerMarkets: Array<{ name: string; geography: { city: string; state: string } }>
) {
  const [user] = await db
    .select({ id: schema.users.id })
    .from(schema.users)
    .where(eq(schema.users.clerkId, clerkId))
    .limit(1);

  if (!user) throw new Error("User not found");

  const [updated] = await db
    .update(schema.markets)
    .set({
      peerMarkets,
      updatedAt: new Date(),
    })
    .where(
      and(eq(schema.markets.id, marketId), eq(schema.markets.userId, user.id))
    )
    .returning();

  if (!updated) throw new Error("Market not found");
  return updated;
}
