"use client";

import { PasswordInput } from "@/components/ui/password-input";
import { TurnstileWidget } from "@/components/ui/turnstile-widget";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useState } from "react";

/* ── Brand Panel (left side on desktop, compact header on mobile) ── */
function BrandPanel() {
  return (
    <div className="hidden md:flex md:w-[45%] bg-[var(--color-primary)] flex-col justify-center items-center px-[var(--spacing-12)] py-[var(--spacing-16)]">
      <div className="max-w-xs text-center">
        <h1 className="font-[family-name:var(--font-playfair)] text-2xl font-bold text-[var(--color-text-inverse)]">
          Modern Signal Advisory
        </h1>
        <p className="font-[family-name:var(--font-inter)] text-sm text-[var(--color-text-inverse)]/70 mt-[var(--spacing-2)]">
          Luxury Market Intelligence
        </p>
        <div className="w-12 h-0.5 bg-[var(--color-accent)] mx-auto mt-[var(--spacing-4)]" />
        <p className="font-[family-name:var(--font-inter)] text-sm text-[var(--color-text-inverse)]/50 mt-[var(--spacing-8)] leading-relaxed">
          Institutional-grade market analysis &mdash; branded to you, grounded
          in real transaction data.
        </p>
      </div>
    </div>
  );
}

/* ── Mobile Brand Header ── */
function MobileBrandHeader() {
  return (
    <div className="md:hidden bg-[var(--color-primary)] px-[var(--spacing-6)] py-[var(--spacing-6)] text-center">
      <h1 className="font-[family-name:var(--font-playfair)] text-xl font-bold text-[var(--color-text-inverse)]">
        Modern Signal Advisory
      </h1>
      <div className="w-10 h-0.5 bg-[var(--color-accent)] mx-auto mt-[var(--spacing-2)]" />
    </div>
  );
}

/* ── Sign-In Form ── */
function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [turnstileError, setTurnstileError] = useState(false);

  const handleTurnstileSuccess = useCallback((token: string) => {
    setTurnstileToken(token);
    setTurnstileError(false);
  }, []);

  const handleTurnstileError = useCallback(() => {
    setTurnstileToken(null);
    setTurnstileError(true);
  }, []);

  const confirmationError =
    searchParams.get("error") === "confirmation_failed";

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          turnstileToken,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Sign in failed");
        setLoading(false);
        return;
      }

      router.push("/dashboard");
    } catch {
      setError("An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  }

  return (
    <>
      <MobileBrandHeader />

      <BrandPanel />

      {/* Form Panel */}
      <div className="flex-1 flex items-center justify-center bg-[var(--color-surface)] px-[var(--spacing-6)] py-[var(--spacing-12)]">
        <div className="w-full max-w-sm">
          <h2 className="font-[family-name:var(--font-playfair)] text-2xl font-bold text-[var(--color-primary)]">
            Welcome back
          </h2>
          <p className="font-[family-name:var(--font-inter)] text-sm text-[var(--color-text-secondary)] mt-[var(--spacing-1)]">
            Sign in to your intelligence dashboard
          </p>

          {confirmationError && (
            <div className="mt-[var(--spacing-4)] bg-red-50 border border-red-200 rounded-[var(--radius-sm)] px-[var(--spacing-3)] py-[var(--spacing-2)]">
              <p className="font-[family-name:var(--font-inter)] text-sm text-[var(--color-error)]">
                Email confirmation failed. Please try signing up again.
              </p>
            </div>
          )}
          {error && (
            <div className="mt-[var(--spacing-4)] bg-red-50 border border-red-200 rounded-[var(--radius-sm)] px-[var(--spacing-3)] py-[var(--spacing-2)]">
              <p className="font-[family-name:var(--font-inter)] text-sm text-[var(--color-error)]">
                {error}
              </p>
            </div>
          )}

          <form onSubmit={handleSignIn} className="mt-[var(--spacing-8)] space-y-[var(--spacing-4)]">
            <div>
              <label
                htmlFor="email"
                className="block font-[family-name:var(--font-inter)] text-sm font-medium text-[var(--color-text)] mb-[var(--spacing-1)]"
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
                className="w-full px-[var(--spacing-3)] py-[var(--spacing-2)] border border-[var(--color-border)] rounded-[var(--radius-sm)] font-[family-name:var(--font-inter)] text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-border-strong)] focus:border-transparent transition-shadow duration-[var(--duration-fast)]"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block font-[family-name:var(--font-inter)] text-sm font-medium text-[var(--color-text)] mb-[var(--spacing-1)]"
              >
                Password
              </label>
              <PasswordInput
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                placeholder="Enter your password"
              />
            </div>

            {/* Turnstile anti-bot widget (invisible in most cases) */}
            <TurnstileWidget
              onSuccess={handleTurnstileSuccess}
              onError={handleTurnstileError}
            />

            <button
              type="submit"
              disabled={loading || turnstileError}
              className="w-full py-[var(--spacing-3)] bg-[var(--color-primary)] text-[var(--color-text-inverse)] rounded-[var(--radius-sm)] font-[family-name:var(--font-inter)] text-sm font-semibold hover:bg-[var(--color-primary-hover)] disabled:opacity-50 transition-colors duration-[var(--duration-default)]"
            >
              {loading ? "Signing in\u2026" : "Sign In"}
            </button>
          </form>

          {/* Sign-up callout */}
          <div className="mt-[var(--spacing-8)] pt-[var(--spacing-6)] border-t border-[var(--color-border)]">
            <p className="font-[family-name:var(--font-inter)] text-sm text-[var(--color-text-secondary)]">
              New to Modern Signal Advisory?
            </p>
            <Link
              href="/sign-up"
              className="inline-flex items-center gap-1.5 font-[family-name:var(--font-inter)] text-sm font-semibold text-[var(--color-accent)] hover:text-[var(--color-accent-hover)] mt-[var(--spacing-1)] transition-colors duration-[var(--duration-default)]"
            >
              Create Account
              <span aria-hidden="true">&rarr;</span>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}

export default function SignInPage() {
  return (
    <Suspense>
      <SignInForm />
    </Suspense>
  );
}
