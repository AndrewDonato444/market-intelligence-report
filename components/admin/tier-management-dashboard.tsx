"use client";

import { useEffect, useState, useCallback } from "react";

type TierEntitlements = {
  reports_per_month: number;
  markets_created: number;
  social_media_kits: number;
  personas_per_report: number;
};

type Tier = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  entitlements: TierEntitlements;
  displayPrice: string;
  monthlyPriceInCents: number | null;
  isActive: boolean;
  sortOrder: number;
};

type TierFormData = {
  name: string;
  slug: string;
  description: string;
  displayPrice: string;
  monthlyPriceInCents: string;
  entitlements: TierEntitlements;
  sortOrder: string;
  isActive: boolean;
};

const emptyForm: TierFormData = {
  name: "",
  slug: "",
  description: "",
  displayPrice: "",
  monthlyPriceInCents: "",
  entitlements: {
    reports_per_month: 2,
    markets_created: 1,
    social_media_kits: 0,
    personas_per_report: 1,
  },
  sortOrder: "",
  isActive: true,
};

function formatEntitlement(val: number, label: string): string {
  if (val === -1) return `Unlimited ${label}`;
  if (val === 0 && label === "kits") return "No kits";
  return `${val} ${label}`;
}

function entitlementSummary(e: TierEntitlements): string {
  return [
    formatEntitlement(e.reports_per_month, "reports/mo"),
    formatEntitlement(e.markets_created, e.markets_created === 1 ? "market" : "markets"),
    formatEntitlement(e.social_media_kits, e.social_media_kits === 1 ? "kit/rpt" : "kits"),
    `${e.personas_per_report} ${e.personas_per_report === 1 ? "persona" : "personas"}`,
  ].join(" · ");
}

