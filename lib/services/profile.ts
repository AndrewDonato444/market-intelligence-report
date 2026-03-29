import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { logActivity } from "@/lib/services/activity-log";

// Re-export types and validation from pure module
export type { ProfileData, ValidationResult } from "./profile-validation";
export { validateProfileData } from "./profile-validation";

// --- Database operations ---

/**
 * Ensure a users row exists for this auth user.
 * Called from the protected layout on every authenticated request.
 * Uses INSERT ... ON CONFLICT DO NOTHING for idempotency.
 */
export async function ensureUserProfile(
  authId: string,
  email: string,
  metadata?: Record<string, unknown>
) {
  try {
    const existing = await getProfile(authId);
    if (existing) return existing;

    // Read tos_accepted_at from auth user metadata (set during signup)
    const tosAcceptedAt = metadata?.tos_accepted_at
      ? new Date(metadata.tos_accepted_at as string)
      : undefined;

    const [created] = await db
      .insert(schema.users)
      .values({
        authId,
        email,
        name: email.split("@")[0], // default name from email prefix
        lastLoginAt: new Date(),
        ...(tosAcceptedAt ? { tosAcceptedAt } : {}),
      })
      .onConflictDoNothing({ target: schema.users.authId })
      .returning();

    // If another request raced us, fetch the existing row
    const user = created ?? await getProfile(authId);

    // Assign Starter tier subscription for new users
    if (user) {
      await assignStarterTier(user.id);
    }

    return user;
  } catch (error) {
    console.error("[ensureUserProfile] Database query failed:", error);
    return null;
  }
}

/**
 * Create a subscription row with the Starter tier for a new user.
 * Gracefully degrades if the Starter tier doesn't exist in the DB.
 * Uses ON CONFLICT DO NOTHING so it's safe to call multiple times.
 */
async function assignStarterTier(userId: string) {
  try {
    // Look up the Starter tier by slug
    const [starterTier] = await db
      .select({ id: schema.subscriptionTiers.id })
      .from(schema.subscriptionTiers)
      .where(eq(schema.subscriptionTiers.slug, "starter"))
      .limit(1);

    if (!starterTier) {
      console.warn(
        `Starter tier not found — subscription not created for user ${userId}`
      );
      return;
    }

    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setDate(periodEnd.getDate() + 30);

    await db
      .insert(schema.subscriptions)
      .values({
        userId,
        tierId: starterTier.id,
        plan: "free",
        status: "active",
        stripeCustomerId: null,
        stripeSubscriptionId: null,
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
      })
      .onConflictDoNothing({ target: schema.subscriptions.userId });
  } catch (err) {
    // Don't block user creation if subscription assignment fails
    console.warn(
      `Failed to assign Starter tier for user ${userId}:`,
      err
    );
  }
}

export async function getProfile(authId: string) {
  try {
    const [user] = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.authId, authId))
      .limit(1);

    return user || null;
  } catch (error) {
    console.error("[getProfile] Database query failed:", error);
    return null;
  }
}

export async function upsertProfile(
  authId: string,
  email: string,
  data: {
    name: string;
    company?: string;
    title?: string;
    phone?: string;
    bio?: string;
    logoUrl?: string;
    brandColors?: { primary?: string; secondary?: string; accent?: string } | null;
  }
) {
  const existing = await getProfile(authId);

  if (existing) {
    const [updated] = await db
      .update(schema.users)
      .set({
        name: data.name,
        company: data.company || null,
        title: data.title || null,
        phone: data.phone || null,
        bio: data.bio || null,
        logoUrl: data.logoUrl || null,
        brandColors: data.brandColors || null,
        updatedAt: new Date(),
      })
      .where(eq(schema.users.authId, authId))
      .returning();

    // Log activity (fire-and-forget)
    logActivity({
      userId: updated.id,
      action: "profile_updated",
      entityType: "user",
      entityId: updated.id,
      metadata: { fieldsChanged: Object.keys(data) },
    });

    return updated;
  }

  const [created] = await db
    .insert(schema.users)
    .values({
      authId,
      email,
      name: data.name,
      company: data.company || null,
      title: data.title || null,
      phone: data.phone || null,
      bio: data.bio || null,
      logoUrl: data.logoUrl || null,
      brandColors: data.brandColors || null,
      lastLoginAt: new Date(),
    })
    .returning();
  return created;
}
