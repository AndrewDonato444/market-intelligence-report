"use client";

import { usePathname } from "next/navigation";
import { SettingsNav } from "@/components/layout/settings-nav";

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div>
      <h1 className="font-[family-name:var(--font-serif)] text-3xl font-bold text-[var(--color-primary)] mb-2">
        Settings
      </h1>
      <SettingsNav currentPath={pathname} />
      {children}
    </div>
  );
}