export function TierManagementDashboard() {
  const [tiers, setTiers] = useState<Tier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<TierFormData>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchTiers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/tiers");
      if (!res.ok) throw new Error(`Failed to load tiers: ${res.status}`);
      const json = await res.json();
      setTiers(json.tiers);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTiers();
  }, [fetchTiers]);

  const slugify = (name: string) =>
    name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  const openAddForm = () => {
    setEditingId(null);
    setForm({ ...emptyForm, sortOrder: String(tiers.length + 1) });
    setFormError(null);
    setShowForm(true);
  };

  const openEditForm = (tier: Tier) => {
    setEditingId(tier.id);
    setForm({
      name: tier.name,
      slug: tier.slug,
      description: tier.description || "",
      displayPrice: tier.displayPrice,
      monthlyPriceInCents: tier.monthlyPriceInCents?.toString() || "",
      entitlements: { ...tier.entitlements },
      sortOrder: String(tier.sortOrder),
      isActive: tier.isActive,
    });
    setFormError(null);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormError(null);
  };

  const handleSave = async () => {
    if (!form.name || !form.slug || !form.displayPrice) {
      setFormError("Name, slug, and display price are required.");
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      const payload = {
        name: form.name,
        slug: form.slug,
        description: form.description || null,
        displayPrice: form.displayPrice,
        monthlyPriceInCents: form.monthlyPriceInCents ? parseInt(form.monthlyPriceInCents, 10) : null,
        entitlements: form.entitlements,
        sortOrder: parseInt(form.sortOrder, 10) || 0,
        isActive: form.isActive,
      };

      const url = editingId ? `/api/admin/tiers/${editingId}` : "/api/admin/tiers";
      const method = editingId ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save tier");
      }

      closeForm();
      fetchTiers();
    } catch (err) {
      setFormError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (tier: Tier) => {
    if (!confirm(`Delete tier "${tier.name}"? This cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/admin/tiers/${tier.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete tier");
      fetchTiers();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleToggleActive = async (tier: Tier) => {
    try {
      const res = await fetch(`/api/admin/tiers/${tier.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !tier.isActive }),
      });
      if (!res.ok) throw new Error("Failed to update tier");
      fetchTiers();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleReorder = async (tier: Tier, direction: "up" | "down") => {
    const idx = tiers.findIndex((t) => t.id === tier.id);
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= tiers.length) return;

    const swapTier = tiers[swapIdx];
    try {
      await Promise.all([
        fetch(`/api/admin/tiers/${tier.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sortOrder: swapTier.sortOrder }),
        }),
        fetch(`/api/admin/tiers/${swapTier.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sortOrder: tier.sortOrder }),
        }),
      ]);
      fetchTiers();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <div className="p-[var(--spacing-6)]">
      <div className="flex items-center justify-between mb-[var(--spacing-6)]">
        <h1 className="font-[family-name:var(--font-sans)] text-2xl font-bold text-[var(--color-text)]">
          Subscription Tiers
        </h1>
        <button
          onClick={openAddForm}
          className="px-[var(--spacing-4)] py-[var(--spacing-2)] bg-[var(--color-primary)] text-white rounded-[var(--radius-md)] font-[family-name:var(--font-sans)] text-sm font-medium hover:opacity-90 transition-opacity"
        >
          Add Tier
        </button>
      </div>

      {loading && (
        <p className="font-[family-name:var(--font-sans)] text-sm text-[var(--color-text-secondary)]">
          Loading tiers...
        </p>
      )}

      {error && !loading && (
        <p className="font-[family-name:var(--font-sans)] text-sm text-[var(--color-error)]">
          Failed to load tiers: {error}
        </p>
      )}

      {!loading && !error && (
        <div className="space-y-[var(--spacing-3)]">
          {tiers.map((tier, idx) => (
            <div
              key={tier.id}
              className="border border-[var(--color-border)] rounded-[var(--radius-md)] p-[var(--spacing-4)] bg-[var(--color-surface)]"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-[var(--spacing-3)]">
                    <span className="font-[family-name:var(--font-sans)] text-xs text-[var(--color-text-tertiary)]">
                      #{tier.sortOrder}
                    </span>
                    <span className="font-[family-name:var(--font-sans)] text-base font-semibold text-[var(--color-text)]">
                      {tier.name}
                    </span>
                    <span className="font-[family-name:var(--font-sans)] text-sm text-[var(--color-text-secondary)]">
                      {tier.displayPrice}
                    </span>
                    <span
                      className={`font-[family-name:var(--font-sans)] text-xs font-medium px-[var(--spacing-2)] py-0.5 rounded-[var(--radius-sm)] ${
                        tier.isActive
                          ? "text-[var(--color-success)] bg-[rgba(34,197,94,0.1)]"
                          : "text-[var(--color-text-tertiary)] bg-[rgba(148,163,184,0.1)]"
                      }`}
                      onClick={() => handleToggleActive(tier)}
                      role="button"
                      tabIndex={0}
                    >
                      {tier.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <p className="font-[family-name:var(--font-sans)] text-sm text-[var(--color-text-secondary)] mt-[var(--spacing-1)]">
                    {entitlementSummary(tier.entitlements)}
                  </p>
                </div>
                <div className="flex items-center gap-[var(--spacing-2)]">
                  <button
                    onClick={() => openEditForm(tier)}
                    className="font-[family-name:var(--font-sans)] text-xs text-[var(--color-primary)] hover:underline"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleReorder(tier, "up")}
                    disabled={idx === 0}
                    aria-label="Move up"
                    className="font-[family-name:var(--font-sans)] text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-text)] disabled:opacity-30"
                  >
                    ▲
                  </button>
                  <button
                    onClick={() => handleReorder(tier, "down")}
                    disabled={idx === tiers.length - 1}
                    aria-label="Move down"
                    className="font-[family-name:var(--font-sans)] text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-text)] disabled:opacity-30"
                  >
                    ▼
                  </button>
                  <button
                    onClick={() => handleDelete(tier)}
                    className="font-[family-name:var(--font-sans)] text-xs text-[var(--color-error)] hover:underline"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[var(--color-surface)] rounded-[var(--radius-lg)] p-[var(--spacing-6)] w-full max-w-lg shadow-[var(--shadow-lg)]">
            <div className="flex items-center justify-between mb-[var(--spacing-4)]">
              <h2 className="font-[family-name:var(--font-sans)] text-lg font-semibold text-[var(--color-text)]">
                {editingId ? "Edit Tier" : "Add New Tier"}
              </h2>
              <button
                onClick={closeForm}
                className="text-[var(--color-text-secondary)] hover:text-[var(--color-text)]"
              >
                ✕
              </button>
            </div>

            {formError && (
              <p className="font-[family-name:var(--font-sans)] text-sm text-[var(--color-error)] mb-[var(--spacing-3)]">
                {formError}
              </p>
            )}

            <div className="space-y-[var(--spacing-3)]">
              <div>
                <label htmlFor="tier-name" className="font-[family-name:var(--font-sans)] text-sm font-medium text-[var(--color-text)] block mb-1">
                  Name
                </label>
                <input
                  id="tier-name"
                  type="text"
                  value={form.name}
                  onChange={(e) => {
                    const name = e.target.value;
                    setForm((f) => ({
                      ...f,
                      name,
                      slug: editingId ? f.slug : slugify(name),
                    }));
                  }}
                  className="w-full border border-[var(--color-border)] rounded-[var(--radius-sm)] px-[var(--spacing-3)] py-[var(--spacing-2)] font-[family-name:var(--font-sans)] text-sm"
                />
              </div>

              <div>
                <label htmlFor="tier-slug" className="font-[family-name:var(--font-sans)] text-sm font-medium text-[var(--color-text)] block mb-1">
                  Slug
                </label>
                <input
                  id="tier-slug"
                  type="text"
                  value={form.slug}
                  onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                  className="w-full border border-[var(--color-border)] rounded-[var(--radius-sm)] px-[var(--spacing-3)] py-[var(--spacing-2)] font-[family-name:var(--font-sans)] text-sm"
                />
              </div>

              <div>
                <label htmlFor="tier-description" className="font-[family-name:var(--font-sans)] text-sm font-medium text-[var(--color-text)] block mb-1">
                  Description
                </label>
                <textarea
                  id="tier-description"
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  rows={2}
                  className="w-full border border-[var(--color-border)] rounded-[var(--radius-sm)] px-[var(--spacing-3)] py-[var(--spacing-2)] font-[family-name:var(--font-sans)] text-sm"
                />
              </div>

              <div>
                <label htmlFor="tier-price" className="font-[family-name:var(--font-sans)] text-sm font-medium text-[var(--color-text)] block mb-1">
                  Display Price
                </label>
                <input
                  id="tier-price"
                  type="text"
                  value={form.displayPrice}
                  onChange={(e) => setForm((f) => ({ ...f, displayPrice: e.target.value }))}
                  placeholder="e.g. $199/mo"
                  className="w-full border border-[var(--color-border)] rounded-[var(--radius-sm)] px-[var(--spacing-3)] py-[var(--spacing-2)] font-[family-name:var(--font-sans)] text-sm"
                />
              </div>

              <fieldset className="border border-[var(--color-border)] rounded-[var(--radius-sm)] p-[var(--spacing-3)]">
                <legend className="font-[family-name:var(--font-sans)] text-sm font-medium text-[var(--color-text)] px-1">
                  Entitlements
                </legend>
                <div className="grid grid-cols-2 gap-[var(--spacing-2)]">
                  <div>
                    <label htmlFor="ent-reports" className="font-[family-name:var(--font-sans)] text-xs text-[var(--color-text-secondary)] block">
                      Reports/month
                    </label>
                    <input
                      id="ent-reports"
                      type="number"
                      value={form.entitlements.reports_per_month}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          entitlements: { ...f.entitlements, reports_per_month: parseInt(e.target.value, 10) || 0 },
                        }))
                      }
                      className="w-full border border-[var(--color-border)] rounded-[var(--radius-sm)] px-[var(--spacing-2)] py-1 font-[family-name:var(--font-sans)] text-sm"
                    />
                  </div>
                  <div>
                    <label htmlFor="ent-markets" className="font-[family-name:var(--font-sans)] text-xs text-[var(--color-text-secondary)] block">
                      Markets
                    </label>
                    <input
                      id="ent-markets"
                      type="number"
                      value={form.entitlements.markets_created}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          entitlements: { ...f.entitlements, markets_created: parseInt(e.target.value, 10) || 0 },
                        }))
                      }
                      className="w-full border border-[var(--color-border)] rounded-[var(--radius-sm)] px-[var(--spacing-2)] py-1 font-[family-name:var(--font-sans)] text-sm"
                    />
                  </div>
                  <div>
                    <label htmlFor="ent-kits" className="font-[family-name:var(--font-sans)] text-xs text-[var(--color-text-secondary)] block">
                      Social media kits
                    </label>
                    <input
                      id="ent-kits"
                      type="number"
                      value={form.entitlements.social_media_kits}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          entitlements: { ...f.entitlements, social_media_kits: parseInt(e.target.value, 10) || 0 },
                        }))
                      }
                      className="w-full border border-[var(--color-border)] rounded-[var(--radius-sm)] px-[var(--spacing-2)] py-1 font-[family-name:var(--font-sans)] text-sm"
                    />
                  </div>
                  <div>
                    <label htmlFor="ent-personas" className="font-[family-name:var(--font-sans)] text-xs text-[var(--color-text-secondary)] block">
                      Personas/report
                    </label>
                    <input
                      id="ent-personas"
                      type="number"
                      value={form.entitlements.personas_per_report}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          entitlements: { ...f.entitlements, personas_per_report: parseInt(e.target.value, 10) || 0 },
                        }))
                      }
                      className="w-full border border-[var(--color-border)] rounded-[var(--radius-sm)] px-[var(--spacing-2)] py-1 font-[family-name:var(--font-sans)] text-sm"
                    />
                  </div>
                </div>
                <p className="font-[family-name:var(--font-sans)] text-xs text-[var(--color-text-tertiary)] mt-[var(--spacing-2)]">
                  Use -1 for unlimited, 0 for not included
                </p>
              </fieldset>

              <div className="flex gap-[var(--spacing-3)]">
                <div className="flex-1">
                  <label htmlFor="tier-sort" className="font-[family-name:var(--font-sans)] text-sm font-medium text-[var(--color-text)] block mb-1">
                    Sort Order
                  </label>
                  <input
                    id="tier-sort"
                    type="number"
                    value={form.sortOrder}
                    onChange={(e) => setForm((f) => ({ ...f, sortOrder: e.target.value }))}
                    className="w-full border border-[var(--color-border)] rounded-[var(--radius-sm)] px-[var(--spacing-3)] py-[var(--spacing-2)] font-[family-name:var(--font-sans)] text-sm"
                  />
                </div>
                <div className="flex items-end pb-[var(--spacing-2)]">
                  <label className="flex items-center gap-[var(--spacing-2)] font-[family-name:var(--font-sans)] text-sm text-[var(--color-text)]">
                    <input
                      type="checkbox"
                      checked={form.isActive}
                      onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                    />
                    Active
                  </label>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-[var(--spacing-3)] mt-[var(--spacing-4)]">
              <button
                onClick={closeForm}
                className="px-[var(--spacing-4)] py-[var(--spacing-2)] font-[family-name:var(--font-sans)] text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text)]"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-[var(--spacing-4)] py-[var(--spacing-2)] bg-[var(--color-primary)] text-white rounded-[var(--radius-md)] font-[family-name:var(--font-sans)] text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save Tier"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
