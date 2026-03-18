"use client";

import { PasswordInput } from "@/components/ui/password-input";
import { BrandPanelCompact, MobileBrandHeader } from "@/components/auth/brand-panel";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [sessionValid, setSessionValid] = useState<boolean | null>(null);
  const redirectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Check for valid session on mount
  useEffect(() => {
    let cancelled = false;
    async function checkSession() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!cancelled) setSessionValid(!!user);
    }
    checkSession();
    return () => {
      cancelled = true;
      if (redirectTimerRef.current) clearTimeout(redirectTimerRef.current);
    };
  }, []);

  const passwordTooShort = password.length > 0 && password.length < 8;
  const passwordsMismatch =
    confirmPassword.length > 0 && password !== confirmPassword;
  const canSubmit =
    password.length >= 8 &&
    confirmPassword.length > 0 &&
    password === confirmPassword &&
    !loading;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to reset password");
        setLoading(false);
        return;
      }

      setSuccess(true);
      setLoading(false);
      redirectTimerRef.current = setTimeout(() => router.push("/dashboard"), 2000);
    } catch {
      setError("An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  }

  // Session check still loading
  if (sessionValid === null) {
    return (
      <>
        <MobileBrandHeader />
        <BrandPanelCompact />
        <div className="flex-1 flex items-center justify-center bg-[var(--color-mkt-bg)]">
          <p className="font-[family-name:var(--font-body)] text-sm text-[var(--color-mkt-text-secondary)]">
            Verifying reset link&hellip;
          </p>
        </div>
      </>
    );
  }

  // Invalid/expired session
  if (!sessionValid) {
    return (
      <>
        <MobileBrandHeader />
        <BrandPanelCompact />
        <div className="flex-1 flex items-center justify-center bg-[var(--color-mkt-bg)] px-[var(--spacing-6)]">
          <div className="w-full max-w-sm text-center">
            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-[var(--spacing-4)]">
              <svg
                className="w-6 h-6 text-[var(--color-error)]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v2m0 4h.01M12 3a9 9 0 110 18 9 9 0 010-18z"
                />
              </svg>
            </div>
            <h2 className="font-[family-name:var(--font-display)] text-2xl font-light text-[var(--color-mkt-text)]">
              Link expired
            </h2>
            <p className="font-[family-name:var(--font-body)] text-sm text-[var(--color-mkt-text-secondary)] mt-[var(--spacing-2)]">
              This reset link has expired or is invalid.
            </p>
            <Link
              href="/forgot-password"
              className="inline-flex items-center gap-1.5 font-[family-name:var(--font-body)] text-sm font-semibold text-[var(--color-mkt-accent)] hover:text-[var(--color-mkt-text)] mt-[var(--spacing-4)] transition-colors duration-[var(--duration-default)]"
            >
              Request a new reset link
              <span aria-hidden="true">&rarr;</span>
            </Link>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <MobileBrandHeader />
      <BrandPanelCompact />

      <div className="flex-1 flex items-center justify-center bg-[var(--color-mkt-bg)] px-[var(--spacing-6)] py-[var(--spacing-12)]">
        <div className="w-full max-w-sm">
          {success ? (
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-[var(--color-success)]/10 flex items-center justify-center mx-auto mb-[var(--spacing-4)]">
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
                Password updated
              </h2>
              <p className="font-[family-name:var(--font-body)] text-sm text-[var(--color-mkt-text-secondary)] mt-[var(--spacing-2)]">
                Redirecting to your dashboard&hellip;
              </p>
            </div>
          ) : (
            <div>
              <h2 className="font-[family-name:var(--font-display)] text-2xl font-light text-[var(--color-mkt-text)]">
                Set new password
              </h2>
              <p className="font-[family-name:var(--font-body)] text-sm text-[var(--color-mkt-text-secondary)] mt-[var(--spacing-1)]">
                Choose a new password for your account
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
                    htmlFor="password"
                    className="block font-[family-name:var(--font-body)] text-sm font-medium text-[var(--color-mkt-text)] mb-[var(--spacing-1)]"
                  >
                    New password
                  </label>
                  <PasswordInput
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                    placeholder="Enter new password"
                  />
                  {passwordTooShort && (
                    <p className="font-[family-name:var(--font-body)] text-xs text-[var(--color-error)] mt-[var(--spacing-1)]">
                      Password must be at least 8 characters
                    </p>
                  )}
                  {!passwordTooShort && password.length === 0 && (
                    <p className="font-[family-name:var(--font-body)] text-xs text-[var(--color-mkt-text-secondary)] mt-[var(--spacing-1)]">
                      Min 8 characters
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="confirmPassword"
                    className="block font-[family-name:var(--font-body)] text-sm font-medium text-[var(--color-mkt-text)] mb-[var(--spacing-1)]"
                  >
                    Confirm password
                  </label>
                  <PasswordInput
                    id="confirmPassword"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                    placeholder="Confirm new password"
                  />
                  {passwordsMismatch && (
                    <p className="font-[family-name:var(--font-body)] text-xs text-[var(--color-error)] mt-[var(--spacing-1)]">
                      Passwords do not match
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={!canSubmit}
                  className="w-full py-[var(--spacing-3)] bg-[var(--color-mkt-text)] text-[var(--color-mkt-surface)] rounded-[var(--radius-sm)] font-[family-name:var(--font-body)] text-sm font-semibold hover:bg-[var(--color-mkt-darkest)] disabled:opacity-50 transition-colors duration-[var(--duration-default)]"
                >
                  {loading ? "Updating\u2026" : "Set New Password"}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
