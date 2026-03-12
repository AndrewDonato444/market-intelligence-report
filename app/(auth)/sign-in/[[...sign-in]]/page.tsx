"use client";

import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const confirmationError = searchParams.get("error") === "confirmation_failed";

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push("/dashboard");
  }

  return (
    <div className="flex justify-center">
      <form onSubmit={handleSignIn} className="w-full max-w-sm space-y-4">
        <h2 className="font-[family-name:var(--font-serif)] text-2xl font-bold text-[var(--color-primary)] text-center">
          Sign In
        </h2>
        {confirmationError && (
          <p className="text-sm text-[var(--color-error)] text-center">
            Email confirmation failed. Please try signing up again.
          </p>
        )}
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
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full px-3 py-2 border border-[var(--color-border)] rounded-[var(--radius-sm)] text-sm"
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 bg-[var(--color-primary)] text-[var(--color-text-inverse)] rounded-[var(--radius-sm)] text-sm font-medium disabled:opacity-50"
        >
          {loading ? "Signing in..." : "Sign In"}
        </button>
        <p className="text-sm text-center text-[var(--color-text-secondary)]">
          Don&apos;t have an account?{" "}
          <Link href="/sign-up" className="text-[var(--color-accent)] hover:underline">
            Sign Up
          </Link>
        </p>
      </form>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense>
      <SignInForm />
    </Suspense>
  );
}
