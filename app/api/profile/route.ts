import { getAuthUser } from "@/lib/supabase/auth";
import { NextResponse } from "next/server";
import {
  getProfile,
  upsertProfile,
  validateProfileData,
} from "@/lib/services/profile";

export async function GET() {
  const authUser = await getAuthUser();
  if (!authUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const profile = await getProfile(authUser.id);

  if (profile) {
    return NextResponse.json({ profile });
  }

  // No profile yet — return defaults for pre-population
  return NextResponse.json({
    profile: null,
    defaults: {
      name: "",
      email: authUser.email,
    },
  });
}

export async function PUT(request: Request) {
  const authUser = await getAuthUser();
  if (!authUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const validation = validateProfileData(body);
  if (!validation.success) {
    return NextResponse.json(
      { error: "Validation failed", errors: validation.errors },
      { status: 422 }
    );
  }

  const profile = await upsertProfile(authUser.id, authUser.email, validation.data!);
  return NextResponse.json({ profile });
}
