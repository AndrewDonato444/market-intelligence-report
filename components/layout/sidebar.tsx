"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReportEntitlementBadge } from "@/components/reports/report-entitlement-badge";

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: "grid" },
  { label: "Reports", href: "/reports", icon: "file-text" },
  { label: "Markets", href: "/markets", icon: "map-pin" },
  { label: "Settings", href: "/settings", icon: "settings" },
  { label: "How To", href: "/how-to", icon: "book-open" },
];

interface SidebarProps {
  isAdmin?: boolean;
}

const iconMap: Record<string, React.ReactNode> = {
  grid: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
    </svg>
  ),
  "book-open": (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </svg>
  ),
  "file-text": (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" />
    </svg>
  ),
  "map-pin": (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  ),
  settings: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  ),
  shield: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  ),
};

export function Sidebar({ isAdmin = false }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="w-60 bg-[var(--color-surface)] border-r border-[var(--color-border)] shrink-0 flex flex-col">
      <nav className="flex-1 flex flex-col p-[var(--spacing-3)]">
        <div
            className="rounded-[var(--radius-md)] p-[var(--spacing-3)] space-y-[var(--spacing-1)] mb-[var(--spacing-3)]"
            style={{
              backgroundColor: "var(--color-primary-light)",
              border: "1px solid var(--color-border)",
            }}
          >
            <span
              className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wide"
              style={{ backgroundColor: "var(--color-accent)", color: "#fff" }}
            >
              BETA
            </span>
            <p className="font-[family-name:var(--font-sans)] text-xs leading-snug" style={{ color: "var(--color-text-secondary)" }}>
              Some things may break. We&apos;re improving fast.
            </p>
            <a
              href="mailto:support@modernsignaladvisory.com"
              className="font-[family-name:var(--font-sans)] text-xs font-medium text-[var(--color-accent)] hover:underline"
            >
              Report an issue
            </a>
          </div>
        <ul className="space-y-[var(--spacing-1)]">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-[var(--spacing-3)] px-[var(--spacing-3)] py-[var(--spacing-2)] rounded-[var(--radius-sm)] font-[family-name:var(--font-sans)] text-sm transition-colors duration-[var(--duration-default)] ${
                    isActive
                      ? "bg-[var(--color-primary-light)] text-[var(--color-primary)] font-medium"
                      : "text-[var(--color-text-secondary)] hover:bg-[var(--color-primary-light)] hover:text-[var(--color-text)]"
                  }`}
                >
                  <span className={isActive ? "text-[var(--color-accent)]" : ""}>
                    {iconMap[item.icon]}
                  </span>
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
        <div
          className="mt-auto pt-[var(--spacing-3)] space-y-[var(--spacing-3)]"
        >
          <div className="px-[var(--spacing-1)]">
            <p className="font-[family-name:var(--font-sans)] text-xs font-medium text-[var(--color-text-secondary)] mb-[var(--spacing-1)]">
              Report Credits
            </p>
            <ReportEntitlementBadge />
          </div>
        </div>
      </nav>
      {isAdmin && (
        <div className="px-[var(--spacing-3)] pb-[var(--spacing-2)]">
          <Link
            href="/admin/users"
            className="flex items-center gap-[var(--spacing-3)] px-[var(--spacing-3)] py-[var(--spacing-2)] rounded-[var(--radius-sm)] font-[family-name:var(--font-sans)] text-sm transition-colors duration-[var(--duration-default)] text-[var(--color-accent)] hover:bg-[var(--color-primary-light)] font-medium"
          >
            <span>{iconMap.shield}</span>
            Admin
          </Link>
        </div>
      )}
      <div className="p-[var(--spacing-3)] border-t border-[var(--color-border)]">
        <p className="font-[family-name:var(--font-sans)] text-xs text-[var(--color-text-tertiary)]">
          Modern Signal Advisory
        </p>
      </div>
    </aside>
  );
}
