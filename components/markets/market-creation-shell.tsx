"use client";

import { useState, useCallback, useRef } from "react";
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
                disabled={saving}
                className="px-6 py-2.5 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-[var(--color-primary)] font-[family-name:var(--font-sans)] font-semibold text-sm rounded-[var(--radius-sm)] transition-colors duration-[var(--duration-default)] disabled:opacity-50"
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
