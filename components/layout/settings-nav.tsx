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
    <nav className="flex gap-1 border-b border-[var(--color-app-border)] mb-6">
      {tabs.map((tab) => {
        const isActive = currentPath === tab.href || currentPath.startsWith(tab.href + "/");
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`px-4 py-2 text-sm font-[family-name:var(--font-body)] transition-colors duration-[var(--duration-default)] border-b-2 -mb-px ${
              isActive
                ? "font-medium text-[var(--color-app-text)] border-[var(--color-app-accent)]"
                : "text-[var(--color-app-text-secondary)] border-transparent hover:text-[var(--color-app-text)] hover:border-[var(--color-app-border)]"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
