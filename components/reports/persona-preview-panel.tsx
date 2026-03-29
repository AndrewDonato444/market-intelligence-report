"use client";

interface PersonaForPreview {
  name: string;
  slug: string;
  profileOverview: string;
  whatWinsThem: string;
  biggestFear: string;
  narrativeFraming: {
    keyVocabulary: string[];
  } | null;
  reportMetrics: string[] | null;
  talkingPointTemplates: string[] | null;
}

interface PersonaPreviewPanelProps {
  persona: PersonaForPreview;
  onClose: () => void;
}

export function PersonaPreviewPanel({
  persona,
  onClose,
}: PersonaPreviewPanelProps) {
  const keyVocabulary = persona.narrativeFraming?.keyVocabulary ?? [];
  const reportMetrics = (persona.reportMetrics ?? []).slice(0, 3);
  const firstTemplate = persona.talkingPointTemplates?.[0];

  return (
    <div
      data-testid="persona-preview-panel"
      className="bg-[var(--color-app-bg)] rounded-[var(--radius-sm)] p-4 mt-4"
    >
      <h3 className="font-[family-name:var(--font-display)] text-xl font-semibold text-[var(--color-app-text)] uppercase">
        {persona.name}
      </h3>
      <div className="w-8 h-0.5 bg-[var(--color-app-accent)] mt-1 mb-3" />

      <p className="font-[family-name:var(--font-body)] text-sm text-[var(--color-app-text)]">
        {persona.profileOverview}
      </p>

      <p className="font-[family-name:var(--font-body)] text-xs font-medium text-[var(--color-app-text)] mt-3">
        <span className="font-semibold">What Wins Them:</span>{" "}
        {persona.whatWinsThem}
      </p>

      <p className="font-[family-name:var(--font-body)] text-xs text-[var(--color-app-text-secondary)] mt-1">
        <span className="font-semibold">Biggest Fear:</span>{" "}
        {persona.biggestFear}
      </p>

      {keyVocabulary.length > 0 && (
        <div className="mt-3">
          <p className="font-[family-name:var(--font-body)] text-xs uppercase text-[var(--color-app-text-tertiary)] tracking-wider font-medium mb-1">
            Key Vocabulary
          </p>
          <div className="flex flex-wrap gap-1">
            {keyVocabulary.map((word) => (
              <span
                key={word}
                className="px-2 py-0.5 border border-[var(--color-app-border)] rounded-full font-[family-name:var(--font-body)] text-xs text-[var(--color-app-text-secondary)]"
              >
                {word}
              </span>
            ))}
          </div>
        </div>
      )}

      {reportMetrics.length > 0 && (
        <div className="mt-3">
          <p className="font-[family-name:var(--font-body)] text-xs uppercase text-[var(--color-app-text-tertiary)] tracking-wider font-medium mb-1">
            Top Report Metrics
          </p>
          <ul className="list-disc list-inside">
            {reportMetrics.map((metric) => (
              <li
                key={metric}
                className="font-[family-name:var(--font-body)] text-xs text-[var(--color-app-text)]"
              >
                {metric}
              </li>
            ))}
          </ul>
        </div>
      )}

      {firstTemplate && (
        <div className="mt-3">
          <p className="font-[family-name:var(--font-body)] text-xs uppercase text-[var(--color-app-text-tertiary)] tracking-wider font-medium mb-1">
            Sample Talking Point
          </p>
          <p className="font-[family-name:var(--font-body)] text-xs text-[var(--color-app-text-secondary)] italic bg-[var(--color-app-surface)] p-2 rounded-[var(--radius-sm)]">
            &ldquo;{firstTemplate}&rdquo;
          </p>
        </div>
      )}

      <div className="mt-3">
        <button
          type="button"
          onClick={onClose}
          className="font-[family-name:var(--font-body)] text-xs text-[var(--color-app-text-tertiary)] cursor-pointer hover:text-[var(--color-app-text-secondary)] transition-colors duration-[var(--duration-default)]"
        >
          Close Preview
        </button>
      </div>
    </div>
  );
}
