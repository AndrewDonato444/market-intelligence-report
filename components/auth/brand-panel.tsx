/**
 * Shared brand panel components for auth pages (sign-in, forgot-password, reset-password).
 */

export function BrandPanel() {
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

export function BrandPanelCompact() {
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
      </div>
    </div>
  );
}

export function MobileBrandHeader() {
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
