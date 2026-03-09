interface UsageSummaryCardsProps {
  totalCost: number;
  totalCalls: number;
  cacheHitRate: number;
}

export function UsageSummaryCards({
  totalCost,
  totalCalls,
  cacheHitRate,
}: UsageSummaryCardsProps) {
  const cards = [
    {
      label: "Total Cost",
      value: `$${totalCost.toFixed(2)}`,
    },
    {
      label: "API Calls",
      value: `${totalCalls}`,
    },
    {
      label: "Cache Hit Rate",
      value: `${Math.round(cacheHitRate)}%`,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className="bg-[var(--color-surface)] rounded-[var(--radius-md)] shadow-[var(--shadow-sm)] p-5 text-center"
        >
          <p className="font-[family-name:var(--font-sans)] text-2xl font-bold text-[var(--color-primary)]">
            {card.value}
          </p>
          <p className="font-[family-name:var(--font-sans)] text-xs font-medium text-[var(--color-text-tertiary)] uppercase tracking-wider mt-1">
            {card.label}
          </p>
        </div>
      ))}
    </div>
  );
}
