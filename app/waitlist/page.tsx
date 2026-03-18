"use client";

import Link from "next/link";
import { useState } from "react";

export default function WaitlistPage() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    market: "",
    website: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function updateField(field: string, value: string) {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong. Please try again.");
        setLoading(false);
        return;
      }

      setSubmitted(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "w-full px-4 py-3 font-[family-name:var(--font-body)] text-[15px] bg-[var(--color-mkt-surface)] text-[var(--color-mkt-text)] border border-[var(--color-mkt-border)] rounded-[var(--radius-sm)] outline-none transition-[border-color] duration-300 focus:border-[var(--color-mkt-accent)] placeholder:text-[var(--color-mkt-border-muted)]";

  return (
    <main
      className="min-h-screen flex items-center justify-center"
      style={{
        fontFamily: "var(--font-body)",
        background: "var(--color-mkt-bg)",
        color: "var(--color-mkt-text)",
        padding: "48px 24px",
      }}
    >
      <div className="w-full max-w-lg">
        {/* Back link */}
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 font-[family-name:var(--font-body)] text-sm text-[var(--color-mkt-accent)] hover:text-[var(--color-mkt-text)] transition-colors duration-300 mb-12"
        >
          <span aria-hidden="true">&larr;</span> Back to homepage
        </Link>

        {submitted ? (
          /* ── Confirmation State ── */
          <div className="text-center py-16">
            <div
              className="w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-8"
              style={{ background: "var(--color-mkt-accent-muted)" }}
            >
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--color-mkt-accent)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M20 6L9 17l-5-5" />
              </svg>
            </div>

            <h1 className="font-[family-name:var(--font-display)] text-3xl font-light text-[var(--color-mkt-text)] mb-4">
              You&rsquo;re on the list.
            </h1>

            <p className="font-[family-name:var(--font-body)] text-base text-[var(--color-mkt-text-secondary)] leading-relaxed max-w-sm mx-auto mb-2">
              We&rsquo;ve sent a confirmation to{" "}
              <span className="font-medium text-[var(--color-mkt-text)]">
                {formData.email}
              </span>
              .
            </p>
            <p className="font-[family-name:var(--font-body)] text-base text-[var(--color-mkt-text-secondary)] leading-relaxed max-w-sm mx-auto">
              A member of our team will reach out personally when the founding
              cohort opens.
            </p>

            <Link
              href="/"
              className="inline-flex items-center gap-1.5 font-[family-name:var(--font-body)] text-sm font-medium text-[var(--color-mkt-accent)] mt-10 hover:text-[var(--color-mkt-text)] transition-colors duration-300"
            >
              Return to Homepage
              <span aria-hidden="true">&rarr;</span>
            </Link>
          </div>
        ) : (
          /* ── Form State ── */
          <>
            <div className="text-center mb-10">
              <div className="text-[11px] font-semibold tracking-[0.2em] uppercase text-[var(--color-mkt-accent)] mb-4">
                Founding Cohort
              </div>

              <h1 className="font-[family-name:var(--font-display)] text-3xl md:text-4xl font-light text-[var(--color-mkt-text)] leading-tight mb-4">
                Reserve your position in the founding cohort.
              </h1>

              <p className="font-[family-name:var(--font-body)] text-base text-[var(--color-mkt-text-secondary)]">
                25 founding members.{" "}
                <span className="text-[var(--color-mkt-accent)] font-medium">
                  7 spots remaining.
                </span>
              </p>
            </div>

            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 rounded-[var(--radius-sm)] px-4 py-3">
                <p className="font-[family-name:var(--font-body)] text-sm text-[var(--color-error)]">
                  {error}
                </p>
                {error.includes("already on our waitlist") && (
                  <Link
                    href="/sign-in"
                    className="font-[family-name:var(--font-body)] text-sm font-medium text-[var(--color-mkt-accent)] mt-1 inline-block"
                  >
                    Sign in instead &rarr;
                  </Link>
                )}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="firstName"
                    className="block font-[family-name:var(--font-body)] text-sm font-medium text-[var(--color-mkt-text)] mb-1"
                  >
                    First Name
                  </label>
                  <input
                    id="firstName"
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={(e) => updateField("firstName", e.target.value)}
                    placeholder="Alex"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label
                    htmlFor="lastName"
                    className="block font-[family-name:var(--font-body)] text-sm font-medium text-[var(--color-mkt-text)] mb-1"
                  >
                    Last Name
                  </label>
                  <input
                    id="lastName"
                    type="text"
                    required
                    value={formData.lastName}
                    onChange={(e) => updateField("lastName", e.target.value)}
                    placeholder="Rivera"
                    className={inputClass}
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="block font-[family-name:var(--font-body)] text-sm font-medium text-[var(--color-mkt-text)] mb-1"
                >
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => updateField("email", e.target.value)}
                  placeholder="alex@example.com"
                  className={inputClass}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="phone"
                    className="block font-[family-name:var(--font-body)] text-sm font-medium text-[var(--color-mkt-text)] mb-1"
                  >
                    Phone{" "}
                    <span className="font-normal text-[var(--color-mkt-text-muted)]">
                      (optional)
                    </span>
                  </label>
                  <input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => updateField("phone", e.target.value)}
                    placeholder="(555) 555-1234"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label
                    htmlFor="market"
                    className="block font-[family-name:var(--font-body)] text-sm font-medium text-[var(--color-mkt-text)] mb-1"
                  >
                    Primary Market
                  </label>
                  <input
                    id="market"
                    type="text"
                    required
                    value={formData.market}
                    onChange={(e) => updateField("market", e.target.value)}
                    placeholder="Naples, FL"
                    className={inputClass}
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="website"
                  className="block font-[family-name:var(--font-body)] text-sm font-medium text-[var(--color-mkt-text)] mb-1"
                >
                  Website or LinkedIn{" "}
                  <span className="font-normal text-[var(--color-mkt-text-muted)]">
                    (optional)
                  </span>
                </label>
                <input
                  id="website"
                  type="url"
                  value={formData.website}
                  onChange={(e) => updateField("website", e.target.value)}
                  placeholder="https://yourwebsite.com"
                  className={inputClass}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 mt-2 font-[family-name:var(--font-body)] text-[13px] font-semibold tracking-[0.1em] uppercase bg-[var(--color-mkt-text)] text-[var(--color-mkt-surface)] rounded-[var(--radius-sm)] hover:bg-[var(--color-mkt-darkest)] disabled:opacity-50 transition-colors duration-300 cursor-pointer"
              >
                {loading ? "Reserving\u2026" : "Reserve My Spot"}
              </button>
            </form>

            <p className="text-center text-[13px] text-[var(--color-mkt-text-muted)] mt-6">
              No commitment. We&rsquo;ll reach out personally when the founding
              cohort opens.
            </p>
          </>
        )}
      </div>
    </main>
  );
}
