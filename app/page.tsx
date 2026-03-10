import Link from "next/link";
import { LandingNav } from "@/components/marketing/landing-nav";

const DATA_CALLOUTS = [
  { value: "31", label: "Proprietary market indicators" },
  { value: "7", label: "Specialized AI agents per report" },
  { value: "8", label: "Intelligence sections per report" },
];

const PILLARS = [
  {
    title: "Proprietary Intelligence",
    description:
      "Market indicators and indexes that provide conviction-grade insight — not just data.",
  },
  {
    title: "AI-Synthesized Narrative",
    description:
      "Seven specialized agents transform raw data into strategic market narrative with confidence ratings.",
  },
  {
    title: "Editorial Presentation",
    description:
      "Reports your clients and their wealth managers will read cover to cover.",
  },
];

const PROCESS_STEPS = [
  {
    number: "01",
    title: "Define",
    description: "Select your market and set the parameters.",
  },
  {
    number: "02",
    title: "Analyze",
    description: "Seven AI agents synthesize real data into strategic narrative.",
  },
  {
    number: "03",
    title: "Publish",
    description: "Download a branded PDF ready for your next advisory meeting.",
  },
];

const REPORT_SECTIONS = [
  {
    title: "Executive Summary",
    description: "Strategic market narrative distilled by AI, reviewed by you",
    highlight: false,
  },
  {
    title: "Market Overview",
    description: "Pricing, inventory, absorption, velocity",
    highlight: false,
  },
  {
    title: "Second Home Analysis",
    description: "Seasonal patterns and investment signals",
    highlight: false,
  },
  {
    title: "AI-Powered Forecasts",
    description: "Confidence-rated market projections",
    highlight: true,
  },
  {
    title: "Key Market Drivers",
    description: "The forces shaping price and velocity",
    highlight: false,
  },
  {
    title: "Competitive Analysis",
    description: "Peer market matrix with intelligence ratings",
    highlight: true,
  },
  {
    title: "Trending Insights",
    description: "Emerging patterns your competitors will miss",
    highlight: false,
  },
  {
    title: "Methodology",
    description: "Full transparency on sources and process",
    highlight: false,
  },
];

