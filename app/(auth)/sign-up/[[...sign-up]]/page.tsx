"use client";

import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function SignUpPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [confirmationSent, setConfirmationSent] = useState(false);

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    // If email confirmation is required, Supabase returns a user with
    // identities array empty (or the user isn't fully confirmed).
    // Show confirmation message instead of redirecting.
    const needsConfirmation =
      data.user &&
      data.user.identities &&
      data.user.identities.length === 0;

    if (
      needsConfirmation ||
      (data.user && !data.session)
    ) {
      setConfirmationSent(true);
      setLoading(false);
      return;
    }

    // If no confirmation needed (e.g., dev mode), redirect directly
    router.push("/dashboard");
  }

  if (confirmationSent) {
    return (
      <div className="flex justify-center">
        <div className="w-full max-w-sm space-y-4 text-center">
          <div className="w-12 h-12 mx-auto rounded-full bg-[var(--color-accent-light)] flex items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 text-[var(--color-accent)]"
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
          <h2 className="font-[family-name:var(--font-serif)] text-2xl font-bold text-[var(--color-primary)]">
            Check Your Email
          </h2>
          <p className="text-sm text-[var(--color-text-secondary)]">
            We sent a confirmation link to{" "}
            <span className="font-medium text-[var(--color-text)]">{email}</span>.
            Click the link in your email to activate your account.
          </p>
          <div className="pt-2 space-y-3">
            <button
              onClick={() => {
                setConfirmationSent(false);
                setEmail("");
                setPassword("");
              }}
              className="w-full py-2 border border-[var(--color-border)] text-[var(--color-text-secondary)] rounded-[var(--radius-sm)] text-sm font-medium hover:bg-[var(--color-primary-light)] transition-colors"
            >
              Use a different email
            </button>
            <p className="text-xs text-[var(--color-text-tertiary)]">
              Didn&apos;t receive it? Check your spam folder or try again.
            </p>
          </div>
          <p className="text-sm text-[var(--color-text-secondary)] pt-2">
            Already confirmed?{" "}
            <Link href="/sign-in" className="text-[var(--color-accent)] hover:underline">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-center">
      <form onSubmit={handleSignUp} className="w-full max-w-sm space-y-4">
        <h2 className="font-[family-name:var(--font-serif)] text-2xl font-bold text-[var(--color-primary)] text-center">
          Create Account
        </h2>
        {error && (
          <p className="text-sm text-[var(--color-error)] text-center">{error}</p>
        )}
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full px-3 py-2 border border-[var(--color-border)] rounded-[var(--radius-sm)] text-sm"
        />
        <input
          type="password"
          placeholder="Password (min 6 characters)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
          className="w-full px-3 py-2 border border-[var(--color-border)] rounded-[var(--radius-sm)] text-sm"
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 bg-[var(--color-primary)] text-[var(--color-text-inverse)] rounded-[var(--radius-sm)] text-sm font-medium disabled:opacity-50"
        >
          {loading ? "Creating account..." : "Sign Up"}
        </button>
        <p className="text-sm text-center text-[var(--color-text-secondary)]">
          Already have an account?{" "}
          <Link href="/sign-in" className="text-[var(--color-accent)] hover:underline">
            Sign In
          </Link>
        </p>
      </form>
    </div>
  );
}
