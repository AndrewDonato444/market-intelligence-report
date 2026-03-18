import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabase/admin-auth";
import { db } from "@/lib/db";
import { waitlist } from "@/lib/db/schema";
import { desc, asc, ilike, eq, or, sql } from "drizzle-orm";

export type WaitlistResponse = {
  entries: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string | null;
    market: string;
    website: string | null;
    status: "pending" | "invited" | "joined";
    createdAt: string;
  }[];
  total: number;
  page: number;
  pageSize: number;
};

export async function GET(request: Request) {
  const adminId = await requireAdmin();
  if (!adminId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") || "";
  const status = searchParams.get("status") || "all";
  const sortBy = searchParams.get("sortBy") || "createdAt";
  const sortDir = searchParams.get("sortDir") || "desc";
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const limit = Math.min(100, parseInt(searchParams.get("limit") || "20"));

  try {
    const conditions = [];

    if (search) {
      // Escape ILIKE wildcard characters to prevent pattern injection
      const escaped = search.replace(/[%_\\]/g, "\\$&");
      conditions.push(
        or(
          ilike(waitlist.firstName, `%${escaped}%`),
          ilike(waitlist.lastName, `%${escaped}%`),
          ilike(waitlist.email, `%${escaped}%`),
          ilike(waitlist.market, `%${escaped}%`)
        )
      );
    }

    const validStatuses = ["pending", "invited", "joined"];
    if (status !== "all") {
      if (!validStatuses.includes(status)) {
        return NextResponse.json({ error: "Invalid status filter" }, { status: 400 });
      }
      conditions.push(eq(waitlist.status, status as "pending" | "invited" | "joined"));
    }

    const where = conditions.length > 0
      ? sql`${sql.join(conditions.map(c => sql`(${c})`), sql` AND `)}`
      : undefined;

    const sortColumn = sortBy === "name" ? waitlist.lastName
      : sortBy === "email" ? waitlist.email
      : sortBy === "market" ? waitlist.market
      : sortBy === "status" ? waitlist.status
      : waitlist.createdAt;

    const orderFn = sortDir === "asc" ? asc : desc;

    const [entries, countResult] = await Promise.all([
      db
        .select()
        .from(waitlist)
        .where(where)
        .orderBy(orderFn(sortColumn))
        .limit(limit)
        .offset((page - 1) * limit),
      db
        .select({ count: sql<number>`count(*)` })
        .from(waitlist)
        .where(where),
    ]);

    const response: WaitlistResponse = {
      entries: entries.map((e) => ({
        ...e,
        createdAt: e.createdAt.toISOString(),
      })),
      total: Number(countResult[0].count),
      page,
      pageSize: limit,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Waitlist fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch waitlist" },
      { status: 500 }
    );
  }
}
