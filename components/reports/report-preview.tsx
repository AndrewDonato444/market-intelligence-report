"use client";

// --- Section data types ---

interface ReportSection {
  sectionType: string;
  title: string;
  content: unknown;
}

// --- Section Renderers ---

function MarketOverviewRenderer({
  content,
}: {
  content: {
    narrative?: string;
    highlights?: string[];
    recommendations?: string[];
  };
}) {
  return (
    <div className="space-y-3">
      {content.narrative && (
        <p className="font-[family-name:var(--font-sans)] text-sm text-[var(--color-text)] leading-relaxed">
          {content.narrative}
        </p>
      )}
      {content.highlights && content.highlights.length > 0 && (
        <div>
          <h4 className="font-[family-name:var(--font-sans)] text-xs font-semibold text-[var(--color-text-secondary)] uppercase mb-1">
            Highlights
          </h4>
          <ul className="list-disc list-inside space-y-1">
            {content.highlights.map((h, i) => (
              <li
                key={i}
                className="font-[family-name:var(--font-sans)] text-sm text-[var(--color-text)]"
              >
                {h}
              </li>
            ))}
          </ul>
        </div>
      )}
      {content.recommendations && content.recommendations.length > 0 && (
        <div>
          <h4 className="font-[family-name:var(--font-sans)] text-xs font-semibold text-[var(--color-text-secondary)] uppercase mb-1">
            Recommendations
          </h4>
          <ul className="list-disc list-inside space-y-1">
            {content.recommendations.map((r, i) => (
              <li
                key={i}
                className="font-[family-name:var(--font-sans)] text-sm text-[var(--color-text)]"
              >
                {r}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function KeyDriversRenderer({
  content,
}: {
  content: {
    themes?: Array<{
      name: string;
      impact: string;
      trend: string;
      narrative: string;
    }>;
  };
}) {
  const trendSymbol: Record<string, string> = {
    up: "\u2191",
    down: "\u2193",
    stable: "\u2192",
  };

  return (
    <div className="space-y-3">
      {content.themes?.map((theme, i) => (
        <div
          key={i}
          className="p-3 rounded-[var(--radius-sm)] border border-[var(--color-border)]"
        >
          <div className="flex items-center gap-2 mb-1">
            <span className="font-[family-name:var(--font-sans)] text-sm font-medium text-[var(--color-text)]">
              {theme.name}
            </span>
            <span className="font-[family-name:var(--font-sans)] text-xs text-[var(--color-text-secondary)]">
              {theme.impact} impact {trendSymbol[theme.trend] || ""}
            </span>
          </div>
          <p className="font-[family-name:var(--font-sans)] text-sm text-[var(--color-text)] leading-relaxed">
            {theme.narrative}
          </p>
        </div>
      ))}
    </div>
  );
}

function ForecastsRenderer({
  content,
}: {
  content: {
    projections?: Array<{
      segment: string;
      sixMonth: { medianPrice: number; confidence: string };
      twelveMonth: { medianPrice: number; confidence: string };
    }>;
    scenarios?: {
      base?: { narrative: string; medianPriceChange: number };
      bull?: { narrative: string; medianPriceChange: number };
      bear?: { narrative: string; medianPriceChange: number };
    };
  };
}) {
  function formatPrice(value: number): string {
    if (value >= 1_000_000) {
      return `$${(value / 1_000_000).toFixed(1)}M`;
    }
    return `$${value.toLocaleString()}`;
  }

  const scenarioLabels: Record<string, string> = {
    base: "Base Case",
    bull: "Bull Case",
    bear: "Bear Case",
  };

  return (
    <div className="space-y-4">
      {content.projections && content.projections.length > 0 && (
        <div>
          <h4 className="font-[family-name:var(--font-sans)] text-xs font-semibold text-[var(--color-text-secondary)] uppercase mb-2">
            Projections
          </h4>
          {content.projections.map((p, i) => (
            <div
              key={i}
              className="flex gap-4 text-sm font-[family-name:var(--font-sans)]"
            >
              <span className="text-[var(--color-text)] capitalize">
                {p.segment.replace("_", " ")}
              </span>
              <span className="text-[var(--color-text-secondary)]">
                6mo: {formatPrice(p.sixMonth.medianPrice)}
              </span>
              <span className="text-[var(--color-text-secondary)]">
                12mo: {formatPrice(p.twelveMonth.medianPrice)}
              </span>
            </div>
          ))}
        </div>
      )}
      {content.scenarios && (
        <div className="space-y-2">
          {(["base", "bull", "bear"] as const).map((key) => {
            const scenario = content.scenarios?.[key];
            if (!scenario) return null;
            return (
              <div
                key={key}
                className="p-3 rounded-[var(--radius-sm)] border border-[var(--color-border)]"
              >
                <span className="font-[family-name:var(--font-sans)] text-xs font-semibold text-[var(--color-text-secondary)] uppercase">
                  {scenarioLabels[key]}
                </span>
                <p className="font-[family-name:var(--font-sans)] text-sm text-[var(--color-text)] mt-1">
                  {scenario.narrative}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function NarrativeSectionRenderer({
  content,
}: {
  content: {
    narrative?: string;
    highlights?: string[];
    timing?: Record<string, string>;
  };
}) {
  return (
    <div className="space-y-3">
      {content.narrative && (
        <p className="font-[family-name:var(--font-sans)] text-sm text-[var(--color-text)] leading-relaxed">
          {content.narrative}
        </p>
      )}
      {content.highlights && content.highlights.length > 0 && (
        <ul className="list-disc list-inside space-y-1">
          {content.highlights.map((h, i) => (
            <li
              key={i}
              className="font-[family-name:var(--font-sans)] text-sm text-[var(--color-text)]"
            >
              {h}
            </li>
          ))}
        </ul>
      )}
      {content.timing && Object.keys(content.timing).length > 0 && (
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(content.timing).map(([key, value]) => (
            <div key={key} className="p-2 bg-[var(--color-background)] rounded-[var(--radius-sm)]">
              <span className="font-[family-name:var(--font-sans)] text-xs font-semibold text-[var(--color-text-secondary)] capitalize">
                {key}
              </span>
              <p className="font-[family-name:var(--font-sans)] text-sm text-[var(--color-text)]">
                {value}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function GenericSectionRenderer({ content }: { content: unknown }) {
  return (
    <pre className="font-[family-name:var(--font-mono)] text-xs text-[var(--color-text-secondary)] bg-[var(--color-background)] p-3 rounded-[var(--radius-sm)] overflow-auto max-h-64">
      {JSON.stringify(content, null, 2)}
    </pre>
  );
}

// --- Section Renderer ---

export function SectionRenderer({ section }: { section: ReportSection }) {
  const content = section.content as Record<string, unknown>;

  let body: React.ReactNode;
  switch (section.sectionType) {
    case "market_overview":
      body = <MarketOverviewRenderer content={content as any} />;
      break;
    case "key_drivers":
      body = <KeyDriversRenderer content={content as any} />;
      break;
    case "forecasts":
      body = <ForecastsRenderer content={content as any} />;
      break;
    case "executive_summary":
    case "strategic_summary":
      body = <NarrativeSectionRenderer content={content as any} />;
      break;
    default:
      body = <GenericSectionRenderer content={content} />;
      break;
  }

  return (
    <div className="bg-[var(--color-surface)] rounded-[var(--radius-md)] shadow-[var(--shadow-sm)] p-6">
      <h3 className="font-[family-name:var(--font-serif)] text-lg font-bold text-[var(--color-primary)] mb-1">
        {section.title}
      </h3>
      <div className="w-8 h-0.5 bg-[var(--color-accent)] mb-4" />
      {body}
    </div>
  );
}

// --- Report Preview ---

interface ReportPreviewProps {
  sections: ReportSection[];
}

export function ReportPreview({ sections }: ReportPreviewProps) {
  if (sections.length === 0) {
    return (
      <div className="bg-[var(--color-surface)] rounded-[var(--radius-md)] shadow-[var(--shadow-sm)] p-6 text-center">
        <p className="font-[family-name:var(--font-sans)] text-sm text-[var(--color-text-secondary)]">
          Report sections are being assembled. Check back shortly.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {sections.map((section, idx) => (
        <SectionRenderer key={`${section.sectionType}-${idx}`} section={section} />
      ))}
    </div>
  );
}
