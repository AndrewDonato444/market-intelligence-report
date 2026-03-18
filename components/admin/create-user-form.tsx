"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

type Tier = {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
};

export function CreateUserForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tiers, setTiers] = useState<Tier[]>([]);
  const [tiersLoading, setTiersLoading] = useState(true);

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    company: "",
    phone: "",
    title: "",
    role: "user",
    tierId: "",
    sendInvite: true,
  });

  // Fetch tiers on mount
  useEffect(() => {
    fetch("/api/admin/tiers")
      .then((res) => res.json())
      .then((data) => {
        const activeTiers = (data.tiers || []).filter((t: Tier) => t.isActive);
        setTiers(activeTiers);
        if (activeTiers.length > 0) {
          setForm((f) => ({ ...f, tierId: activeTiers[0].id }));
        }
      })
      .catch(() => setTiers([]))
      .finally(() => setTiersLoading(false));
  }, []);

  const updateField = (field: string, value: string | boolean) => {
    setForm((f) => ({ ...f, [field]: value }));
    if (error) setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/users/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const json = await res.json();

      if (!res.ok) {
        setError(json.error || "Something went wrong");
        return;
      }

      // Redirect to user detail page
      router.push(`/admin/users/${json.userId}`);
    } catch {
      setError("Failed to create user. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "var(--spacing-2, 8px) var(--spacing-3, 12px)",
    border: "1px solid var(--color-border, #e5e7eb)",
    borderRadius: "var(--radius-sm, 6px)",
    fontSize: "var(--text-sm, 14px)",
    fontFamily: "var(--font-sans, sans-serif)",
    background: "var(--color-surface, #fff)",
    color: "var(--color-text, #1a1a1a)",
    outline: "none",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: "var(--text-sm, 14px)",
    fontWeight: 500,
    color: "var(--color-text, #1a1a1a)",
    marginBottom: "var(--spacing-1, 4px)",
    fontFamily: "var(--font-sans, sans-serif)",
  };

  return (
    <div style={{ padding: "var(--spacing-6, 24px)" }}>
      {/* Back link */}
      <button
        onClick={() => router.push("/admin/users")}
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          fontSize: "var(--text-sm, 14px)",
          color: "var(--color-text-secondary, #6b7280)",
          fontFamily: "var(--font-sans, sans-serif)",
          padding: 0,
          marginBottom: "var(--spacing-4, 16px)",
          display: "flex",
          alignItems: "center",
          gap: "var(--spacing-1, 4px)",
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="19" y1="12" x2="5" y2="12" />
          <polyline points="12 19 5 12 12 5" />
        </svg>
        Back to Users
      </button>

      {/* Card */}
      <div
        style={{
          maxWidth: 600,
          background: "var(--color-surface, #fff)",
          border: "1px solid var(--color-border, #e5e7eb)",
          borderRadius: "var(--radius-md, 8px)",
          boxShadow: "var(--shadow-sm, 0 1px 2px rgba(0,0,0,0.05))",
          padding: "var(--spacing-6, 24px)",
        }}
      >
        <h1
          style={{
            fontFamily: "var(--font-heading, Georgia, serif)",
            fontSize: "var(--text-xl, 20px)",
            fontWeight: 600,
            color: "var(--color-text, #1a1a1a)",
            margin: "0 0 var(--spacing-6, 24px) 0",
          }}
        >
          Add New User
        </h1>

        {error && (
          <div
            style={{
              padding: "var(--spacing-3, 12px)",
              background: "var(--color-error-light, rgba(239,68,68,0.1))",
              color: "var(--color-error, #ef4444)",
              borderRadius: "var(--radius-sm, 6px)",
              fontSize: "var(--text-sm, 14px)",
              marginBottom: "var(--spacing-4, 16px)",
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Name row */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "var(--spacing-4, 16px)",
              marginBottom: "var(--spacing-4, 16px)",
            }}
          >
            <div>
              <label style={labelStyle}>First Name</label>
              <input
                type="text"
                value={form.firstName}
                onChange={(e) => updateField("firstName", e.target.value)}
                placeholder="Jordan"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Last Name</label>
              <input
                type="text"
                value={form.lastName}
                onChange={(e) => updateField("lastName", e.target.value)}
                placeholder="Ellis"
                style={inputStyle}
              />
            </div>
          </div>

          {/* Email */}
          <div style={{ marginBottom: "var(--spacing-4, 16px)" }}>
            <label style={labelStyle}>
              Email <span style={{ color: "var(--color-error, #ef4444)" }}>*</span>
            </label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => updateField("email", e.target.value)}
              placeholder="agent@example.com"
              style={inputStyle}
            />
          </div>

          {/* Company + Phone */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "var(--spacing-4, 16px)",
              marginBottom: "var(--spacing-4, 16px)",
            }}
          >
            <div>
              <label style={labelStyle}>Company</label>
              <input
                type="text"
                value={form.company}
                onChange={(e) => updateField("company", e.target.value)}
                placeholder="Ellis Luxury Group"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Phone</label>
              <input
                type="text"
                value={form.phone}
                onChange={(e) => updateField("phone", e.target.value)}
                placeholder="555-123-4567"
                style={inputStyle}
              />
            </div>
          </div>

          {/* Title */}
          <div style={{ marginBottom: "var(--spacing-4, 16px)" }}>
            <label style={labelStyle}>Title</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => updateField("title", e.target.value)}
              placeholder="Managing Broker"
              style={inputStyle}
            />
          </div>

          {/* Role + Tier */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "var(--spacing-4, 16px)",
              marginBottom: "var(--spacing-4, 16px)",
            }}
          >
            <div>
              <label style={labelStyle}>Role</label>
              <select
                value={form.role}
                onChange={(e) => updateField("role", e.target.value)}
                style={inputStyle}
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Subscription Tier</label>
              <select
                value={form.tierId}
                onChange={(e) => updateField("tierId", e.target.value)}
                style={inputStyle}
                disabled={tiersLoading}
              >
                {tiersLoading ? (
                  <option>Loading...</option>
                ) : tiers.length === 0 ? (
                  <option value="">No tiers available</option>
                ) : (
                  tiers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>

          {/* Send Invite */}
          <div
            style={{
              marginBottom: "var(--spacing-6, 24px)",
              display: "flex",
              alignItems: "center",
              gap: "var(--spacing-2, 8px)",
            }}
          >
            <input
              type="checkbox"
              id="sendInvite"
              checked={form.sendInvite}
              onChange={(e) => updateField("sendInvite", e.target.checked)}
              style={{ width: 16, height: 16, cursor: "pointer" }}
            />
            <label
              htmlFor="sendInvite"
              style={{
                fontSize: "var(--text-sm, 14px)",
                color: "var(--color-text-secondary, #6b7280)",
                fontFamily: "var(--font-sans, sans-serif)",
                cursor: "pointer",
              }}
            >
              Send invite email to set password
            </label>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "var(--spacing-3, 12px)",
              background: loading
                ? "var(--color-text-secondary, #6b7280)"
                : "var(--color-primary, #0F172A)",
              color: "#fff",
              border: "none",
              borderRadius: "var(--radius-sm, 6px)",
              fontSize: "var(--text-sm, 14px)",
              fontWeight: 500,
              fontFamily: "var(--font-sans, sans-serif)",
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Creating..." : "Create User"}
          </button>
        </form>
      </div>
    </div>
  );
}
