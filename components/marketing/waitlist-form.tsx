"use client";

import { useState, useRef } from "react";

interface WaitlistFormProps {
  buttonText: string;
  variant: "hero" | "cta";
}

export function WaitlistForm({ buttonText, variant }: WaitlistFormProps) {
  const [submitted, setSubmitted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const originalText = buttonText;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!inputRef.current?.value) return;

    setSubmitted(true);
    inputRef.current.value = "";

    setTimeout(() => {
      setSubmitted(false);
    }, 3000);
  }

  const isHero = variant === "hero";

  return (
    <form
      onSubmit={handleSubmit}
      className={`flex w-full max-w-[480px] ${
        isHero ? "flex-col sm:flex-row" : "flex-col sm:flex-row"
      }`}
      style={{ gap: 0 }}
    >
      <input
        ref={inputRef}
        type="email"
        placeholder="Enter your email"
        required
        className={`flex-1 font-[family-name:var(--font-body)] text-[15px] outline-none transition-[border-color] duration-300 ${
          isHero
            ? "px-6 py-4 bg-[var(--color-mkt-surface)] text-[var(--color-mkt-text)] border border-[var(--color-mkt-border)] focus:border-[var(--color-mkt-accent)] placeholder:text-[var(--color-mkt-border-muted)] sm:border-r-0 border-b-0 sm:border-b"
            : "px-6 py-[18px] text-[var(--color-mkt-text-inverse)] border border-[rgba(253,252,250,0.12)] focus:border-[var(--color-mkt-accent)] placeholder:text-[rgba(253,252,250,0.3)] sm:border-r-0 border-b-0 sm:border-b"
        }`}
        style={
          isHero
            ? {}
            : { background: "rgba(253,252,250,0.06)" }
        }
      />
      <button
        type="submit"
        className={`font-[family-name:var(--font-body)] text-[13px] font-semibold tracking-[0.1em] uppercase cursor-pointer whitespace-nowrap transition-all duration-300 ${
          isHero
            ? "px-8 py-4 border border-[var(--color-mkt-text)]"
            : "px-9 py-[18px] border"
        }`}
        style={
          submitted
            ? {
                background: "var(--color-mkt-success)",
                borderColor: "var(--color-mkt-success)",
                color: "var(--color-mkt-text-inverse)",
              }
            : isHero
              ? {
                  background: "var(--color-mkt-text)",
                  color: "var(--color-mkt-surface)",
                }
              : {
                  background: "var(--color-mkt-accent)",
                  borderColor: "var(--color-mkt-accent)",
                  color: "var(--color-mkt-darkest)",
                }
        }
      >
        {submitted ? "You\u2019re In" : originalText}
      </button>

    </form>
  );
}
