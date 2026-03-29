"use client";

import React, { useState, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import { selectionVariant, staggerContainer, scaleVariant } from "@/lib/animations";

const TIER_OPTIONS = [
  {
    value: "luxury" as const,
    label: "Luxury",
    range: "$1M - $6M",
    tagline: "The broadest luxury segment",
    defaultFloor: 1_000_000,
  },
  {
    value: "high_luxury" as const,
    label: "High Luxury",
    range: "$6M - $10M",
    tagline: "Established luxury enclaves",
    defaultFloor: 6_000_000,
  },
  {
    value: "ultra_luxury" as const,
    label: "Ultra Luxury",
    range: "$10M+",
    tagline: "Trophy properties and estates",
    defaultFloor: 10_000_000,
  },
];

type LuxuryTier = "luxury" | "high_luxury" | "ultra_luxury";

export interface StepTierData {
  luxuryTier: LuxuryTier;
  priceFloor: number;
  priceCeiling?: number;
}

interface StepYourTierProps {
  onStepComplete: (data: StepTierData) => void;
  onValidationChange?: (valid: boolean) => void;
}

export function StepYourTier({
  onStepComplete,
  onValidationChange,
}: StepYourTierProps) {
  const [selectedTier, setSelectedTier] = useState<LuxuryTier | null>(null);

  // Validity is simply: a tier is selected
  useEffect(() => {
    onValidationChange?.(selectedTier !== null);
  }, [selectedTier, onValidationChange]);

  // Emit step data on selection
  useEffect(() => {
    if (selectedTier) {
      const option = TIER_OPTIONS.find((t) => t.value === selectedTier)!;
      onStepComplete({
        luxuryTier: selectedTier,
        priceFloor: option.defaultFloor,
      });
    }
  }, [selectedTier, onStepComplete]);

  const handleTierSelect = useCallback((tier: LuxuryTier) => {
    setSelectedTier(tier);
  }, []);

  return (
    <div className="py-4">
      {/* Heading */}
      <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold text-[var(--color-app-text)]">
        Which tier defines your clientele?
      </h2>
      <p className="mt-2 font-[family-name:var(--font-body)] text-sm text-[var(--color-app-text-secondary)]">
        This determines which transactions we analyze for your market.
      </p>

      <div className="w-8 h-0.5 bg-[var(--color-app-accent)] mt-4 mb-6" />

      {/* Tier Cards */}
      <motion.div
        role="radiogroup"
        aria-label="Luxury tier selection"
        className="grid grid-cols-1 sm:grid-cols-3 gap-3"
        variants={staggerContainer}
        initial="initial"
        animate="animate"
      >
        {TIER_OPTIONS.map((tier) => {
          const isSelected = selectedTier === tier.value;
          return (
            <motion.div
              key={tier.value}
              role="radio"
              aria-checked={isSelected}
              aria-label={`${tier.label} tier: ${tier.range}`}
              tabIndex={0}
              onClick={() => handleTierSelect(tier.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handleTierSelect(tier.value);
                }
              }}
              whileTap={selectionVariant.tap}
              variants={scaleVariant}
              className={`cursor-pointer rounded-[var(--radius-sm)] border p-4 transition-all duration-[var(--duration-default)] ${
                isSelected
                  ? "border-[var(--color-app-accent)] bg-[var(--color-app-accent-light)] shadow-[var(--shadow-sm)]"
                  : "border-[var(--color-app-border)] bg-[var(--color-app-surface)] hover:border-[var(--color-app-accent)]/50 hover:shadow-[var(--shadow-sm)]"
              }`}
            >
              <span className="block font-[family-name:var(--font-body)] text-sm font-semibold text-[var(--color-app-text)]">
                {tier.label}
              </span>
              <span className="block font-[family-name:var(--font-display)] text-lg font-bold text-[var(--color-app-text)] mt-1">
                {tier.range}
              </span>
              <span className="block font-[family-name:var(--font-body)] text-xs text-[var(--color-app-text-secondary)] mt-1">
                {tier.tagline}
              </span>
            </motion.div>
          );
        })}
      </motion.div>
      <p className="mt-6 flex items-start gap-1.5 font-[family-name:var(--font-body)] text-xs text-[var(--color-app-text-secondary)]">
        <span className="text-[var(--color-app-accent)] mt-px">◆</span>
        Keeping the ranges tight yields the best data analysis. You can always come back and generate a new report for another tier.
      </p>
    </div>
  );
}
