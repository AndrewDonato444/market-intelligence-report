"use client";

interface PersonaCardProps {
  persona: {
    id: string;
    name: string;
    slug: string;
    tagline: string;
    primaryMotivation: string;
  };
  isSelected: boolean;
  selectionOrder: number | null;
  isMaxed: boolean;
  onSelect: (id: string) => void;
  onPreview: (slug: string) => void;
}

export function PersonaCard({
  persona,
  isSelected,
  selectionOrder,
  isMaxed,
  onSelect,
  onPreview,
}: PersonaCardProps) {
  const handleClick = () => {
    onSelect(persona.id);
  };

  const handlePreview = (e: React.MouseEvent) => {
    e.stopPropagation();
    onPreview(persona.slug);
  };

  return (
    <div
      data-testid="persona-card"
      data-selected={isSelected ? "true" : "false"}
      onClick={handleClick}
      className={`relative p-4 rounded-[var(--radius-md)] border cursor-pointer transition-all duration-[var(--duration-default)] ${
        isSelected
          ? "border-[var(--color-app-accent)] bg-[var(--color-app-accent-light)]"
          : isMaxed
            ? "border-[var(--color-app-border)] opacity-60 cursor-not-allowed"
            : "border-[var(--color-app-border)] hover:border-[var(--color-app-border-strong)]"
      }`}
    >
      {selectionOrder !== null && (
        <span
          data-testid={`selection-badge-${selectionOrder}`}
          className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center rounded-full bg-[var(--color-app-accent)] text-[var(--color-app-text)] font-[family-name:var(--font-body)] text-xs font-semibold"
        >
          {selectionOrder}
        </span>
      )}

      <h3
        data-testid="persona-name"
        className="font-[family-name:var(--font-display)] text-lg font-semibold text-[var(--color-app-text)] pr-8"
      >
        {persona.name}
      </h3>

      <p className="font-[family-name:var(--font-body)] text-xs text-[var(--color-app-text-secondary)] mt-1">
        {persona.tagline}
      </p>

      <span className="inline-block mt-2 px-2 py-0.5 rounded-full bg-[var(--color-app-active-bg)] font-[family-name:var(--font-body)] text-xs text-[var(--color-app-text)]">
        {persona.primaryMotivation}
      </span>

      <div className="mt-3">
        <button
          type="button"
          onClick={handlePreview}
          className="font-[family-name:var(--font-body)] text-xs text-[var(--color-app-accent)] underline cursor-pointer hover:text-[var(--color-app-accent-hover)] transition-colors duration-[var(--duration-default)]"
        >
          Preview
        </button>
      </div>
    </div>
  );
}
