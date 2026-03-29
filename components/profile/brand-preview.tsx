"use client";

interface BrandPreviewProps {
  company: string;
  colors: {
    primary?: string;
    secondary?: string;
    accent?: string;
  } | null;
}

const DEFAULT_COLORS = {
  primary: "#0F172A",
  secondary: "#CA8A04",
  accent: "#1E3A5F",
};

export function BrandPreview({ company, colors }: BrandPreviewProps) {
  const c = {
    primary: colors?.primary || DEFAULT_COLORS.primary,
    secondary: colors?.secondary || DEFAULT_COLORS.secondary,
    accent: colors?.accent || DEFAULT_COLORS.accent,
  };

  return (
    <div className="rounded-[var(--radius-sm)] border border-[var(--color-app-border)] overflow-hidden bg-[var(--color-report-bg,#FAFAF9)]">
      {/* Header bar */}
      <div
        className="px-4 py-3 flex items-center gap-3"
        style={{ backgroundColor: c.primary }}
      >
        <span
          className="font-[family-name:var(--font-sans)] text-sm font-bold tracking-wide uppercase"
          style={{ color: "#F8FAFC" }}
        >
          {company || "Your Company"}
        </span>
      </div>

      {/* Accent line */}
      <div className="h-0.5" style={{ backgroundColor: c.secondary }} />

      {/* Content preview */}
      <div className="p-4 space-y-3">
        <h3
          className="font-[family-name:var(--font-serif)] text-lg font-bold"
          style={{ color: c.primary }}
        >
          Market Intelligence Report
        </h3>

        <div className="flex items-baseline gap-2">
          <span
            className="font-[family-name:var(--font-sans)] text-2xl font-light"
            style={{ color: c.secondary }}
          >
            $8.7M
          </span>
          <span className="font-[family-name:var(--font-sans)] text-xs text-[var(--color-text-secondary)]">
            Median Sale Price
          </span>
        </div>

        <div className="flex gap-2 mt-2">
          <div
            className="h-1.5 rounded-full flex-1"
            style={{ backgroundColor: c.primary }}
          />
          <div
            className="h-1.5 rounded-full flex-1"
            style={{ backgroundColor: c.secondary }}
          />
          <div
            className="h-1.5 rounded-full flex-1"
            style={{ backgroundColor: c.accent }}
          />
        </div>
      </div>
    </div>
  );
}
