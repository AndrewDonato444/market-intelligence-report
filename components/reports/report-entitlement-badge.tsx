"use client";

import { useState, useEffect } from "react";

type EntitlementState =
  | { status: "loading" }
  | { status: "loaded"; limit: number; used: number; remaining: number }
  | { status: "error" };

export function ReportEntitlementBadge() {
  const [state, setState] = useState<EntitlementState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;

    async function fetchEntitlement() {
      try {
        const res = await fetch("/api/entitlements/check?type=reports_per_month");
        if (!res.ok) {
          if (!cancelled) setState({ status: "error" });
          return;
        }
        const data = await res.json();
        if (!cancelled) {
          setState({
            status: "loaded",
            limit: data.limit,
            used: data.used,
            remaining: data.remaining,
          });
        }
      } catch {
        if (!cancelled) setState({ status: "error" });
      }
    }

    fetchEntitlement();
    return () => { cancelled = true; };
  }, []);

  if (state.status === "loading" || state.status === "error") return null;

  const { limit, used } = state;
  const isUnlimited = limit === -1;

  if (isUnlimited) {
    return (
      <div data-testid="report-entitlement-badge" className="mt-[var(--spacing-2)]">
        <div className="flex items-center gap-[var(--spacing-2)]">
          <div className="h-1.5 flex-1 rounded-full overflow-hidden bg-[var(--color-accent)]/10">
            <div
              className="h-full rounded-full"
              style={{
                width: "100%",
                background: "linear-gradient(90deg, var(--color-accent), var(--color-accent-hover), var(--color-accent))",
                backgroundSize: "200% 100%",
                animation: "shimmer 2.5s ease-in-out infinite",
              }}
            />
          </div>
          <span className="font-[family-name:var(--font-sans)] text-xs text-[var(--color-accent)] font-medium whitespace-nowrap">
            Unlimited
          </span>
        </div>
        <style>{`@keyframes shimmer { 0%, 100% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } }`}</style>
      </div>
    );
  }

  const safeUsed = Math.min(used, limit);
  const pct = limit > 0 ? Math.max(0, Math.min(100, (safeUsed / limit) * 100)) : 0;
  const isNearCap = limit > 0 && safeUsed >= Math.floor(limit * 0.8);

  // Credits reset on the 1st of next month
  const now = new Date();
  const resetDate = new Date(now.getFullYear(), now.getMonth() + 1, 1, 0, 1);
  const resetLabel = resetDate.toLocaleDateString("en-US", { month: "short", day: "numeric" });

  return (
    <div data-testid="report-entitlement-badge" className="mt-[var(--spacing-2)]">
      <div className="flex items-center gap-[var(--spacing-2)]">
        <div className="h-1.5 flex-1 rounded-full overflow-hidden bg-[var(--color-border)]">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${pct}%`,
              backgroundColor: isNearCap ? "var(--color-warning)" : "var(--color-accent)",
            }}
          />
        </div>
        <span className={`font-[family-name:var(--font-sans)] text-xs font-medium whitespace-nowrap ${
          isNearCap ? "text-[var(--color-warning)]" : "text-[var(--color-text-secondary)]"
        }`}>
          {safeUsed}/{limit}
        </span>
      </div>
      <p className="font-[family-name:var(--font-sans)] text-xs text-[var(--color-text-tertiary)] mt-0.5">
        Credits reset {resetLabel}
      </p>
    </div>
  );
}
