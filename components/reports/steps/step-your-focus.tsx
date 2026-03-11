"use client";

import React, { useState, useCallback, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { selectionVariant, staggerContainer, scaleVariant } from "@/lib/animations";

// ---------------------------------------------------------------------------
// Segment & Property Type definitions
// ---------------------------------------------------------------------------

const SEGMENT_OPTIONS = [
  { value: "waterfront", label: "Waterfront", description: "Lakefront, riverfront, and canal-front properties", icon: "🌊" },
  { value: "golf course", label: "Golf Course", description: "Golf and country club communities", icon: "⛳" },
  { value: "gated community", label: "Gated Community", description: "Private, access-controlled enclaves", icon: "🏰" },
  { value: "ski-in/ski-out", label: "Ski-In/Ski-Out", description: "Direct slope access properties", icon: "⛷️" },
  { value: "mountain view", label: "Mountain View", description: "Properties with mountain vistas", icon: "🏔️" },
  { value: "historic district", label: "Historic District", description: "Designated historic neighborhoods", icon: "🏛️" },
  { value: "new development", label: "New Development", description: "Recently built or under construction", icon: "🏗️" },
  { value: "equestrian", label: "Equestrian", description: "Horse properties and equestrian estates", icon: "🐴" },
  { value: "beachfront", label: "Beachfront", description: "Direct ocean or gulf access", icon: "🏖️" },
  { value: "lakefront", label: "Lakefront", description: "Direct lake access", icon: "🏞️" },
  { value: "vineyard", label: "Vineyard", description: "Wine country and vineyard estates", icon: "🍇" },
  { value: "desert", label: "Desert", description: "Desert landscape properties", icon: "🏜️" },
  { value: "island", label: "Island", description: "Island and barrier island properties", icon: "🏝️" },
];

const PROPERTY_TYPE_OPTIONS = [
  { value: "single_family", label: "Single Family", icon: "🏠" },
  { value: "estate", label: "Estate", icon: "🏡" },
  { value: "condo", label: "Condo", icon: "🏢" },
  { value: "townhouse", label: "Townhouse", icon: "🏘️" },
  { value: "co-op", label: "Co-op", icon: "🤝" },
  { value: "penthouse", label: "Penthouse", icon: "🌆" },
  { value: "chalet", label: "Chalet", icon: "🏔️" },
  { value: "villa", label: "Villa", icon: "🏖️" },
  { value: "ranch", label: "Ranch", icon: "🐎" },
  { value: "land", label: "Land", icon: "🌿" },
];

// ---------------------------------------------------------------------------
// Smart default mappings (static, per spec)
// ---------------------------------------------------------------------------

const STATE_SEGMENT_DEFAULTS: Record<string, string[]> = {
  FL: ["waterfront", "beachfront", "golf course"],
  HI: ["waterfront", "beachfront", "golf course"],
  SC: ["waterfront", "beachfront", "golf course"],
  NC: ["waterfront", "beachfront", "golf course"],
  GA: ["waterfront", "beachfront", "golf course"],
  AL: ["waterfront", "beachfront", "golf course"],
  MS: ["waterfront", "beachfront", "golf course"],
  LA: ["waterfront", "beachfront", "golf course"],
  TX: ["waterfront", "beachfront", "golf course"],
  CA: ["waterfront", "vineyard", "new development"],
  CO: ["ski-in/ski-out", "mountain view"],
  MT: ["ski-in/ski-out", "mountain view"],
  WY: ["ski-in/ski-out", "mountain view"],
  UT: ["ski-in/ski-out", "mountain view"],
  ID: ["ski-in/ski-out", "mountain view"],
  NY: ["gated community", "waterfront"],
  NJ: ["gated community", "waterfront"],
  CT: ["gated community", "waterfront"],
  MA: ["gated community", "waterfront"],
  AZ: ["desert", "golf course"],
  NV: ["desert", "golf course"],
  NM: ["desert", "golf course"],
  _default: ["gated community"],
};

const STATE_PROPERTY_DEFAULTS: Record<string, string[]> = {
  FL: ["single_family", "estate", "condo"],
  HI: ["single_family", "estate", "condo"],
  SC: ["single_family", "estate", "condo"],
  NC: ["single_family", "estate", "condo"],
  GA: ["single_family", "estate", "condo"],
  AL: ["single_family", "estate", "condo"],
  MS: ["single_family", "estate", "condo"],
  LA: ["single_family", "estate", "condo"],
  TX: ["single_family", "estate", "condo"],
  CA: ["single_family", "estate", "condo"],
  CO: ["chalet", "estate", "single_family"],
  MT: ["chalet", "estate", "single_family"],
  WY: ["chalet", "estate", "single_family"],
  UT: ["chalet", "estate", "single_family"],
  ID: ["chalet", "estate", "single_family"],
  NY: ["condo", "co-op", "penthouse", "townhouse"],
  NJ: ["condo", "co-op", "penthouse", "townhouse"],
  CT: ["condo", "co-op", "penthouse", "townhouse"],
  MA: ["condo", "co-op", "penthouse", "townhouse"],
  AZ: ["estate", "single_family", "villa"],
  NV: ["estate", "single_family", "villa"],
  NM: ["estate", "single_family", "villa"],
  _default: ["single_family", "estate"],
};

// ---------------------------------------------------------------------------
// Data contract
// ---------------------------------------------------------------------------

export interface StepFocusData {
  segments: string[];
  propertyTypes: string[];
}

interface StepYourFocusProps {
  marketData?: { city: string; state: string };
  onStepComplete: (data: StepFocusData) => void;
  onValidationChange?: (valid: boolean) => void;
}

// ---------------------------------------------------------------------------
// ToggleCard (inline — used for both segments and property types)
// ---------------------------------------------------------------------------

interface ToggleCardProps {
  value: string;
  label: string;
  description?: string;
  icon: string;
  selected: boolean;
  popular: boolean;
  onToggle: (value: string) => void;
}

function ToggleCard({
  value,
  label,
  description,
  icon,
  selected,
  popular,
  onToggle,
}: ToggleCardProps) {
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onToggle(value);
      }
    },
    [onToggle, value],
  );

  return (
    <motion.button
      type="button"
      role="switch"
      aria-checked={selected}
      aria-label={`${label}${popular ? " — Popular in your area" : ""}`}
      onClick={() => onToggle(value)}
      onKeyDown={handleKeyDown}
      whileTap={selectionVariant.tap}
      variants={scaleVariant}
      className={`cursor-pointer rounded-[var(--radius-md)] border p-4 text-left transition-all duration-[var(--duration-default)] ${
        selected
          ? "border-[var(--color-accent)] bg-[var(--color-accent-light)] shadow-[var(--shadow-sm)]"
          : "border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-border-strong)] hover:shadow-[var(--shadow-md)]"
      }`}
    >
      <span className="block text-lg mb-1">{icon}</span>
      <span className="block font-[family-name:var(--font-sans)] text-sm font-semibold text-[var(--color-text)]">
        {label}
      </span>
      {description && (
        <span className="block font-[family-name:var(--font-sans)] text-xs text-[var(--color-text-secondary)] mt-0.5">
          {description}
        </span>
      )}
      {popular && (
        <span
          className="inline-block mt-2 px-2 py-0.5 rounded-full bg-[var(--color-accent-light)] text-[var(--color-accent)] font-[family-name:var(--font-sans)] text-xs font-medium"
          aria-label="Popular in your area"
        >
          Popular in your area
        </span>
      )}
    </motion.button>
  );
}

