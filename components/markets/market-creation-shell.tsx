"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { pageTransition } from "@/lib/animations";
import { CreationStepIndicator } from "@/components/reports/creation-step-indicator";
import { StepYourMarket } from "@/components/reports/steps/step-your-market";
import { StepYourTier } from "@/components/reports/steps/step-your-tier";
import { StepYourFocus } from "@/components/reports/steps/step-your-focus";
import type { StepMarketData } from "@/components/reports/steps/step-your-market";
import type { StepTierData } from "@/components/reports/steps/step-your-tier";
import type { StepFocusData } from "@/components/reports/steps/step-your-focus";
import type { PageDirection } from "@/lib/animations";

// "View Plans" target — update when #177 (Account & Billing page) is built
const VIEW_PLANS_HREF = "/account";

// Entitlement check result shape
interface EntitlementState {
  allowed: boolean;
  limit: number;
  used: number;
  remaining: number;
}

// ---------------------------------------------------------------------------
// Steps (3 only — no audience / review / generate)
// ---------------------------------------------------------------------------

const STEPS = [
  { name: "Your Market", description: "Define the geography for your market." },
  { name: "Your Tier", description: "Choose the luxury tier and price range." },
  { name: "Your Focus", description: "Pick market segments and property types." },
];

const STEP_NAMES = STEPS.map((s) => s.name);

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface MarketCreationShellProps {
  mode?: "create" | "edit";
  marketId?: string;
  initialData?: {
    name: string;
    geography: { city: string; state: string; county?: string; region?: string };
    luxuryTier: "luxury" | "high_luxury" | "ultra_luxury";
    priceFloor: number;
    priceCeiling?: number | null;
    segments?: string[] | null;
    propertyTypes?: string[] | null;
  };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function MarketCreationShell({
  mode = "create",
  marketId,
  initialData,
}: MarketCreationShellProps) {
  const router = useRouter();
  const isEdit = mode === "edit";

  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState<PageDirection>("forward");
  const [stepValid, setStepValid] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Entitlement state (create mode only)
  const [entitlement, setEntitlement] = useState<EntitlementState | null>(null);
  const [entitlementLoading, setEntitlementLoading] = useState(!isEdit);
  const [gateDismissed, setGateDismissed] = useState(false);

  // Data refs — pre-populate in edit mode
  const marketDataRef = useRef<StepMarketData | null>(
    initialData
      ? {
          city: initialData.geography.city,
          state: initialData.geography.state,
          county: initialData.geography.county,
          region: initialData.geography.region,
          marketName: initialData.name,
          isNewMarket: !isEdit,
        }
      : null,
  );
  const tierDataRef = useRef<StepTierData | null>(
    initialData
      ? {
          luxuryTier: initialData.luxuryTier,
          priceFloor: initialData.priceFloor,
          priceCeiling: initialData.priceCeiling ?? undefined,
        }
      : null,
  );
  const focusDataRef = useRef<StepFocusData | null>(
    initialData
      ? {
          segments: initialData.segments ?? [],
          propertyTypes: initialData.propertyTypes ?? [],
        }
      : null,
  );

  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === STEPS.length - 1;

  // Fetch entitlement check when reaching step 3 (create mode only)
  useEffect(() => {
    if (isEdit || currentStep !== 2) return;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    setEntitlementLoading(true);
    fetch("/api/entitlements/check?type=markets_created", {
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
  }, [isEdit, currentStep]);

  // Entitlement-derived state
  const isUnlimited = entitlement?.limit === -1;
  const isCapHit = entitlement !== null && !entitlement.allowed;
  const isLastMarket =
    entitlement !== null &&
    entitlement.allowed &&
    entitlement.remaining === 1 &&
    !isUnlimited;
  const showUsageIndicator =
    entitlement !== null && !isUnlimited && !entitlementLoading && isLastStep && !isEdit;
  const isSaveDisabled =
    saving || (!isEdit && (entitlementLoading || isCapHit));

  // --- Navigation ---
  const handleNext = () => {
    if (!isLastStep) {
      setDirection("forward");
      setCurrentStep((s) => s + 1);
      setStepValid(false);
    }
  };

  const handleBack = () => {
    if (!isFirstStep) {
      setDirection("backward");
      setCurrentStep((s) => s - 1);
      setStepValid(false);
    }
  };

  // --- Step callbacks ---
  const handleMarketStepComplete = useCallback((data: StepMarketData) => {
    marketDataRef.current = data;
  }, []);

  const handleTierStepComplete = useCallback((data: StepTierData) => {
    tierDataRef.current = data;
  }, []);

  const handleFocusStepComplete = useCallback((data: StepFocusData) => {
    focusDataRef.current = data;
  }, []);

  const handleValidation = useCallback((valid: boolean) => {
    setStepValid(valid);
  }, []);

  // --- Save market ---
  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    setError(null);

    const market = marketDataRef.current;
    const tier = tierDataRef.current;
    const focus = focusDataRef.current;

    const body = {
      name: market?.marketName || `${market?.city} ${market?.state}`,
      geography: {
        city: market?.city,
        state: market?.state,
        county: market?.county || undefined,
        region: market?.region || undefined,
      },
      luxuryTier: tier?.luxuryTier || "luxury",
      priceFloor: tier?.priceFloor || 1000000,
      priceCeiling: tier?.priceCeiling || undefined,
      segments: focus?.segments || [],
      propertyTypes: focus?.propertyTypes || [],
    };

    try {
      const url = isEdit ? `/api/markets/${marketId}` : "/api/markets";
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to save market");
      }

      router.push("/markets");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setSaving(false);
    }
  };

  // --- Render steps ---
  const renderStepContent = () => {
    if (currentStep === 0) {
      return (
        <StepYourMarket
          markets={[]}
          onStepComplete={handleMarketStepComplete}
          onValidationChange={handleValidation}
        />
      );
    }

    if (currentStep === 1) {
      return (
        <StepYourTier
          onStepComplete={handleTierStepComplete}
          onValidationChange={handleValidation}
        />
      );
    }

    if (currentStep === 2) {
      return (
        <StepYourFocus
          marketData={
            marketDataRef.current
              ? { city: marketDataRef.current.city, state: marketDataRef.current.state }
              : undefined
          }
          onStepComplete={handleFocusStepComplete}
          onValidationChange={handleValidation}
        />
      );
    }

    return null;
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-[var(--color-surface)] rounded-[var(--radius-md)] shadow-[var(--shadow-sm)] p-8">
        <h1 className="font-[family-name:var(--font-serif)] text-2xl font-bold text-[var(--color-primary)]">
          {isEdit ? "Edit Your Market" : "Define Your Market"}
        </h1>
        <p className="font-[family-name:var(--font-sans)] text-sm text-[var(--color-text-secondary)] mt-1">
          {isEdit
            ? "Update the market that drives your intelligence reports."
            : "Set up the market that drives your intelligence reports."}
        </p>
        <div className="w-12 h-0.5 bg-[var(--color-accent)] mt-3 mb-8" />

        <CreationStepIndicator steps={STEP_NAMES} currentStep={currentStep} />

        {/* Step content with slide animation */}
        <div className="min-h-[200px] relative overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              variants={pageTransition(direction)}
              initial="initial"
              animate="animate"
              exit="exit"
              data-testid={`step-content-${currentStep}`}
            >
              {renderStepContent()}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Entitlement: Loading skeleton (step 3, create mode) */}
        {isLastStep && !isEdit && entitlementLoading && (
          <div
            aria-busy="true"
            aria-label="Checking market availability"
            className="mt-4 rounded-[var(--radius-sm)] bg-[var(--color-primary-light)] p-[var(--spacing-2)]"
          >
            <div className="h-3.5 w-44 bg-[var(--color-border)] rounded animate-pulse" />
          </div>
        )}

        {/* Entitlement: Usage indicator (when quota remains) */}
        {showUsageIndicator && !isCapHit && (
          <div
            aria-label={`Market usage: ${entitlement.used} of ${entitlement.limit} markets defined`}
            className={`mt-4 rounded-[var(--radius-sm)] p-[var(--spacing-2)] ${
              isLastMarket
                ? "bg-[var(--color-accent-light)]"
                : "bg-[var(--color-primary-light)]"
            }`}
          >
            <p className="font-[family-name:var(--font-sans)] text-xs text-[var(--color-text-secondary)]">
              {entitlement.used} of {entitlement.limit} markets defined
            </p>
            {isLastMarket && (
              <p className="font-[family-name:var(--font-sans)] text-xs text-[var(--color-warning)] mt-0.5">
                This is your last available market on the Professional plan
              </p>
            )}
          </div>
        )}

        {/* Entitlement: Soft gate banner (when cap is hit) */}
        {isLastStep && !isEdit && isCapHit && !gateDismissed && (
          <div
            role="alert"
            id="entitlement-gate-banner"
            className="mt-4 border border-[var(--color-border-strong)] rounded-[var(--radius-md)] shadow-[var(--shadow-sm)] bg-[var(--color-surface)] p-[var(--spacing-6)]"
          >
            <h3 className="font-[family-name:var(--font-serif)] text-lg font-bold text-[var(--color-text)]">
              You&apos;ve Reached Your Market Limit
            </h3>
            <p className="mt-2 font-[family-name:var(--font-sans)] text-sm text-[var(--color-text-secondary)]">
              Your current market is still fully active. Upgrade to
              Professional to define up to 3 markets — track multiple
              geographies and give your clients broader intelligence.
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
          </div>
        )}

        {/* Error message */}
        {error && (
          <p className="mt-4 text-sm text-[var(--color-error)] font-[family-name:var(--font-sans)]">
            {error}
          </p>
        )}

        {/* Navigation */}
        <div className="flex justify-between mt-6 pt-6 border-t border-[var(--color-border)]">
          <div>
            {!isFirstStep && (
              <button
                type="button"
                onClick={handleBack}
                className="px-5 py-2.5 font-[family-name:var(--font-sans)] text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors duration-[var(--duration-default)] rounded-[var(--radius-sm)]"
              >
                Back
              </button>
            )}
          </div>
          <div>
            {isLastStep ? (
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaveDisabled}
                aria-disabled={isCapHit || undefined}
                aria-describedby={isCapHit ? "entitlement-gate-banner" : undefined}
                className="px-6 py-2.5 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-[var(--color-primary)] font-[family-name:var(--font-sans)] font-semibold text-sm rounded-[var(--radius-sm)] transition-colors duration-[var(--duration-default)] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[var(--color-accent)]"
              >
                {saving
                  ? "Saving…"
                  : isEdit
                    ? "Save Changes"
                    : "Save Market"}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleNext}
                className="px-6 py-2.5 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-[var(--color-primary)] font-[family-name:var(--font-sans)] font-semibold text-sm rounded-[var(--radius-sm)] transition-colors duration-[var(--duration-default)]"
              >
                Next
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
