"use client";

import { useState } from "react";
import Link from "next/link";

interface HowToContentProps {
  hasMarkets: boolean;
  hasReports: boolean;
  hasKit: boolean;
}

// --- Checklist ---

function QuickStartChecklist({
  hasMarkets,
  hasReports,
  hasKit,
}: {
  hasMarkets: boolean;
  hasReports: boolean;
  hasKit: boolean;
}) {
  const items = [
    { label: "Define at least one market", complete: hasMarkets },
    { label: "Generate your first report", complete: hasReports },
    { label: "Explore your Content Studio", complete: hasKit },
  ];

  return (
    <div
      data-testid="quick-start-checklist"
      className="bg-[var(--color-app-surface)] border border-[var(--color-app-border)] rounded-[var(--radius-lg)] shadow-[var(--shadow-sm)] p-[var(--spacing-6)]"
    >
      <p className="font-[family-name:var(--font-body)] text-sm font-semibold uppercase tracking-wider text-[var(--color-app-text-secondary)] mb-[var(--spacing-4)]">
        Your Progress
      </p>
      <ul className="space-y-[var(--spacing-3)]">
        {items.map((item) => (
          <li
            key={item.label}
            className="flex items-center gap-[var(--spacing-3)] font-[family-name:var(--font-body)] text-base"
          >
            {item.complete ? (
              <span
                data-testid="checklist-complete"
                className="text-[var(--color-app-accent)] flex-shrink-0"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </span>
            ) : (
              <span
                data-testid="checklist-incomplete"
                className="text-[var(--color-app-text-secondary)] opacity-40 flex-shrink-0"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10" />
                </svg>
              </span>
            )}
            <span className={item.complete ? "text-[var(--color-app-text)]" : "text-[var(--color-app-text-secondary)]"}>
              {item.label}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// --- Step Card ---

function StepCard({
  number,
  title,
  description,
  ctaText,
  ctaHref,
  disabled,
  testId,
}: {
  number: number;
  title: string;
  description: string;
  ctaText: string;
  ctaHref?: string;
  disabled?: boolean;
  testId: string;
}) {
  return (
    <div
      data-testid={testId}
      className="bg-[var(--color-app-surface)] border border-[var(--color-app-border)] rounded-[var(--radius-lg)] shadow-[var(--shadow-sm)] p-[var(--spacing-6)]"
    >
      <div className="flex items-start gap-[var(--spacing-4)]">
        <span className="font-[family-name:var(--font-display)] text-2xl font-semibold text-[var(--color-app-accent)] flex-shrink-0 leading-none mt-1">
          {number}
        </span>
        <div className="flex-1 min-w-0">
          <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold text-[var(--color-app-text)] mb-[var(--spacing-2)]">
            {title}
          </h2>
          <p className="font-[family-name:var(--font-body)] text-base text-[var(--color-app-text-secondary)] leading-relaxed mb-[var(--spacing-4)]">
            {description}
          </p>
          {disabled ? (
            <span className="inline-block font-[family-name:var(--font-body)] text-sm font-medium text-[var(--color-app-text-secondary)] bg-[var(--color-app-border)] px-[var(--spacing-4)] py-[var(--spacing-2)] rounded-[var(--radius-md)]">
              {ctaText}
            </span>
          ) : (
            <Link
              href={ctaHref || "#"}
              className="inline-block font-[family-name:var(--font-body)] text-sm font-medium text-[var(--color-app-surface)] bg-[var(--color-app-accent)] hover:opacity-90 px-[var(--spacing-4)] py-[var(--spacing-2)] rounded-[var(--radius-md)] transition-opacity duration-[var(--duration-default)]"
            >
              {ctaText}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

// --- FAQ Accordion ---

const faqItems = [
  {
    question: "How long does a report take to generate?",
    answer:
      "Most reports are created in less than 10 minutes. Some may take longer depending on the amount of data being processed. The analysis engine examines recent transactions, market dynamics, and competitive positioning to produce a publication-quality document.",
  },
  {
    question: "What data sources power the analysis?",
    answer:
      "The platform draws from multiple real estate data providers, public records, and market news sources. Data is cross-referenced and validated to ensure accuracy and relevance to your specific market.",
  },
  {
    question: "Can I customize which sections appear in my report?",
    answer:
      "Each report is structured around the key sections that matter most to luxury market advisors: executive summary, market analysis, competitive landscape, and forward outlook. Section emphasis adapts to your market's characteristics.",
  },
  {
    question: "What are client personas and how do they shape my report?",
    answer:
      "During report creation, you can select up to three client personas — profiles like the Relocating Executive or the Seasonal Second-Home Buyer. The analysis engine tailors insights, talking points, and narrative framing to match each persona's priorities, so your intelligence speaks directly to the clients you serve.",
  },
  {
    question: "What is the Content Studio?",
    answer:
      "Each completed report powers a Content Studio — ready-to-post social media content and targeted email campaigns distilled from your market intelligence. Content is organized by platform and persona, so you can publish with confidence across LinkedIn, Instagram, and email.",
  },
];

function FaqAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div data-testid="faq-section">
      <h2 className="font-[family-name:var(--font-body)] text-lg font-semibold text-[var(--color-app-text)] mb-[var(--spacing-4)]">
        Common Questions
      </h2>
      <div className="border-t border-[var(--color-app-border)]">
        {faqItems.map((item, idx) => {
          const isOpen = openIndex === idx;
          return (
            <div key={idx} className="border-b border-[var(--color-app-border)]">
              <button
                onClick={() => setOpenIndex(isOpen ? null : idx)}
                className="w-full flex items-center justify-between py-[var(--spacing-4)] text-left font-[family-name:var(--font-body)] text-base font-medium text-[var(--color-app-text)] hover:text-[var(--color-app-accent)] transition-colors duration-[var(--duration-default)]"
                aria-expanded={isOpen}
              >
                {item.question}
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={`flex-shrink-0 ml-[var(--spacing-2)] text-[var(--color-app-text-secondary)] transition-transform duration-[var(--duration-default)] ${isOpen ? "rotate-180" : ""}`}
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>
              <div
                data-testid="faq-answer"
                aria-hidden={!isOpen}
                hidden={!isOpen}
                className="pb-[var(--spacing-4)]"
              >
                <p className="font-[family-name:var(--font-body)] text-sm text-[var(--color-app-text-secondary)] leading-relaxed">
                  {item.answer}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// --- Main Content Component ---

export function HowToContent({ hasMarkets, hasReports, hasKit }: HowToContentProps) {
  return (
    <div className="max-w-2xl mx-auto space-y-[var(--spacing-8)]">
      {/* Header */}
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold text-[var(--color-app-text)] mb-[var(--spacing-2)]">
          Getting Started
        </h1>
        <p className="font-[family-name:var(--font-body)] text-base text-[var(--color-app-text-secondary)]">
          Your guide to creating market intelligence that positions you as the
          authority your clients expect.
        </p>
      </div>

      {/* Checklist */}
      <QuickStartChecklist hasMarkets={hasMarkets} hasReports={hasReports} hasKit={hasKit} />

      {/* Steps */}
      <div className="space-y-[var(--spacing-6)]">
        <StepCard
          number={1}
          title="Define Your Market"
          description="Every great market brief starts with a clearly defined territory. Set your geographic focus, price range, and property types so the analysis speaks directly to your clients' interests."
          ctaText={hasMarkets ? "View Your Markets" : "Define Your First Market"}
          ctaHref={hasMarkets ? "/markets" : "/markets/new"}
          testId="step-1"
        />
        <StepCard
          number={2}
          title="Generate Your Report"
          description="Our analysis engine examines recent transactions, market trends, and competitive dynamics to produce a publication-quality intelligence brief — typically in under five minutes."
          ctaText={
            hasReports ? "Create Another Report" : "Generate Your First Report"
          }
          ctaHref="/reports/create"
          testId="step-2"
        />
        <StepCard
          number={3}
          title="Activate Your Content Studio"
          description="Each report powers a Content Studio — ready-to-post social content and email campaigns that position you as the market authority your clients expect."
          ctaText={
            hasReports
              ? "Open Content Studio"
              : "Coming after your first report"
          }
          ctaHref={hasReports ? "/content-studio" : undefined}
          disabled={!hasReports}
          testId="step-3"
        />
      </div>

      {/* FAQ */}
      <FaqAccordion />
    </div>
  );
}
