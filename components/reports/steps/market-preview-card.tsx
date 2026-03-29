"use client";

import React from "react";
import { motion } from "framer-motion";
import { DURATION_SLOW, EASING_DEFAULT } from "@/lib/animations";

interface MarketPreviewCardProps {
  city: string;
  state: string;
}

export function MarketPreviewCard({ city, state }: MarketPreviewCardProps) {
  return (
    <motion.div
      data-testid="market-preview-card"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: DURATION_SLOW, ease: EASING_DEFAULT }}
      className="mt-6 p-4 rounded-[var(--radius-md)] shadow-[var(--shadow-sm)] bg-[var(--color-app-accent-light)] border border-[var(--color-app-accent)]/20"
    >
      <div className="flex items-center gap-2">
        <svg
          className="w-4 h-4 text-[var(--color-app-accent)]"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
        <span className="font-[family-name:var(--font-display)] text-base font-semibold text-[var(--color-app-text)]">
          {city}, {state}
        </span>
      </div>
    </motion.div>
  );
}
