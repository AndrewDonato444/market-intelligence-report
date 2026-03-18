"use client";

import { PasswordInput } from "@/components/ui/password-input";
import { TurnstileWidget } from "@/components/ui/turnstile-widget";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useState } from "react";

/* ── Brand Panel (left side on desktop, compact header on mobile) ── */
function BrandPanel() {
  return (
    <div className="hidden md:flex md:w-[45%] bg-[var(--color-mkt-dark)] flex-col justify-center items-center px-[var(--spacing-12)] py-[var(--spacing-16)]">
      <div className="max-w-sm text-center">
        <h1 className="font-[family-name:var(--font-display)] text-4xl font-light text-[var(--color-mkt-text-inverse)] tracking-[0.06em]">
          Modern{" "}
          <span className="text-[var(--color-mkt-accent)]">Signal</span>{" "}
          Advisory
        </h1>
        <p className="font-[family-name:var(--font-body)] text-base text-[var(--color-mkt-text-inverse)]/70 mt-[var(--spacing-3)]">
          The Intelligence Era of Real Estate
        </p>
        <div className="w-16 h-0.5 bg-[var(--color-mkt-accent)] mx-auto mt-[var(--spacing-6)]" />
        <p className="font-[family-name:var(--font-body)] text-base text-[var(--color-mkt-text-inverse)]/50 mt-[var(--spacing-8)] leading-relaxed">
          The intelligence, the voice, and the system to tell your
          market&rsquo;s story &mdash; with authority, every month without fail.
        </p>
      </div>
    </div>
  );
}

/* ── Mobile Brand Header ── */
function MobileBrandHeader() {
  return (
    <div className="md:hidden bg-[var(--color-mkt-dark)] px-[var(--spacing-6)] py-[var(--spacing-6)] text-center">
      <h1 className="font-[family-name:var(--font-display)] text-xl font-light text-[var(--color-mkt-text-inverse)] tracking-[0.06em]">
        Modern{" "}
        <span className="text-[var(--color-mkt-accent)]">Signal</span>{" "}
        Advisory
      </h1>
      <div className="w-10 h-0.5 bg-[var(--color-mkt-accent)] mx-auto mt-[var(--spacing-2)]" />
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
      <div className="flex-1 flex items-center justify-center bg-[var(--color-mkt-bg)] px-[var(--spacing-6)] py-[var(--spacing-12)]">
        <div className="w-full max-w-sm">
          <h2 className="font-[family-name:var(--font-display)] text-2xl font-light text-[var(--color-mkt-text)]">
            Welcome back
          </h2>
          <p className="font-[family-name:var(--font-body)] text-sm text-[var(--color-mkt-text-secondary)] mt-[var(--spacing-1)]">
            Sign in to your intelligence dashboard
          </p>

          {confirmationError && (
            <div className="mt-[var(--spacing-4)] bg-red-50 border border-red-200 rounded-[var(--radius-sm)] px-[var(--spacing-3)] py-[var(--spacing-2)]">
              <p className="font-[family-name:var(--font-body)] text-sm text-[var(--color-error)]">
                Email confirmation failed. Please try signing up again.
              </p>
            </div>
          )}
          {error && (
            <div className="mt-[var(--spacing-4)] bg-red-50 border border-red-200 rounded-[var(--radius-sm)] px-[var(--spacing-3)] py-[var(--spacing-2)]">
              <p className="font-[family-name:var(--font-body)] text-sm text-[var(--color-error)]">
                {error}
              </p>
            </div>
          )}

          <form onSubmit={handleSignIn} className="mt-[var(--spacing-8)] space-y-[var(--spacing-4)]">
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

            <div>
              <label
                htmlFor="password"
                className="block font-[family-name:var(--font-body)] text-sm font-medium text-[var(--color-mkt-text)] mb-[var(--spacing-1)]"
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
              className="w-full py-[var(--spacing-3)] bg-[var(--color-mkt-text)] text-[var(--color-mkt-surface)] rounded-[var(--radius-sm)] font-[family-name:var(--font-body)] text-sm font-semibold hover:bg-[var(--color-mkt-darkest)] disabled:opacity-50 transition-colors duration-[var(--duration-default)]"
            >
              {loading ? "Signing in\u2026" : "Sign In"}
            </button>
          </form>

          {/* Waitlist callout */}
          <div className="mt-[var(--spacing-8)] pt-[var(--spacing-6)] border-t border-[var(--color-mkt-border)]">
            <p className="font-[family-name:var(--font-body)] text-sm text-[var(--color-mkt-text-secondary)]">
              Don&rsquo;t have an account yet?
            </p>
            <Link
              href="/waitlist"
              className="inline-flex items-center gap-1.5 font-[family-name:var(--font-body)] text-sm font-semibold text-[var(--color-mkt-accent)] hover:text-[var(--color-mkt-text)] mt-[var(--spacing-1)] transition-colors duration-[var(--duration-default)]"
            >
              Join the Waitlist
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
