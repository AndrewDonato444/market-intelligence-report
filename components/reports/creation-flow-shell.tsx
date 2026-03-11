"use client";

import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { pageTransition } from "@/lib/animations";
import { CreationStepIndicator } from "./creation-step-indicator";
import { StepYourMarket } from "./steps/step-your-market";
import { StepYourTier } from "./steps/step-your-tier";
import { StepYourFocus } from "./steps/step-your-focus";
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
import type { StepFocusData } from "./steps/step-your-focus";
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
    name: "Your Focus",
    description: "Pick market segments and property types.",
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

function getInitialState() {
  const draft = loadDraft();
  if (draft && draft.currentStep < 5) {
    return draft;
  }
  return null;
}

export function CreationFlowShell({ markets }: CreationFlowShellProps) {
  const initialDraft = useRef(getInitialState());
  const draft = initialDraft.current;

  const [currentStep, setCurrentStep] = useState(draft?.currentStep ?? 0);
  const [direction, setDirection] = useState<PageDirection>("forward");
  const [stepValid, setStepValid] = useState(false);
  const [showQuickStart, setShowQuickStart] = useState(
    markets.length > 0 && !draft,
  );
  const marketDataRef = useRef<StepMarketData | null>(
    draft?.marketData ?? null,
  );
  const tierDataRef = useRef<StepTierData | null>(draft?.tierData ?? null);
  const focusDataRef = useRef<StepFocusData | null>(draft?.focusData ?? null);
  const audienceDataRef = useRef<StepAudienceData | null>(
    draft?.audienceData ?? null,
  );
  const [reportData, setReportData] = useState<StepReviewData | null>(null);

  const isLastStep = currentStep === STEPS.length - 1;
  const isFirstStep = currentStep === 0;

  // --- Persistence helpers ---
  const persistState = useCallback(
    (step: number) => {
      if (step >= 5) return;
      saveDraft({
        currentStep: step,
        marketData: marketDataRef.current,
        tierData: tierDataRef.current,
        focusData: focusDataRef.current,
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
      focusDataRef.current = { segments: [], propertyTypes: [] };

      setShowQuickStart(false);
      setDirection("forward");
      setCurrentStep(3); // Jump to Audience
      setStepValid(false);
      saveDraft({
        currentStep: 3,
        marketData: marketDataRef.current,
        tierData: tierDataRef.current,
        focusData: focusDataRef.current,
        audienceData: null,
        savedAt: new Date().toISOString(),
      });
    },
    [],
  );

  const handleStartFresh = useCallback(() => {
    setShowQuickStart(false);
  }, []);

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

  const handleFocusStepComplete = useCallback((data: StepFocusData) => {
    focusDataRef.current = data;
  }, []);

  const handleFocusValidation = useCallback((valid: boolean) => {
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
    setCurrentStep(5);
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
        <StepYourFocus
          marketData={
            marketDataRef.current
              ? { city: marketDataRef.current.city, state: marketDataRef.current.state }
              : undefined
          }
          onStepComplete={handleFocusStepComplete}
          onValidationChange={handleFocusValidation}
        />
      );
    }

    if (currentStep === 3) {
      return (
        <StepYourAudience
          onStepComplete={handleAudienceStepComplete}
          onValidationChange={handleAudienceValidation}
        />
      );
    }

    if (currentStep === 4) {
      return (
        <StepYourReview
          marketData={marketDataRef.current}
          tierData={tierDataRef.current}
          focusData={focusDataRef.current}
          audienceData={audienceDataRef.current}
          onStepComplete={handleReviewStepComplete}
          onValidationChange={handleReviewValidation}
          onNavigateToStep={handleNavigateToStep}
        />
      );
    }

    // Step 6: Generating (feature #157)
    if (currentStep === 5 && reportData) {
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
      <div className="bg-[var(--color-surface)] rounded-[var(--radius-md)] shadow-[var(--shadow-sm)] p-8">
        <h1 className="font-[family-name:var(--font-serif)] text-2xl font-bold text-[var(--color-primary)]">
          Create Your Intelligence Report
        </h1>
        <div className="w-12 h-0.5 bg-[var(--color-accent)] mt-3 mb-8" />

        <CreationStepIndicator steps={STEP_NAMES} currentStep={currentStep} />

        {/* Quick Start for returning users */}
        {showQuickStart && currentStep === 0 && (
          <div
            className="mb-6 p-5 border border-[var(--color-accent)] rounded-[var(--radius-md)] bg-[var(--color-background)]"
            data-testid="quick-start"
          >
            <h3 className="font-[family-name:var(--font-serif)] text-base font-semibold text-[var(--color-primary)] mb-1">
              Quick Start
            </h3>
            <p className="font-[family-name:var(--font-sans)] text-sm text-[var(--color-text-secondary)] mb-4">
              Use one of your saved markets to jump straight to audience
              selection.
            </p>
            <div className="flex flex-wrap gap-3 mb-4">
              {markets.map((m) => (
                <div
                  key={m.id}
                  className="flex flex-col items-start gap-1 p-3 border border-[var(--color-border)] rounded-[var(--radius-sm)] bg-[var(--color-surface)]"
                >
                  <span className="font-[family-name:var(--font-sans)] text-sm font-medium text-[var(--color-text)]">
                    {m.name}
                  </span>
                  <span className="font-[family-name:var(--font-sans)] text-xs text-[var(--color-text-secondary)]">
                    {m.geography.city}, {m.geography.state}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleQuickStart(m)}
                    className="mt-1 px-3 py-1 text-xs font-semibold bg-[var(--color-accent)] text-[var(--color-primary)] rounded-[var(--radius-sm)] hover:bg-[var(--color-accent-hover)] transition-colors"
                  >
                    Use This
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={handleStartFresh}
              className="font-[family-name:var(--font-sans)] text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text)] underline transition-colors"
            >
              Start Fresh
            </button>
          </div>
        )}

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

        {/* Navigation — hidden on Step 6 (Generating) */}
        {currentStep !== 5 && (
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
              {currentStep === 4 ? null : (
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
        )}
      </div>
    </div>
  );
}
