"use client";

interface CreationStepIndicatorProps {
  steps: string[];
  currentStep: number;
}

export function CreationStepIndicator({
  steps,
  currentStep,
}: CreationStepIndicatorProps) {
  return (
    <div className="flex items-center justify-center gap-0 mb-8">
      {steps.map((label, i) => {
        const isActive = i === currentStep;
        const isComplete = i < currentStep;

        return (
          <div key={label} className="flex items-center">
            {i > 0 && (
              <div
                className={`w-8 h-0.5 ${
                  isComplete
                    ? "bg-[var(--color-app-accent)]"
                    : "bg-[var(--color-app-border)]"
                }`}
              />
            )}
            <div className="flex flex-col items-center gap-1">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                  isActive
                    ? "border-2 border-[var(--color-app-accent)] bg-[var(--color-app-accent)] text-white"
                    : isComplete
                      ? "border-2 border-[var(--color-app-accent)] bg-[var(--color-app-accent)] text-white"
                      : "border-2 border-[var(--color-app-border)] bg-[var(--color-app-surface)] text-[var(--color-app-text-tertiary)]"
                }`}
              >
                {isComplete ? (
                  <svg
                    data-testid="step-check"
                    className="w-3 h-3"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={3}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                ) : (
                  <span>{i + 1}</span>
                )}
              </div>
              <span
                className={`font-[family-name:var(--font-body)] text-xs whitespace-nowrap ${
                  isActive
                    ? "text-[var(--color-app-accent)] font-semibold"
                    : isComplete
                      ? "text-[var(--color-app-accent)]"
                      : "text-[var(--color-app-text-tertiary)]"
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
