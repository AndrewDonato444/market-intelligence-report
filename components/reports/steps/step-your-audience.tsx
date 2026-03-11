"use client";

import React, { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  selectionVariant,
  staggerContainer,
  scaleVariant,
  fadeVariant,
  slideVariant,
} from "@/lib/animations";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface BuyerPersonaSummary {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  primaryMotivation: string;
  whatWinsThem: string;
  displayOrder: number;
}

interface PersonaDetail {
  name: string;
  slug: string;
  profileOverview: string;
  whatWinsThem: string;
  biggestFear: string;
  narrativeFraming: { keyVocabulary: string[] } | null;
  reportMetrics: string[] | null;
  talkingPointTemplates: string[] | null;
}

// ---------------------------------------------------------------------------
// Data contract
// ---------------------------------------------------------------------------

export interface StepAudienceData {
  personaIds: string[];
}

interface StepYourAudienceProps {
  onStepComplete: (data: StepAudienceData) => void;
  onValidationChange?: (valid: boolean) => void;
}

// ---------------------------------------------------------------------------
// AudiencePersonaCard (inline)
// ---------------------------------------------------------------------------

interface AudiencePersonaCardProps {
  persona: BuyerPersonaSummary;
  isSelected: boolean;
  selectionOrder: number | null;
  isMaxed: boolean;
  onSelect: (id: string) => void;
  onPreview: (slug: string) => void;
}

function AudiencePersonaCard({
  persona,
  isSelected,
  selectionOrder,
  isMaxed,
  onSelect,
  onPreview,
}: AudiencePersonaCardProps) {
  const handleClick = useCallback(() => {
    if (isMaxed && !isSelected) return;
    onSelect(persona.id);
  }, [isMaxed, isSelected, onSelect, persona.id]);

  const handlePreview = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onPreview(persona.slug);
    },
    [onPreview, persona.slug],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        if (isMaxed && !isSelected) return;
        onSelect(persona.id);
      }
    },
    [isMaxed, isSelected, onSelect, persona.id],
  );

  return (
    <motion.button
      type="button"
      role="switch"
      aria-checked={isSelected}
      aria-disabled={isMaxed && !isSelected ? true : undefined}
      aria-label={
        isMaxed && !isSelected
          ? `${persona.name} — maximum 3 personas selected`
          : undefined
      }
      data-testid="audience-persona-card"
      data-selected={isSelected ? "true" : "false"}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      whileTap={isMaxed && !isSelected ? undefined : selectionVariant.tap}
      variants={scaleVariant}
      className={`relative cursor-pointer rounded-[var(--radius-md)] border p-4 text-left transition-all duration-[var(--duration-default)] ${
        isSelected
          ? "border-[var(--color-accent)] bg-[var(--color-accent-light)] shadow-[var(--shadow-sm)]"
          : isMaxed
            ? "border-[var(--color-border)] opacity-60 cursor-not-allowed"
            : "border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-border-strong)] hover:shadow-[var(--shadow-md)]"
      }`}
    >
      {selectionOrder !== null && (
        <span
          data-testid={`selection-badge-${selectionOrder}`}
          aria-label={`Selected, position ${selectionOrder}`}
          className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center rounded-full bg-[var(--color-accent)] text-[var(--color-primary)] font-[family-name:var(--font-sans)] text-xs font-semibold"
        >
          {selectionOrder}
        </span>
      )}

      <h3
        data-testid="persona-name"
        className="font-[family-name:var(--font-serif)] text-lg font-bold text-[var(--color-text)] pr-8"
      >
        {persona.name}
      </h3>

      <p className="font-[family-name:var(--font-sans)] text-xs text-[var(--color-text-secondary)] mt-1">
        {persona.tagline}
      </p>

      <span className="inline-block mt-2 px-2 py-0.5 rounded-full bg-[var(--color-primary-light)] font-[family-name:var(--font-sans)] text-xs text-[var(--color-text)]">
        {persona.primaryMotivation}
      </span>

      <p className="font-[family-name:var(--font-sans)] text-xs text-[var(--color-text-secondary)] italic mt-2">
        What they care about: {persona.whatWinsThem}
      </p>

      <div className="mt-3">
        <span
          role="link"
          tabIndex={0}
          onClick={handlePreview}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              handlePreview(e as unknown as React.MouseEvent);
            }
          }}
          className="font-[family-name:var(--font-sans)] text-xs text-[var(--color-accent)] underline cursor-pointer hover:text-[var(--color-accent-hover)] transition-colors duration-[var(--duration-default)]"
        >
          Preview
        </span>
      </div>
    </motion.button>
  );
}

// ---------------------------------------------------------------------------
// AudiencePreviewPanel (inline)
// ---------------------------------------------------------------------------

