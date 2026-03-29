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
// Qualifier questions → persona mapping
// ---------------------------------------------------------------------------

interface QualifierOption {
  label: string;
  value: string;
  /** Persona slugs this answer maps to (scored) */
  slugs: string[];
}

interface QualifierQuestion {
  id: string;
  question: string;
  options: QualifierOption[];
}

const QUALIFIER_QUESTIONS: QualifierQuestion[] = [
  {
    id: "motivation",
    question: "What is your client primarily motivated by?",
    options: [
      { label: "Financial return / investment growth", value: "financial", slugs: ["business-mogul", "tech-founder"] },
      { label: "Lifestyle / personal enjoyment", value: "lifestyle", slugs: ["coastal-escape-seeker", "seasonal-second-home"] },
      { label: "Family legacy / generational wealth", value: "legacy", slugs: ["legacy-builder"] },
      { label: "Portfolio diversification / relocation", value: "portfolio", slugs: ["corporate-executive", "international-buyer"] },
    ],
  },
  {
    id: "use",
    question: "How will the property be used?",
    options: [
      { label: "Primary residence", value: "primary", slugs: ["legacy-builder", "corporate-executive"] },
      { label: "Vacation / seasonal home", value: "vacation", slugs: ["coastal-escape-seeker", "seasonal-second-home"] },
      { label: "Investment / rental income", value: "investment", slugs: ["business-mogul", "tech-founder"] },
      { label: "Mixed use / multiple properties", value: "mixed", slugs: ["international-buyer", "celebrity-public-figure"] },
    ],
  },
  {
    id: "privacy",
    question: "How important is privacy and discretion?",
    options: [
      { label: "Critical — NDAs, off-market preferred", value: "critical", slugs: ["celebrity-public-figure", "international-buyer"] },
      { label: "Important but standard", value: "standard", slugs: ["business-mogul", "corporate-executive", "tech-founder"] },
      { label: "Not a primary concern", value: "low", slugs: ["coastal-escape-seeker", "legacy-builder", "seasonal-second-home"] },
    ],
  },
  {
    id: "timeline",
    question: "What is their purchase timeline?",
    options: [
      { label: "Immediate — within 3 months", value: "immediate", slugs: ["business-mogul", "corporate-executive"] },
      { label: "Near-term — within 6 months", value: "near", slugs: ["tech-founder", "coastal-escape-seeker"] },
      { label: "Flexible — exploring the market", value: "flexible", slugs: ["legacy-builder", "seasonal-second-home", "international-buyer"] },
    ],
  },
];

