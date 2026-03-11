export default function AccountInactivePage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-[var(--color-background)]">
      <div className="w-full max-w-md text-center">
        <h1 className="font-[family-name:var(--font-serif)] text-2xl font-bold text-[var(--color-primary)]">
          Modern Signal Advisory
        </h1>
        <p className="font-[family-name:var(--font-sans)] text-sm text-[var(--color-text-secondary)] mt-[var(--spacing-1)]">
          Luxury Market Intelligence
        </p>
        <div className="w-24 h-0.5 bg-[var(--color-accent)] mx-auto mt-[var(--spacing-3)]" />

        <div className="mt-[var(--spacing-8)] p-[var(--spacing-6)] bg-[var(--color-surface)] rounded-[var(--radius-lg)] shadow-[var(--shadow-md)]">
          <h2 className="font-[family-name:var(--font-serif)] text-xl font-semibold text-[var(--color-text)]">
            Your account is no longer active
          </h2>
          <p className="font-[family-name:var(--font-sans)] text-[var(--color-text-secondary)] mt-[var(--spacing-3)]">
            Please contact support if you believe this is an error.
          </p>
          <a
            href="mailto:support@modernsignaladvisory.com"
            className="inline-block mt-[var(--spacing-4)] text-[var(--color-primary)] font-medium hover:underline"
          >
            support@modernsignaladvisory.com
          </a>
        </div>
      </div>
    </main>
  );
}