interface AudiencePreviewPanelProps {
  persona: PersonaDetail;
  onClose: () => void;
}

function AudiencePreviewPanel({ persona, onClose }: AudiencePreviewPanelProps) {
  const keyVocabulary = persona.narrativeFraming?.keyVocabulary ?? [];
  const reportMetrics = (persona.reportMetrics ?? []).slice(0, 3);
  const firstTemplate = persona.talkingPointTemplates?.[0];

  return (
    <motion.div
      data-testid="audience-preview-panel"
      role="complementary"
      aria-label={`Persona preview: ${persona.name}`}
      variants={slideVariant("right")}
      initial="initial"
      animate="animate"
      exit="exit"
      className="bg-[var(--color-background)] rounded-[var(--radius-md)] shadow-[var(--shadow-md)] p-6"
    >
      <h3 className="font-[family-name:var(--font-serif)] text-xl font-bold text-[var(--color-primary)] uppercase">
        {persona.name}
      </h3>
      <div className="w-8 h-0.5 bg-[var(--color-accent)] mt-1 mb-3" />

      <p className="font-[family-name:var(--font-sans)] text-sm text-[var(--color-text)]">
        {persona.profileOverview}
      </p>

      <p className="font-[family-name:var(--font-sans)] text-xs font-medium text-[var(--color-text)] mt-3">
        <span className="font-semibold">What Wins Them:</span>{" "}
        {persona.whatWinsThem}
      </p>

      <p className="font-[family-name:var(--font-sans)] text-xs text-[var(--color-text-secondary)] mt-1">
        <span className="font-semibold">Biggest Fear:</span>{" "}
        {persona.biggestFear}
      </p>

      {keyVocabulary.length > 0 && (
        <div className="mt-3">
          <p className="font-[family-name:var(--font-sans)] text-xs uppercase text-[var(--color-text-tertiary)] tracking-wider font-medium mb-1">
            Key Vocabulary
          </p>
          <div className="flex flex-wrap gap-1">
            {keyVocabulary.map((word) => (
              <span
                key={word}
                className="px-2 py-0.5 border border-[var(--color-border)] rounded-full font-[family-name:var(--font-sans)] text-xs text-[var(--color-text-secondary)]"
              >
                {word}
              </span>
            ))}
          </div>
        </div>
      )}

      {reportMetrics.length > 0 && (
        <div className="mt-3">
          <p className="font-[family-name:var(--font-sans)] text-xs uppercase text-[var(--color-text-tertiary)] tracking-wider font-medium mb-1">
            Top Report Metrics
          </p>
          <ul className="list-disc list-inside">
            {reportMetrics.map((metric) => (
              <li
                key={metric}
                className="font-[family-name:var(--font-sans)] text-xs text-[var(--color-text)]"
              >
                {metric}
              </li>
            ))}
          </ul>
        </div>
      )}

      {firstTemplate && (
        <div className="mt-3">
          <p className="font-[family-name:var(--font-sans)] text-xs uppercase text-[var(--color-text-tertiary)] tracking-wider font-medium mb-1">
            Sample Talking Point
          </p>
          <p className="font-[family-name:var(--font-sans)] text-xs text-[var(--color-text-secondary)] italic bg-[var(--color-surface)] p-2 rounded-[var(--radius-sm)]">
            &ldquo;{firstTemplate}&rdquo;
          </p>
        </div>
      )}

      <div className="mt-3">
        <button
          type="button"
          onClick={onClose}
          className="font-[family-name:var(--font-sans)] text-xs text-[var(--color-text-tertiary)] cursor-pointer hover:text-[var(--color-text-secondary)] transition-colors duration-[var(--duration-default)]"
        >
          Close Preview
        </button>
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// StepYourAudience
// ---------------------------------------------------------------------------

export function StepYourAudience({
  onStepComplete,
  onValidationChange,
}: StepYourAudienceProps) {
  const [personas, setPersonas] = useState<BuyerPersonaSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [previewSlug, setPreviewSlug] = useState<string | null>(null);
  const [previewPersona, setPreviewPersona] = useState<PersonaDetail | null>(
    null,
  );
  const [previewLoading, setPreviewLoading] = useState(false);

  const isMaxed = selectedIds.length >= 3;
  const isValid = selectedIds.length > 0;

  // Fetch personas
  const fetchPersonas = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/buyer-personas");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      const fetched = data.personas ?? [];
      setPersonas(fetched);

      // If empty, allow skipping
      if (fetched.length === 0) {
        onValidationChange?.(true);
        onStepComplete({ personaIds: [] });
      }
    } catch {
      setError("We couldn't load buyer personas. You can skip this step or try refreshing.");
      onValidationChange?.(true);
    } finally {
      setLoading(false);
    }
  }, [onValidationChange, onStepComplete]);

  useEffect(() => {
    fetchPersonas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Validation
  useEffect(() => {
    if (!loading && !error && personas.length > 0) {
      onValidationChange?.(isValid);
    }
  }, [isValid, loading, error, personas.length, onValidationChange]);

  // Emit data
  useEffect(() => {
    if (isValid) {
      onStepComplete({ personaIds: selectedIds });
    }
  }, [selectedIds, isValid, onStepComplete]);

  // Selection toggle
  const handleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((pid) => pid !== id);
      }
      if (prev.length >= 3) return prev;
      return [...prev, id];
    });
  }, []);

  // Preview
  const handlePreview = useCallback(
    async (slug: string) => {
      setPreviewSlug(slug);
      setPreviewLoading(true);

      // Check if persona data is already in the full list (use summary data from list fetch)
      const fromList = personas.find((p) => p.slug === slug);

      try {
        const res = await fetch(`/api/buyer-personas/${slug}`);
        if (!res.ok) throw new Error("Failed to fetch preview");
        const data = await res.json();
        setPreviewPersona(data.persona);
      } catch {
        // Fallback: won't show preview if fetch fails
        if (fromList) {
          setPreviewPersona(null);
          setPreviewSlug(null);
        }
      } finally {
        setPreviewLoading(false);
      }
    },
    [personas],
  );

  const handleClosePreview = useCallback(() => {
    setPreviewSlug(null);
    setPreviewPersona(null);
  }, []);

  return (
    <div className="py-4">
      {/* Heading */}
      <h2 className="font-[family-name:var(--font-serif)] text-2xl font-bold text-[var(--color-primary)]">
        Who are you advising?
      </h2>
      <p className="mt-2 font-[family-name:var(--font-sans)] text-sm text-[var(--color-text-secondary)]">
        Select up to 3 buyer personas &mdash; we&apos;ll tailor insights, talking points, and narrative framing to match their priorities
      </p>

      <div className="w-8 h-0.5 bg-[var(--color-accent)] mt-4 mb-6" />

      {/* Loading */}
      {loading && (
        <div
          data-testid="audience-loading-skeleton"
          aria-busy="true"
          aria-label="Loading buyer personas"
          className="grid grid-cols-2 gap-3"
        >
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="bg-[var(--color-background)] rounded-[var(--radius-md)] h-40 animate-pulse"
            />
          ))}
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="text-center py-6">
          <p className="font-[family-name:var(--font-sans)] text-sm text-[var(--color-text-secondary)]">
            {error}
          </p>
          <button
            type="button"
            onClick={fetchPersonas}
            className="mt-3 px-4 py-2 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-[var(--color-primary)] font-[family-name:var(--font-sans)] font-semibold text-sm rounded-[var(--radius-sm)] transition-colors duration-[var(--duration-default)]"
          >
            Retry
          </button>
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && personas.length === 0 && (
        <p className="text-center py-6 font-[family-name:var(--font-sans)] text-sm text-[var(--color-text-secondary)]">
          No buyer personas are configured yet. You can proceed without targeting specific buyer types.
        </p>
      )}

      {/* Persona cards */}
      {!loading && !error && personas.length > 0 && (
        <>
          <div className={previewSlug && previewPersona ? "flex gap-4" : ""}>
            <motion.div
              className={`grid ${previewSlug && previewPersona ? "grid-cols-1 w-1/2" : "grid-cols-2"} gap-3`}
              variants={staggerContainer}
              initial="initial"
              animate="animate"
            >
              {personas.map((persona) => {
                const idx = selectedIds.indexOf(persona.id);
                const selectionOrder = idx >= 0 ? idx + 1 : null;
                const cardIsMaxed = isMaxed && !selectedIds.includes(persona.id);

                return (
                  <AudiencePersonaCard
                    key={persona.id}
                    persona={persona}
                    isSelected={selectedIds.includes(persona.id)}
                    selectionOrder={selectionOrder}
                    isMaxed={cardIsMaxed}
                    onSelect={handleSelect}
                    onPreview={handlePreview}
                  />
                );
              })}
            </motion.div>

            {/* Preview panel */}
            <AnimatePresence mode="wait">
              {previewSlug && previewPersona && (
                <div className="w-1/2">
                  <AudiencePreviewPanel
                    key={previewSlug}
                    persona={previewPersona}
                    onClose={handleClosePreview}
                  />
                </div>
              )}
            </AnimatePresence>
          </div>

          {/* Max-3 explanation */}
          {isMaxed && (
            <p className="text-center py-4 font-[family-name:var(--font-sans)] text-sm text-[var(--color-text-secondary)]">
              You&apos;ve chosen 3 personas &mdash; that&apos;s the max for a focused report. Deselect one to swap.
            </p>
          )}
        </>
      )}
    </div>
  );
}
