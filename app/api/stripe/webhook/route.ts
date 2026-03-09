/**
 * Stripe webhook handler — processes subscription lifecycle events.
 */

import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe/client";
import { upsertSubscription } from "@/lib/services/subscription";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import Stripe from "stripe";

export async function POST(request: Request) {
  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json(
      { error: "Stripe not configured" },
      { status: 503 }
    );
  }

  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Missing stripe-signature header" },
      { status: 400 }
    );
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json(
      { error: "Webhook secret not configured" },
      { status: 503 }
    );
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    return NextResponse.json(
      { error: `Webhook verification failed: ${err instanceof Error ? err.message : "unknown"}` },
      { status: 400 }
    );
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.userId;
      if (!userId || !session.subscription || !session.customer) break;

      const subscription = await stripe.subscriptions.retrieve(
        session.subscription as string
      );

      await upsertSubscription({
        userId,
        stripeCustomerId: session.customer as string,
        stripeSubscriptionId: subscription.id,
        plan: determinePlan(subscription),
        status: subscription.status,
        currentPeriodStart: new Date(
          subscription.current_period_start * 1000
        ),
        currentPeriodEnd: new Date(
          subscription.current_period_end * 1000
        ),
      });
      break;
    }

    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = subscription.customer as string;

      // Find user by Stripe customer ID
      const [existing] = await db
        .select({ userId: schema.subscriptions.userId })
        .from(schema.subscriptions)
        .where(eq(schema.subscriptions.stripeCustomerId, customerId))
        .limit(1);

      if (existing) {
        await upsertSubscription({
          userId: existing.userId,
          stripeCustomerId: customerId,
          stripeSubscriptionId: subscription.id,
          plan: determinePlan(subscription),
          status: subscription.status,
          currentPeriodStart: new Date(
            subscription.current_period_start * 1000
          ),
          currentPeriodEnd: new Date(
            subscription.current_period_end * 1000
          ),
        });
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}

function determinePlan(subscription: Stripe.Subscription): string {
  const priceId = subscription.items.data[0]?.price?.id;
  if (priceId === process.env.STRIPE_PRICE_TEAM) return "team";
  if (priceId === process.env.STRIPE_PRICE_PROFESSIONAL) return "professional";
  return "professional";
}
