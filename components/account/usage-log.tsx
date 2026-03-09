interface UsageLogEntry {
  id: string;
  provider: string;
  endpoint: string;
  cost: string;
  responseTimeMs: number | null;
  cached: number;
  createdAt: string;
}

interface UsageLogProps {
  entries: UsageLogEntry[];
}

function formatCost(cost: string): string {
  const num = parseFloat(cost);
  if (num === 0) return "cached";
  return `$${num.toFixed(4)}`;
}

function formatTime(ms: number | null): string {
  if (ms === null) return "-";
  return `${ms}ms`;
}

function shortenEndpoint(endpoint: string): string {
  if (endpoint.length <= 25) return endpoint;
  return endpoint.slice(0, 22) + "...";
}

export function UsageLog({ entries }: UsageLogProps) {
  const cardClass =
    "bg-[var(--color-surface)] rounded-[var(--radius-md)] shadow-[var(--shadow-sm)] p-6";
  const headingClass =
    "font-[family-name:var(--font-serif)] text-xl font-bold text-[var(--color-primary)]";
  const accentLine = "w-12 h-0.5 bg-[var(--color-accent)] mt-3 mb-6";

  if (entries.length === 0) {
    return (
      <div className={cardClass}>
        <h2 className={headingClass}>Recent API Calls</h2>
        <div className={accentLine} />
        <p className="font-[family-name:var(--font-sans)] text-sm text-[var(--color-text-secondary)]">
          No API calls recorded yet.
        </p>
      </div>
    );
  }

  return (
    <div className={cardClass}>
      <h2 className={headingClass}>Recent API Calls</h2>
      <div className={accentLine} />

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--color-border)]">
              <th className="text-left py-2 font-[family-name:var(--font-sans)] font-medium text-[var(--color-text-tertiary)] text-xs uppercase tracking-wider">
                Provider
              </th>
              <th className="text-left py-2 font-[family-name:var(--font-sans)] font-medium text-[var(--color-text-tertiary)] text-xs uppercase tracking-wider">
                Endpoint
              </th>
              <th className="text-right py-2 font-[family-name:var(--font-sans)] font-medium text-[var(--color-text-tertiary)] text-xs uppercase tracking-wider">
                Cost
              </th>
              <th className="text-right py-2 font-[family-name:var(--font-sans)] font-medium text-[var(--color-text-tertiary)] text-xs uppercase tracking-wider">
                Time
              </th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <tr
                key={entry.id}
                className="border-b border-[var(--color-border)] last:border-0"
              >
                <td className="py-2 font-[family-name:var(--font-sans)] text-[var(--color-text)]">
                  {entry.provider}
                </td>
                <td className="py-2 font-[family-name:var(--font-mono)] text-xs text-[var(--color-text-secondary)]">
                  {shortenEndpoint(entry.endpoint)}
                </td>
                <td className="py-2 text-right font-[family-name:var(--font-mono)] text-[var(--color-text)]">
                  {formatCost(entry.cost)}
                </td>
                <td className="py-2 text-right font-[family-name:var(--font-sans)] text-[var(--color-text-secondary)]">
                  {formatTime(entry.responseTimeMs)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
