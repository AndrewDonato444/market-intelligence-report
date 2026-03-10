"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { label: "Back to App", href: "/dashboard", icon: "arrow-left" },
  { label: "Eval Suite", href: "/admin/eval", icon: "beaker" },
  { label: "Data Sources", href: "/admin/data-sources", icon: "database" },
  { label: "Pipeline", href: "/admin/pipeline", icon: "pipeline" },
];

const iconMap: Record<string, React.ReactNode> = {
  "arrow-left": (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  ),
  beaker: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4.5 3h15" /><path d="M6 3v16a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V3" />
      <path d="M6 14h12" />
    </svg>
  ),
  database: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <ellipse cx="12" cy="5" rx="9" ry="3" />
      <path d="M3 5v14a9 3 0 0 0 18 0V5" />
      <path d="M3 12a9 3 0 0 0 18 0" />
    </svg>
  ),
  pipeline: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="6" height="5" rx="1" />
      <rect x="16" y="3" width="6" height="5" rx="1" />
      <rect x="9" y="16" width="6" height="5" rx="1" />
      <path d="M5 8v3a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8" />
      <path d="M12 13v3" />
    </svg>
  ),
};

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-60 bg-[var(--color-surface)] border-r border-[var(--color-border)] shrink-0 flex flex-col">
      <nav className="flex-1 p-[var(--spacing-3)]">
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
      </nav>
      <div className="p-[var(--spacing-3)] border-t border-[var(--color-border)]">
        <p className="font-[family-name:var(--font-sans)] text-xs text-[var(--color-text-tertiary)]">
          Modern Signal Advisory
        </p>
      </div>
    </aside>
  );
}
