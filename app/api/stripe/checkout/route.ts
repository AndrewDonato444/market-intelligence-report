/**
 * Stripe checkout API — creates a checkout session for subscription.
 */

import { getAuthUserId } from "@/lib/supabase/auth";
import { NextResponse } from "next/server";
import { createCheckoutSession } from "@/lib/services/subscription";
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

  let body: { priceId: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.priceId) {
    return NextResponse.json(
      { error: "priceId is required" },
      { status: 400 }
    );
  }

  try {
    const origin = new URL(request.url).origin;
    const session = await createCheckoutSession(
      authId,
      body.priceId,
      `${origin}/settings/account?checkout=success`,
      `${origin}/settings/account?checkout=cancelled`
    );

    return NextResponse.json({ url: session.url });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Checkout failed" },
      { status: 500 }
    );
  }
}
