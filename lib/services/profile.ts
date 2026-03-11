import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { logActivity } from "@/lib/services/activity-log";

// Re-export types and validation from pure module
export type { ProfileData, ValidationResult } from "./profile-validation";
export { validateProfileData } from "./profile-validation";

// --- Database operations ---

export async function getProfile(authId: string) {
  const [user] = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.authId, authId))
    .limit(1);

  return user || null;
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