// ---------------------------------------------------------------------------
// StepYourFocus
// ---------------------------------------------------------------------------

export function StepYourFocus({
  marketData,
  onStepComplete,
  onValidationChange,
}: StepYourFocusProps) {
  // Compute smart defaults once from marketData
  const { defaultSegments, defaultPropertyTypes } = useMemo(() => {
    if (!marketData?.state) {
      return { defaultSegments: [] as string[], defaultPropertyTypes: [] as string[] };
    }
    const state = marketData.state.toUpperCase();
    return {
      defaultSegments: STATE_SEGMENT_DEFAULTS[state] || STATE_SEGMENT_DEFAULTS._default,
      defaultPropertyTypes: STATE_PROPERTY_DEFAULTS[state] || STATE_PROPERTY_DEFAULTS._default,
    };
  }, [marketData]);

  const [selectedSegments, setSelectedSegments] = useState<string[]>(defaultSegments);
  const [selectedPropertyTypes, setSelectedPropertyTypes] = useState<string[]>(defaultPropertyTypes);

  // Track which items are "popular" (smart default) — stable set, doesn't change on toggle
  const popularSegments = useMemo(() => new Set(defaultSegments), [defaultSegments]);
  const popularPropertyTypes = useMemo(() => new Set(defaultPropertyTypes), [defaultPropertyTypes]);

  // Validation: at least one segment OR one property type selected
  const isValid = selectedSegments.length > 0 || selectedPropertyTypes.length > 0;

  // Report validation
  useEffect(() => {
    onValidationChange?.(isValid);
  }, [isValid, onValidationChange]);

  // Emit step data when valid
  useEffect(() => {
    if (isValid) {
      onStepComplete({
        segments: selectedSegments,
        propertyTypes: selectedPropertyTypes,
      });
    }
  }, [selectedSegments, selectedPropertyTypes, isValid, onStepComplete]);

  const toggleSegment = useCallback((value: string) => {
    setSelectedSegments((prev) =>
      prev.includes(value) ? prev.filter((s) => s !== value) : [...prev, value],
    );
  }, []);

  const togglePropertyType = useCallback((value: string) => {
    setSelectedPropertyTypes((prev) =>
      prev.includes(value) ? prev.filter((t) => t !== value) : [...prev, value],
    );
  }, []);

  const showEmptyState = !isValid && defaultSegments.length === 0;

  return (
    <div className="py-4">
      {/* Heading */}
      <h2 className="font-[family-name:var(--font-serif)] text-2xl font-bold text-[var(--color-primary)]">
        What matters in your market?
      </h2>
      <p className="mt-2 font-[family-name:var(--font-sans)] text-sm text-[var(--color-text-secondary)]">
        Select the segments and property types that define your area &mdash; we&apos;ll tailor the analysis to match
      </p>

      <div className="w-8 h-0.5 bg-[var(--color-accent)] mt-4 mb-6" />

      {/* Market Segments */}
      <h3 className="font-[family-name:var(--font-sans)] text-sm font-semibold text-[var(--color-text)] uppercase tracking-wide mb-3">
        Market Segments
      </h3>
      <motion.div
        className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6"
        variants={staggerContainer}
        initial="initial"
        animate="animate"
      >
        {SEGMENT_OPTIONS.map((seg) => (
          <ToggleCard
            key={seg.value}
            value={seg.value}
            label={seg.label}
            description={seg.description}
            icon={seg.icon}
            selected={selectedSegments.includes(seg.value)}
            popular={popularSegments.has(seg.value)}
            onToggle={toggleSegment}
          />
        ))}
      </motion.div>

      {/* Divider */}
      <div className="border-t border-[var(--color-border)] my-6" />

      {/* Property Types */}
      <h3 className="font-[family-name:var(--font-sans)] text-sm font-semibold text-[var(--color-text)] uppercase tracking-wide mb-3">
        Property Types
      </h3>
      <motion.div
        className="grid grid-cols-2 sm:grid-cols-3 gap-3"
        variants={staggerContainer}
        initial="initial"
        animate="animate"
      >
        {PROPERTY_TYPE_OPTIONS.map((pt) => (
          <ToggleCard
            key={pt.value}
            value={pt.value}
            label={pt.label}
            icon={pt.icon}
            selected={selectedPropertyTypes.includes(pt.value)}
            popular={popularPropertyTypes.has(pt.value)}
            onToggle={togglePropertyType}
          />
        ))}
      </motion.div>

      {/* Empty state */}
      {showEmptyState && (
        <p className="text-center py-6 font-[family-name:var(--font-sans)] text-sm text-[var(--color-text-secondary)]">
          Pick the segments that define your market &mdash; or skip ahead if you want the full picture
        </p>
      )}
    </div>
  );
}
