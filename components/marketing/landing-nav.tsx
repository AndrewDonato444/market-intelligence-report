"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const NAV_LINKS = [
  { label: "How It Works", href: "#how-it-works" },
  { label: "The Report", href: "#the-report" },
  { label: "Pricing", href: "#pricing" },
];

export function LandingNav() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

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
      <div className="max-w-6xl mx-auto px-[var(--spacing-6)] py-[var(--spacing-4)] flex items-center justify-between">
        {/* Logo */}
        <Link
          href="/"
          className={`font-[family-name:var(--font-playfair)] text-base transition-colors duration-[var(--duration-default)] shrink-0 ${
            scrolled
              ? "text-[var(--color-primary)]"
              : "text-[var(--color-text-inverse)]"
          }`}
        >
          Modern Signal Advisory
        </Link>

        {/* Center links — hidden on mobile */}
        <div className="hidden md:flex items-center gap-[var(--spacing-8)]">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className={`font-[family-name:var(--font-inter)] text-sm transition-colors duration-[var(--duration-default)] ${
                scrolled
                  ? "text-[var(--color-text-secondary)] hover:text-[var(--color-primary)]"
                  : "text-[var(--color-text-tertiary)] hover:text-[var(--color-text-inverse)]"
              }`}
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-[var(--spacing-4)]">
          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className={`md:hidden font-[family-name:var(--font-inter)] text-sm transition-colors duration-[var(--duration-default)] ${
              scrolled
                ? "text-[var(--color-text-secondary)]"
                : "text-[var(--color-text-tertiary)]"
            }`}
            aria-label="Toggle navigation"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              {mobileOpen ? (
                <path d="M5 5l10 10M15 5L5 15" />
              ) : (
                <path d="M3 6h14M3 10h14M3 14h14" />
              )}
            </svg>
          </button>

          {/* Sign In */}
          <Link
            href="/sign-in"
            className={`hidden md:inline-block font-[family-name:var(--font-inter)] text-sm transition-colors duration-[var(--duration-default)] ${
              scrolled
                ? "text-[var(--color-text-secondary)] hover:text-[var(--color-primary)]"
                : "text-[var(--color-text-tertiary)] hover:text-[var(--color-text-inverse)]"
            }`}
          >
            Sign In
          </Link>

          {/* CTA */}
          <Link
            href="/sign-up"
            className="hidden md:inline-block font-[family-name:var(--font-inter)] text-sm font-medium transition-all duration-[var(--duration-default)] bg-[var(--color-accent)] text-[var(--color-primary)] px-5 py-2 rounded-[var(--radius-sm)] hover:bg-[var(--color-accent-hover)]"
          >
            Commission a Report
          </Link>
        </div>
      </div>

      {/* Mobile dropdown */}
      {mobileOpen && (
        <div className="md:hidden bg-[var(--color-report-bg)] border-t border-[var(--color-border)] px-[var(--spacing-6)] py-[var(--spacing-4)] space-y-3">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className="block font-[family-name:var(--font-inter)] text-sm text-[var(--color-text-secondary)]"
            >
              {link.label}
            </a>
          ))}
          <Link
            href="/sign-in"
            onClick={() => setMobileOpen(false)}
            className="block font-[family-name:var(--font-inter)] text-sm text-[var(--color-text-secondary)]"
          >
            Sign In
          </Link>
          <Link
            href="/sign-up"
            onClick={() => setMobileOpen(false)}
            className="block font-[family-name:var(--font-inter)] text-sm font-medium text-[var(--color-accent)]"
          >
            Commission a Report
          </Link>
        </div>
      )}
    </nav>
  );
}
