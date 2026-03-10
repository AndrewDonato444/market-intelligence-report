import { getAuthUserId } from "@/lib/supabase/auth";
import { NextResponse } from "next/server";
import { getBuyerPersonaBySlug } from "@/lib/services/buyer-personas";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const userId = await getAuthUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { slug } = await params;

  try {
    const persona = await getBuyerPersonaBySlug(slug);
    if (!persona) {
      return NextResponse.json(
        { error: "Buyer persona not found" },
        { status: 404 }
      );
    }
    return NextResponse.json({ persona });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to fetch buyer persona";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
