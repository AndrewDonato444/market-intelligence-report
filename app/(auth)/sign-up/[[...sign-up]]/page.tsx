"use client";

import { PasswordInput } from "@/components/ui/password-input";
import { TurnstileWidget } from "@/components/ui/turnstile-widget";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";

/* ── Sizzle content — pulled from landing page for consistency ── */

const SIZZLE_FEATURES = [
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
      </svg>
    ),
    title: "31 Market Indicators",
    description: "Institutional-grade analysis across every dimension of your luxury market",
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
      </svg>
    ),
    title: "8 Buyer Personas",
    description: "Tailored intelligence lenses for every luxury client type you advise",
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
      </svg>
    ),
    title: "Your Name on the Cover",
    description: "A designed publication branded to you — ready to hand to your most important clients",
  },
];

/* ── Sizzle Panel (left side on desktop) ── */
function SizzlePanel() {
  return (
    <div className="hidden md:flex md:w-[45%] bg-[var(--color-primary)] flex-col justify-center px-[var(--spacing-12)] py-[var(--spacing-16)]">
      <div className="max-w-sm">
        {/* Brand */}
        <p className="font-[family-name:var(--font-inter)] text-xs uppercase tracking-[0.2em] text-[var(--color-accent)]">
          Modern Signal Advisory
        </p>
        <div className="w-10 h-0.5 bg-[var(--color-accent)] mt-[var(--spacing-3)]" />

        {/* Headline */}
        <h2 className="font-[family-name:var(--font-playfair)] text-xl text-[var(--color-text-inverse)] mt-[var(--spacing-6)] leading-snug">
          Walk into the room as the advisor who brought the research.
        </h2>

        <p className="font-[family-name:var(--font-inter)] text-sm text-[var(--color-text-inverse)]/60 mt-[var(--spacing-4)] leading-relaxed">
          AI-powered intelligence reports grounded in real transaction data
          &mdash; branded to you, ready in under two minutes.
        </p>

        {/* Feature cards */}
        <div className="mt-[var(--spacing-8)] space-y-[var(--spacing-3)]">
          {SIZZLE_FEATURES.map((feature) => (
            <div
              key={feature.title}
              className="bg-white/[0.07] rounded-[var(--radius-sm)] px-[var(--spacing-4)] py-[var(--spacing-3)] flex items-start gap-[var(--spacing-3)]"
            >
              <div className="text-[var(--color-accent)] shrink-0 mt-0.5">
                {feature.icon}
              </div>
              <div>
                <div className="font-[family-name:var(--font-inter)] text-sm font-medium text-[var(--color-text-inverse)]">
                  {feature.title}
                </div>
                <p className="font-[family-name:var(--font-inter)] text-xs text-[var(--color-text-inverse)]/50 mt-0.5 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Social proof nudge */}
        <p className="font-[family-name:var(--font-inter)] text-xs text-[var(--color-text-inverse)]/40 mt-[var(--spacing-8)]">
          Trusted by luxury agents at Sotheby&rsquo;s, Douglas Elliman,
          Compass, and The Agency.
        </p>
      </div>
    </div>
  );
}

/* ── Mobile Sizzle Header ── */
function MobileSizzleHeader() {
  return (
    <div className="md:hidden bg-[var(--color-primary)] px-[var(--spacing-6)] py-[var(--spacing-6)] text-center">
      <p className="font-[family-name:var(--font-inter)] text-xs uppercase tracking-[0.2em] text-[var(--color-accent)]">
        Modern Signal Advisory
      </p>
      <div className="w-10 h-0.5 bg-[var(--color-accent)] mx-auto mt-[var(--spacing-2)]" />
      <p className="font-[family-name:var(--font-inter)] text-sm text-[var(--color-text-inverse)]/70 mt-[var(--spacing-3)]">
        Market intelligence for luxury advisors
      </p>
    </div>
  );
}

/* ── Confirmation State ── */
function ConfirmationSent({
  email,
  onReset,
}: {
  email: string;
  onReset: () => void;
}) {
  return (
    <>
      <MobileSizzleHeader />
      <SizzlePanel />

      <div className="flex-1 flex items-center justify-center bg-[var(--color-surface)] px-[var(--spacing-6)] py-[var(--spacing-12)]">
        <div className="w-full max-w-sm text-center">
          <div className="w-14 h-14 mx-auto rounded-full bg-[var(--color-accent-light)] flex items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-7 w-7 text-[var(--color-accent)]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          </div>

          <h2 className="font-[family-name:var(--font-playfair)] text-2xl font-bold text-[var(--color-primary)] mt-[var(--spacing-6)]">
            Check Your Email
          </h2>
          <p className="font-[family-name:var(--font-inter)] text-sm text-[var(--color-text-secondary)] mt-[var(--spacing-3)] leading-relaxed">
            We sent a confirmation link to{" "}
            <span className="font-medium text-[var(--color-text)]">
              {email}
            </span>
            . Click the link in your email to activate your account.
          </p>

          <div className="mt-[var(--spacing-6)] space-y-[var(--spacing-3)]">
            <button
              onClick={onReset}
              className="w-full py-[var(--spacing-2)] border border-[var(--color-border)] text-[var(--color-text-secondary)] rounded-[var(--radius-sm)] font-[family-name:var(--font-inter)] text-sm font-medium hover:bg-[var(--color-primary-light)] transition-colors duration-[var(--duration-default)]"
            >
              Use a different email
            </button>
            <p className="font-[family-name:var(--font-inter)] text-xs text-[var(--color-text-tertiary)]">
              Didn&rsquo;t receive it? Check your spam folder or try again.
            </p>
          </div>

          <p className="font-[family-name:var(--font-inter)] text-sm text-[var(--color-text-secondary)] mt-[var(--spacing-6)]">
            Already confirmed?{" "}
            <Link
              href="/sign-in"
              className="text-[var(--color-accent)] hover:text-[var(--color-accent-hover)] font-medium transition-colors duration-[var(--duration-default)]"
            >
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </>
  );
}

/* ── Page ── */
export default function SignUpPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [tosAccepted, setTosAccepted] = useState(false);
  const [tosError, setTosError] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [confirmationSent, setConfirmationSent] = useState(false);
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

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setTosError("");

    if (!tosAccepted) {
      setTosError("Please accept the Terms of Service to continue");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          turnstileToken,
          tosAcceptedAt: new Date().toISOString(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Signup failed");
        setLoading(false);
        return;
      }

      if (data.needsConfirmation) {
        setConfirmationSent(true);
        setLoading(false);
        return;
      }

      router.push("/dashboard");
    } catch {
      setError("An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  }

  if (confirmationSent) {
    return (
      <ConfirmationSent
        email={email}
        onReset={() => {
          setConfirmationSent(false);
          setEmail("");
          setPassword("");
        }}
      />
    );
  }

  return (
    <>
      <MobileSizzleHeader />

      <SizzlePanel />

      {/* Form Panel */}
      <div className="flex-1 flex items-center justify-center bg-[var(--color-surface)] px-[var(--spacing-6)] py-[var(--spacing-12)]">
        <div className="w-full max-w-sm">
          <h2 className="font-[family-name:var(--font-playfair)] text-2xl font-bold text-[var(--color-primary)]">
            Start Your Intelligence Edge
          </h2>
          <p className="font-[family-name:var(--font-inter)] text-sm text-[var(--color-text-secondary)] mt-[var(--spacing-1)]">
            Commission your first report in under two minutes
          </p>

          {error && (
            <div className="mt-[var(--spacing-4)] bg-red-50 border border-red-200 rounded-[var(--radius-sm)] px-[var(--spacing-3)] py-[var(--spacing-2)]">
              <p className="font-[family-name:var(--font-inter)] text-sm text-[var(--color-error)]">
                {error}
              </p>
            </div>
          )}

          <form onSubmit={handleSignUp} className="mt-[var(--spacing-8)] space-y-[var(--spacing-4)]">
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
                minLength={6}
                autoComplete="new-password"
                placeholder="Create a password"
              />
              <p className="font-[family-name:var(--font-inter)] text-xs text-[var(--color-text-tertiary)] mt-[var(--spacing-1)]">
                Minimum 6 characters
              </p>
            </div>

            {/* ToS Checkbox */}
            <div className="flex items-start gap-[var(--spacing-2)]">
              <input
                id="tos"
                type="checkbox"
                checked={tosAccepted}
                onChange={(e) => {
                  setTosAccepted(e.target.checked);
                  if (e.target.checked) setTosError("");
                }}
                aria-label="I agree to the Terms of Service"
                className="mt-0.5 h-4 w-4 shrink-0 rounded-[var(--radius-sm)] border border-[var(--color-border)] accent-[var(--color-accent)] cursor-pointer"
              />
              <label
                htmlFor="tos"
                className="font-[family-name:var(--font-inter)] text-sm text-[var(--color-text-secondary)] cursor-pointer"
              >
                I agree to the{" "}
                <a
                  href="/terms"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="text-[var(--color-accent)] hover:text-[var(--color-accent-hover)] font-medium transition-colors duration-[var(--duration-default)]"
                >
                  Terms of Service
                </a>
              </label>
            </div>

            {tosError && (
              <div className="bg-red-50 border border-red-200 rounded-[var(--radius-sm)] px-[var(--spacing-3)] py-[var(--spacing-2)]">
                <p className="font-[family-name:var(--font-inter)] text-sm text-[var(--color-error)]">
                  {tosError}
                </p>
              </div>
            )}

            {/* Turnstile anti-bot widget (invisible in most cases) */}
            <TurnstileWidget
              onSuccess={handleTurnstileSuccess}
              onError={handleTurnstileError}
            />

            {/* Gold CTA — visually distinct from sign-in's navy button */}
            <button
              type="submit"
              disabled={loading || turnstileError}
              className="w-full py-[var(--spacing-3)] bg-[var(--color-accent)] text-[var(--color-primary)] rounded-[var(--radius-sm)] font-[family-name:var(--font-inter)] text-sm font-semibold hover:bg-[var(--color-accent-hover)] disabled:opacity-50 transition-colors duration-[var(--duration-default)]"
            >
              {loading ? "Creating account\u2026" : "Create Account"}
            </button>
          </form>

          {/* Sign-in link */}
          <div className="mt-[var(--spacing-8)] pt-[var(--spacing-6)] border-t border-[var(--color-border)]">
            <p className="font-[family-name:var(--font-inter)] text-sm text-[var(--color-text-secondary)]">
              Already have an account?{" "}
              <Link
                href="/sign-in"
                className="font-medium text-[var(--color-accent)] hover:text-[var(--color-accent-hover)] transition-colors duration-[var(--duration-default)]"
              >
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
