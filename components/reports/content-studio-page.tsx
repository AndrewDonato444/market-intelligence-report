"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import type { SocialMediaKitContent, EmailCampaignContent } from "@/lib/db/schema";
import { KitViewer } from "@/components/reports/kit-viewer";
import { EmailCampaignViewer } from "@/components/reports/email-viewer";
import { GenerateKitButton } from "@/components/reports/generate-kit-button";
import { GenerateEmailButton } from "@/components/reports/generate-email-button";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ContentStudioPageProps {
  reportId: string;
  kitStatus: string | null;
  kitContent: Record<string, unknown> | null;
  kitGeneratedAt: string | null;
  emailStatus: string | null;
  emailContent: Record<string, unknown> | null;
  emailGeneratedAt: string | null;
  kitEntitlement: { allowed: boolean; limit: number };
  emailEntitlement: { allowed: boolean; limit: number };
}

type Tab = "social" | "email";

// ---------------------------------------------------------------------------
// Tab config
// ---------------------------------------------------------------------------

const TABS: { key: Tab; label: string }[] = [
  { key: "social", label: "Social Media" },
  { key: "email", label: "Email Campaigns" },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ContentStudioPage({
  reportId,
  kitStatus,
  kitContent,
  kitGeneratedAt,
  emailStatus,
  emailContent,
  emailGeneratedAt,
  kitEntitlement,
  emailEntitlement,
}: ContentStudioPageProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // Derive active tab from URL on every render (stays in sync with back/forward)
  const activeTab: Tab = searchParams.get("tab") === "email" ? "email" : "social";

  function switchTab(tab: Tab) {
    const params = new URLSearchParams(searchParams.toString());
    if (tab === "email") {
      params.set("tab", "email");
    } else {
      params.delete("tab");
    }
    const qs = params.toString();
    router.replace(`${pathname}${qs ? `?${qs}` : ""}`, { scroll: false });
  }

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href={`/reports/${reportId}`}
        className="font-[family-name:var(--font-sans)] text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors"
      >
        &larr; Back to Report
      </Link>

      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="font-[family-name:var(--font-serif)] text-xl font-bold text-[var(--color-text)]">
          Content Studio
        </h1>
        <GeneratedAtLabel
          kitGeneratedAt={kitGeneratedAt}
          emailGeneratedAt={emailGeneratedAt}
          activeTab={activeTab}
        />
      </div>

      {/* Tab bar */}
      <div role="tablist" className="flex border-b border-[var(--color-border)]">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            role="tab"
            aria-selected={activeTab === tab.key}
            aria-controls={`tabpanel-${tab.key}`}
            onClick={() => switchTab(tab.key)}
            className={`px-4 py-2 text-sm font-[family-name:var(--font-sans)] font-medium transition-colors border-b-2 -mb-px ${
              activeTab === tab.key
                ? "border-[var(--color-accent)] text-[var(--color-text)]"
                : "border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:border-[var(--color-border)]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "social" && (
        <div role="tabpanel" id="tabpanel-social" aria-label="Social Media">
        <SocialMediaTabContent
          reportId={reportId}
          status={kitStatus}
          content={kitContent}
          generatedAt={kitGeneratedAt}
          entitlement={kitEntitlement}
        />
        </div>
      )}
      {activeTab === "email" && (
        <div role="tabpanel" id="tabpanel-email" aria-label="Email Campaigns">
        <EmailTabContent
          reportId={reportId}
          status={emailStatus}
          content={emailContent}
          generatedAt={emailGeneratedAt}
          entitlement={emailEntitlement}
        />
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Social Media tab content
// ---------------------------------------------------------------------------

function SocialMediaTabContent({
  reportId,
  status,
  content,
  generatedAt,
  entitlement,
}: {
  reportId: string;
  status: string | null;
  content: Record<string, unknown> | null;
  generatedAt: string | null;
  entitlement: { allowed: boolean; limit: number };
}) {
  // Completed — show viewer
  if (status === "completed" && content) {
    return (
      <KitViewer
        reportId={reportId}
        content={content as unknown as SocialMediaKitContent}
        generatedAt={generatedAt}
      />
    );
  }

  // Starter tier — upgrade prompt
  if (entitlement.limit === 0 && !entitlement.allowed) {
    return <UpgradePrompt type="social" />;
  }

  // Generating / queued / failed / none — show generate button
  return (
    <div className="text-center py-12 space-y-4">
      <p className="font-[family-name:var(--font-sans)] text-sm text-[var(--color-text-secondary)]">
        Generate platform-optimized posts, captions, polls, and more from your report data.
      </p>
      <GenerateKitButton
        reportId={reportId}
        initialKitStatus={
          (status as "queued" | "generating" | "completed" | "failed") ?? "none"
        }
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Email Campaigns tab content
// ---------------------------------------------------------------------------

function EmailTabContent({
  reportId,
  status,
  content,
  generatedAt,
  entitlement,
}: {
  reportId: string;
  status: string | null;
  content: Record<string, unknown> | null;
  generatedAt: string | null;
  entitlement: { allowed: boolean; limit: number };
}) {
  // Completed — show viewer
  if (status === "completed" && content) {
    return (
      <EmailCampaignViewer
        reportId={reportId}
        content={content as unknown as EmailCampaignContent}
        generatedAt={generatedAt}
      />
    );
  }

  // Starter tier — upgrade prompt
  if (entitlement.limit === 0 && !entitlement.allowed) {
    return <UpgradePrompt type="email" />;
  }

  // Generating / queued / failed / none — show generate button
  return (
    <div className="text-center py-12 space-y-4">
      <p className="font-[family-name:var(--font-sans)] text-sm text-[var(--color-text-secondary)]">
        Generate drip sequences, newsletters, and persona-targeted emails from your report data.
      </p>
      <GenerateEmailButton
        reportId={reportId}
        initialCampaignStatus={
          (status as "queued" | "generating" | "completed" | "failed") ?? "none"
        }
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Upgrade prompt
// ---------------------------------------------------------------------------

function UpgradePrompt({ type }: { type: "social" | "email" }) {
  const title =
    type === "social"
      ? "Social Media Kit — Professional Feature"
      : "Email Campaigns — Professional Feature";

  const benefits =
    type === "social"
      ? [
          "Platform-optimized posts (LinkedIn, Instagram, X, Facebook)",
          "Persona-targeted content for your audience",
          "Poll ideas with data-backed context",
          "Stat callouts for quick sharing",
          "Content calendar suggestions",
        ]
      : [
          "Drip sequences for nurturing leads",
          "Market update newsletters",
          "Persona-targeted email copy",
          "Subject lines and CTAs",
          "Re-engagement templates",
        ];

  return (
    <div className="py-12 max-w-md mx-auto">
      <div className="p-6 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] space-y-4">
        <h2 className="font-[family-name:var(--font-serif)] text-lg font-bold text-[var(--color-primary)]">
          {title}
        </h2>
        <p className="font-[family-name:var(--font-sans)] text-sm text-[var(--color-text-secondary)]">
          Professional Feature
        </p>
        <ul className="font-[family-name:var(--font-sans)] text-sm text-[var(--color-text-secondary)] space-y-2 list-disc list-inside">
          {benefits.map((b) => (
            <li key={b}>{b}</li>
          ))}
        </ul>
        <Link
          href="/account"
          className="block w-full text-center px-4 py-2 bg-[var(--color-accent)] text-[var(--color-primary)] font-[family-name:var(--font-sans)] font-medium text-sm rounded-[var(--radius-sm)] transition-colors hover:opacity-90"
        >
          View Plans to Upgrade
        </Link>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Generated-at label (shows relevant timestamp for active tab)
// ---------------------------------------------------------------------------

function GeneratedAtLabel({
  kitGeneratedAt,
  emailGeneratedAt,
  activeTab,
}: {
  kitGeneratedAt: string | null;
  emailGeneratedAt: string | null;
  activeTab: Tab;
}) {
  const ts = activeTab === "social" ? kitGeneratedAt : emailGeneratedAt;
  if (!ts) return null;

  const date = new Date(ts);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  let label: string;
  if (diffHours < 1) label = "Generated just now";
  else if (diffHours < 24) label = `Generated ${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
  else label = `Generated ${diffDays} day${diffDays === 1 ? "" : "s"} ago`;

  return (
    <span className="font-[family-name:var(--font-sans)] text-xs text-[var(--color-text-secondary)]">
      {label}
    </span>
  );
}
