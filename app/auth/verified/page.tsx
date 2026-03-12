import Link from "next/link";

export default function EmailVerifiedPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-[var(--color-background)]">
      <div className="w-full max-w-md">
        <div className="text-center mb-[var(--spacing-8)]">
          <h1 className="font-[family-name:var(--font-serif)] text-2xl font-bold text-[var(--color-primary)]">
            Modern Signal Advisory
          </h1>
          <p className="font-[family-name:var(--font-sans)] text-sm text-[var(--color-text-secondary)] mt-[var(--spacing-1)]">
            Luxury Market Intelligence
          </p>
          <div className="w-24 h-0.5 bg-[var(--color-accent)] mx-auto mt-[var(--spacing-3)]" />
        </div>

        <div className="flex justify-center">
          <div className="w-full max-w-sm space-y-4 text-center">
            <div className="w-12 h-12 mx-auto rounded-full bg-[var(--color-success)]\/10 flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 text-[var(--color-success)]"
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
            <h2 className="font-[family-name:var(--font-serif)] text-2xl font-bold text-[var(--color-primary)]">
              Email Verified
            </h2>
            <p className="text-sm text-[var(--color-text-secondary)]">
              Your email has been confirmed. You can now sign in to your account.
            </p>
            <Link
              href="/sign-in"
              className="block w-full py-2 bg-[var(--color-primary)] text-[var(--color-text-inverse)] rounded-[var(--radius-sm)] text-sm font-medium text-center hover:bg-[var(--color-primary-hover)] transition-colors"
            >
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
