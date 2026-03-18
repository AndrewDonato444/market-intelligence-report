"use client";

import { BrandPanelCompact, MobileBrandHeader } from "@/components/auth/brand-panel";
import Link from "next/link";
import { useState } from "react";

function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!domain) return email;
  const visible = local.slice(0, 1);
  return `${visible}***@${domain}`;
}

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Something went wrong");
        setLoading(false);
        return;
      }

      setSent(true);
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <MobileBrandHeader />
      <BrandPanelCompact />

      <div className="flex-1 flex items-center justify-center bg-[var(--color-mkt-bg)] px-[var(--spacing-6)] py-[var(--spacing-12)]">
        <div className="w-full max-w-sm">
          {sent ? (
            /* ── Success State ── */
            <div>
              <div className="w-12 h-12 rounded-full bg-[var(--color-success)]/10 flex items-center justify-center mb-[var(--spacing-4)]">
                <svg
                  className="w-6 h-6 text-[var(--color-success)]"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h2 className="font-[family-name:var(--font-display)] text-2xl font-light text-[var(--color-mkt-text)]">
                Check your email
              </h2>
              <p className="font-[family-name:var(--font-body)] text-sm text-[var(--color-mkt-text-secondary)] mt-[var(--spacing-2)]">
                We sent a reset link to{" "}
                <span className="font-medium text-[var(--color-mkt-text)]">
                  {maskEmail(email)}
                </span>
              </p>
              <p className="font-[family-name:var(--font-body)] text-sm text-[var(--color-mkt-text-secondary)] mt-[var(--spacing-4)]">
                Didn&rsquo;t receive it? Check your spam folder or{" "}
                <button
                  onClick={() => {
                    setSent(false);
                    setEmail("");
                  }}
                  className="font-semibold text-[var(--color-mkt-accent)] hover:text-[var(--color-mkt-text)] transition-colors duration-[var(--duration-default)]"
                >
                  try again
                </button>
              </p>

              <div className="mt-[var(--spacing-8)] pt-[var(--spacing-6)] border-t border-[var(--color-mkt-border)]">
                <Link
                  href="/sign-in"
                  className="inline-flex items-center gap-1.5 font-[family-name:var(--font-body)] text-sm font-semibold text-[var(--color-mkt-accent)] hover:text-[var(--color-mkt-text)] transition-colors duration-[var(--duration-default)]"
                >
                  <span aria-hidden="true">&larr;</span>
                  Back to Sign In
                </Link>
              </div>
            </div>
          ) : (
            /* ── Form State ── */
            <div>
              <h2 className="font-[family-name:var(--font-display)] text-2xl font-light text-[var(--color-mkt-text)]">
                Reset your password
              </h2>
              <p className="font-[family-name:var(--font-body)] text-sm text-[var(--color-mkt-text-secondary)] mt-[var(--spacing-1)]">
                Enter your email to receive a reset link
              </p>

              {error && (
                <div className="mt-[var(--spacing-4)] bg-red-50 border border-red-200 rounded-[var(--radius-sm)] px-[var(--spacing-3)] py-[var(--spacing-2)]">
                  <p className="font-[family-name:var(--font-body)] text-sm text-[var(--color-error)]">
                    {error}
                  </p>
                </div>
              )}

              <form
                onSubmit={handleSubmit}
                className="mt-[var(--spacing-8)] space-y-[var(--spacing-4)]"
              >
                <div>
                  <label
                    htmlFor="email"
                    className="block font-[family-name:var(--font-body)] text-sm font-medium text-[var(--color-mkt-text)] mb-[var(--spacing-1)]"
                  >
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="you@example.com"
                    className="w-full px-[var(--spacing-3)] py-[var(--spacing-2)] border border-[var(--color-mkt-border)] rounded-[var(--radius-sm)] font-[family-name:var(--font-body)] text-sm text-[var(--color-mkt-text)] bg-[var(--color-mkt-surface)] placeholder:text-[var(--color-mkt-border-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-mkt-accent)]/30 focus:border-[var(--color-mkt-accent)] transition-shadow duration-[var(--duration-fast)]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-[var(--spacing-3)] bg-[var(--color-mkt-text)] text-[var(--color-mkt-surface)] rounded-[var(--radius-sm)] font-[family-name:var(--font-body)] text-sm font-semibold hover:bg-[var(--color-mkt-darkest)] disabled:opacity-50 transition-colors duration-[var(--duration-default)]"
                >
                  {loading ? "Sending\u2026" : "Send Reset Link"}
                </button>
              </form>

              <div className="mt-[var(--spacing-8)] pt-[var(--spacing-6)] border-t border-[var(--color-mkt-border)]">
                <p className="font-[family-name:var(--font-body)] text-sm text-[var(--color-mkt-text-secondary)]">
                  Remember your password?
                </p>
                <Link
                  href="/sign-in"
                  className="inline-flex items-center gap-1.5 font-[family-name:var(--font-body)] text-sm font-semibold text-[var(--color-mkt-accent)] hover:text-[var(--color-mkt-text)] mt-[var(--spacing-1)] transition-colors duration-[var(--duration-default)]"
                >
                  <span aria-hidden="true">&larr;</span>
                  Back to Sign In
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
