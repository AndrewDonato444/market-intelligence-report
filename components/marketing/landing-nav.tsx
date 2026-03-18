"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const NAV_LINKS = [
  { label: "Platform", href: "#platform" },
  { label: "How It Works", href: "#flywheel" },
  { label: "Proof", href: "#proof" },
];

export function LandingNav() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 60);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 flex justify-between items-center transition-all duration-500 ${
        scrolled
          ? "bg-[rgba(247,244,239,0.92)] backdrop-blur-[20px] py-4 px-6 md:px-10 shadow-[0_1px_0_rgba(0,0,0,0.05)]"
          : "bg-transparent py-6 px-6 md:px-10"
      }`}
      style={{
        transitionTimingFunction: "var(--ease-mkt-out-quart)",
      }}
    >
      <Link
        href="/"
        className="font-[family-name:var(--font-display)] text-lg font-medium tracking-[0.12em] uppercase text-[var(--color-mkt-text)] no-underline"
      >
        Modern <span className="text-[var(--color-mkt-accent)]">Signal</span>{" "}
        Advisory
      </Link>

      {/* Desktop nav */}
      <ul className="hidden md:flex items-center gap-9 list-none">
        {NAV_LINKS.map((link) => (
          <li key={link.href}>
            <a
              href={link.href}
              className="font-[family-name:var(--font-body)] text-[13px] font-medium tracking-[0.06em] uppercase text-[var(--color-mkt-text-secondary)] no-underline hover:text-[var(--color-mkt-text)] transition-colors duration-300"
            >
              {link.label}
            </a>
          </li>
        ))}
        <li>
          <Link
            href="/sign-in"
            className="font-[family-name:var(--font-body)] text-[13px] font-medium tracking-[0.06em] uppercase text-[var(--color-mkt-text-secondary)] no-underline hover:text-[var(--color-mkt-text)] transition-colors duration-300"
          >
            Log In
          </Link>
        </li>
        <li>
          <Link
            href="/waitlist"
            className="font-[family-name:var(--font-body)] text-[13px] font-medium tracking-[0.08em] uppercase text-[var(--color-mkt-surface)] bg-[var(--color-mkt-text)] px-6 py-2.5 no-underline hover:bg-[var(--color-mkt-darkest)] transition-all duration-300"
          >
            Join the Waitlist
          </Link>
        </li>
      </ul>

      {/* Mobile hamburger */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="md:hidden text-[var(--color-mkt-text-secondary)]"
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

      {/* Mobile dropdown */}
      {mobileOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-[var(--color-mkt-bg)] border-t border-[var(--color-mkt-border)] px-6 py-4 space-y-3">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className="block font-[family-name:var(--font-body)] text-sm text-[var(--color-mkt-text-secondary)]"
            >
              {link.label}
            </a>
          ))}
          <Link
            href="/sign-in"
            onClick={() => setMobileOpen(false)}
            className="block font-[family-name:var(--font-body)] text-sm text-[var(--color-mkt-text-secondary)]"
          >
            Log In
          </Link>
          <Link
            href="/waitlist"
            onClick={() => setMobileOpen(false)}
            className="block font-[family-name:var(--font-body)] text-sm font-medium text-[var(--color-mkt-accent)]"
          >
            Join the Waitlist
          </Link>
        </div>
      )}
    </nav>
  );
}
