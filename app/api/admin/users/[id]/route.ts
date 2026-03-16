import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabase/admin-auth";
import { db, schema } from "@/lib/db";
import { eq, count } from "drizzle-orm";
import { getActivityByUser } from "@/lib/services/activity-log";

export interface UserDetailResponse {
  user: {
    id: string;
    name: string;
    email: string;
    company: string | null;
    title: string | null;
    phone: string | null;
    bio: string | null;
    logoUrl: string | null;
    status: string;
    role: string;
    tosAcceptedAt: string | null;
    lastLoginAt: string | null;
    suspendedAt: string | null;
    deletedAt: string | null;
    createdAt: string;
    updatedAt: string;
  };
  isOwnAccount: boolean;
  reportCounts: {
    total: number;
    completed: number;
    failed: number;
    generating: number;
    queued: number;
  };
  markets: {
    id: string;
    name: string;
    city: string;
    state: string;
    luxuryTier: string;
    priceFloor: number;
  }[];
  activity: {
    id: string;
    action: string;
    entityType: string;
    entityId: string | null;
    metadata: Record<string, unknown> | null;
    createdAt: string;
  }[];
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminId = await requireAdmin();
  if (!adminId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    // Fetch user
    const [user] = await db
      .select({
        id: schema.users.id,
        authId: schema.users.authId,
        name: schema.users.name,
        email: schema.users.email,
        company: schema.users.company,
        title: schema.users.title,
        phone: schema.users.phone,
        bio: schema.users.bio,
        logoUrl: schema.users.logoUrl,
        status: schema.users.status,
        role: schema.users.role,
        tosAcceptedAt: schema.users.tosAcceptedAt,
        lastLoginAt: schema.users.lastLoginAt,
        suspendedAt: schema.users.suspendedAt,
        deletedAt: schema.users.deletedAt,
        createdAt: schema.users.createdAt,
        updatedAt: schema.users.updatedAt,
      })
      .from(schema.users)
      .where(eq(schema.users.id, id))
      .limit(1);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Fetch report counts by status
    const reportStatusCounts = await db
      .select({
        status: schema.reports.status,
        count: count(),
      })
      .from(schema.reports)
      .where(eq(schema.reports.userId, id))
      .groupBy(schema.reports.status);

    const reportCounts = {
      total: 0,
      completed: 0,
      failed: 0,
      generating: 0,
      queued: 0,
    };
    for (const row of reportStatusCounts) {
      const c = Number(row.count);
      reportCounts.total += c;
      if (row.status in reportCounts) {
        reportCounts[row.status as keyof Omit<typeof reportCounts, "total">] = c;
      }
    }

    // Fetch markets
    const markets = await db
      .select({
        id: schema.markets.id,
        name: schema.markets.name,
        geography: schema.markets.geography,
        luxuryTier: schema.markets.luxuryTier,
        priceFloor: schema.markets.priceFloor,
      })
      .from(schema.markets)
      .where(eq(schema.markets.userId, id));

    // Fetch activity timeline
    const activityRows = await getActivityByUser(id, { limit: 50 });

    const isOwnAccount = user.authId === adminId;

    const response: UserDetailResponse = {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        company: user.company,
        title: user.title,
        phone: user.phone,
        bio: user.bio,
        logoUrl: user.logoUrl,
        status: user.status,
        role: user.role,
        tosAcceptedAt: user.tosAcceptedAt?.toISOString() ?? null,
        lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
        suspendedAt: user.suspendedAt?.toISOString() ?? null,
        deletedAt: user.deletedAt?.toISOString() ?? null,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
      },
      isOwnAccount,
      reportCounts,
      markets: markets.map((m) => ({
        id: m.id,
        name: m.name,
        city: (m.geography as { city: string; state: string }).city,
        state: (m.geography as { city: string; state: string }).state,
        luxuryTier: m.luxuryTier,
        priceFloor: m.priceFloor,
      })),
      activity: activityRows.map((a) => ({
        id: a.id,
        action: a.action,
        entityType: a.entityType,
        entityId: a.entityId,
        metadata: a.metadata,
        createdAt: a.createdAt.toISOString(),
      })),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching user detail:", error);
    return NextResponse.json(
      { error: "Failed to fetch user details" },
      { status: 500 }
    );
  }
}
