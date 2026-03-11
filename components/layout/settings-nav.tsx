"use client";

import Link from "next/link";

const tabs = [
  { label: "Profile", href: "/settings/profile" },
  { label: "Account", href: "/settings/account" },
];

interface SettingsNavProps {
  currentPath: string;
}

export function SettingsNav({ currentPath }: SettingsNavProps) {
  return (
    <nav className="flex gap-1 border-b border-[var(--color-border)] mb-6">
      {tabs.map((tab) => {
        const isActive = currentPath === tab.href || currentPath.startsWith(tab.href + "/");
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`px-4 py-2 text-sm font-[family-name:var(--font-sans)] transition-colors duration-[var(--duration-default)] border-b-2 -mb-px ${
              isActive
                ? "font-medium text-[var(--color-primary)] border-[var(--color-accent)]"
                : "text-[var(--color-text-secondary)] border-transparent hover:text-[var(--color-text)] hover:border-[var(--color-border)]"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
