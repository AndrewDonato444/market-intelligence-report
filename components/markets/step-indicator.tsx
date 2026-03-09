"use client";

interface StepIndicatorProps {
  steps: string[];
  currentStep: number;
}

export function StepIndicator({ steps, currentStep }: StepIndicatorProps) {
  return (
    <div className="flex items-center justify-center gap-0 mb-8">
      {steps.map((label, i) => {
        const isActive = i === currentStep;
        const isComplete = i < currentStep;

        return (
          <div key={label} className="flex items-center">
            {i > 0 && (
              <div
                className={`w-12 h-0.5 ${
                  isComplete
                    ? "bg-[var(--color-accent)]"
                    : "bg-[var(--color-border)]"
                }`}
              />
            )}
            <div className="flex flex-col items-center gap-1">
              <div
                className={`w-3 h-3 rounded-full border-2 ${
                  isActive
                    ? "border-[var(--color-accent)] bg-[var(--color-accent)]"
                    : isComplete
                      ? "border-[var(--color-accent)] bg-[var(--color-accent)]"
                      : "border-[var(--color-border)] bg-[var(--color-surface)]"
                }`}
              />
              <span
                className={`font-[family-name:var(--font-sans)] text-xs whitespace-nowrap ${
                  isActive
                    ? "text-[var(--color-text)] font-medium"
                    : isComplete
                      ? "text-[var(--color-accent)]"
                      : "text-[var(--color-text-tertiary)]"
                }`}
              >
                {label}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