export default function Home() {
  return (
    <main className="min-h-screen">
      <LandingNav />

      {/* Hero Section */}
      <section
        data-testid="hero-section"
        className="relative min-h-screen flex items-center justify-center bg-[var(--color-primary)]"
      >
        <div className="absolute inset-0 bg-[var(--color-primary)] opacity-85" />

        <div className="relative z-10 text-center max-w-2xl mx-auto px-[var(--spacing-6)]">
          <h1 className="font-[family-name:var(--font-playfair)] text-3xl md:text-5xl font-light text-[var(--color-text-inverse)] leading-tight">
            31 Indicators.
            <br />
            One Conviction.
          </h1>

          <div
            data-testid="accent-line"
            className="w-20 h-0.5 bg-[var(--color-accent)] mx-auto mt-[var(--spacing-6)]"
          />

          <p className="font-[family-name:var(--font-inter)] text-lg text-[var(--color-text-tertiary)] mt-[var(--spacing-6)] max-w-md mx-auto leading-relaxed">
            The market intelligence platform that replaced guesswork with proof.
          </p>

          <Link
            href="/sign-up"
            className="inline-block mt-[var(--spacing-8)] bg-[var(--color-accent)] text-[var(--color-primary)] font-[family-name:var(--font-inter)] text-sm font-medium uppercase tracking-widest px-8 py-3 rounded-[var(--radius-sm)] hover:bg-[var(--color-accent-hover)] transition-colors duration-[var(--duration-default)]"
          >
            Request a Sample Report
          </Link>
        </div>
      </section>

      {/* Data Callouts */}
      <section
        data-testid="data-callouts"
        className="bg-[var(--color-surface)] py-[var(--spacing-16)]"
      >
        <div className="max-w-5xl mx-auto px-[var(--spacing-6)] flex flex-col md:flex-row items-center justify-center gap-16 md:gap-24">
          {DATA_CALLOUTS.map((callout) => (
            <div
              key={callout.value}
              data-testid="data-callout"
              className="text-center"
            >
              <div className="font-[family-name:var(--font-playfair)] text-5xl text-[var(--color-accent)]">
                {callout.value}
              </div>
              <div className="w-6 h-0.5 bg-[var(--color-accent)] mx-auto mt-[var(--spacing-3)]" />
              <p className="font-[family-name:var(--font-inter)] text-sm text-[var(--color-text-secondary)] mt-[var(--spacing-3)]">
                {callout.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Editorial Showcase */}
      <section className="bg-[var(--color-report-bg)] py-[var(--spacing-16)]">
        <div className="max-w-5xl mx-auto px-[var(--spacing-6)] flex flex-col md:flex-row items-center gap-12 md:gap-16">
          <div className="md:w-1/2">
            <h2 className="font-[family-name:var(--font-playfair)] text-3xl text-[var(--color-primary)] leading-tight">
              A publication, not a printout.
            </h2>
            <div className="w-10 h-0.5 bg-[var(--color-accent)] mt-[var(--spacing-4)]" />
            <p className="font-[family-name:var(--font-inter)] text-base text-[var(--color-text-secondary)] mt-[var(--spacing-6)] leading-relaxed">
              Every report is a magazine-quality market publication that blends
              editorial narrative, sophisticated data visualization, and
              strategic intelligence into a premium reading experience your
              clients will keep — not delete.
            </p>
          </div>

          <div className="md:w-1/2">
            <div
              data-testid="report-preview"
              className="bg-[var(--color-surface)] rounded-[var(--radius-md)] shadow-[var(--shadow-lg)] border-b-2 border-[var(--color-accent)] p-[var(--spacing-6)]"
            >
              <div className="space-y-4">
                <div className="font-[family-name:var(--font-playfair)] text-sm text-[var(--color-primary)] font-semibold">
                  Executive Summary
                </div>
                <div className="h-2 bg-[var(--color-border)] rounded-full w-full" />
                <div className="h-2 bg-[var(--color-border)] rounded-full w-4/5" />
                <div className="flex items-center gap-2 mt-3">
                  <div className="font-[family-name:var(--font-playfair)] text-sm text-[var(--color-primary)] font-semibold">
                    Market Matrix
                  </div>
                  <span className="text-[var(--color-accent)] text-xs">
                    &#9733;&#9733;&#9733;
                  </span>
                </div>
                <div className="h-2 bg-[var(--color-border)] rounded-full w-full" />
                <div className="h-2 bg-[var(--color-border)] rounded-full w-3/5" />
                <div className="font-[family-name:var(--font-playfair)] text-sm text-[var(--color-primary)] font-semibold mt-3">
                  Forecasts
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 bg-[var(--color-border)] rounded-full w-2/5" />
                  <span className="text-[var(--color-success)] text-xs font-[family-name:var(--font-inter)]">
                    &#8599; +4.2%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Intelligence Pillars */}
      <section
        data-testid="intelligence-pillars"
        className="bg-[var(--color-report-bg)] py-[var(--spacing-16)]"
      >
        <div className="max-w-5xl mx-auto px-[var(--spacing-6)] grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8">
          {PILLARS.map((pillar) => (
            <div key={pillar.title} data-testid="pillar">
              <div className="w-6 h-0.5 bg-[var(--color-accent)]" />
              <h3 className="font-[family-name:var(--font-playfair)] text-xl text-[var(--color-primary)] mt-[var(--spacing-4)]">
                {pillar.title}
              </h3>
              <p className="font-[family-name:var(--font-inter)] text-sm text-[var(--color-text-secondary)] mt-[var(--spacing-3)] leading-relaxed">
                {pillar.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Process Narrative */}
      <section
        data-testid="process-narrative"
        className="bg-[var(--color-report-bg)] py-[var(--spacing-16)]"
      >
        <div className="max-w-5xl mx-auto px-[var(--spacing-6)]">
          <h2 className="font-[family-name:var(--font-playfair)] text-2xl text-[var(--color-primary)] text-center">
            From market to publication
          </h2>
          <div className="w-16 h-0.5 bg-[var(--color-accent)] mx-auto mt-[var(--spacing-4)]" />

          <div className="flex flex-col md:flex-row items-start justify-center gap-12 md:gap-0 mt-[var(--spacing-12)]">
            {PROCESS_STEPS.map((step, i) => (
              <div
                key={step.number}
                className="flex flex-col md:flex-row items-start md:items-center flex-1"
              >
                <div className="flex flex-col items-start md:items-center text-left md:text-center flex-1">
                  <div className="font-[family-name:var(--font-playfair)] text-4xl text-[var(--color-accent)] font-light">
                    {step.number}
                  </div>
                  <div className="font-[family-name:var(--font-inter)] font-semibold text-[var(--color-primary)] mt-[var(--spacing-3)]">
                    {step.title}
                  </div>
                  <p className="font-[family-name:var(--font-inter)] text-sm text-[var(--color-text-secondary)] mt-[var(--spacing-2)]">
                    {step.description}
                  </p>
                </div>
                {i < PROCESS_STEPS.length - 1 && (
                  <div
                    className="hidden md:block w-12 h-px bg-[var(--color-border)] mx-4 mt-4 shrink-0"
                    aria-hidden="true"
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Report Breakdown */}
      <section
        data-testid="report-breakdown"
        className="bg-[var(--color-primary)] py-[var(--spacing-16)]"
      >
        <div className="max-w-5xl mx-auto px-[var(--spacing-6)]">
          <h2 className="font-[family-name:var(--font-playfair)] text-3xl text-[var(--color-text-inverse)] text-center">
            Inside every report
          </h2>
          <div className="w-16 h-0.5 bg-[var(--color-accent)] mx-auto mt-[var(--spacing-4)]" />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-8 mt-[var(--spacing-12)]">
            {REPORT_SECTIONS.map((section) => (
              <div key={section.title} className="flex items-start gap-3">
                <div className={`w-4 h-0.5 mt-2.5 shrink-0 ${section.highlight ? "bg-[var(--color-accent)]" : "bg-[var(--color-accent)]"}`} />
                <div>
                  <div className={`font-[family-name:var(--font-inter)] font-medium ${section.highlight ? "text-[var(--color-accent)]" : "text-[var(--color-text-inverse)]"}`}>
                    {section.title}
                  </div>
                  <p className="font-[family-name:var(--font-inter)] text-sm text-[var(--color-text-tertiary)] mt-1">
                    {section.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Closing Statement */}
      <section
        data-testid="closing-statement"
        className="relative min-h-[60vh] flex items-center justify-center bg-[var(--color-primary-hover)]"
      >
        <div className="absolute inset-0 bg-[var(--color-primary)] opacity-85" />

        <div className="relative z-10 text-center max-w-2xl mx-auto px-[var(--spacing-6)]">
          <h2 className="font-[family-name:var(--font-playfair)] text-3xl font-light text-[var(--color-text-inverse)] leading-tight">
            Your market deserves more
            <br />
            than a spreadsheet.
          </h2>

          <div className="w-20 h-0.5 bg-[var(--color-accent)] mx-auto mt-[var(--spacing-6)]" />

          <Link
            href="/sign-up"
            className="inline-block mt-[var(--spacing-8)] bg-[var(--color-accent)] text-[var(--color-primary)] font-[family-name:var(--font-inter)] text-sm font-medium uppercase tracking-widest px-8 py-3 rounded-[var(--radius-sm)] hover:bg-[var(--color-accent-hover)] transition-colors duration-[var(--duration-default)]"
          >
            Request a Sample Report
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[var(--color-primary)] py-[var(--spacing-8)]">
        <div className="text-center">
          <div className="font-[family-name:var(--font-playfair)] text-sm text-[var(--color-text-tertiary)]">
            Modern Signal Advisory
          </div>
          <div className="w-10 h-0.5 bg-[var(--color-accent)] mx-auto mt-[var(--spacing-3)]" />
          <div className="font-[family-name:var(--font-inter)] text-xs text-[var(--color-text-tertiary)] mt-[var(--spacing-3)]">
            2026 Modern Signal Advisory
          </div>
        </div>
      </footer>
    </main>
  );
}