/** Score personas by counting how many qualifier answers map to each slug */
function scorePersonas(answers: Record<string, string>): Record<string, number> {
  const scores: Record<string, number> = {};
  for (const q of QUALIFIER_QUESTIONS) {
    const answer = answers[q.id];
    if (!answer) continue;
    const option = q.options.find((o) => o.value === answer);
    if (!option) continue;
    for (const slug of option.slugs) {
      scores[slug] = (scores[slug] ?? 0) + 1;
    }
  }
  return scores;
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
      className={`group relative cursor-pointer rounded-[var(--radius-md)] border p-4 pb-10 text-left transition-all duration-[var(--duration-default)] ${
        isSelected
          ? "border-[var(--color-app-accent)] bg-[var(--color-app-accent-light)] shadow-[var(--shadow-sm)]"
          : isMaxed
            ? "border-[var(--color-app-border)] opacity-60 cursor-not-allowed"
            : "border-[var(--color-app-border)] bg-[var(--color-app-surface)] hover:border-[var(--color-app-border-strong)] hover:shadow-[var(--shadow-md)]"
      }`}
    >
      {selectionOrder !== null && (
        <span
          data-testid={`selection-badge-${selectionOrder}`}
          aria-label={`Selected, position ${selectionOrder}`}
          className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center rounded-full bg-[var(--color-app-accent)] text-[var(--color-app-text)] font-[family-name:var(--font-body)] text-xs font-semibold"
        >
          {selectionOrder}
        </span>
      )}

      <h3
        data-testid="persona-name"
        className="font-[family-name:var(--font-display)] text-lg font-bold text-[var(--color-app-text)] pr-8"
      >
        {persona.name}
      </h3>

      <p className="font-[family-name:var(--font-body)] text-xs text-[var(--color-app-text-secondary)] mt-1">
        {persona.tagline}
      </p>

      <span className="inline-block mt-2 px-2 py-0.5 rounded-full bg-[var(--color-app-active-bg)] font-[family-name:var(--font-body)] text-xs text-[var(--color-app-text)]">
        {persona.primaryMotivation}
      </span>

      <p className="font-[family-name:var(--font-body)] text-xs text-[var(--color-app-text-secondary)] italic mt-2">
        What they care about: {persona.whatWinsThem}
      </p>

      {/* Hover-reveal "View Profile" bar */}
      <div
        role="button"
        tabIndex={0}
        aria-label={`View profile for ${persona.name}`}
        onClick={handlePreview}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handlePreview(e as unknown as React.MouseEvent);
          }
        }}
        className="absolute bottom-0 left-0 right-0 overflow-hidden rounded-b-[var(--radius-md)]"
      >
        <div className="translate-y-full group-hover:translate-y-0 transition-transform duration-200 ease-out bg-[var(--color-app-text)] px-4 py-2 flex items-center justify-between">
          <span className="font-[family-name:var(--font-body)] text-xs font-medium tracking-wide text-[var(--color-app-accent)]">
            View Profile
          </span>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-[var(--color-app-accent)]">
            <path d="M2 6H10M10 6L7 3M10 6L7 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </div>
    </motion.button>
  );
}

// ---------------------------------------------------------------------------
// Persona portrait images (curated Unsplash)
// ---------------------------------------------------------------------------

const PERSONA_IMAGES: Record<string, string> = {
  "business-mogul":
    "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=480&h=700&fit=crop&crop=top&q=85&auto=format",
  "legacy-builder":
    "https://images.pexels.com/photos/8899940/pexels-photo-8899940.jpeg?auto=compress&cs=tinysrgb&w=480&h=700&fit=crop",
  "coastal-escape-seeker":
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=480&h=700&fit=crop&crop=top&q=85&auto=format",
  "tech-founder":
    "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=480&h=700&fit=crop&crop=top&q=85&auto=format",
  "seasonal-second-home":
    "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=480&h=700&fit=crop&crop=top&q=85&auto=format",
  "international-buyer":
    "https://images.pexels.com/photos/5717583/pexels-photo-5717583.jpeg?auto=compress&cs=tinysrgb&w=480&h=700&fit=crop",
  "celebrity-public-figure":
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=480&h=700&fit=crop&crop=top&q=85&auto=format",
  "corporate-executive":
    "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=480&h=700&fit=crop&crop=top&q=85&auto=format",
};

// ---------------------------------------------------------------------------
// AudiencePreviewPanel (inline)
// ---------------------------------------------------------------------------

interface AudiencePreviewPanelProps {
  persona: PersonaDetail;
  slug: string;
  onClose: () => void;
}

