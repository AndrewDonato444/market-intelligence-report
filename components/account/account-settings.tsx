"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface EntitlementData {
  used: number;
  limit: number;
  remaining: number;
}

export interface SubscriptionData {
  tierName: string;
  tierDescription: string;
  displayPrice: string;
  entitlements: {
    reports: EntitlementData;
    markets: EntitlementData;
    socialMediaKits: EntitlementData;
    emailCampaigns: EntitlementData;
    personasPerReport: EntitlementData;
  };
  billingPeriod: { start: string; end: string };
  nextTier: {
    name: string;
    displayPrice: string;
    entitlements: {
      reports_per_month: number;
      markets_created: number;
      social_media_kits: number;
      email_campaigns: number;
      personas_per_report: number;
    };
  } | null;
}

interface AccountSettingsProps {
  email: string;
  memberSince: string;
  stats: {
    reportCount: number;
    marketCount: number;
  };
  subscriptionData?: SubscriptionData | null;
}

function formatMemberSince(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

function formatBillingDate(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00Z");
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

function UsageEntitlementBar({
  label,
  used,
  limit,
  remaining,
  testId,
}: {
  label: string;
  used: number;
  limit: number;
  remaining: number;
  testId: string;
}) {
  const isUnlimited = limit === -1;
  const percentage = isUnlimited ? 0 : limit > 0 ? Math.round((used / limit) * 100) : 0;
  const isWarning = !isUnlimited && limit > 0 && percentage >= 80;
  const isAtCap = !isUnlimited && remaining <= 0 && limit > 0;

  const barColorClass = isWarning ? "warning" : "normal";

  return (
    <div data-testid={testId} className="mb-4">
      <div className="flex items-center justify-between mb-1">
        <span className="font-[family-name:var(--font-sans)] text-sm font-medium text-[var(--color-text)]">
          {label}
        </span>
        <span className="font-[family-name:var(--font-sans)] text-sm text-[var(--color-text-secondary)]">
          {isUnlimited ? (
            <>
              {used} reports generated
              <span className="ml-2 inline-block px-2 py-0.5 text-xs font-medium rounded-full bg-[var(--color-accent)]/10 text-[var(--color-accent)]">
                Unlimited
              </span>
            </>
          ) : (
            `${used} of ${limit} used`
          )}
        </span>
      </div>
      {!isUnlimited && limit > 0 && (
        <>
          <div className="w-full h-2 rounded-full bg-[var(--color-border)]">
            <div
              data-testid="usage-bar-fill"
              className={`h-2 rounded-full transition-all ${barColorClass}`}
              style={{
                width: `${Math.min(percentage, 100)}%`,
                backgroundColor: isWarning
                  ? "var(--color-warning)"
                  : "var(--color-primary)",
              }}
            />
          </div>
          <div className="mt-1 font-[family-name:var(--font-sans)] text-xs text-[var(--color-text-secondary)]">
            {isAtCap ? "Cap reached" : `${remaining} remaining`}
          </div>
        </>
      )}
    </div>
  );
}

function SubscriptionSection({ data }: { data: SubscriptionData }) {
  const { tierName, tierDescription, displayPrice, entitlements, billingPeriod, nextTier } = data;
  const { reports, markets, socialMediaKits, emailCampaigns, personasPerReport } = entitlements;

  const hasReportAtCap = reports.limit > 0 && reports.remaining <= 0;

  return (
    <>
      {/* Tier Card */}
      <div className="p-4 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)]">
        <div className="flex items-center justify-between">
          <span className="font-[family-name:var(--font-serif)] text-xl font-bold text-[var(--color-primary)] uppercase">
            {tierName}
          </span>
          <span className="font-[family-name:var(--font-sans)] text-lg font-semibold text-[var(--color-accent)]">
            {displayPrice}
          </span>
        </div>
        <p className="font-[family-name:var(--font-sans)] text-sm text-[var(--color-text-secondary)] mt-2">
          {tierDescription}
        </p>
      </div>

      {/* Usage This Period */}
      <div className="mt-6">
        <h3 className="font-[family-name:var(--font-sans)] text-sm font-semibold text-[var(--color-text)] mb-1">
          Usage This Period
        </h3>
        <p className="font-[family-name:var(--font-sans)] text-xs text-[var(--color-text-secondary)] mb-4">
          {formatBillingDate(billingPeriod.start)} &ndash; {formatBillingDate(billingPeriod.end)}
        </p>

        <UsageEntitlementBar
          label="Reports This Month"
          used={reports.used}
          limit={reports.limit}
          remaining={reports.remaining}
          testId="entitlement-reports"
        />

        <UsageEntitlementBar
          label="Markets"
          used={markets.used}
          limit={markets.limit}
          remaining={markets.remaining}
          testId="entitlement-markets"
        />

        {/* Social Media Kits */}
        <div className="flex items-center justify-between mb-4">
          <span className="font-[family-name:var(--font-sans)] text-sm font-medium text-[var(--color-text)]">
            Social Media Kits
          </span>
          <span className="font-[family-name:var(--font-sans)] text-sm text-[var(--color-text-secondary)]">
            Included
          </span>
        </div>

        {/* Email Campaigns */}
        <div className="flex items-center justify-between mb-4">
          <span className="font-[family-name:var(--font-sans)] text-sm font-medium text-[var(--color-text)]">
            Email Campaigns
          </span>
          <span className="font-[family-name:var(--font-sans)] text-sm text-[var(--color-text-secondary)]">
            Included
          </span>
        </div>

        {/* Client Personas */}
        <div className="flex items-center justify-between mb-4">
          <span className="font-[family-name:var(--font-sans)] text-sm font-medium text-[var(--color-text)]">
            Client Personas
          </span>
          <span className="font-[family-name:var(--font-sans)] text-sm text-[var(--color-text-secondary)]">
            {personasPerReport.limit} per report
          </span>
        </div>
      </div>

      {/* At-cap upgrade prompt for reports */}
      {hasReportAtCap && nextTier && (
        <p className="font-[family-name:var(--font-sans)] text-sm text-[var(--color-warning)] mt-2">
          You&apos;ve used all your reports this month. Upgrade to {nextTier.name} for{" "}
          {nextTier.entitlements.reports_per_month} reports per month.
        </p>
      )}

    </>
  );
}

export function AccountSettings({
  email,
  memberSince,
  stats,
  subscriptionData,
}: AccountSettingsProps) {
  const router = useRouter();

  async function handleSignOutEverywhere() {
    const supabase = createClient();
    await supabase.auth.signOut({ scope: "global" });
    router.push("/sign-in");
  }

  const cardClass =
    "bg-[var(--color-surface)] rounded-[var(--radius-md)] shadow-[var(--shadow-sm)] p-6";
  const headingClass =
    "font-[family-name:var(--font-serif)] text-xl font-bold text-[var(--color-primary)]";
  const subTextClass =
    "font-[family-name:var(--font-sans)] text-sm text-[var(--color-text-secondary)] mt-1";
  const accentLine = "w-12 h-0.5 bg-[var(--color-accent)] mt-3 mb-6";

  return (
    <div className="space-y-8">
      {/* Account Information */}
      <div className={cardClass}>
        <h2 className={headingClass}>Account Information</h2>
        <p className={subTextClass}>Your account details and usage summary.</p>
        <div className={accentLine} />

        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <dt className="font-[family-name:var(--font-sans)] text-xs font-medium text-[var(--color-text-tertiary)] uppercase tracking-wider">
              Email
            </dt>
            <dd className="font-[family-name:var(--font-sans)] text-sm text-[var(--color-text)] mt-1">
              {email}
            </dd>
          </div>
          <div>
            <dt className="font-[family-name:var(--font-sans)] text-xs font-medium text-[var(--color-text-tertiary)] uppercase tracking-wider">
              Member Since
            </dt>
            <dd className="font-[family-name:var(--font-sans)] text-sm text-[var(--color-text)] mt-1">
              {formatMemberSince(memberSince)}
            </dd>
          </div>
          <div>
            <dt className="font-[family-name:var(--font-sans)] text-xs font-medium text-[var(--color-text-tertiary)] uppercase tracking-wider">
              Reports Generated
            </dt>
            <dd className="font-[family-name:var(--font-sans)] text-2xl font-bold text-[var(--color-primary)] mt-1">
              {stats.reportCount}
            </dd>
          </div>
          <div>
            <dt className="font-[family-name:var(--font-sans)] text-xs font-medium text-[var(--color-text-tertiary)] uppercase tracking-wider">
              Markets Defined
            </dt>
            <dd className="font-[family-name:var(--font-sans)] text-2xl font-bold text-[var(--color-primary)] mt-1">
              {stats.marketCount}
            </dd>
          </div>
        </dl>
      </div>

      {/* Your Plan — Subscription Section */}
      <div className={cardClass}>
        <h2 className={headingClass}>Your Plan</h2>
        <p className={subTextClass}>Your subscription and usage details.</p>
        <div className={accentLine} />

        {subscriptionData ? (
          <SubscriptionSection data={subscriptionData} />
        ) : (
          <p className="font-[family-name:var(--font-sans)] text-sm text-[var(--color-text-secondary)]">
            Unable to load subscription details. Please try again.
          </p>
        )}
      </div>

      {/* Session Management */}
      <div className={cardClass}>
        <h2 className={headingClass}>Session Management</h2>
        <p className={subTextClass}>
          Manage your active sessions across devices.
        </p>
        <div className={accentLine} />

        <p className="font-[family-name:var(--font-sans)] text-sm text-[var(--color-text)] mb-4">
          Sign out from all active sessions. You will need to sign in again on
          every device.
        </p>
        <button
          onClick={handleSignOutEverywhere}
          className="px-4 py-2 bg-[var(--color-error)] hover:bg-[var(--color-error)]/90 text-white font-[family-name:var(--font-sans)] font-medium text-sm rounded-[var(--radius-sm)] transition-colors duration-[var(--duration-default)]"
        >
          Sign Out Everywhere
        </button>
      </div>
    </div>
  );
}
