/**
 * Stripe billing portal API — creates a portal session for subscription management.
 */

import { getAuthUserId } from "@/lib/supabase/auth";
import { NextResponse } from "next/server";
import { createPortalSession } from "@/lib/services/subscription";
import { isStripeConfigured } from "@/lib/stripe/client";

export async function POST(request: Request) {
  const authId = await getAuthUserId();
  if (!authId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isStripeConfigured()) {
    return NextResponse.json(
      { error: "Stripe is not configured" },
      { status: 503 }
    );
  }

  try {
    const origin = new URL(request.url).origin;
    const session = await createPortalSession(
      authId,
      `${origin}/settings/account`
    );

    return NextResponse.json({ url: session.url });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Portal session failed" },
      { status: 500 }
    );
  }
}