function AudiencePreviewPanel({ persona, slug, onClose }: AudiencePreviewPanelProps) {
  const keyVocabulary = persona.narrativeFraming?.keyVocabulary ?? [];
  const reportMetrics = (persona.reportMetrics ?? []).slice(0, 3);
  const firstTemplate = persona.talkingPointTemplates?.[0];
  const imageUrl = PERSONA_IMAGES[slug];

  return (
    <div
      data-testid="audience-preview-panel"
      role="complementary"
      aria-label={"Persona preview: " + persona.name}
      className="h-full flex flex-row bg-[var(--color-app-bg)] rounded-[var(--radius-md)] shadow-[var(--shadow-lg)] overflow-hidden relative"
    >
      {/* Close button — always visible, top-right corner */}
      <button
        type="button"
        onClick={onClose}
        aria-label="Close preview"
        className="absolute top-3 right-3 z-30 w-8 h-8 flex items-center justify-center rounded-full bg-[var(--color-app-surface)] border border-[var(--color-app-border)] text-[var(--color-app-text-secondary)] hover:text-[var(--color-app-text)] hover:bg-[var(--color-app-bg)] hover:border-[var(--color-app-text-secondary)] transition-all duration-[var(--duration-default)] shadow-[var(--shadow-sm)] cursor-pointer"
      >
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M1 1L9 9M9 1L1 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      </button>
      {imageUrl && (
        <div className="w-[36%] flex-shrink-0 relative overflow-hidden">
          <img
            src={imageUrl}
            alt={persona.name}
            className="absolute inset-0 w-full h-full object-cover object-top"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent to-black/10" />
        </div>
      )}
      <div className="flex-1 overflow-y-auto p-5 pr-10">
        <h3 className="font-[family-name:var(--font-display)] text-xl font-bold text-[var(--color-app-text)] uppercase">
          {persona.name}
        </h3>
        <div className="w-8 h-0.5 bg-[var(--color-app-accent)] mt-1 mb-3" />
        <p className="font-[family-name:var(--font-body)] text-sm text-[var(--color-app-text)]">
          {persona.profileOverview}
        </p>
        <p className="font-[family-name:var(--font-body)] text-xs font-medium text-[var(--color-app-text)] mt-3">
          <span className="font-semibold">What Wins Them:</span>{" "}
          {persona.whatWinsThem}
        </p>
        <p className="font-[family-name:var(--font-body)] text-xs text-[var(--color-app-text-secondary)] mt-1">
          <span className="font-semibold">Biggest Fear:</span>{" "}
          {persona.biggestFear}
        </p>
        {keyVocabulary.length > 0 && (
          <div className="mt-3">
            <p className="font-[family-name:var(--font-body)] text-xs uppercase text-[var(--color-app-text-tertiary)] tracking-wider font-medium mb-1">
              Key Vocabulary
            </p>
            <div className="flex flex-wrap gap-1">
              {keyVocabulary.map((word) => (
                <span
                  key={word}
                  className="px-2 py-0.5 border border-[var(--color-app-border)] rounded-full font-[family-name:var(--font-body)] text-xs text-[var(--color-app-text-secondary)]"
                >
                  {word}
                </span>
              ))}
            </div>
          </div>
        )}
        {reportMetrics.length > 0 && (
          <div className="mt-3">
            <p className="font-[family-name:var(--font-body)] text-xs uppercase text-[var(--color-app-text-tertiary)] tracking-wider font-medium mb-1">
              Top Report Metrics
            </p>
            <ul className="list-disc list-inside">
              {reportMetrics.map((metric) => (
                <li
                  key={metric}
                  className="font-[family-name:var(--font-body)] text-xs text-[var(--color-app-text)]"
                >
                  {metric}
                </li>
              ))}
            </ul>
          </div>
        )}
        {firstTemplate && (
          <div className="mt-3">
            <p className="font-[family-name:var(--font-body)] text-xs uppercase text-[var(--color-app-text-tertiary)] tracking-wider font-medium mb-1">
              Sample Talking Point
            </p>
            <p className="font-[family-name:var(--font-body)] text-xs text-[var(--color-app-text-secondary)] italic bg-[var(--color-app-surface)] p-2 rounded-[var(--radius-sm)]">
              &ldquo;{firstTemplate}&rdquo;
            </p>
          </div>
        )}
      </div>
    </div>
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

  // Qualifier phase
  const [qualifierAnswers, setQualifierAnswers] = useState<Record<string, string>>({});
  const [qualifierDone, setQualifierDone] = useState(true);
  const [recommendedSlugs, setRecommendedSlugs] = useState<string[]>([]);

  const isMaxed = selectedIds.length >= 3;
  const isValid = selectedIds.length > 0;
  const allQuestionsAnswered = Object.keys(qualifierAnswers).length === QUALIFIER_QUESTIONS.length;

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
        // Fetch failed — clear preview state entirely
        setPreviewPersona(null);
        setPreviewSlug(null);
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

  // Qualifier handlers
  const handleQualifierAnswer = useCallback((questionId: string, value: string) => {
    setQualifierAnswers((prev) => ({ ...prev, [questionId]: value }));
  }, []);

  const handleQualifierSubmit = useCallback(() => {
    const scores = scorePersonas(qualifierAnswers);
    // Sort slugs by score descending, take top 3
    const sorted = Object.entries(scores)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([slug]) => slug);
    setRecommendedSlugs(sorted);

    // Auto-select recommended personas
    const recommendedIds = sorted
      .map((slug) => personas.find((p) => p.slug === slug)?.id)
      .filter((id): id is string => !!id);
    setSelectedIds(recommendedIds);
    setQualifierDone(true);
  }, [qualifierAnswers, personas]);

  const handleSkipQualifier = useCallback(() => {
    setQualifierDone(true);
  }, []);

  // Sort personas: recommended first, then rest by displayOrder
  const sortedPersonas = React.useMemo(() => {
    if (recommendedSlugs.length === 0) return personas;
    return [...personas].sort((a, b) => {
      const aRec = recommendedSlugs.indexOf(a.slug);
      const bRec = recommendedSlugs.indexOf(b.slug);
      if (aRec >= 0 && bRec >= 0) return aRec - bRec;
      if (aRec >= 0) return -1;
      if (bRec >= 0) return 1;
      return a.displayOrder - b.displayOrder;
    });
  }, [personas, recommendedSlugs]);

  return (
    <div className="py-4">
      {/* Heading */}
      <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold text-[var(--color-app-text)]">
        Who are you advising?
      </h2>
      <p className="mt-2 font-[family-name:var(--font-body)] text-sm text-[var(--color-app-text-secondary)]">
        {!qualifierDone
          ? "Answer a few quick questions so we can recommend the right buyer profiles for your client"
          : "Select up to 3 buyer personas \u2014 we\u2019ll tailor insights, talking points, and narrative framing to match their priorities"}
      </p>

      <div className="w-8 h-0.5 bg-[var(--color-app-accent)] mt-4 mb-6" />

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
              className="bg-[var(--color-app-bg)] rounded-[var(--radius-md)] h-40 animate-pulse"
            />
          ))}
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="text-center py-6">
          <p className="font-[family-name:var(--font-body)] text-sm text-[var(--color-app-text-secondary)]">
            {error}
          </p>
          <button
            type="button"
            onClick={fetchPersonas}
            className="mt-3 px-4 py-2 bg-[var(--color-app-accent)] hover:bg-[var(--color-app-accent-hover)] text-[var(--color-app-text)] font-[family-name:var(--font-body)] font-semibold text-sm rounded-[var(--radius-sm)] transition-colors duration-[var(--duration-default)]"
          >
            Retry
          </button>
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && personas.length === 0 && (
        <p className="text-center py-6 font-[family-name:var(--font-body)] text-sm text-[var(--color-app-text-secondary)]">
          No buyer personas are configured yet. You can proceed without targeting specific buyer types.
        </p>
      )}

      {/* Phase 1: Qualifier questions */}
      {!loading && !error && personas.length > 0 && !qualifierDone && (
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="space-y-6"
        >
          {QUALIFIER_QUESTIONS.map((q) => (
            <motion.fieldset
              key={q.id}
              variants={fadeVariant}
              className="space-y-2"
            >
              <legend className="font-[family-name:var(--font-body)] text-sm font-medium text-[var(--color-app-text)]">
                {q.question}
              </legend>
              <div className="grid grid-cols-2 gap-2">
                {q.options.map((opt) => {
                  const isChosen = qualifierAnswers[q.id] === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => handleQualifierAnswer(q.id, opt.value)}
                      className={`text-left px-3 py-2 rounded-[var(--radius-sm)] border font-[family-name:var(--font-body)] text-sm transition-all duration-[var(--duration-default)] ${
                        isChosen
                          ? "border-[var(--color-app-accent)] bg-[var(--color-app-accent-light)] text-[var(--color-app-text)] font-medium"
                          : "border-[var(--color-app-border)] bg-[var(--color-app-surface)] text-[var(--color-app-text-secondary)] hover:border-[var(--color-app-border-strong)]"
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </motion.fieldset>
          ))}

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={handleQualifierSubmit}
              disabled={!allQuestionsAnswered}
              className={`px-5 py-2 rounded-[var(--radius-sm)] font-[family-name:var(--font-body)] font-semibold text-sm transition-colors duration-[var(--duration-default)] ${
                allQuestionsAnswered
                  ? "bg-[var(--color-app-accent)] hover:bg-[var(--color-app-accent-hover)] text-[var(--color-app-text)] cursor-pointer"
                  : "bg-[var(--color-app-border)] text-[var(--color-app-text-tertiary)] cursor-not-allowed"
              }`}
            >
              See Recommendations
            </button>
            <button
              type="button"
              onClick={handleSkipQualifier}
              className="px-4 py-2 font-[family-name:var(--font-body)] text-sm text-[var(--color-app-text-tertiary)] hover:text-[var(--color-app-text-secondary)] transition-colors duration-[var(--duration-default)]"
            >
              Skip &mdash; I know who I want
            </button>
          </div>
        </motion.div>
      )}

      {/* Phase 2: Persona cards (after qualifier or skip) */}
      {!loading && !error && personas.length > 0 && qualifierDone && (
        <>
          {/* Recommendation banner */}
          {recommendedSlugs.length > 0 && (
            <motion.div
              variants={fadeVariant}
              initial="initial"
              animate="animate"
              className="mb-4 px-4 py-3 rounded-[var(--radius-md)] bg-[var(--color-app-accent-light)] border border-[var(--color-app-accent)]"
            >
              <p className="font-[family-name:var(--font-body)] text-sm text-[var(--color-app-text)]">
                <span className="font-semibold">Based on your answers</span>, we recommend the highlighted personas below. You can adjust the selection if needed.
              </p>
            </motion.div>
          )}

          <div className="relative">
            {/* Cards — always 2-col, never reflow */}
            <motion.div
              className="grid grid-cols-2 gap-3"
              variants={staggerContainer}
              initial="initial"
              animate="animate"
            >
              {sortedPersonas.map((persona) => {
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

            {/* Preview panel — slides in over the cards, no layout shift */}
            <AnimatePresence>
              {previewSlug && (
                <>
                  {/* Backdrop */}
                  <motion.div
                    key="backdrop"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    onClick={handleClosePreview}
                    className="absolute inset-0 bg-[var(--color-app-surface)]/80 backdrop-blur-[2px] rounded-[var(--radius-md)] z-10 cursor-pointer"
                  />
                  {/* Panel */}
                  <motion.div
                    key={previewSlug}
                    initial={{ x: "100%", opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: "100%", opacity: 0 }}
                    transition={{ type: "spring", stiffness: 320, damping: 32 }}
                    className="absolute inset-0 z-20"
                  >
                    {previewLoading ? (
                      <div className="h-full bg-[var(--color-app-bg)] rounded-[var(--radius-md)] shadow-[var(--shadow-lg)] p-6 flex items-center justify-center">
                        <div className="w-8 h-8 border-2 border-[var(--color-app-accent)] border-t-transparent rounded-full animate-spin" />
                      </div>
                    ) : previewPersona ? (
                      <AudiencePreviewPanel
                        persona={previewPersona}
                        slug={previewSlug}
                        onClose={handleClosePreview}
                      />
                    ) : null}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          {/* Max-3 explanation */}
          {isMaxed && (
            <p className="text-center py-4 font-[family-name:var(--font-body)] text-sm text-[var(--color-app-text-secondary)]">
              You&apos;ve chosen 3 personas &mdash; that&apos;s the max for a focused report. Deselect one to swap.
            </p>
          )}
        </>
      )}
    </div>
  );
}
