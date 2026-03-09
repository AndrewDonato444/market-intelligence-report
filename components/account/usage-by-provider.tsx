interface ProviderData {
  provider: string;
  totalCost: number;
  callCount: number;
  cacheHits: number;
}

interface UsageByProviderProps {
  providers: ProviderData[];
}

export function UsageByProvider({ providers }: UsageByProviderProps) {
  const cardClass =
    "bg-[var(--color-surface)] rounded-[var(--radius-md)] shadow-[var(--shadow-sm)] p-6";
  const headingClass =
    "font-[family-name:var(--font-serif)] text-xl font-bold text-[var(--color-primary)]";
  const accentLine = "w-12 h-0.5 bg-[var(--color-accent)] mt-3 mb-6";

  if (providers.length === 0) {
    return (
      <div className={cardClass}>
        <h2 className={headingClass}>Usage by Provider</h2>
        <div className={accentLine} />
        <p className="font-[family-name:var(--font-sans)] text-sm text-[var(--color-text-secondary)]">
          No provider data available yet.
        </p>
      </div>
    );
  }

  return (
    <div className={cardClass}>
      <h2 className={headingClass}>Usage by Provider</h2>
      <div className={accentLine} />

      <div className="space-y-4">
        {providers.map((p) => {
          const cacheRate =
            p.callCount > 0
              ? Math.round((p.cacheHits / p.callCount) * 100)
              : 0;
          return (
            <div
              key={p.provider}
              className="flex items-center justify-between py-3 border-b border-[var(--color-border)] last:border-0"
            >
              <div>
                <p className="font-[family-name:var(--font-sans)] text-sm font-medium text-[var(--color-text)]">
                  {p.provider}
                </p>
                <p className="font-[family-name:var(--font-sans)] text-xs text-[var(--color-text-tertiary)] mt-0.5">
                  {p.callCount} calls &middot; {cacheRate}% cached
                </p>
              </div>
              <p className="font-[family-name:var(--font-mono)] text-sm font-medium text-[var(--color-primary)]">
                ${p.totalCost.toFixed(2)}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
