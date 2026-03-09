/**
 * Stripe client wrapper — initializes Stripe with the secret key from env.
 */

import Stripe from "stripe";

let stripeInstance: Stripe | null = null;

export function getStripe(): Stripe | null {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    return null;
  }

  if (!stripeInstance) {
    stripeInstance = new Stripe(secretKey, {
      apiVersion: "2025-02-24.acacia",
      typescript: true,
    });
  }

  return stripeInstance;
}

export function isStripeConfigured(): boolean {
  return !!process.env.STRIPE_SECRET_KEY;
}
