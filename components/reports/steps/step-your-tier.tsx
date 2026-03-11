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
  const [priceFloor, setPriceFloor] = useState("");
  const [priceCeiling, setPriceCeiling] = useState("");
  const [floorError, setFloorError] = useState("");
  const [ceilingError, setCeilingError] = useState("");

  // Validate and compute validity
  const validate = useCallback(
    (tier: LuxuryTier | null, floor: string, ceiling: string) => {
      let floorErr = "";
      let ceilingErr = "";

      if (tier === null) {
        return { valid: false, floorErr: "", ceilingErr: "" };
      }

      const floorNum = Number(floor);
      if (floor && !isNaN(floorNum) && floorNum < 500_000) {
        floorErr = "Price floor must be at least $500,000";
      }

      if (ceiling) {
        const ceilingNum = Number(ceiling);
        if (!isNaN(ceilingNum) && !isNaN(floorNum) && ceilingNum <= floorNum) {
          ceilingErr = "Ceiling must be higher than the floor";
        }
      }

      const valid =
        tier !== null &&
        floor !== "" &&
        !isNaN(floorNum) &&
        floorNum >= 500_000 &&
        floorErr === "" &&
        ceilingErr === "";

      return { valid, floorErr, ceilingErr };
    },
    [],
  );

  // Report validation state
  useEffect(() => {
    const { valid, floorErr, ceilingErr } = validate(
      selectedTier,
      priceFloor,
      priceCeiling,
    );
    setFloorError(floorErr);
    setCeilingError(ceilingErr);
    onValidationChange?.(valid);
  }, [selectedTier, priceFloor, priceCeiling, onValidationChange, validate]);

  // Emit step data when valid
  useEffect(() => {
    const { valid } = validate(selectedTier, priceFloor, priceCeiling);
    if (valid && selectedTier) {
      const data: StepTierData = {
        luxuryTier: selectedTier,
        priceFloor: Number(priceFloor),
      };
      if (priceCeiling && !isNaN(Number(priceCeiling))) {
        data.priceCeiling = Number(priceCeiling);
      }
      onStepComplete(data);
    }
  }, [selectedTier, priceFloor, priceCeiling, onStepComplete, validate]);

  const handleTierSelect = useCallback((tier: LuxuryTier) => {
    const option = TIER_OPTIONS.find((t) => t.value === tier);
    setSelectedTier(tier);
    setPriceFloor(String(option?.defaultFloor || 1_000_000));
    setPriceCeiling("");
  }, []);

  const handleFloorChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setPriceFloor(e.target.value);
    },
    [],
  );

  const handleCeilingChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setPriceCeiling(e.target.value);
    },
    [],
  );

  const labelClass =
    "block font-[family-name:var(--font-sans)] text-xs font-medium text-[var(--color-text-secondary)] mb-1.5";
  const inputClass =
    "w-full px-3 py-2 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-background)] font-[family-name:var(--font-sans)] text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:border-[var(--color-accent)] transition-colors duration-[var(--duration-default)]";

  return (
    <div className="py-4">
      {/* Heading */}
      <h2 className="font-[family-name:var(--font-serif)] text-2xl font-bold text-[var(--color-primary)]">
        What&apos;s your price point?
      </h2>
      <p className="mt-2 font-[family-name:var(--font-sans)] text-sm text-[var(--color-text-secondary)]">
        This determines which transactions we analyze for your market
      </p>

      <div className="w-8 h-0.5 bg-[var(--color-accent)] mt-4 mb-6" />

      {/* Tier Cards */}
      <motion.div
        role="radiogroup"
        aria-label="Luxury tier selection"
        className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6"
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
                  ? "border-[var(--color-accent)] bg-[var(--color-accent-light)] shadow-[var(--shadow-sm)]"
                  : "border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-accent)]/50 hover:shadow-[var(--shadow-sm)]"
              }`}
            >
              <span className="block font-[family-name:var(--font-sans)] text-sm font-semibold text-[var(--color-text)]">
                {tier.label}
              </span>
              <span className="block font-[family-name:var(--font-sans)] text-lg font-bold text-[var(--color-primary)] mt-1">
                {tier.range}
              </span>
              <span className="block font-[family-name:var(--font-sans)] text-xs text-[var(--color-text-secondary)] mt-1">
                {tier.tagline}
              </span>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Price Floor & Ceiling */}
      {selectedTier && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="tier-price-floor" className={labelClass}>
              Price Floor *
            </label>
            <input
              id="tier-price-floor"
              type="number"
              value={priceFloor}
              onChange={handleFloorChange}
              className={`${inputClass} ${floorError ? "border-[var(--color-error)]" : ""}`}
              min="500000"
              step="100000"
              aria-label="Price Floor"
              aria-describedby={floorError ? "floor-error" : undefined}
            />
            {floorError && (
              <p
                id="floor-error"
                className="mt-1 font-[family-name:var(--font-sans)] text-xs text-[var(--color-error)]"
              >
                {floorError}
              </p>
            )}
          </div>
          <div>
            <label htmlFor="tier-price-ceiling" className={labelClass}>
              Price Ceiling
            </label>
            <input
              id="tier-price-ceiling"
              type="number"
              value={priceCeiling}
              onChange={handleCeilingChange}
              className={`${inputClass} ${ceilingError ? "border-[var(--color-error)]" : ""}`}
              step="100000"
              placeholder="No ceiling"
              aria-label="Price Ceiling"
              aria-describedby={ceilingError ? "ceiling-error" : undefined}
            />
            {ceilingError && (
              <p
                id="ceiling-error"
                className="mt-1 font-[family-name:var(--font-sans)] text-xs text-[var(--color-error)]"
              >
                {ceilingError}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
