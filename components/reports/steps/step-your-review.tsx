"use client";

import React, { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { motion } from "framer-motion";
import { fadeVariant, staggerContainer } from "@/lib/animations";
import type { StepMarketData } from "./step-your-market";
import type { StepTierData } from "./step-your-tier";
import type { StepFocusData } from "./step-your-focus";
import type { StepAudienceData } from "./step-your-audience";

// ---------------------------------------------------------------------------
// Data contract
// ---------------------------------------------------------------------------

export interface StepReviewData {
  reportId: string;
  title: string;
}

interface StepYourReviewProps {
  marketData: StepMarketData | null;
  tierData: StepTierData | null;
  focusData: StepFocusData | null;
  audienceData: StepAudienceData | null;
  onStepComplete: (data: StepReviewData) => void;
  onValidationChange?: (valid: boolean) => void;
  onNavigateToStep: (stepIndex: number) => void;
}

// ---------------------------------------------------------------------------
// Label maps
// ---------------------------------------------------------------------------

const TIER_LABELS: Record<string, string> = {
  luxury: "Luxury",
  high_luxury: "High Luxury",
  ultra_luxury: "Ultra Luxury",
};

const SEGMENT_LABELS: Record<string, string> = {
  "high-rise": "High-Rise",
  penthouse: "Penthouse",
  townhouse: "Townhouse",
  "arts district": "Arts & Culture District",
  "trophy home": "Trophy Home",
  waterfront: "Waterfront",
  beachfront: "Beachfront",
  lakefront: "Lakefront",
  marina: "Private Dock / Marina",
  island: "Island",
  "golf course": "Golf Course",
  "gated community": "Gated Community",
  "ski-in/ski-out": "Ski-In/Ski-Out",
  "mountain view": "Mountain View",
  equestrian: "Equestrian",
  "country estate": "Country Estate",
  "historic district": "Historic District",
  "new development": "New Development",
  vineyard: "Vineyard",
  desert: "Desert",
};

const PROPERTY_TYPE_LABELS: Record<string, string> = {
  single_family: "Single Family",
  estate: "Estate",
  condo: "Condo",
  townhouse: "Townhouse",
  "co-op": "Co-op",
  penthouse: "Penthouse",
  chalet: "Chalet",
  villa: "Villa",
  ranch: "Ranch",
  land: "Land",
};

// All report sections (matches report-validation.ts)
const ALL_SECTIONS = [
  "executive_briefing",
  "market_insights_index",
  "luxury_market_dashboard",
  "neighborhood_intelligence",
  "the_narrative",
  "forward_look",
  "comparative_positioning",
  "strategic_benchmark",
  "disclaimer_methodology",
  "persona_intelligence",
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function generateTitle(city: string, tier: string): string {
  const tierLabel = TIER_LABELS[tier] || "Luxury";
  return `${city} ${tierLabel} Market Intelligence Report`;
}

// ---------------------------------------------------------------------------
// ReviewSectionCard
// ---------------------------------------------------------------------------

function ReviewSectionCard({
  label,
  onEdit,
  children,
}: {
  label: string;
  onEdit: () => void;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      variants={fadeVariant}
      className="border border-[var(--color-border)] rounded-[var(--radius-md)] p-4 bg-[var(--color-surface)]"
    >
      <div className="flex items-start justify-between mb-2">
        <span className="uppercase text-xs font-semibold text-[var(--color-text-tertiary)] font-[family-name:var(--font-sans)]">
          {label}
        </span>
        <button
          type="button"
          onClick={onEdit}
          aria-label={`Edit ${label}`}
          className="text-xs text-[var(--color-accent)] hover:text-[var(--color-accent-hover)] font-[family-name:var(--font-sans)] transition-colors duration-[var(--duration-default)]"
        >
          Edit
        </button>
      </div>
      {children}
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Tag
// ---------------------------------------------------------------------------

function Tag({
  children,
  variant = "primary",
}: {
  children: React.ReactNode;
  variant?: "primary" | "accent";
}) {
  const bg =
    variant === "accent"
      ? "bg-[var(--color-accent-light)]"
      : "bg-[var(--color-primary-light)]";
  return (
    <span
      className={`inline-block px-2.5 py-1 ${bg} text-xs rounded-full font-[family-name:var(--font-sans)] text-[var(--color-text)] mr-1.5 mb-1.5`}
    >
      {children}
    </span>
  );
}

// ---------------------------------------------------------------------------
// StepYourReview
// ---------------------------------------------------------------------------

// "View Plans" target — update when #177 (Account & Billing page) is built
const VIEW_PLANS_HREF = "/account";

// Entitlement check result shape
interface EntitlementState {
  allowed: boolean;
  limit: number;
  used: number;
  remaining: number;
}

export function StepYourReview({
  marketData,
  tierData,
  focusData,
  audienceData,
  onStepComplete,
  onValidationChange,
  onNavigateToStep,
}: StepYourReviewProps) {
  // Auto-generated title
  const defaultTitle = useMemo(
    () => generateTitle(marketData?.city || "Market", tierData?.luxuryTier || "luxury"),
    [marketData?.city, tierData?.luxuryTier]
  );

  const [title, setTitle] = useState(defaultTitle);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [personaNames, setPersonaNames] = useState<Record<string, string>>({});
  // Cache created market ID so retries don't create duplicates
  const createdMarketIdRef = useRef<string | null>(null);

  // Entitlement state
  const [entitlement, setEntitlement] = useState<EntitlementState | null>(null);
  const [entitlementLoading, setEntitlementLoading] = useState(true);
  const [gateDismissed, setGateDismissed] = useState(false);

  // Report step 5 as always valid
  useEffect(() => {
    onValidationChange?.(true);
  }, [onValidationChange]);

  // Fetch entitlement check on mount
  useEffect(() => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    fetch("/api/entitlements/check?type=reports_per_month", {
      signal: controller.signal,
    })
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data: EntitlementState) => {
        setEntitlement(data);
        setEntitlementLoading(false);
      })
      .catch(() => {
        // Fail-open: enable button, hide usage indicator
        setEntitlement(null);
        setEntitlementLoading(false);
      })
      .finally(() => clearTimeout(timeout));

    return () => {
      controller.abort();
      clearTimeout(timeout);
    };
  }, []);

  // Fetch persona names for display
  useEffect(() => {
    const ids = audienceData?.personaIds || [];
    if (ids.length === 0) return;

    fetch("/api/buyer-personas")
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => {
        const map: Record<string, string> = {};
        for (const p of data.personas || []) {
          map[p.id] = p.name;
        }
        setPersonaNames(map);
      })
      .catch(() => {
        // Graceful fallback — show IDs if names can't load
      });
  }, [audienceData?.personaIds]);

  const isTitleValid = title.trim().length > 0 && title.length <= 500;
  const isTitleEmpty = title.trim().length === 0;

  // Entitlement-derived state
  const isUnlimited = entitlement?.limit === -1;
  const isCapHit = entitlement !== null && !entitlement.allowed;
  const isLastReport =
    entitlement !== null &&
    entitlement.allowed &&
    entitlement.remaining === 1 &&
    !isUnlimited;
  const showUsageIndicator =
    entitlement !== null && !isUnlimited && !entitlementLoading;
  const isGenerateDisabled =
    !isTitleValid || isSubmitting || entitlementLoading || isCapHit;

  const handleGenerate = useCallback(async () => {
    if (!isTitleValid || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);

    try {
      let marketId: string;

      // Create market if new (reuse cached ID on retry to avoid duplicates)
      if (marketData?.isNewMarket) {
        if (createdMarketIdRef.current) {
          marketId = createdMarketIdRef.current;
        } else {
          const marketRes = await fetch("/api/markets", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: marketData.marketName || `${marketData.city} ${marketData.state}`,
              geography: {
                city: marketData.city,
                state: marketData.state,
                county: marketData.county || undefined,
                region: marketData.region || undefined,
              },
              luxuryTier: tierData?.luxuryTier || "luxury",
              priceFloor: tierData?.priceFloor || 1000000,
              priceCeiling: tierData?.priceCeiling || undefined,
              segments: focusData?.segments || [],
              propertyTypes: focusData?.propertyTypes || [],
            }),
          });

          if (!marketRes.ok) throw new Error("Failed to create market");
          const marketJson = await marketRes.json();
          marketId = marketJson.market.id;
          createdMarketIdRef.current = marketId;
        }
      } else {
        marketId = marketData?.existingMarketId || "";
      }

      // Create report
      const reportRes = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          marketId,
          title: title.trim(),
          sections: ALL_SECTIONS,
          personaIds: audienceData?.personaIds || [],
        }),
      });

      if (!reportRes.ok) throw new Error("Failed to create report");
      const reportJson = await reportRes.json();
      const reportId = reportJson.report.id;

      onStepComplete({ reportId, title: title.trim() });
    } catch {
      setIsSubmitting(false);
      setError("Something went wrong. Please try again.");
    }
  }, [isTitleValid, isSubmitting, marketData, tierData, focusData, audienceData, title, onStepComplete]);

  // Price range display
  const priceDisplay = useMemo(() => {
    if (!tierData) return "";
    const floor = formatCurrency(tierData.priceFloor);
    const ceiling = tierData.priceCeiling ? formatCurrency(tierData.priceCeiling) : "+";
    return tierData.priceCeiling ? `${floor} \u2013 ${ceiling}` : `${floor}${ceiling}`;
  }, [tierData]);

  const tierLabel = TIER_LABELS[tierData?.luxuryTier || "luxury"] || "Luxury";

  return (
    <div className="py-4">
      {/* Heading */}
      <h2 className="font-[family-name:var(--font-serif)] text-2xl font-bold text-[var(--color-primary)]">
        Review Your Report
      </h2>
      <p className="mt-2 font-[family-name:var(--font-sans)] text-sm text-[var(--color-text-secondary)]">
        Everything look right? Edit any section or generate your intelligence report.
      </p>
      <div className="w-12 h-0.5 bg-[var(--color-accent)] mt-3 mb-6" />

      {/* Summary sections */}
      <motion.div
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        className="space-y-3"
      >
        {/* Your Market */}
        <ReviewSectionCard label="Your Market" onEdit={() => onNavigateToStep(0)}>
          <p className="font-[family-name:var(--font-sans)] text-sm font-medium text-[var(--color-text)]">
            {marketData?.city || "Not selected"}, {marketData?.state || ""}
          </p>
        </ReviewSectionCard>

        {/* Your Tier */}
        <ReviewSectionCard label="Your Tier" onEdit={() => onNavigateToStep(1)}>
          <p className="font-[family-name:var(--font-sans)] text-sm font-medium text-[var(--color-text)]">
            {tierLabel} &middot; {priceDisplay}
          </p>
        </ReviewSectionCard>

        {/* Your Focus */}
        <ReviewSectionCard label="Your Focus" onEdit={() => onNavigateToStep(2)}>
          <div className="mb-1">
            {(focusData?.segments || []).map((s: string) => (
              <Tag key={s} variant="primary">
                {SEGMENT_LABELS[s] || s}
              </Tag>
            ))}
          </div>
          <div>
            {(focusData?.propertyTypes || []).map((pt: string) => (
              <Tag key={pt} variant="accent">
                {PROPERTY_TYPE_LABELS[pt] || pt}
              </Tag>
            ))}
          </div>
        </ReviewSectionCard>

        {/* Your Audience */}
        <ReviewSectionCard label="Your Audience" onEdit={() => onNavigateToStep(3)}>
          {(audienceData?.personaIds || []).length > 0 ? (
            <div>
              {audienceData!.personaIds.map((id) => (
                <Tag key={id} variant="primary">
                  {personaNames[id] || id}
                </Tag>
              ))}
            </div>
          ) : (
            <p className="font-[family-name:var(--font-sans)] text-sm text-[var(--color-text-secondary)] italic">
              No buyer personas selected — report will use general framing
            </p>
          )}
        </ReviewSectionCard>

        {/* Report Title */}
        <motion.div variants={fadeVariant} className="pt-2">
          <label
            htmlFor="report-title"
            className="block uppercase text-xs font-semibold text-[var(--color-text-tertiary)] font-[family-name:var(--font-sans)] mb-2"
          >
            Report Title
          </label>
          <input
            id="report-title"
            type="text"
            aria-label="Report title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={500}
            className="w-full px-3 py-2.5 font-[family-name:var(--font-sans)] text-sm text-[var(--color-text)] border border-[var(--color-border)] rounded-[var(--radius-sm)] bg-[var(--color-surface)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)] transition-colors duration-[var(--duration-default)]"
          />
          <div className="flex justify-between mt-1">
            <div>
              {isTitleEmpty && (
                <p className="text-xs text-[var(--color-error)] font-[family-name:var(--font-sans)]" role="alert">
                  Report title is required
                </p>
              )}
            </div>
            <p
              id="title-char-count"
              className="text-xs text-[var(--color-text-tertiary)] font-[family-name:var(--font-sans)]"
            >
              {title.length} / 500
            </p>
          </div>
        </motion.div>

        {/* Estimated time */}
        <motion.div variants={fadeVariant}>
          <p className="text-center font-[family-name:var(--font-sans)] text-xs text-[var(--color-text-tertiary)] py-2">
            Estimated generation time: 2-4 minutes
          </p>
        </motion.div>

        {/* Entitlement: Loading skeleton */}
        {entitlementLoading && (
          <motion.div
            variants={fadeVariant}
            aria-busy="true"
            aria-label="Checking report availability"
            className="rounded-[var(--radius-sm)] bg-[var(--color-primary-light)] p-[var(--spacing-2)]"
          >
            <div className="h-3.5 w-44 bg-[var(--color-border)] rounded animate-pulse" />
          </motion.div>
        )}

        {/* Entitlement: Usage indicator (when quota remains) */}
        {showUsageIndicator && !isCapHit && (
          <motion.div
            variants={fadeVariant}
            aria-label={`Report usage: ${entitlement.used} of ${entitlement.limit} reports used this month`}
            className={`rounded-[var(--radius-sm)] p-[var(--spacing-2)] ${
              isLastReport
                ? "bg-[var(--color-accent-light)]"
                : "bg-[var(--color-primary-light)]"
            }`}
          >
            <p className="font-[family-name:var(--font-sans)] text-xs text-[var(--color-text-secondary)]">
              {entitlement.used} of {entitlement.limit} reports used this month
            </p>
            {isLastReport && (
              <p className="font-[family-name:var(--font-sans)] text-xs text-[var(--color-warning)] mt-0.5">
                This is your last report this month on the Starter plan
              </p>
            )}
          </motion.div>
        )}

        {/* Entitlement: Soft gate banner (when cap is hit) */}
        {isCapHit && !gateDismissed && (
          <motion.div
            variants={fadeVariant}
            role="alert"
            id="entitlement-gate-banner"
            className="border border-[var(--color-border-strong)] rounded-[var(--radius-md)] shadow-[var(--shadow-sm)] bg-[var(--color-surface)] p-[var(--spacing-6)]"
          >
            <h3 className="font-[family-name:var(--font-serif)] text-lg font-bold text-[var(--color-text)]">
              You&apos;ve Reached Your Monthly Limit
            </h3>
            <p className="mt-2 font-[family-name:var(--font-sans)] text-sm text-[var(--color-text-secondary)]">
              You&apos;ve used {entitlement!.used} of {entitlement!.limit} reports
              this month on the Starter plan. Upgrade to Professional for 10
              reports per month — plus peer market analysis and expanded audience
              targeting.
            </p>
            <div className="flex items-center gap-4 mt-4">
              <a
                href={VIEW_PLANS_HREF}
                className="inline-block px-4 py-2 bg-[var(--color-accent)] text-[var(--color-primary)] font-[family-name:var(--font-sans)] font-semibold text-sm rounded-[var(--radius-sm)] transition-colors duration-[var(--duration-default)] hover:bg-[var(--color-accent-hover)]"
              >
                View Plans
              </a>
              <button
                type="button"
                onClick={() => setGateDismissed(true)}
                className="font-[family-name:var(--font-sans)] text-sm text-[var(--color-text-secondary)] underline"
              >
                Maybe Later
              </button>
            </div>
          </motion.div>
        )}

        {/* Error message */}
        {error && (
          <p className="text-center font-[family-name:var(--font-sans)] text-sm text-[var(--color-error)]" role="alert">
            {error}
          </p>
        )}

        {/* Generate button */}
        <motion.div variants={fadeVariant}>
          <button
            type="button"
            onClick={handleGenerate}
            disabled={isGenerateDisabled}
            aria-busy={isSubmitting}
            aria-disabled={isCapHit || undefined}
            aria-describedby={isCapHit ? "entitlement-gate-banner" : undefined}
            className="w-full py-3 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-[var(--color-primary)] font-[family-name:var(--font-sans)] font-semibold text-sm rounded-[var(--radius-sm)] shadow-[var(--shadow-sm)] transition-colors duration-[var(--duration-default)] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[var(--color-accent)]"
          >
            {isSubmitting ? "Generating..." : "Generate Report"}
          </button>
        </motion.div>
      </motion.div>
    </div>
  );
}
