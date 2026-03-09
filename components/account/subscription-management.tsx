"use client";

import { useState } from "react";

interface SubscriptionData {
  plan: string;
  status: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
}

interface SubscriptionManagementProps {
  subscription: SubscriptionData | null;
  stripeConfigured: boolean;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function SubscriptionManagement({
  subscription,
  stripeConfigured,
}: SubscriptionManagementProps) {
  const [loading, setLoading] = useState(false);

  const cardClass =
    "bg-[var(--color-surface)] rounded-[var(--radius-md)] shadow-[var(--shadow-sm)] p-6";
  const headingClass =
    "font-[family-name:var(--font-serif)] text-xl font-bold text-[var(--color-primary)]";
  const subTextClass =
    "font-[family-name:var(--font-sans)] text-sm text-[var(--color-text-secondary)] mt-1";
  const accentLine = "w-12 h-0.5 bg-[var(--color-accent)] mt-3 mb-6";

  async function handleManageBilling() {
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      // Portal session failed
    } finally {
      setLoading(false);
    }
  }

  async function handleUpgrade() {
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          priceId: "default",
        }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      // Checkout failed
    } finally {
      setLoading(false);
    }
  }

  if (!stripeConfigured) {
    return (
      <div className={cardClass}>
        <h2 className={headingClass}>Subscription</h2>
        <p className={subTextClass}>
          Manage your plan and billing.
        </p>
        <div className={accentLine} />
        <p className="font-[family-name:var(--font-sans)] text-sm text-[var(--color-text-secondary)]">
          Billing is not yet set up. Contact your administrator to configure
          payment processing.
        </p>
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className={cardClass}>
        <h2 className={headingClass}>Subscription</h2>
        <p className={subTextClass}>
          Manage your plan and billing.
        </p>
        <div className={accentLine} />

        <dl className="mb-4">
          <dt className="font-[family-name:var(--font-sans)] text-xs font-medium text-[var(--color-text-tertiary)] uppercase tracking-wider">
            Current Plan
          </dt>
          <dd className="font-[family-name:var(--font-sans)] text-lg font-semibold text-[var(--color-primary)] mt-1">
            Free
          </dd>
        </dl>

        <p className="font-[family-name:var(--font-sans)] text-sm text-[var(--color-text)] mb-4">
          Upgrade to unlock unlimited reports and premium data sources.
        </p>

        <button
          onClick={handleUpgrade}
          disabled={loading}
          className="px-6 py-2 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-[var(--color-primary)] font-[family-name:var(--font-sans)] font-semibold text-sm rounded-[var(--radius-sm)] transition-colors duration-[var(--duration-default)] disabled:opacity-50"
        >
          {loading ? "Loading..." : "Upgrade"}
        </button>
      </div>
    );
  }

  return (
    <div className={cardClass}>
      <h2 className={headingClass}>Subscription</h2>
      <p className={subTextClass}>
        Manage your plan and billing.
      </p>
      <div className={accentLine} />

      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div>
          <dt className="font-[family-name:var(--font-sans)] text-xs font-medium text-[var(--color-text-tertiary)] uppercase tracking-wider">
            Current Plan
          </dt>
          <dd className="font-[family-name:var(--font-sans)] text-lg font-semibold text-[var(--color-primary)] mt-1">
            {capitalize(subscription.plan)}
          </dd>
        </div>
        <div>
          <dt className="font-[family-name:var(--font-sans)] text-xs font-medium text-[var(--color-text-tertiary)] uppercase tracking-wider">
            Status
          </dt>
          <dd className="font-[family-name:var(--font-sans)] text-sm mt-1">
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                subscription.status === "active"
                  ? "bg-[var(--color-success)]/10 text-[var(--color-success)]"
                  : "bg-[var(--color-warning)]/10 text-[var(--color-warning)]"
              }`}
            >
              {capitalize(subscription.status)}
            </span>
          </dd>
        </div>
        {subscription.currentPeriodStart && subscription.currentPeriodEnd && (
          <div className="sm:col-span-2">
            <dt className="font-[family-name:var(--font-sans)] text-xs font-medium text-[var(--color-text-tertiary)] uppercase tracking-wider">
              Current Period
            </dt>
            <dd className="font-[family-name:var(--font-sans)] text-sm text-[var(--color-text)] mt-1">
              {formatDate(subscription.currentPeriodStart)} &mdash;{" "}
              {formatDate(subscription.currentPeriodEnd)}
            </dd>
          </div>
        )}
      </dl>

      <button
        onClick={handleManageBilling}
        disabled={loading}
        className="px-6 py-2 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-[var(--color-primary)] font-[family-name:var(--font-sans)] font-semibold text-sm rounded-[var(--radius-sm)] transition-colors duration-[var(--duration-default)] disabled:opacity-50"
      >
        {loading ? "Loading..." : "Manage Billing"}
      </button>
    </div>
  );
}
