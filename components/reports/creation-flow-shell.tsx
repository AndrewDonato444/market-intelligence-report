"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { pageTransition } from "@/lib/animations";
import { CreationStepIndicator } from "./creation-step-indicator";
import { StepYourMarket } from "./steps/step-your-market";
import { StepYourTier } from "./steps/step-your-tier";
import { StepYourAudience } from "./steps/step-your-audience";
import { StepYourReview } from "./steps/step-your-review";
import { StepGenerating } from "./steps/step-generating";
import {
  loadDraft,
  saveDraft,
  clearDraft,
} from "@/lib/hooks/use-flow-persistence";
import type { StepMarketData } from "./steps/step-your-market";
import type { StepTierData } from "./steps/step-your-tier";
import type { StepAudienceData } from "./steps/step-your-audience";
import type { StepReviewData } from "./steps/step-your-review";
import type { PageDirection } from "@/lib/animations";

const STEPS = [
  {
    name: "Your Market",
    description: "Select the market for your intelligence report.",
  },
  {
    name: "Your Tier",
    description: "Choose the luxury tier and price range.",
  },
  {
    name: "Your Audience",
    description: "Select buyer personas to tailor your report.",
  },
  {
    name: "Review",
    description: "Review your selections before generating.",
  },
  {
    name: "Generate",
    description: "Your intelligence report is being generated.",
  },
];

const STEP_NAMES = STEPS.map((s) => s.name);

const TIER_DEFAULTS: Record<string, { priceFloor: number; priceCeiling?: number }> = {
  luxury: { priceFloor: 1_000_000 },
  high_luxury: { priceFloor: 6_000_000 },
  ultra_luxury: { priceFloor: 10_000_000 },
};

interface MarketOption {
  id: string;
  name: string;
  geography: { city: string; state: string };
  luxuryTier: string;
  isDefault: number;
}

interface CreationFlowShellProps {
  markets: MarketOption[];
}

