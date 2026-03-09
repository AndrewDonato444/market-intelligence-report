"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { StepIndicator } from "./step-indicator";
import {
  AVAILABLE_SEGMENTS,
  AVAILABLE_PROPERTY_TYPES,
} from "@/lib/services/market-validation";

const STEPS = ["Geography", "Pricing", "Segments"];

const TIER_OPTIONS = [
  {
    value: "luxury" as const,
    label: "Luxury",
    range: "$1M – $6M",
    defaultFloor: 1000000,
  },
  {
    value: "high_luxury" as const,
    label: "High Luxury",
    range: "$6M – $10M",
    defaultFloor: 6000000,
  },
  {
    value: "ultra_luxury" as const,
    label: "Ultra Luxury",
    range: "$10M+",
    defaultFloor: 10000000,
  },
];

interface FormState {
  name: string;
  city: string;
  state: string;
  county: string;
  region: string;
  luxuryTier: "luxury" | "high_luxury" | "ultra_luxury";
  priceFloor: string;
  priceCeiling: string;
  segments: string[];
  propertyTypes: string[];
}

export function MarketWizard() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const [form, setForm] = useState<FormState>({
    name: "",
    city: "",
    state: "",
    county: "",
    region: "",
    luxuryTier: "luxury",
    priceFloor: "1000000",
    priceCeiling: "",
    segments: [],
    propertyTypes: [],
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const handleTierChange = (tier: FormState["luxuryTier"]) => {
    const tierOption = TIER_OPTIONS.find((t) => t.value === tier);
    setForm((prev) => ({
      ...prev,
      luxuryTier: tier,
      priceFloor: String(tierOption?.defaultFloor || 1000000),
    }));
  };

  const toggleArrayItem = (
    field: "segments" | "propertyTypes",
    item: string
  ) => {
    setForm((prev) => ({
      ...prev,
      [field]: prev[field].includes(item)
        ? prev[field].filter((i) => i !== item)
        : [...prev[field], item],
    }));
  };

  const validateStep = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 0) {
      if (!form.name.trim()) newErrors.name = "Market name is required";
      if (!form.city.trim()) newErrors.city = "City is required";
      if (!form.state.trim()) newErrors.state = "State is required";
    }

    if (step === 1) {
      const floor = Number(form.priceFloor);
      if (isNaN(floor) || floor < 500000) {
        newErrors.priceFloor = "Price floor must be at least $500,000";
      }
      if (form.priceCeiling) {
        const ceiling = Number(form.priceCeiling);
        if (isNaN(ceiling)) {
          newErrors.priceCeiling = "Price ceiling must be a valid number";
        } else if (ceiling <= floor) {
          newErrors.priceCeiling =
            "Price ceiling must be greater than price floor";
        }
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
    if (!validateStep()) return;

    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch("/api/markets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          geography: {
            city: form.city,
            state: form.state,
            county: form.county || undefined,
            region: form.region || undefined,
          },
          luxuryTier: form.luxuryTier,
          priceFloor: Number(form.priceFloor),
          priceCeiling: form.priceCeiling
            ? Number(form.priceCeiling)
            : undefined,
          segments: form.segments.length > 0 ? form.segments : undefined,
          propertyTypes:
            form.propertyTypes.length > 0 ? form.propertyTypes : undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.errors) setErrors(data.errors);
        setMessage({
          type: "error",
          text: data.error || "Failed to create market",
        });
        return;
      }

      router.push("/markets");
    } catch {
      setMessage({
        type: "error",
        text: "Network error. Please try again.",
      });
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    "w-full px-3 py-2 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] font-[family-name:var(--font-sans)] text-sm text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:border-transparent transition-shadow duration-[var(--duration-default)]";

  const labelClass =
    "block font-[family-name:var(--font-sans)] text-sm font-medium text-[var(--color-text)] mb-1";

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-[var(--color-surface)] rounded-[var(--radius-md)] shadow-[var(--shadow-sm)] p-6">
        <h2 className="font-[family-name:var(--font-serif)] text-2xl font-bold text-[var(--color-primary)]">
          Define Your Market
        </h2>
        <p className="font-[family-name:var(--font-sans)] text-sm text-[var(--color-text-secondary)] mt-1">
          The market definition drives every report.
        </p>
        <div className="w-12 h-0.5 bg-[var(--color-accent)] mt-3 mb-6" />

        <StepIndicator steps={STEPS} currentStep={step} />

        {/* Step 1: Geography */}
        {step === 0 && (
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className={labelClass}>
                Market Name *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={form.name}
                onChange={handleChange}
                className={`${inputClass} ${errors.name ? "border-[var(--color-error)]" : ""}`}
                placeholder="e.g., Naples Luxury"
              />
              {errors.name && (
                <p className="mt-1 text-xs text-[var(--color-error)]">
                  {errors.name}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="city" className={labelClass}>
                  City *
                </label>
                <input
                  type="text"
                  id="city"
                  name="city"
                  value={form.city}
                  onChange={handleChange}
                  className={`${inputClass} ${errors.city ? "border-[var(--color-error)]" : ""}`}
                  placeholder="e.g., Naples"
                />
                {errors.city && (
                  <p className="mt-1 text-xs text-[var(--color-error)]">
                    {errors.city}
                  </p>
                )}
              </div>
              <div>
                <label htmlFor="state" className={labelClass}>
                  State *
                </label>
                <input
                  type="text"
                  id="state"
                  name="state"
                  value={form.state}
                  onChange={handleChange}
                  className={`${inputClass} ${errors.state ? "border-[var(--color-error)]" : ""}`}
                  placeholder="e.g., Florida"
                />
                {errors.state && (
                  <p className="mt-1 text-xs text-[var(--color-error)]">
                    {errors.state}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="county" className={labelClass}>
                  County
                </label>
                <input
                  type="text"
                  id="county"
                  name="county"
                  value={form.county}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="e.g., Collier County"
                />
              </div>
              <div>
                <label htmlFor="region" className={labelClass}>
                  Region
                </label>
                <input
                  type="text"
                  id="region"
                  name="region"
                  value={form.region}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="e.g., Southwest Florida"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Pricing & Tier */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <label className={labelClass}>Luxury Tier *</label>
              <div className="space-y-2 mt-2">
                {TIER_OPTIONS.map((tier) => (
                  <label
                    key={tier.value}
                    className={`flex items-center gap-3 p-3 rounded-[var(--radius-sm)] border cursor-pointer transition-colors duration-[var(--duration-default)] ${
                      form.luxuryTier === tier.value
                        ? "border-[var(--color-accent)] bg-[var(--color-accent-light)]"
                        : "border-[var(--color-border)] hover:border-[var(--color-border-strong)]"
                    }`}
                  >
                    <input
                      type="radio"
                      name="luxuryTier"
                      value={tier.value}
                      checked={form.luxuryTier === tier.value}
                      onChange={() => handleTierChange(tier.value)}
                      className="accent-[var(--color-accent)]"
                    />
                    <div>
                      <span className="font-[family-name:var(--font-sans)] text-sm font-medium text-[var(--color-text)]">
                        {tier.label}
                      </span>
                      <span className="font-[family-name:var(--font-sans)] text-xs text-[var(--color-text-secondary)] ml-2">
                        {tier.range}
                      </span>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="priceFloor" className={labelClass}>
                  Price Floor *
                </label>
                <input
                  type="number"
                  id="priceFloor"
                  name="priceFloor"
                  value={form.priceFloor}
                  onChange={handleChange}
                  className={`${inputClass} ${errors.priceFloor ? "border-[var(--color-error)]" : ""}`}
                  min="500000"
                  step="100000"
                />
                {errors.priceFloor && (
                  <p className="mt-1 text-xs text-[var(--color-error)]">
                    {errors.priceFloor}
                  </p>
                )}
              </div>
              <div>
                <label htmlFor="priceCeiling" className={labelClass}>
                  Price Ceiling
                </label>
                <input
                  type="number"
                  id="priceCeiling"
                  name="priceCeiling"
                  value={form.priceCeiling}
                  onChange={handleChange}
                  className={`${inputClass} ${errors.priceCeiling ? "border-[var(--color-error)]" : ""}`}
                  step="100000"
                  placeholder="Optional"
                />
                {errors.priceCeiling && (
                  <p className="mt-1 text-xs text-[var(--color-error)]">
                    {errors.priceCeiling}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Segments & Property Types */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <label className={labelClass}>
                Market Segments (select all that apply)
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
                {AVAILABLE_SEGMENTS.map((segment) => (
                  <label
                    key={segment}
                    className={`flex items-center gap-2 px-3 py-2 rounded-[var(--radius-sm)] border cursor-pointer text-sm transition-colors duration-[var(--duration-default)] ${
                      form.segments.includes(segment)
                        ? "border-[var(--color-accent)] bg-[var(--color-accent-light)] text-[var(--color-text)]"
                        : "border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-border-strong)]"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={form.segments.includes(segment)}
                      onChange={() => toggleArrayItem("segments", segment)}
                      className="accent-[var(--color-accent)]"
                    />
                    <span className="font-[family-name:var(--font-sans)] capitalize">
                      {segment}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className={labelClass}>
                Property Types (select all that apply)
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
                {AVAILABLE_PROPERTY_TYPES.map((type) => (
                  <label
                    key={type}
                    className={`flex items-center gap-2 px-3 py-2 rounded-[var(--radius-sm)] border cursor-pointer text-sm transition-colors duration-[var(--duration-default)] ${
                      form.propertyTypes.includes(type)
                        ? "border-[var(--color-accent)] bg-[var(--color-accent-light)] text-[var(--color-text)]"
                        : "border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-border-strong)]"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={form.propertyTypes.includes(type)}
                      onChange={() => toggleArrayItem("propertyTypes", type)}
                      className="accent-[var(--color-accent)]"
                    />
                    <span className="font-[family-name:var(--font-sans)] capitalize">
                      {type.replace("_", " ")}
                    </span>
                  </label>
                ))}
              </div>
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
                {saving ? "Creating..." : "Create Market"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
