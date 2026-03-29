"use client";

import React, { useState, useCallback, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import { MarketAutocomplete } from "./market-autocomplete";
import { MarketPreviewCard } from "./market-preview-card";

// US states for the state selector
const US_STATES = [
  "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado",
  "Connecticut", "Delaware", "District of Columbia", "Florida", "Georgia",
  "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky",
  "Louisiana", "Maine", "Maryland", "Massachusetts", "Michigan", "Minnesota",
  "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire",
  "New Jersey", "New Mexico", "New York", "North Carolina", "North Dakota",
  "Ohio", "Oklahoma", "Oregon", "Pennsylvania", "Rhode Island",
  "South Carolina", "South Dakota", "Tennessee", "Texas", "Utah", "Vermont",
  "Virginia", "Washington", "West Virginia", "Wisconsin", "Wyoming",
];

const TIER_LABELS: Record<string, string> = {
  luxury: "Luxury",
  high_luxury: "High Luxury",
  ultra_luxury: "Ultra Luxury",
};

interface MarketOption {
  id: string;
  name: string;
  geography: { city: string; state: string };
  luxuryTier: string;
  isDefault: number;
}

export interface StepMarketData {
  existingMarketId?: string;
  city: string;
  state: string;
  marketName: string;
  isNewMarket: boolean;
}

interface StepYourMarketProps {
  markets: MarketOption[];
  onStepComplete: (data: StepMarketData) => void;
  onValidationChange?: (valid: boolean) => void;
  onQuickStart?: (market: MarketOption) => void;
}

export function StepYourMarket({
  markets,
  onStepComplete,
  onValidationChange,
  onQuickStart,
}: StepYourMarketProps) {
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [marketName, setMarketName] = useState("");
  const [marketNameManuallySet, setMarketNameManuallySet] = useState(false);

  const isValid = city.trim().length > 0 && state.trim().length > 0;
  const showPreview = isValid;

  // Report validation state changes
  useEffect(() => {
    onValidationChange?.(isValid);
  }, [isValid, onValidationChange]);

  // Auto-generate market name when city changes (unless manually set)
  useEffect(() => {
    if (!marketNameManuallySet && city.trim()) {
      setMarketName(`${city.trim()} Luxury`);
    } else if (!marketNameManuallySet && !city.trim()) {
      setMarketName("");
    }
  }, [city, marketNameManuallySet]);

  // Emit step data whenever form changes
  useEffect(() => {
    if (isValid) {
      onStepComplete({
        city: city.trim(),
        state: state.trim(),
        marketName: marketName || `${city.trim()} Luxury`,
        isNewMarket: true,
      });
    }
  }, [city, state, marketName, isValid, onStepComplete]);

  const handleCityChange = useCallback((value: string) => {
    setCity(value);
  }, []);

  const handleCitySelect = useCallback((selectedCity: string, selectedState: string) => {
    setCity(selectedCity);
    setState(selectedState);
  }, []);

  const handleStateChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setState(e.target.value);
  }, []);

  const handleMarketNameChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setMarketName(e.target.value);
      setMarketNameManuallySet(true);
    },
    [],
  );

  const labelClass =
    "block font-[family-name:var(--font-body)] text-xs font-medium text-[var(--color-app-text-secondary)] mb-1.5";
  const inputClass =
    "w-full px-3 py-2 rounded-[var(--radius-sm)] border border-[var(--color-app-border)] bg-[var(--color-app-bg)] font-[family-name:var(--font-body)] text-sm text-[var(--color-app-text)] placeholder:text-[var(--color-app-text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-app-accent)] focus:border-[var(--color-app-accent)] transition-colors duration-[var(--duration-default)]";

  return (
    <div className="py-4">
      {/* Heading */}
      <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold text-[var(--color-app-text)]">
        Where do you operate?
      </h2>
      <p className="mt-2 font-[family-name:var(--font-body)] text-sm text-[var(--color-app-text-secondary)]">
        We'll use this to find luxury transactions in your area.
      </p>

      <div className="w-8 h-0.5 bg-[var(--color-app-accent)] mt-4 mb-6" />

      {/* Existing markets */}
      {markets.length > 0 && (
        <div className="mb-6">
          <p className="font-[family-name:var(--font-body)] text-xs font-medium uppercase tracking-wide text-[var(--color-app-text-tertiary)] mb-3">
            Saved Markets
          </p>
          <div className="flex flex-wrap gap-3 mb-4">
            {markets.map((m) => (
              <div
                key={m.id}
                className="flex flex-col items-start gap-1 p-3 border border-[var(--color-app-border)] rounded-[var(--radius-sm)] bg-[var(--color-app-surface)]"
              >
                <span className="font-[family-name:var(--font-body)] text-sm font-medium text-[var(--color-app-text)]">
                  {m.name}
                </span>
                <span className="font-[family-name:var(--font-body)] text-xs text-[var(--color-app-text-secondary)]">
                  {m.geography.city}, {m.geography.state}
                  {m.luxuryTier && ` \u00B7 ${TIER_LABELS[m.luxuryTier] || m.luxuryTier}`}
                </span>
                {onQuickStart && (
                  <button
                    type="button"
                    onClick={() => onQuickStart(m)}
                    className="mt-1 px-3 py-1 text-xs font-semibold bg-[var(--color-app-accent)] text-[var(--color-app-text)] rounded-[var(--radius-sm)] hover:bg-[var(--color-app-accent-hover)] transition-colors duration-[var(--duration-default)]"
                  >
                    Use This
                  </button>
                )}
              </div>
            ))}
          </div>
          <div className="flex items-center gap-3 mt-2">
            <div className="flex-1 h-px bg-[var(--color-app-border)]" />
            <span className="font-[family-name:var(--font-body)] text-xs font-medium text-[var(--color-app-text-secondary)] whitespace-nowrap">
              or define a new market
            </span>
            <div className="flex-1 h-px bg-[var(--color-app-border)]" />
          </div>
        </div>
      )}

      {/* City */}
      <div className="mb-4">
        <label htmlFor="step-city" className={labelClass}>
          City *
        </label>
        <MarketAutocomplete
          value={city}
          onChange={handleCityChange}
          onSelect={handleCitySelect}
          placeholder="e.g., Naples"
        />
      </div>

      {/* State */}
      <div className="mb-4">
        <label htmlFor="step-state" className={labelClass}>
          State *
        </label>
        <select
          id="step-state"
          value={state}
          onChange={handleStateChange}
          className={inputClass}
          aria-label="State"
        >
          <option value="">Select a state</option>
          {US_STATES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {/* Report Name */}
      <div className="mb-4">
        <label htmlFor="step-report-name" className={labelClass}>
          Report Name
        </label>
        <input
          id="step-report-name"
          type="text"
          value={marketName}
          onChange={handleMarketNameChange}
          placeholder="e.g., Naples Luxury"
          className={inputClass}
          aria-label="Report Name"
        />
        <p className="mt-2 flex items-center gap-1.5 font-[family-name:var(--font-body)] text-xs text-[var(--color-app-text-secondary)]">
          <span className="text-[var(--color-app-accent)]">◆</span>
          This name appears on the cover of your report.
        </p>
      </div>

      {/* Market Preview */}
      <AnimatePresence>
        {showPreview && (
          <MarketPreviewCard
            city={city}
            state={state}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
