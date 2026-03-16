"use client";

import { Turnstile } from "@marsidev/react-turnstile";
import { useState } from "react";

interface TurnstileWidgetProps {
  onSuccess: (token: string) => void;
  onError?: () => void;
  onExpire?: () => void;
}

export function TurnstileWidget({
  onSuccess,
  onError,
  onExpire,
}: TurnstileWidgetProps) {
  const [error, setError] = useState(false);

  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  if (!siteKey) {
    // If no site key configured, skip Turnstile entirely (dev without keys)
    return null;
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-[var(--radius-sm)] px-[var(--spacing-3)] py-[var(--spacing-2)]">
        <p className="font-[family-name:var(--font-inter)] text-sm text-[var(--color-error)]">
          Security verification unavailable. Please refresh the page and try
          again.
        </p>
      </div>
    );
  }

  return (
    <Turnstile
      siteKey={siteKey}
      onSuccess={onSuccess}
      onError={() => {
        setError(true);
        onError?.();
      }}
      onExpire={() => {
        onExpire?.();
      }}
      options={{
        theme: "light",
        size: "invisible",
      }}
    />
  );
}
