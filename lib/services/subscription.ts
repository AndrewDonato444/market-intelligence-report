/**
 * Subscription service — manages Stripe subscriptions for users.
 */

import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { getStripe } from "@/lib/stripe/client";

export async function getSubscription(authId: string) {
  const [user] = await db
    .select({ id: schema.users.id })
    .from(schema.users)
    .where(eq(schema.users.authId, authId))
    .limit(1);

  if (!user) return null;

  const [subscription] = await db
    .select()
    .from(schema.subscriptions)
    .where(eq(schema.subscriptions.userId, user.id))
    .limit(1);

  return subscription || null;
}

export async function createCheckoutSession(
  authId: string,
  priceId: string,
  successUrl: string,
  cancelUrl: string
) {
  const stripe = getStripe();
  if (!stripe) throw new Error("Stripe is not configured");

  const [user] = await db
    .select({ id: schema.users.id, email: schema.users.email })
    .from(schema.users)
    .where(eq(schema.users.authId, authId))
    .limit(1);

  if (!user) throw new Error("User not found");

  // Check if user already has a Stripe customer ID
  const [existing] = await db
    .select({ stripeCustomerId: schema.subscriptions.stripeCustomerId })
    .from(schema.subscriptions)
    .where(eq(schema.subscriptions.userId, user.id))
    .limit(1);

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    payment_method_types: ["card"],
    customer: existing?.stripeCustomerId || undefined,
    customer_email: existing?.stripeCustomerId ? undefined : user.email,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: { userId: user.id, authId },
  });

  return session;
}

export async function createPortalSession(
  authId: string,
  returnUrl: string
) {
  const stripe = getStripe();
  if (!stripe) throw new Error("Stripe is not configured");

  const [user] = await db
    .select({ id: schema.users.id })
    .from(schema.users)
    .where(eq(schema.users.authId, authId))
    .limit(1);

  if (!user) throw new Error("User not found");

  const [subscription] = await db
    .select({ stripeCustomerId: schema.subscriptions.stripeCustomerId })
    .from(schema.subscriptions)
    .where(eq(schema.subscriptions.userId, user.id))
    .limit(1);

  if (!subscription?.stripeCustomerId) {
    throw new Error("No billing account found");
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: subscription.stripeCustomerId,
    return_url: returnUrl,
  });

  return session;
}

export async function upsertSubscription(data: {
  userId: string;
  stripeCustomerId: string;
  stripeSubscriptionId: string;
  plan: string;
  status: string;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
}) {
  const [existing] = await db
    .select()
    .from(schema.subscriptions)
    .where(eq(schema.subscriptions.userId, data.userId))
    .limit(1);

  if (existing) {
    await db
      .update(schema.subscriptions)
      .set({
        stripeSubscriptionId: data.stripeSubscriptionId,
        plan: data.plan,
        status: data.status,
        currentPeriodStart: data.currentPeriodStart,
        currentPeriodEnd: data.currentPeriodEnd,
        updatedAt: new Date(),
      })
      .where(eq(schema.subscriptions.userId, data.userId));
  } else {
    await db.insert(schema.subscriptions).values({
      userId: data.userId,
      stripeCustomerId: data.stripeCustomerId,
      stripeSubscriptionId: data.stripeSubscriptionId,
      plan: data.plan,
      status: data.status,
      currentPeriodStart: data.currentPeriodStart,
      currentPeriodEnd: data.currentPeriodEnd,
    });
  }
}
