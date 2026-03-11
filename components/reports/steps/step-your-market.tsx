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
  county?: string;
  region?: string;
  marketName: string;
  isNewMarket: boolean;
}

interface StepYourMarketProps {
  markets: MarketOption[];
  onStepComplete: (data: StepMarketData) => void;
  onValidationChange?: (valid: boolean) => void;
}

export function StepYourMarket({
  markets,
  onStepComplete,
  onValidationChange,
}: StepYourMarketProps) {
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [county, setCounty] = useState("");
  const [region, setRegion] = useState("");
  const [marketName, setMarketName] = useState("");
  const [marketNameManuallySet, setMarketNameManuallySet] = useState(false);
  const [selectedExistingId, setSelectedExistingId] = useState<string | null>(null);
  const [showRefine, setShowRefine] = useState(false);

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
        existingMarketId: selectedExistingId || undefined,
        city: city.trim(),
        state: state.trim(),
        county: county.trim() || undefined,
        region: region.trim() || undefined,
        marketName: marketName || `${city.trim()} Luxury`,
        isNewMarket: !selectedExistingId,
      });
    }
  }, [city, state, county, region, marketName, selectedExistingId, isValid, onStepComplete]);

  const handleCityChange = useCallback((value: string) => {
    setCity(value);
    setSelectedExistingId(null);
  }, []);

  const handleCitySelect = useCallback((selectedCity: string, selectedState: string) => {
    setCity(selectedCity);
    setState(selectedState);
    setSelectedExistingId(null);
  }, []);

  const handleStateChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setState(e.target.value);
    setSelectedExistingId(null);
  }, []);

  const handleExistingMarketSelect = useCallback(
    (market: MarketOption) => {
      setCity(market.geography.city);
      setState(market.geography.state);
      setMarketName(market.name);
      setMarketNameManuallySet(true);
      setSelectedExistingId(market.id);
    },
    [],
  );

  const handleMarketNameChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setMarketName(e.target.value);
      setMarketNameManuallySet(true);
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
        Where do you operate?
      </h2>
      <p className="mt-2 font-[family-name:var(--font-sans)] text-sm text-[var(--color-text-secondary)]">
        We'll use this to find luxury transactions in your area.
      </p>

      <div className="w-8 h-0.5 bg-[var(--color-accent)] mt-4 mb-6" />

      {/* Existing markets */}
      {markets.length > 0 && (
        <div className="mb-6">
          <p className="font-[family-name:var(--font-sans)] text-sm font-medium text-[var(--color-text)] mb-3">
            Use an existing market
          </p>
          <div className="flex flex-wrap gap-3">
            {markets.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => handleExistingMarketSelect(m)}
                className={`px-4 py-3 rounded-[var(--radius-sm)] border text-left transition-all duration-[var(--duration-default)] ${
                  selectedExistingId === m.id
                    ? "border-[var(--color-accent)] bg-[var(--color-accent-light)] shadow-[var(--shadow-sm)]"
                    : "border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-accent)]/50"
                }`}
              >
                <span className="block font-[family-name:var(--font-sans)] text-sm font-semibold text-[var(--color-text)]">
                  {m.name}
                </span>
                <span className="block font-[family-name:var(--font-sans)] text-xs text-[var(--color-text-secondary)] mt-0.5">
                  {m.geography.city}, {m.geography.state}
                  {m.luxuryTier && ` \u00B7 ${TIER_LABELS[m.luxuryTier] || m.luxuryTier}`}
                </span>
              </button>
            ))}
          </div>
          <p className="mt-3 font-[family-name:var(--font-sans)] text-xs text-[var(--color-text-tertiary)]">
            — or define a new market —
          </p>
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

      {/* Refine your area */}
      <div className="mb-4">
        <button
          type="button"
          onClick={() => setShowRefine(!showRefine)}
          className="font-[family-name:var(--font-sans)] text-sm text-[var(--color-accent)] hover:text-[var(--color-accent-hover)] cursor-pointer transition-colors duration-[var(--duration-default)]"
        >
          {showRefine ? "\u25BC" : "\u25B6"} Refine your area
        </button>

        {showRefine && (
          <div className="mt-3 space-y-4">
            <div>
              <label htmlFor="step-county" className={labelClass}>
                County
              </label>
              <input
                id="step-county"
                type="text"
                value={county}
                onChange={(e) => setCounty(e.target.value)}
                placeholder="e.g., Collier County"
                className={inputClass}
                aria-label="County"
              />
            </div>
            <div>
              <label htmlFor="step-region" className={labelClass}>
                Region
              </label>
              <input
                id="step-region"
                type="text"
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                placeholder="e.g., Southwest Florida"
                className={inputClass}
                aria-label="Region"
              />
            </div>
          </div>
        )}
      </div>

      {/* Market Name */}
      <div className="mb-4">
        <label htmlFor="step-market-name" className={labelClass}>
          Market Name
        </label>
        <input
          id="step-market-name"
          type="text"
          value={marketName}
          onChange={handleMarketNameChange}
          placeholder="e.g., Naples Luxury"
          className={inputClass}
          aria-label="Market Name"
        />
        <p className="mt-1 font-[family-name:var(--font-sans)] text-xs text-[var(--color-text-tertiary)]">
          This appears as the title in your report.
        </p>
      </div>

      {/* Market Preview */}
      <AnimatePresence>
        {showPreview && (
          <MarketPreviewCard
            city={city}
            state={state}
            county={county || undefined}
            region={region || undefined}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
