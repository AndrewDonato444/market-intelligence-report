"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { StepIndicator } from "@/components/markets/step-indicator";
import {
  REPORT_SECTIONS,
  REQUIRED_SECTIONS,
} from "@/lib/services/report-validation";
import Link from "next/link";
import { PersonaCard } from "./persona-card";
import { PersonaPreviewPanel } from "./persona-preview-panel";

const STEPS = ["Market", "Sections", "Personas", "Review"];

interface MarketOption {
  id: string;
  name: string;
  geography: { city: string; state: string };
  luxuryTier: string;
  isDefault: number;
  peerMarkets?: Array<{ name: string; geography: { city: string; state: string } }> | null;
}

interface BuyerPersona {
  id: string;
  name: string;
  slug: string;
  tagline: string;
  displayOrder: number;
  primaryMotivation: string;
  buyingLens: string;
  whatWinsThem: string;
  biggestFear: string;
  profileOverview: string;
  reportMetrics: Array<{ metric: string; priority?: string }> | null;
  narrativeFraming: {
    languageTone: string;
    keyVocabulary: string[];
    avoid: string[];
  } | null;
  talkingPointTemplates: Array<{ template: string }> | null;
}

interface ReportWizardProps {
  markets: MarketOption[];
}

export function ReportWizard({ markets }: ReportWizardProps) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Find default market
  const defaultMarket = markets.find((m) => m.isDefault === 1) || markets[0];

  const [selectedMarketId, setSelectedMarketId] = useState(
    defaultMarket?.id || ""
  );
  const [selectedSections, setSelectedSections] = useState<string[]>(
    REPORT_SECTIONS.map((s) => s.type)
  );
  const [title, setTitle] = useState("");

  // Persona state
  const [personas, setPersonas] = useState<BuyerPersona[]>([]);
  const [personasFetched, setPersonasFetched] = useState(false);
  const [personasFetchError, setPersonasFetchError] = useState(false);
  const [selectedPersonaIds, setSelectedPersonaIds] = useState<string[]>([]);
  const [previewPersonaSlug, setPreviewPersonaSlug] = useState<string | null>(null);
  const [maxPersonaMessage, setMaxPersonaMessage] = useState<string | null>(null);

  const selectedMarket = markets.find((m) => m.id === selectedMarketId);

  // Generate default title based on selected market
  const defaultTitle = selectedMarket
    ? `${selectedMarket.name} Intelligence Report`
    : "Intelligence Report";

  const effectiveTitle = title.trim() || defaultTitle;

  // Fetch personas on mount
  const fetchPersonas = useCallback(async () => {
    setPersonasFetchError(false);
    try {
      const res = await fetch("/api/buyer-personas");
      if (!res.ok) {
        setPersonasFetchError(true);
        return;
      }
      const data = await res.json();
      setPersonas(data.personas ?? []);
      setPersonasFetched(true);
    } catch {
      setPersonasFetchError(true);
    }
  }, []);

  useEffect(() => {
    fetchPersonas();
  }, [fetchPersonas]);

  const toggleSection = (sectionType: string) => {
    if (REQUIRED_SECTIONS.includes(sectionType)) return;

    setSelectedSections((prev) =>
      prev.includes(sectionType)
        ? prev.filter((s) => s !== sectionType)
        : [...prev, sectionType]
    );
  };

  const handlePersonaSelect = (personaId: string) => {
    setMaxPersonaMessage(null);

    if (selectedPersonaIds.includes(personaId)) {
      // Deselect
      setSelectedPersonaIds((prev) => prev.filter((id) => id !== personaId));
      return;
    }

    if (selectedPersonaIds.length >= 3) {
      setMaxPersonaMessage(
        "Maximum 3 personas. Deselect one to choose a different persona."
      );
      return;
    }

    setSelectedPersonaIds((prev) => [...prev, personaId]);
  };

  const handlePersonaPreview = (slug: string) => {
    setPreviewPersonaSlug((prev) => (prev === slug ? null : slug));
  };

  const previewPersona = personas.find((p) => p.slug === previewPersonaSlug);

  const validateStep = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 0) {
      if (!selectedMarketId) {
        newErrors.market = "Select a market to continue";
      }
    }

    if (step === 2) {
      // Personas step — require at least 1 unless no personas exist in system
      if (personas.length > 0 && selectedPersonaIds.length === 0) {
        newErrors.personas = "Select at least 1 buyer persona to continue";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep()) {
      setStep((s) => s + 1);
    }
  };

  const handleBack = () => {
    setStep((s) => s - 1);
  };

  const handleSubmit = async () => {
    setSaving(true);
    setMessage(null);

    const payload: Record<string, unknown> = {
      marketId: selectedMarketId,
      title: effectiveTitle,
      sections: selectedSections,
    };

    if (selectedPersonaIds.length > 0) {
      payload.personaIds = selectedPersonaIds;
    }

    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.errors) setErrors(data.errors);
        setMessage({
          type: "error",
          text: data.error || "Failed to create report",
        });
        return;
      }

      router.push("/reports");
    } catch {
      setMessage({
        type: "error",
        text: "Network error. Please try again.",
      });
    } finally {
      setSaving(false);
    }
  };

  const tierLabels: Record<string, string> = {
    luxury: "Luxury",
    high_luxury: "High Luxury",
    ultra_luxury: "Ultra Luxury",
  };

  const inputClass =
    "w-full px-3 py-2 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] font-[family-name:var(--font-sans)] text-sm text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:border-transparent transition-shadow duration-[var(--duration-default)]";

  const labelClass =
    "block font-[family-name:var(--font-sans)] text-sm font-medium text-[var(--color-text)] mb-1";

  // Get selected persona names for review
  const selectedPersonaNames = selectedPersonaIds
    .map((id) => personas.find((p) => p.id === id))
    .filter(Boolean)
    .map((p, i) => `${i + 1}. ${p!.name}`);

  // No markets available
  if (markets.length === 0) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-[var(--color-surface)] rounded-[var(--radius-md)] shadow-[var(--shadow-sm)] p-6 text-center">
          <h2 className="font-[family-name:var(--font-serif)] text-2xl font-bold text-[var(--color-primary)]">
            Generate Report
          </h2>
          <div className="w-12 h-0.5 bg-[var(--color-accent)] mt-3 mb-6 mx-auto" />
          <p className="font-[family-name:var(--font-sans)] text-sm text-[var(--color-text-secondary)] mb-4">
            No markets defined yet. Define a market before generating a report.
          </p>
          <Link
            href="/markets/new"
            className="inline-block px-6 py-2 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-[var(--color-primary)] font-[family-name:var(--font-sans)] font-semibold text-sm rounded-[var(--radius-sm)] transition-colors duration-[var(--duration-default)]"
          >
            Create a Market
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-[var(--color-surface)] rounded-[var(--radius-md)] shadow-[var(--shadow-sm)] p-6">
        <h2 className="font-[family-name:var(--font-serif)] text-2xl font-bold text-[var(--color-primary)]">
          Generate Report
        </h2>
        <p className="font-[family-name:var(--font-sans)] text-sm text-[var(--color-text-secondary)] mt-1">
          Configure and generate a market intelligence report.
        </p>
        <div className="w-12 h-0.5 bg-[var(--color-accent)] mt-3 mb-6" />

        <StepIndicator steps={STEPS} currentStep={step} />

        {/* Step 1: Select Market */}
        {step === 0 && (
          <div className="space-y-4">
            <label className={labelClass}>Select Market *</label>
            <div className="space-y-2">
              {markets.map((market) => (
                <label
                  key={market.id}
                  className={`flex items-center gap-3 p-3 rounded-[var(--radius-sm)] border cursor-pointer transition-colors duration-[var(--duration-default)] ${
                    selectedMarketId === market.id
                      ? "border-[var(--color-accent)] bg-[var(--color-accent-light)]"
                      : "border-[var(--color-border)] hover:border-[var(--color-border-strong)]"
                  }`}
                >
                  <input
                    type="radio"
                    name="market"
                    value={market.id}
                    checked={selectedMarketId === market.id}
                    onChange={() => setSelectedMarketId(market.id)}
                    className="accent-[var(--color-accent)]"
                  />
                  <div className="flex-1">
                    <span className="font-[family-name:var(--font-sans)] text-sm font-medium text-[var(--color-text)]">
                      {market.name}
                    </span>
                    <span className="font-[family-name:var(--font-sans)] text-xs text-[var(--color-text-secondary)] ml-2">
                      {market.geography.city}, {market.geography.state}
                    </span>
                    <span className="font-[family-name:var(--font-sans)] text-xs text-[var(--color-text-tertiary)] ml-2">
                      {tierLabels[market.luxuryTier] || market.luxuryTier}
                    </span>
                  </div>
                </label>
              ))}
            </div>
            {errors.market && (
              <p className="mt-1 text-xs text-[var(--color-error)]">
                {errors.market}
              </p>
            )}
          </div>
        )}

        {/* Step 2: Section Selection */}
        {step === 1 && (
          <div className="space-y-4">
            <label className={labelClass}>Report Sections</label>
            <p className="font-[family-name:var(--font-sans)] text-xs text-[var(--color-text-secondary)] -mt-2">
              Required sections cannot be removed. Toggle optional sections as needed.
            </p>
            <div className="space-y-2">
              {REPORT_SECTIONS.map((section) => {
                const isSelected = selectedSections.includes(section.type);
                const isRequired = section.required;
                const needsPeers =
                  section.type === "competitive_market_analysis" &&
                  selectedMarket &&
                  (!selectedMarket.peerMarkets ||
                    selectedMarket.peerMarkets.length === 0);

                return (
                  <label
                    key={section.type}
                    className={`flex items-start gap-3 p-3 rounded-[var(--radius-sm)] border transition-colors duration-[var(--duration-default)] ${
                      isRequired
                        ? "border-[var(--color-accent)] bg-[var(--color-accent-light)] cursor-default"
                        : isSelected
                          ? "border-[var(--color-accent)] bg-[var(--color-accent-light)] cursor-pointer"
                          : "border-[var(--color-border)] cursor-pointer hover:border-[var(--color-border-strong)]"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      disabled={isRequired}
                      onChange={() => toggleSection(section.type)}
                      className="accent-[var(--color-accent)] mt-0.5"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-[family-name:var(--font-sans)] text-sm font-medium text-[var(--color-text)]">
                          {section.label}
                        </span>
                        {isRequired && (
                          <span className="font-[family-name:var(--font-sans)] text-[10px] text-[var(--color-accent)] font-semibold uppercase">
                            Required
                          </span>
                        )}
                      </div>
                      <p className="font-[family-name:var(--font-sans)] text-xs text-[var(--color-text-secondary)] mt-0.5">
                        {section.description}
                      </p>
                      {needsPeers && (
                        <p className="font-[family-name:var(--font-sans)] text-xs text-[var(--color-warning)] mt-1">
                          No peer markets configured — results may be limited
                        </p>
                      )}
                    </div>
                  </label>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 3: Persona Selection */}
        {step === 2 && (
          <div className="space-y-4">
            <label className={labelClass}>Select Buyer Personas</label>
            <p className="font-[family-name:var(--font-sans)] text-xs text-[var(--color-text-secondary)] -mt-2">
              Choose 1-3 buyer archetypes. The first persona sets the report&apos;s primary
              narrative tone.
            </p>

            {personasFetchError && (
              <div className="text-center py-4">
                <p className="font-[family-name:var(--font-sans)] text-sm text-[var(--color-error)] mb-2">
                  Failed to load buyer personas.
                </p>
                <button
                  type="button"
                  onClick={fetchPersonas}
                  className="px-4 py-1.5 font-[family-name:var(--font-sans)] text-sm text-[var(--color-accent)] border border-[var(--color-accent)] rounded-[var(--radius-sm)] hover:bg-[var(--color-accent-light)] transition-colors duration-[var(--duration-default)]"
                >
                  Retry
                </button>
              </div>
            )}

            {!personasFetchError && personasFetched && personas.length === 0 && (
              <p className="font-[family-name:var(--font-sans)] text-sm text-[var(--color-text-secondary)] py-4 text-center">
                No buyer personas available. You can generate a report without persona targeting.
              </p>
            )}

            {!personasFetchError && personas.length > 0 && (
              <div className="grid grid-cols-2 gap-3">
                {personas.map((persona) => {
                  const selectionIndex = selectedPersonaIds.indexOf(persona.id);
                  const isSelected = selectionIndex !== -1;
                  const isMaxed =
                    !isSelected && selectedPersonaIds.length >= 3;

                  return (
                    <PersonaCard
                      key={persona.id}
                      persona={persona}
                      isSelected={isSelected}
                      selectionOrder={isSelected ? selectionIndex + 1 : null}
                      isMaxed={isMaxed}
                      onSelect={handlePersonaSelect}
                      onPreview={handlePersonaPreview}
                    />
                  );
                })}
              </div>
            )}

            {maxPersonaMessage && (
              <p className="font-[family-name:var(--font-sans)] text-xs text-[var(--color-warning)] mt-2">
                {maxPersonaMessage}
              </p>
            )}

            {errors.personas && (
              <p className="mt-1 text-xs text-[var(--color-error)]">
                {errors.personas}
              </p>
            )}

            {previewPersona && (
              <PersonaPreviewPanel
                persona={previewPersona}
                onClose={() => setPreviewPersonaSlug(null)}
              />
            )}
          </div>
        )}

        {/* Step 4: Review */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <label htmlFor="title" className={labelClass}>
                Report Title
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className={inputClass}
                placeholder={defaultTitle}
              />
              <p className="font-[family-name:var(--font-sans)] text-xs text-[var(--color-text-tertiary)] mt-1">
                Leave blank to use the default title.
              </p>
            </div>

            <div className="bg-[var(--color-background)] rounded-[var(--radius-sm)] p-4">
              <h3 className="font-[family-name:var(--font-sans)] text-sm font-semibold text-[var(--color-text)] mb-3">
                Report Summary
              </h3>
              <dl className="space-y-2">
                <div className="flex justify-between">
                  <dt className="font-[family-name:var(--font-sans)] text-xs text-[var(--color-text-secondary)]">
                    Market
                  </dt>
                  <dd className="font-[family-name:var(--font-sans)] text-xs font-medium text-[var(--color-text)]">
                    {selectedMarket?.name}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="font-[family-name:var(--font-sans)] text-xs text-[var(--color-text-secondary)]">
                    Sections
                  </dt>
                  <dd className="font-[family-name:var(--font-sans)] text-xs font-medium text-[var(--color-text)]">
                    {selectedSections.length} of {REPORT_SECTIONS.length}
                  </dd>
                </div>
                {selectedPersonaNames.length > 0 && (
                  <div className="flex justify-between items-start">
                    <dt className="font-[family-name:var(--font-sans)] text-xs text-[var(--color-text-secondary)]">
                      Buyer Personas
                    </dt>
                    <dd className="font-[family-name:var(--font-sans)] text-xs font-medium text-[var(--color-text)] text-right">
                      {selectedPersonaNames.map((name) => (
                        <span key={name} className="block">
                          {name}
                        </span>
                      ))}
                    </dd>
                  </div>
                )}
                <div className="flex justify-between">
                  <dt className="font-[family-name:var(--font-sans)] text-xs text-[var(--color-text-secondary)]">
                    Title
                  </dt>
                  <dd className="font-[family-name:var(--font-sans)] text-xs font-medium text-[var(--color-text)]">
                    {effectiveTitle}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        )}

        {/* Message */}
        {message && (
          <p
            className={`mt-4 font-[family-name:var(--font-sans)] text-sm ${
              message.type === "success"
                ? "text-[var(--color-success)]"
                : "text-[var(--color-error)]"
            }`}
          >
            {message.text}
          </p>
        )}

        {/* Navigation */}
        <div className="flex justify-between mt-8">
          <div>
            {step > 0 && (
              <button
                type="button"
                onClick={handleBack}
                className="px-4 py-2 font-[family-name:var(--font-sans)] text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors duration-[var(--duration-default)]"
              >
                Back
              </button>
            )}
          </div>
          <div>
            {step < STEPS.length - 1 ? (
              <button
                type="button"
                onClick={handleNext}
                className="px-6 py-2 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-[var(--color-primary)] font-[family-name:var(--font-sans)] font-semibold text-sm rounded-[var(--radius-sm)] transition-colors duration-[var(--duration-default)]"
              >
                Next
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={saving}
                className="px-6 py-2 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-[var(--color-primary)] font-[family-name:var(--font-sans)] font-semibold text-sm rounded-[var(--radius-sm)] transition-colors duration-[var(--duration-default)] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? "Creating..." : "Generate Report"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
