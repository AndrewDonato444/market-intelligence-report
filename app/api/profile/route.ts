import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import {
  getProfile,
  upsertProfile,
  validateProfileData,
} from "@/lib/services/profile";

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const profile = await getProfile(userId);

  if (profile) {
    return NextResponse.json({ profile });
  }

  // No profile yet — return Clerk defaults for pre-population
  const clerkUser = await currentUser();
  return NextResponse.json({
    profile: null,
    defaults: {
      name:
        [clerkUser?.firstName, clerkUser?.lastName].filter(Boolean).join(" ") ||
        "",
      email: clerkUser?.emailAddresses?.[0]?.emailAddress || "",
    },
  });
}

export async function PUT(request: Request) {
  const { userId } = await auth();
  if (!userId) {
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

  const clerkUser = await currentUser();
  const email = clerkUser?.emailAddresses?.[0]?.emailAddress || "";

  const profile = await upsertProfile(userId, email, validation.data!);
  return NextResponse.json({ profile });
}
