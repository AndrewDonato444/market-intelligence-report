"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { label: "Volume", href: "/admin/analytics" },
  { label: "Geographic", href: "/admin/analytics/geographic" },
  { label: "Users", href: "/admin/analytics/users" },
  { label: "Performance", href: "/admin/analytics/performance" },
];

export function AnalyticsNav() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-[var(--spacing-1)] border-b border-[var(--color-border)] pb-[var(--spacing-2)]" aria-label="Analytics sections">
      {TABS.map((tab) => {
        const isActive = tab.href === "/admin/analytics"
          ? pathname === "/admin/analytics"
          : pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`px-[var(--spacing-3)] py-[var(--spacing-2)] rounded-t-[var(--radius-sm)] text-sm font-medium transition-colors ${
              isActive
                ? "bg-[var(--color-surface)] text-[var(--color-primary)] border-b-2 border-[var(--color-primary)]"
                : "text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface)]"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
