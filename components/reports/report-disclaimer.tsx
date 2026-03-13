"use client";

import { DISCLAIMER_TEXT } from "@/lib/agents/report-assembler";

export function ReportDisclaimer() {
  return (
    <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-md)] px-4 py-3">
      <p className="font-[family-name:var(--font-sans)] text-xs text-[var(--color-text-secondary)] leading-relaxed">
        {DISCLAIMER_TEXT}
      </p>
    </div>
  );
}
