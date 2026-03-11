"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export function LandingNav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-colors duration-[var(--duration-default)] ease-[var(--ease-default)] ${
        scrolled
          ? "bg-[var(--color-report-bg)] border-b border-[var(--color-border)]"
          : "bg-transparent border-b border-transparent"
      }`}
    >
      <div className="max-w-5xl mx-auto px-[var(--spacing-6)] py-[var(--spacing-4)] flex items-center justify-between">
        <Link
          href="/"
          className={`font-[family-name:var(--font-playfair)] text-base transition-colors duration-[var(--duration-default)] ${
            scrolled
              ? "text-[var(--color-primary)]"
              : "text-[var(--color-text-inverse)]"
          }`}
        >
          Modern Signal Advisory
        </Link>

        <div className="flex items-center gap-[var(--spacing-6)]">
          <Link
            href="/sign-in"
            className={`font-[family-name:var(--font-inter)] text-sm transition-colors duration-[var(--duration-default)] ${
              scrolled
                ? "text-[var(--color-text-secondary)]"
                : "text-[var(--color-text-tertiary)]"
            }`}
          >
            Sign In
          </Link>
          <Link
            href="/sign-up"
            className={`font-[family-name:var(--font-inter)] text-sm font-medium transition-colors duration-[var(--duration-default)] ${
              scrolled
                ? "bg-[var(--color-accent)] text-[var(--color-primary)] px-4 py-1.5 rounded-[var(--radius-sm)] hover:bg-[var(--color-accent-hover)]"
                : "text-[var(--color-accent)] hover:text-[var(--color-accent-hover)]"
            }`}
          >
            Get Started
          </Link>
        </div>
      </div>
    </nav>
  );
}
