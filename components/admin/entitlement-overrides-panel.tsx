"use client";

import { useEffect, useState, useCallback } from "react";

const ENTITLEMENT_LABELS: Record<string, string> = {
  reports_per_month: "Reports per month",
  markets_created: "Markets",
  social_media_kits: "Social media kits",
  email_campaigns: "Email campaigns",
  personas_per_report: "Personas per report",
};

const ENTITLEMENT_TYPES = Object.keys(ENTITLEMENT_LABELS);

type Override = {
  id: string;
  userId: string;
  entitlementType: string;
  value: number;
  expiresAt: string | null;
  grantedBy: string;
  reason: string | null;
  createdAt: string;
};

type TierInfo = {
  tierName: string;
  entitlements: Record<string, number>;
};

function formatValue(value: number): string {
  if (value === -1) return "Unlimited";
  if (value === 0) return "Not included";
  return String(value);
}

function isExpired(expiresAt: string | null): boolean {
  if (!expiresAt) return false;
  return new Date(expiresAt) <= new Date();
}

function formatDate(iso: string | null): string {
  if (!iso) return "Permanent";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function EntitlementOverridesPanel({
  userId,
  userName,
}: {
  userId: string;
  userName: string;
}) {
  const [overrides, setOverrides] = useState<Override[]>([]);
  const [tier, setTier] = useState<TierInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [revokeId, setRevokeId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Form state
  const [formType, setFormType] = useState(ENTITLEMENT_TYPES[0]);
  const [formValue, setFormValue] = useState<number>(10);
  const [formUnlimited, setFormUnlimited] = useState(false);
  const [formPermanent, setFormPermanent] = useState(false);
  const [formExpiry, setFormExpiry] = useState("");
  const [formReason, setFormReason] = useState("");
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const fetchOverrides = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/users/${userId}/overrides`);
      if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`);
      const json = await res.json();
      setOverrides(json.overrides);
      setTier(json.tier || null);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchOverrides();
  }, [fetchOverrides]);

  const handleGrant = async () => {
    const errors: Record<string, string> = {};
    if (!formType) errors.type = "Select an entitlement type";
    const actualValue = formUnlimited ? -1 : formValue;
    if (!formUnlimited && (formValue < 1 || isNaN(formValue))) {
      errors.value = "Value must be at least 1, or use Unlimited";
    }
    if (!formPermanent && !formExpiry) {
      errors.expiry = "Set an expiry date or choose Permanent";
    }
    if (!formPermanent && formExpiry && new Date(formExpiry) <= new Date()) {
      errors.expiry = "Expiry must be a future date";
    }
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    setFormErrors({});
    setActionLoading(true);
    setActionMessage(null);
    try {
      const res = await fetch(`/api/admin/users/${userId}/overrides`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entitlementType: formType,
          value: actualValue,
          expiresAt: formPermanent ? null : new Date(formExpiry).toISOString(),
          reason: formReason || null,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create override");
      }
      setActionMessage({
        type: "success",
        text: `Override granted — ${ENTITLEMENT_LABELS[formType]} set to ${formatValue(actualValue)} for ${userName}`,
      });
      setShowForm(false);
      resetForm();
      await fetchOverrides();
    } catch (err) {
      setActionMessage({ type: "error", text: (err as Error).message });
    } finally {
      setActionLoading(false);
    }
  };

  const handleRevoke = async (overrideId: string) => {
    setActionLoading(true);
    setActionMessage(null);
    try {
      const res = await fetch(
        `/api/admin/users/${userId}/overrides/${overrideId}`,
        { method: "DELETE" }
      );
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to revoke override");
      }
      setActionMessage({ type: "success", text: "Override revoked" });
      setRevokeId(null);
      await fetchOverrides();
    } catch (err) {
      setActionMessage({ type: "error", text: (err as Error).message });
    } finally {
      setActionLoading(false);
    }
  };

  const resetForm = () => {
    setFormType(ENTITLEMENT_TYPES[0]);
    setFormValue(10);
    setFormUnlimited(false);
    setFormPermanent(false);
    setFormExpiry("");
    setFormReason("");
    setFormErrors({});
  };

  // Compute effective entitlements
  const effectiveEntitlements = tier
    ? ENTITLEMENT_TYPES.reduce(
        (acc, type) => {
          const tierCap = tier.entitlements[type] ?? 0;
          const activeOverridesForType = overrides.filter(
            (o) => o.entitlementType === type && !isExpired(o.expiresAt)
          );
          let overrideCap = 0;
          for (const o of activeOverridesForType) {
            if (o.value === -1) {
              overrideCap = -1;
              break;
            }
            if (o.value > overrideCap) overrideCap = o.value;
          }
          let effective: number;
          if (tierCap === -1 || overrideCap === -1) {
            effective = -1;
          } else {
            effective = Math.max(tierCap, overrideCap);
          }
          acc[type] = {
            tierCap,
            effective,
            hasOverride: overrideCap > 0 || overrideCap === -1,
          };
          return acc;
        },
        {} as Record<
          string,
          { tierCap: number; effective: number; hasOverride: boolean }
        >
      )
    : null;

  if (loading) {
    return (
      <div
        style={{
          padding: "var(--spacing-4)",
          color: "var(--color-app-text-secondary)",
          fontSize: "var(--text-sm)",
        }}
      >
        Loading overrides...
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          padding: "var(--spacing-4)",
          color: "var(--color-error)",
          fontSize: "var(--text-sm)",
        }}
      >
        Failed to load overrides: {error}
      </div>
    );
  }

  return (
    <div className="app-fade-in" style={{ fontFamily: "var(--font-body)" }}>
      {/* Action Message */}
      {actionMessage && (
        <div
          style={{
            marginBottom: "var(--spacing-4)",
            padding: "var(--spacing-2) var(--spacing-3)",
            borderRadius: "var(--radius-sm)",
            fontSize: "var(--text-sm)",
            color:
              actionMessage.type === "success"
                ? "var(--color-success)"
                : "var(--color-error)",
            background:
              actionMessage.type === "success"
                ? "var(--color-success-light, rgba(34,197,94,0.1))"
                : "var(--color-error-light, rgba(239,68,68,0.1))",
          }}
        >
          {actionMessage.text}
        </div>
      )}

      {/* Effective Entitlements Summary */}
      {effectiveEntitlements && tier && (
        <div
          style={{
            background: "var(--color-app-surface)",
            border: "1px solid var(--color-app-border)",
            borderRadius: "var(--radius-md)",
            padding: "var(--spacing-4)",
            marginBottom: "var(--spacing-4)",
          }}
        >
          <h3
            style={{
              fontSize: "var(--text-sm)",
              fontWeight: "var(--font-semibold)",
              color: "var(--color-app-text)",
              margin: "0 0 var(--spacing-1)",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            Effective Entitlements
          </h3>
          <p
            style={{
              fontSize: "var(--text-sm)",
              color: "var(--color-app-text-secondary)",
              margin: "0 0 var(--spacing-3)",
            }}
          >
            Tier: <strong>{tier.tierName}</strong>
          </p>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
              gap: "var(--spacing-3)",
            }}
          >
            {ENTITLEMENT_TYPES.map((type) => {
              const ent = effectiveEntitlements[type];
              return (
                <div
                  key={type}
                  style={{
                    padding: "var(--spacing-3)",
                    background: "var(--color-app-bg)",
                    borderRadius: "var(--radius-sm)",
                    textAlign: "center",
                  }}
                >
                  <div
                    style={{
                      fontSize: "var(--text-xs)",
                      color: "var(--color-app-text-secondary)",
                      marginBottom: "var(--spacing-1)",
                    }}
                  >
                    {ENTITLEMENT_LABELS[type]}
                  </div>
                  <div
                    style={{
                      fontSize: "var(--text-lg)",
                      fontWeight: "var(--font-semibold)",
                      color: ent.hasOverride
                        ? "var(--color-app-accent)"
                        : "var(--color-app-text)",
                    }}
                  >
                    {ent.hasOverride && ent.tierCap !== ent.effective
                      ? `${formatValue(ent.tierCap)} → ${formatValue(ent.effective)}`
                      : formatValue(ent.effective)}
                  </div>
                  <div
                    style={{
                      fontSize: "var(--text-xs)",
                      color: "var(--color-app-text-tertiary)",
                      marginTop: "2px",
                    }}
                  >
                    {ent.hasOverride ? "↑ Override" : "Tier default"}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Overrides Section */}
      <div
        style={{
          background: "var(--color-app-surface)",
          border: "1px solid var(--color-app-border)",
          borderRadius: "var(--radius-md)",
          padding: "var(--spacing-4)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "var(--spacing-4)",
          }}
        >
          <h3
            style={{
              fontSize: "var(--text-sm)",
              fontWeight: "var(--font-semibold)",
              color: "var(--color-app-text)",
              margin: 0,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            Overrides
          </h3>
          <button
            onClick={() => {
              resetForm();
              setShowForm(true);
            }}
            style={{
              padding: "var(--spacing-1) var(--spacing-3)",
              borderRadius: "var(--radius-sm)",
              border: "none",
              background: "var(--color-app-accent)",
              color: "#fff",
              fontSize: "var(--text-sm)",
              fontWeight: "var(--font-medium)",
              cursor: "pointer",
            }}
          >
            Grant Override
          </button>
        </div>

        {/* Grant Form */}
        {showForm && (
          <div
            style={{
              background: "var(--color-app-bg)",
              border: "1px solid var(--color-app-border)",
              borderRadius: "var(--radius-md)",
              padding: "var(--spacing-4)",
              marginBottom: "var(--spacing-4)",
            }}
          >
            <h4
              style={{
                fontSize: "var(--text-lg)",
                fontWeight: "var(--font-semibold)",
                color: "var(--color-app-text)",
                margin: "0 0 var(--spacing-1)",
              }}
            >
              Grant Entitlement Override
            </h4>
            <p
              style={{
                fontSize: "var(--text-sm)",
                color: "var(--color-app-text-secondary)",
                margin: "0 0 var(--spacing-4)",
              }}
            >
              For: {userName}
            </p>

            {/* Entitlement Type */}
            <div style={{ marginBottom: "var(--spacing-3)" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "var(--text-sm)",
                  fontWeight: "var(--font-medium)",
                  color: "var(--color-app-text)",
                  marginBottom: "var(--spacing-1)",
                }}
              >
                Entitlement Type
              </label>
              <select
                value={formType}
                onChange={(e) => setFormType(e.target.value)}
                style={{
                  width: "100%",
                  padding: "var(--spacing-2)",
                  border: "1px solid var(--color-app-border, var(--color-app-border))",
                  borderRadius: "var(--radius-sm)",
                  fontSize: "var(--text-sm)",
                  background: "var(--color-app-surface)",
                  color: "var(--color-app-text)",
                }}
              >
                {ENTITLEMENT_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {ENTITLEMENT_LABELS[type]}
                  </option>
                ))}
              </select>
              {formErrors.type && (
                <p
                  style={{
                    color: "var(--color-error)",
                    fontSize: "var(--text-xs)",
                    margin: "var(--spacing-1) 0 0",
                  }}
                >
                  {formErrors.type}
                </p>
              )}
            </div>

            {/* Value */}
            <div style={{ marginBottom: "var(--spacing-3)" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "var(--text-sm)",
                  fontWeight: "var(--font-medium)",
                  color: "var(--color-app-text)",
                  marginBottom: "var(--spacing-1)",
                }}
              >
                Value
              </label>
              <input
                type="number"
                min={1}
                value={formUnlimited ? "" : formValue}
                disabled={formUnlimited}
                onChange={(e) => setFormValue(parseInt(e.target.value, 10))}
                style={{
                  width: "100%",
                  padding: "var(--spacing-2)",
                  border: "1px solid var(--color-app-border, var(--color-app-border))",
                  borderRadius: "var(--radius-sm)",
                  fontSize: "var(--text-sm)",
                  background: "var(--color-app-surface)",
                  color: "var(--color-app-text)",
                  opacity: formUnlimited ? 0.5 : 1,
                }}
              />
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "var(--spacing-1)",
                  fontSize: "var(--text-sm)",
                  color: "var(--color-app-text-secondary)",
                  marginTop: "var(--spacing-1)",
                }}
              >
                <input
                  type="checkbox"
                  checked={formUnlimited}
                  onChange={(e) => setFormUnlimited(e.target.checked)}
                />
                Unlimited
              </label>
              {formErrors.value && (
                <p
                  style={{
                    color: "var(--color-error)",
                    fontSize: "var(--text-xs)",
                    margin: "var(--spacing-1) 0 0",
                  }}
                >
                  {formErrors.value}
                </p>
              )}
            </div>

            {/* Expiry */}
            <div style={{ marginBottom: "var(--spacing-3)" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "var(--text-sm)",
                  fontWeight: "var(--font-medium)",
                  color: "var(--color-app-text)",
                  marginBottom: "var(--spacing-1)",
                }}
              >
                Expiry
              </label>
              <div
                style={{
                  display: "flex",
                  gap: "var(--spacing-3)",
                  alignItems: "center",
                  marginBottom: "var(--spacing-1)",
                }}
              >
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    fontSize: "var(--text-sm)",
                    color: "var(--color-app-text-secondary)",
                  }}
                >
                  <input
                    type="radio"
                    name="expiry"
                    checked={formPermanent}
                    onChange={() => setFormPermanent(true)}
                  />
                  Permanent
                </label>
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    fontSize: "var(--text-sm)",
                    color: "var(--color-app-text-secondary)",
                  }}
                >
                  <input
                    type="radio"
                    name="expiry"
                    checked={!formPermanent}
                    onChange={() => setFormPermanent(false)}
                  />
                  Expires on:
                </label>
              </div>
              {!formPermanent && (
                <input
                  type="date"
                  value={formExpiry}
                  onChange={(e) => setFormExpiry(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "var(--spacing-2)",
                    border: "1px solid var(--color-app-border, var(--color-app-border))",
                    borderRadius: "var(--radius-sm)",
                    fontSize: "var(--text-sm)",
                    background: "var(--color-app-surface)",
                    color: "var(--color-app-text)",
                  }}
                />
              )}
              {formErrors.expiry && (
                <p
                  style={{
                    color: "var(--color-error)",
                    fontSize: "var(--text-xs)",
                    margin: "var(--spacing-1) 0 0",
                  }}
                >
                  {formErrors.expiry}
                </p>
              )}
            </div>

            {/* Reason */}
            <div style={{ marginBottom: "var(--spacing-4)" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "var(--text-sm)",
                  fontWeight: "var(--font-medium)",
                  color: "var(--color-app-text)",
                  marginBottom: "var(--spacing-1)",
                }}
              >
                Reason
              </label>
              <textarea
                value={formReason}
                onChange={(e) => setFormReason(e.target.value)}
                placeholder="Why is this override being granted? (e.g., Beta tester comp, Partner agreement, Support escalation)"
                rows={2}
                style={{
                  width: "100%",
                  padding: "var(--spacing-2)",
                  border: "1px solid var(--color-app-border, var(--color-app-border))",
                  borderRadius: "var(--radius-sm)",
                  fontSize: "var(--text-sm)",
                  background: "var(--color-app-surface)",
                  color: "var(--color-app-text)",
                  resize: "vertical",
                }}
              />
            </div>

            {/* Actions */}
            <div style={{ display: "flex", gap: "var(--spacing-2)" }}>
              <button
                onClick={() => {
                  setShowForm(false);
                  resetForm();
                }}
                disabled={actionLoading}
                style={{
                  padding: "var(--spacing-1) var(--spacing-3)",
                  borderRadius: "var(--radius-sm)",
                  border: "1px solid var(--color-app-border)",
                  background: "var(--color-app-surface)",
                  color: "var(--color-app-text-secondary)",
                  fontSize: "var(--text-sm)",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleGrant}
                disabled={actionLoading}
                style={{
                  padding: "var(--spacing-1) var(--spacing-3)",
                  borderRadius: "var(--radius-sm)",
                  border: "none",
                  background: "var(--color-app-accent)",
                  color: "#fff",
                  fontSize: "var(--text-sm)",
                  fontWeight: "var(--font-medium)",
                  cursor: actionLoading ? "not-allowed" : "pointer",
                  opacity: actionLoading ? 0.6 : 1,
                }}
              >
                {actionLoading ? "Granting..." : "Grant Override"}
              </button>
            </div>
          </div>
        )}

        {/* Override Cards */}
        {overrides.length === 0 ? (
          <p
            style={{
              fontSize: "var(--text-sm)",
              color: "var(--color-app-text-tertiary)",
              margin: 0,
            }}
          >
            No overrides granted for this user
          </p>
        ) : (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "var(--spacing-3)",
            }}
          >
            {overrides.map((override) => {
              const expired = isExpired(override.expiresAt);
              return (
                <div
                  key={override.id}
                  style={{
                    border: "1px solid var(--color-app-border)",
                    borderRadius: "var(--radius-sm)",
                    padding: "var(--spacing-3)",
                    background: "var(--color-app-surface)",
                    opacity: expired ? 0.6 : 1,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                    }}
                  >
                    <div>
                      <span
                        style={{
                          fontWeight: "var(--font-semibold)",
                          color: "var(--color-app-text)",
                          fontSize: "var(--text-sm)",
                        }}
                      >
                        {ENTITLEMENT_LABELS[override.entitlementType] ||
                          override.entitlementType}
                        : {formatValue(override.value)}
                      </span>
                      <span
                        style={{
                          marginLeft: "var(--spacing-3)",
                          fontSize: "var(--text-sm)",
                          color: "var(--color-app-text-secondary)",
                        }}
                      >
                        {expired ? (
                          <span
                            style={{
                              display: "inline-block",
                              padding: "1px var(--spacing-1)",
                              borderRadius: "var(--radius-sm)",
                              background:
                                "var(--color-error-light, rgba(239,68,68,0.1))",
                              color: "var(--color-error)",
                              fontSize: "var(--text-xs)",
                              fontWeight: "var(--font-medium)",
                            }}
                          >
                            Expired
                          </span>
                        ) : override.expiresAt ? (
                          `Expires ${formatDate(override.expiresAt)}`
                        ) : (
                          "Permanent"
                        )}
                      </span>
                    </div>
                    {!expired && (
                      <>
                        {revokeId === override.id ? (
                          <div
                            style={{
                              display: "flex",
                              gap: "var(--spacing-1)",
                            }}
                          >
                            <button
                              onClick={() => setRevokeId(null)}
                              disabled={actionLoading}
                              style={{
                                padding: "2px var(--spacing-2)",
                                borderRadius: "var(--radius-sm)",
                                border: "1px solid var(--color-app-border)",
                                background: "var(--color-app-surface)",
                                color: "var(--color-app-text-secondary)",
                                fontSize: "var(--text-xs)",
                                cursor: "pointer",
                              }}
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => handleRevoke(override.id)}
                              disabled={actionLoading}
                              style={{
                                padding: "2px var(--spacing-2)",
                                borderRadius: "var(--radius-sm)",
                                border: "1px solid var(--color-error)",
                                background: "var(--color-error)",
                                color: "#fff",
                                fontSize: "var(--text-xs)",
                                fontWeight: "var(--font-medium)",
                                cursor: actionLoading
                                  ? "not-allowed"
                                  : "pointer",
                                opacity: actionLoading ? 0.6 : 1,
                              }}
                            >
                              Confirm
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setRevokeId(override.id)}
                            style={{
                              padding: "2px var(--spacing-2)",
                              borderRadius: "var(--radius-sm)",
                              border: "1px solid var(--color-error)",
                              background: "transparent",
                              color: "var(--color-error)",
                              fontSize: "var(--text-xs)",
                              cursor: "pointer",
                            }}
                          >
                            Revoke
                          </button>
                        )}
                      </>
                    )}
                  </div>
                  {override.reason && (
                    <p
                      style={{
                        fontSize: "var(--text-sm)",
                        color: "var(--color-app-text-secondary)",
                        fontStyle: "italic",
                        margin: "var(--spacing-2) 0 0",
                      }}
                    >
                      &quot;{override.reason}&quot;
                    </p>
                  )}
                  <p
                    style={{
                      fontSize: "var(--text-xs)",
                      color: "var(--color-app-text-tertiary)",
                      margin: "var(--spacing-1) 0 0",
                    }}
                  >
                    Granted by {override.grantedBy} on{" "}
                    {formatDateTime(override.createdAt)}
                    {expired &&
                      override.expiresAt &&
                      ` · Expired ${formatDate(override.expiresAt)}`}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
