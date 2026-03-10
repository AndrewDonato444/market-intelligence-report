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
          ? "border-[var(--color-accent)] bg-[var(--color-accent-light)]"
          : isMaxed
            ? "border-[var(--color-border)] opacity-60 cursor-not-allowed"
            : "border-[var(--color-border)] hover:border-[var(--color-border-strong)]"
      }`}
    >
      {selectionOrder !== null && (
        <span
          data-testid={`selection-badge-${selectionOrder}`}
          className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center rounded-full bg-[var(--color-accent)] text-[var(--color-primary)] font-[family-name:var(--font-sans)] text-xs font-semibold"
        >
          {selectionOrder}
        </span>
      )}

      <h3
        data-testid="persona-name"
        className="font-[family-name:var(--font-serif)] text-lg font-semibold text-[var(--color-text)] pr-8"
      >
        {persona.name}
      </h3>

      <p className="font-[family-name:var(--font-sans)] text-xs text-[var(--color-text-secondary)] mt-1">
        {persona.tagline}
      </p>

      <span className="inline-block mt-2 px-2 py-0.5 rounded-full bg-[var(--color-primary-light)] font-[family-name:var(--font-sans)] text-xs text-[var(--color-text)]">
        {persona.primaryMotivation}
      </span>

      <div className="mt-3">
        <button
          type="button"
          onClick={handlePreview}
          className="font-[family-name:var(--font-sans)] text-xs text-[var(--color-accent)] underline cursor-pointer hover:text-[var(--color-accent-hover)] transition-colors duration-[var(--duration-default)]"
        >
          Preview
        </button>
      </div>
    </div>
  );
}
