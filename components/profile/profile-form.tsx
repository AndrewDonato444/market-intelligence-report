"use client";

import { useState } from "react";
import { BrandPreview } from "./brand-preview";

interface ProfileFormData {
  name: string;
  email: string;
  company: string;
  title: string;
  phone: string;
  bio: string;
  brandColors: {
    primary?: string;
    secondary?: string;
    accent?: string;
  } | null;
}

interface ProfileFormProps {
  initialData: ProfileFormData;
}

export function ProfileForm({ initialData }: ProfileFormProps) {
  const [form, setForm] = useState<ProfileFormData>(initialData);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    // Clear field error on change
    if (fieldErrors[name]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const handleColorChange = (
    colorKey: "primary" | "secondary" | "accent",
    value: string
  ) => {
    setForm((prev) => ({
      ...prev,
      brandColors: {
        ...(prev.brandColors || {}),
        [colorKey]: value,
      },
    }));
    if (fieldErrors.brandColors) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next.brandColors;
        return next;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    setFieldErrors({});

    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          company: form.company,
          title: form.title,
          phone: form.phone,
          bio: form.bio,
          brandColors: form.brandColors,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.errors) {
          setFieldErrors(data.errors);
        }
        setMessage({
          type: "error",
          text: data.error || "Failed to save profile",
        });
        return;
      }

      setMessage({ type: "success", text: "Profile saved successfully" });
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
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Profile Info Card */}
      <div className="bg-[var(--color-surface)] rounded-[var(--radius-md)] shadow-[var(--shadow-sm)] p-6">
        <h2 className="font-[family-name:var(--font-serif)] text-2xl font-bold text-[var(--color-primary)]">
          Your Profile
        </h2>
        <p className="font-[family-name:var(--font-sans)] text-sm text-[var(--color-text-secondary)] mt-1">
          How you appear on reports.
        </p>
        <div className="w-12 h-0.5 bg-[var(--color-accent)] mt-3 mb-6" />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="name" className={labelClass}>
              Name *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={form.name}
              onChange={handleChange}
              className={`${inputClass} ${fieldErrors.name ? "border-[var(--color-error)]" : ""}`}
              required
            />
            {fieldErrors.name && (
              <p className="mt-1 text-xs text-[var(--color-error)]">
                {fieldErrors.name}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="email" className={labelClass}>
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={form.email}
              readOnly
              className={`${inputClass} bg-[var(--color-background)] text-[var(--color-text-secondary)] cursor-not-allowed`}
            />
            <p className="mt-1 text-xs text-[var(--color-text-tertiary)]">
              Managed by your authentication provider
            </p>
          </div>

          <div>
            <label htmlFor="company" className={labelClass}>
              Company
            </label>
            <input
              type="text"
              id="company"
              name="company"
              value={form.company}
              onChange={handleChange}
              className={inputClass}
              placeholder="e.g., Ashford & Associates"
            />
          </div>

          <div>
            <label htmlFor="title" className={labelClass}>
              Title
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={form.title}
              onChange={handleChange}
              className={inputClass}
              placeholder="e.g., Principal Broker"
            />
          </div>

          <div>
            <label htmlFor="phone" className={labelClass}>
              Phone
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              className={`${inputClass} ${fieldErrors.phone ? "border-[var(--color-error)]" : ""}`}
              placeholder="e.g., (239) 555-0147"
            />
            {fieldErrors.phone && (
              <p className="mt-1 text-xs text-[var(--color-error)]">
                {fieldErrors.phone}
              </p>
            )}
          </div>

          <div className="md:col-span-2">
            <label htmlFor="bio" className={labelClass}>
              Bio
            </label>
            <textarea
              id="bio"
              name="bio"
              value={form.bio}
              onChange={handleChange}
              rows={3}
              className={inputClass}
              placeholder="Brief description of your practice and expertise..."
            />
          </div>
        </div>
      </div>

      {/* Report Branding Card */}
      <div className="bg-[var(--color-surface)] rounded-[var(--radius-md)] shadow-[var(--shadow-sm)] p-6">
        <h2 className="font-[family-name:var(--font-serif)] text-xl font-bold text-[var(--color-primary)]">
          Report Branding
        </h2>
        <p className="font-[family-name:var(--font-sans)] text-sm text-[var(--color-text-secondary)] mt-1">
          Colors that appear on your generated reports.
        </p>
        <div className="w-12 h-0.5 bg-[var(--color-accent)] mt-3 mb-6" />

        {fieldErrors.brandColors && (
          <p className="mb-4 text-xs text-[var(--color-error)]">
            {fieldErrors.brandColors}
          </p>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            {(["primary", "secondary", "accent"] as const).map((key) => (
              <div key={key} className="flex items-center gap-3">
                <label className="font-[family-name:var(--font-sans)] text-sm font-medium text-[var(--color-text)] capitalize w-24">
                  {key}
                </label>
                <input
                  type="color"
                  value={form.brandColors?.[key] || "#000000"}
                  onChange={(e) => handleColorChange(key, e.target.value)}
                  className="w-10 h-10 rounded-[var(--radius-sm)] border border-[var(--color-border)] cursor-pointer"
                />
                <input
                  type="text"
                  value={form.brandColors?.[key] || ""}
                  onChange={(e) => handleColorChange(key, e.target.value)}
                  className="w-24 px-2 py-1 rounded-[var(--radius-sm)] border border-[var(--color-border)] font-[family-name:var(--font-mono)] text-xs text-[var(--color-text)]"
                  placeholder="#000000"
                />
              </div>
            ))}
          </div>

          <BrandPreview company={form.company} colors={form.brandColors} />
        </div>
      </div>

      {/* Message + Submit */}
      <div className="flex items-center justify-between">
        <div>
          {message && (
            <p
              className={`font-[family-name:var(--font-sans)] text-sm ${
                message.type === "success"
                  ? "text-[var(--color-success)]"
                  : "text-[var(--color-error)]"
              }`}
            >
              {message.text}
            </p>
          )}
        </div>
        <button
          type="submit"
          disabled={saving}
          className="px-6 py-2 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-[var(--color-primary)] font-[family-name:var(--font-sans)] font-semibold text-sm rounded-[var(--radius-sm)] transition-colors duration-[var(--duration-default)] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? "Saving..." : "Save Profile"}
        </button>
      </div>
    </form>
  );
}