export function CreationFlowShell({ markets }: CreationFlowShellProps) {
  // Always start at step 0 for SSR — draft is restored client-side in useEffect
  // to avoid server/client HTML mismatch (localStorage is unavailable during SSR).
  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState<PageDirection>("forward");
  const [stepValid, setStepValid] = useState(false);
  const marketDataRef = useRef<StepMarketData | null>(null);
  const tierDataRef = useRef<StepTierData | null>(null);
  const audienceDataRef = useRef<StepAudienceData | null>(null);
  const [reportData, setReportData] = useState<StepReviewData | null>(null);

  // Restore draft after hydration (client-only)
  useEffect(() => {
    const draft = loadDraft();
    if (draft && draft.currentStep < 4) {
      marketDataRef.current = draft.marketData ?? null;
      tierDataRef.current = draft.tierData ?? null;
      audienceDataRef.current = draft.audienceData ?? null;
      setCurrentStep(draft.currentStep);
    }
  }, []);

  const isLastStep = currentStep === STEPS.length - 1;
  const isFirstStep = currentStep === 0;

  // --- Persistence helpers ---
  const persistState = useCallback(
    (step: number) => {
      if (step >= 4) return;
      saveDraft({
        currentStep: step,
        marketData: marketDataRef.current,
        tierData: tierDataRef.current,
        focusData: null,
        audienceData: audienceDataRef.current,
        savedAt: new Date().toISOString(),
      });
    },
    [],
  );

  const handleNext = () => {
    if (!isLastStep) {
      const nextStep = currentStep + 1;
      setDirection("forward");
      setCurrentStep(nextStep);
      setStepValid(false);
      persistState(nextStep);
    }
  };

  const handleBack = () => {
    if (!isFirstStep) {
      const prevStep = currentStep - 1;
      setDirection("backward");
      setCurrentStep(prevStep);
      setStepValid(false);
      persistState(prevStep);
    }
  };

  // --- Quick Start ---
  const handleQuickStart = useCallback(
    (market: MarketOption) => {
      const tierKey = market.luxuryTier as keyof typeof TIER_DEFAULTS;
      const tierDefaults = TIER_DEFAULTS[tierKey] ?? TIER_DEFAULTS.luxury;

      marketDataRef.current = {
        existingMarketId: market.id,
        city: market.geography.city,
        state: market.geography.state,
        marketName: market.name,
        isNewMarket: false,
      };
      tierDataRef.current = {
        luxuryTier: tierKey as "luxury" | "high_luxury" | "ultra_luxury",
        priceFloor: tierDefaults.priceFloor,
        priceCeiling: tierDefaults.priceCeiling,
      };
      setDirection("forward");
      setCurrentStep(2); // Jump to Audience
      setStepValid(false);
      saveDraft({
        currentStep: 2,
        marketData: marketDataRef.current,
        tierData: tierDataRef.current,
        focusData: null,
        audienceData: null,
        savedAt: new Date().toISOString(),
      });
    },
    [],
  );

  // --- Step callbacks ---
  const handleMarketStepComplete = useCallback((data: StepMarketData) => {
    marketDataRef.current = data;
  }, []);

  const handleMarketValidation = useCallback((valid: boolean) => {
    setStepValid(valid);
  }, []);

  const handleTierStepComplete = useCallback((data: StepTierData) => {
    tierDataRef.current = data;
  }, []);

  const handleTierValidation = useCallback((valid: boolean) => {
    setStepValid(valid);
  }, []);

  const handleAudienceStepComplete = useCallback((data: StepAudienceData) => {
    audienceDataRef.current = data;
  }, []);

  const handleAudienceValidation = useCallback((valid: boolean) => {
    setStepValid(valid);
  }, []);

  const handleReviewStepComplete = useCallback((data: StepReviewData) => {
    setReportData(data);
    setDirection("forward");
    setCurrentStep(4);
    setStepValid(false);
    clearDraft();
  }, []);

  const handleReviewValidation = useCallback((valid: boolean) => {
    setStepValid(valid);
  }, []);

  const handleNavigateToStep = useCallback(
    (stepIndex: number) => {
      setDirection("backward");
      setCurrentStep(stepIndex);
      setStepValid(false);
      persistState(stepIndex);
    },
    [persistState],
  );

  const renderStepContent = () => {
    if (currentStep === 0) {
      return (
        <StepYourMarket
          markets={markets}
          onStepComplete={handleMarketStepComplete}
          onValidationChange={handleMarketValidation}
          onQuickStart={handleQuickStart}
        />
      );
    }

    if (currentStep === 1) {
      return (
        <StepYourTier
          onStepComplete={handleTierStepComplete}
          onValidationChange={handleTierValidation}
        />
      );
    }

    if (currentStep === 2) {
      return (
        <StepYourAudience
          onStepComplete={handleAudienceStepComplete}
          onValidationChange={handleAudienceValidation}
        />
      );
    }

    if (currentStep === 3) {
      return (
        <StepYourReview
          marketData={marketDataRef.current}
          tierData={tierDataRef.current}
          audienceData={audienceDataRef.current}
          onStepComplete={handleReviewStepComplete}
          onValidationChange={handleReviewValidation}
          onNavigateToStep={handleNavigateToStep}
        />
      );
    }

    // Step 5: Generating (feature #157)
    if (currentStep === 4 && reportData) {
      return (
        <StepGenerating
          reportId={reportData.reportId}
          reportTitle={reportData.title}
          onStepComplete={() => {}}
          onValidationChange={handleReviewValidation}
        />
      );
    }

    return null;
  };

  const tierLabel = (tier: string) => {
    const labels: Record<string, string> = {
      luxury: "Luxury",
      high_luxury: "High Luxury",
      ultra_luxury: "Ultra Luxury",
    };
    return labels[tier] || tier;
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-[var(--color-app-surface)] rounded-[var(--radius-md)] shadow-[var(--shadow-sm)] p-8">
        <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold text-[var(--color-app-text)]">
          Create Your Intelligence Report
        </h1>
        <div className="w-12 h-0.5 bg-[var(--color-app-accent)] mt-3 mb-8" />

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

        {/* Navigation — hidden on Generate step */}
        {currentStep !== 4 && (
          <div className="flex justify-between mt-6 pt-6 border-t border-[var(--color-app-border)]">
            <div>
              {!isFirstStep && (
                <button
                  type="button"
                  onClick={handleBack}
                  className="px-5 py-2.5 font-[family-name:var(--font-body)] text-sm text-[var(--color-app-text-secondary)] hover:text-[var(--color-app-text)] transition-colors duration-[var(--duration-default)] rounded-[var(--radius-sm)]"
                >
                  Back
                </button>
              )}
            </div>
            <div>
              {currentStep === 3 ? null : (
                <button
                  type="button"
                  onClick={handleNext}
                  className="px-6 py-2.5 bg-[var(--color-app-accent)] hover:bg-[var(--color-app-accent-hover)] text-[var(--color-app-text)] font-[family-name:var(--font-body)] font-semibold text-sm rounded-[var(--radius-sm)] transition-colors duration-[var(--duration-default)]"
                >
                  Next
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
