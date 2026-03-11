import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabase/admin-auth";
import { db, schema } from "@/lib/db";
import { sql, eq, or, ilike, desc, asc, and, count } from "drizzle-orm";

export interface UserListResponse {
  users: {
    id: string;
    name: string;
    email: string;
    company: string | null;
    status: string;
    lastLoginAt: string | null;
    createdAt: string;
  }[];
  total: number;
  counts: {
    all: number;
    active: number;
    suspended: number;
    deleted: number;
  };
}

export async function GET(request: NextRequest) {
  const adminId = await requireAdmin();
  if (!adminId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") || "";
  const status = searchParams.get("status") as "active" | "suspended" | "deleted" | null;
  const sortBy = searchParams.get("sortBy") || "lastLoginAt";
  const sortDir = searchParams.get("sortDir") || "desc";
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "20", 10);
  const offset = (page - 1) * limit;

  try {
    // Build where conditions
    const conditions = [];

    if (status) {
      conditions.push(eq(schema.users.status, status));
    }

    if (search) {
      conditions.push(
        or(
          ilike(schema.users.name, `%${search}%`),
          ilike(schema.users.email, `%${search}%`)
        )!
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Determine sort column
    const sortColumn =
      sortBy === "createdAt"
        ? schema.users.createdAt
        : sortBy === "name"
        ? schema.users.name
        : sortBy === "email"
        ? schema.users.email
        : schema.users.lastLoginAt;

    const orderFn = sortDir === "asc" ? asc : desc;

    // Query users
    const users = await db
      .select({
        id: schema.users.id,
        name: schema.users.name,
        email: schema.users.email,
        company: schema.users.company,
        status: schema.users.status,
        lastLoginAt: schema.users.lastLoginAt,
        createdAt: schema.users.createdAt,
      })
      .from(schema.users)
      .where(whereClause)
      .orderBy(orderFn(sortColumn))
      .limit(limit)
      .offset(offset);

    // Count total matching
    const [totalResult] = await db
      .select({ count: count() })
      .from(schema.users)
      .where(whereClause);

    // Count by status (for filter badges)
    const statusCounts = await db
      .select({
        status: schema.users.status,
        count: count(),
      })
      .from(schema.users)
      .groupBy(schema.users.status);

    const counts = {
      all: 0,
      active: 0,
      suspended: 0,
      deleted: 0,
    };
    for (const row of statusCounts) {
      counts[row.status as keyof typeof counts] = Number(row.count);
      counts.all += Number(row.count);
    }

    const response: UserListResponse = {
      users: users.map((u) => ({
        ...u,
        lastLoginAt: u.lastLoginAt?.toISOString() ?? null,
        createdAt: u.createdAt.toISOString(),
      })),
      total: Number(totalResult?.count ?? 0),
      counts,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}
