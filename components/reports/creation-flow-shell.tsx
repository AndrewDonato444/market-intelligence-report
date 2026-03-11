"use client";

import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { pageTransition } from "@/lib/animations";
import { CreationStepIndicator } from "./creation-step-indicator";
import { StepYourMarket } from "./steps/step-your-market";
import { StepYourTier } from "./steps/step-your-tier";
import { StepYourFocus } from "./steps/step-your-focus";
import { StepYourAudience } from "./steps/step-your-audience";
import type { StepMarketData } from "./steps/step-your-market";
import type { StepTierData } from "./steps/step-your-tier";
import type { StepFocusData } from "./steps/step-your-focus";
import type { StepAudienceData } from "./steps/step-your-audience";
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
  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState<PageDirection>("forward");
  const [stepValid, setStepValid] = useState(false);
  const marketDataRef = useRef<StepMarketData | null>(null);
  const tierDataRef = useRef<StepTierData | null>(null);
  const focusDataRef = useRef<StepFocusData | null>(null);
  const audienceDataRef = useRef<StepAudienceData | null>(null);

  const isLastStep = currentStep === STEPS.length - 1;
  const isFirstStep = currentStep === 0;

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

  const step = STEPS[currentStep];

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

    // Placeholder for steps 4-5 (features #156-#157)
    return (
      <div className="py-8 text-center">
        <h2 className="font-[family-name:var(--font-serif)] text-xl font-semibold text-[var(--color-text)] mb-2">
          {step.name}
        </h2>
        <p className="font-[family-name:var(--font-sans)] text-sm text-[var(--color-text-secondary)]">
          {step.description}
        </p>
        <div className="mt-6 p-4 rounded-[var(--radius-sm)] border border-dashed border-[var(--color-border)] bg-[var(--color-background)]">
          <p className="font-[family-name:var(--font-sans)] text-xs text-[var(--color-text-tertiary)]">
            Step content will be implemented in feature #{152 + currentStep}
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-[var(--color-surface)] rounded-[var(--radius-md)] shadow-[var(--shadow-sm)] p-8">
        <h1 className="font-[family-name:var(--font-serif)] text-2xl font-bold text-[var(--color-primary)]">
          Create Your Intelligence Report
        </h1>
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
                className="px-8 py-2.5 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-[var(--color-primary)] font-[family-name:var(--font-sans)] font-semibold text-sm rounded-[var(--radius-sm)] transition-colors duration-[var(--duration-default)] shadow-[var(--shadow-sm)]"
              >
                Generate Report
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
