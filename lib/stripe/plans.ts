/**
 * Subscription plans configuration.
 * Price IDs come from Stripe Dashboard and are set via env vars.
 */

export interface Plan {
  id: string;
  name: string;
  description: string;
  priceId: string;
  features: string[];
}

export const PLANS: Plan[] = [
  {
    id: "professional",
    name: "Professional",
    description: "For individual luxury agents generating monthly reports.",
    priceId: process.env.STRIPE_PRICE_PROFESSIONAL || "",
    features: [
      "Unlimited reports",
      "All data sources",
      "PDF export",
      "Digital sharing links",
      "Custom branding",
    ],
  },
  {
    id: "team",
    name: "Team",
    description: "For teams and brokerages with multiple agents.",
    priceId: process.env.STRIPE_PRICE_TEAM || "",
    features: [
      "Everything in Professional",
      "Team member accounts",
      "Shared report templates",
      "Priority data refresh",
      "Dedicated support",
    ],
  },
];

export function getPlanById(planId: string): Plan | undefined {
  return PLANS.find((p) => p.id === planId);
}
