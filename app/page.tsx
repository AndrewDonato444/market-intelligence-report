import Link from "next/link";
import { LandingNav } from "@/components/marketing/landing-nav";

const CREDIBILITY_STATS = [
  { value: "2,234", label: "Transactions analyzed per report" },
  { value: "$6.58B", label: "In luxury volume modeled" },
  { value: "31", label: "Market indicators tracked" },
];

const PAIN_POINTS = [
  {
    before: "Copy-pasting MLS stats into a Word doc",
    after: "An AI pipeline that synthesizes 2,000+ transactions into strategic narrative",
  },
  {
    before: "Generic market summaries anyone could write",
    after: "Persona-specific intelligence tailored to how your buyers think",
  },
  {
    before: "Reports your clients skim and forget",
    after: "A publication your clients keep, share, and reference",
  },
];

const PROCESS_STEPS = [
  {
    number: "01",
    title: "Define your market",
    description:
      "Select your geography, luxury tier, and target buyer personas. The platform adapts to your specific market — from Gulf Coast waterfront to Manhattan penthouses.",
  },
  {
    number: "02",
    title: "AI agents go to work",
    description:
      "Four specialized agents analyze transaction data, identify strategic themes, model forecasts, and craft editorial narrative — all grounded in real market data.",
  },
  {
    number: "03",
    title: "Publish and present",
    description:
      "Download a branded PDF with ten sections of strategic intelligence — ready for your next client meeting or listing presentation.",
  },
];

const REPORT_SECTIONS = [
  {
    title: "Strategic Overview & Insights Index",
    description: "Headline metrics with confidence ratings across key market forces",
  },
  {
    title: "Executive Summary & Market Matrix",
    description: "Segment-by-segment performance with intelligence ratings from A+ to C",
  },
  {
    title: "Key Market Drivers",
    description: "Five strategic themes shaping your specific market right now",
  },
  {
    title: "Neighborhood Intelligence",
    description: "Micro-market patterns, amenity analysis, and hyperlocal trends",
  },
  {
    title: "The Narrative",
    description: "AI editorial analysis that connects the data into a coherent market story",
  },
  {
    title: "Competitive Positioning",
    description: "Your market benchmarked against peer luxury markets nationwide",
  },
  {
    title: "Forward Outlook & Forecasts",
    description: "Confidence-rated projections with base case scenarios and timing advice",
  },
  {
    title: "Strategic Summary",
    description: "Key stats recap with actionable positioning recommendations",
  },
];

const PILLARS = [
  {
    title: "Proprietary Intelligence",
    description:
      "31 market indicators and composite indexes that provide conviction-grade insight. Not a data dump — a strategic framework.",
  },
  {
    title: "AI-Synthesized Narrative",
    description:
      "Four specialized agents transform raw transactions into the kind of market analysis that used to require a research team.",
  },
  {
    title: "Editorial Presentation",
    description:
      "Every report is designed for print. The kind of publication wealth managers and clients read cover to cover — not glance at and discard.",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen">
      <LandingNav />

      {/* ── Hero ── */}
      <section
        data-testid="hero-section"
        className="relative min-h-screen flex items-center justify-center bg-[var(--color-primary)]"
      >
        <div className="absolute inset-0 bg-[var(--color-primary)] opacity-85" />

        <div className="relative z-10 text-center max-w-3xl mx-auto px-[var(--spacing-6)]">
          <p className="font-[family-name:var(--font-inter)] text-xs uppercase tracking-[0.2em] text-[var(--color-accent)] mb-[var(--spacing-6)]">
            Luxury Market Intelligence
          </p>

          <h1 className="font-[family-name:var(--font-playfair)] text-3xl md:text-5xl font-light text-[var(--color-text-inverse)] leading-tight">
            The market report your clients
            <br />
            will actually read.
          </h1>

          <div
            data-testid="accent-line"
            className="w-20 h-0.5 bg-[var(--color-accent)] mx-auto mt-[var(--spacing-6)]"
          />

          <p className="font-[family-name:var(--font-inter)] text-lg text-[var(--color-text-tertiary)] mt-[var(--spacing-6)] max-w-lg mx-auto leading-relaxed">
            AI-powered intelligence reports that transform raw market data into strategic narrative — branded to you, ready to present.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-[var(--spacing-8)]">
            <a
              href="#how-it-works"
              className="inline-block bg-[var(--color-accent)] text-[var(--color-primary)] font-[family-name:var(--font-inter)] text-sm font-medium uppercase tracking-widest px-8 py-3 rounded-[var(--radius-sm)] hover:bg-[var(--color-accent-hover)] transition-colors duration-[var(--duration-default)]"
            >
              See How It Works
            </a>
            <Link
              href="/sign-up"
              className="inline-block text-[var(--color-text-tertiary)] font-[family-name:var(--font-inter)] text-sm uppercase tracking-widest px-8 py-3 rounded-[var(--radius-sm)] border border-[var(--color-text-tertiary)]/30 hover:border-[var(--color-text-tertiary)]/60 transition-colors duration-[var(--duration-default)]"
            >
              Request Access
            </Link>
          </div>
        </div>
      </section>

      {/* ── Credibility Bar ── */}
      <section
        data-testid="data-callouts"
        className="bg-[var(--color-surface)] py-[var(--spacing-10)] border-b border-[var(--color-border)]"
      >
        <div className="max-w-5xl mx-auto px-[var(--spacing-6)] flex flex-col md:flex-row items-center justify-center gap-12 md:gap-24">
          {CREDIBILITY_STATS.map((stat) => (
            <div
              key={stat.label}
              data-testid="data-callout"
              className="text-center"
            >
              <div className="font-[family-name:var(--font-playfair)] text-4xl md:text-5xl text-[var(--color-accent)]">
                {stat.value}
              </div>
              <div className="w-6 h-0.5 bg-[var(--color-accent)] mx-auto mt-[var(--spacing-3)]" />
              <p className="font-[family-name:var(--font-inter)] text-sm text-[var(--color-text-secondary)] mt-[var(--spacing-3)]">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── The Problem ── */}
      <section className="bg-[var(--color-report-bg)] py-[var(--spacing-16)]">
        <div className="max-w-4xl mx-auto px-[var(--spacing-6)]">
          <p className="font-[family-name:var(--font-inter)] text-xs uppercase tracking-[0.2em] text-[var(--color-accent)] text-center">
            The gap
          </p>
          <h2 className="font-[family-name:var(--font-playfair)] text-2xl md:text-3xl text-[var(--color-primary)] text-center mt-[var(--spacing-3)] leading-tight">
            Your market expertise deserves{" "}
            <br className="hidden md:block" />
            better packaging.
          </h2>
          <div className="w-16 h-0.5 bg-[var(--color-accent)] mx-auto mt-[var(--spacing-4)]" />

          <div className="mt-[var(--spacing-12)] space-y-8">
            {PAIN_POINTS.map((point) => (
              <div
                key={point.before}
                className="flex flex-col md:flex-row items-start gap-4 md:gap-8"
              >
                <div className="md:w-1/2 flex items-start gap-3">
                  <span className="text-[var(--color-text-tertiary)] text-sm mt-0.5 shrink-0">&times;</span>
                  <p className="font-[family-name:var(--font-inter)] text-base text-[var(--color-text-tertiary)] line-through decoration-[var(--color-text-tertiary)]/30">
                    {point.before}
                  </p>
                </div>
                <div className="md:w-1/2 flex items-start gap-3">
                  <div className="w-4 h-0.5 bg-[var(--color-accent)] mt-2.5 shrink-0" />
                  <p className="font-[family-name:var(--font-inter)] text-base text-[var(--color-text)]">
                    {point.after}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Editorial Showcase ── */}
      <section className="bg-[var(--color-report-bg)] py-[var(--spacing-16)]">
        <div className="max-w-5xl mx-auto px-[var(--spacing-6)] flex flex-col md:flex-row items-center gap-12 md:gap-16">
          <div className="md:w-1/2">
            <p className="font-[family-name:var(--font-inter)] text-xs uppercase tracking-[0.2em] text-[var(--color-accent)]">
              The product
            </p>
            <h2 className="font-[family-name:var(--font-playfair)] text-3xl text-[var(--color-primary)] leading-tight mt-[var(--spacing-3)]">
              A publication,
              <br />
              not a printout.
            </h2>
            <div className="w-10 h-0.5 bg-[var(--color-accent)] mt-[var(--spacing-4)]" />
            <p className="font-[family-name:var(--font-inter)] text-base text-[var(--color-text-secondary)] mt-[var(--spacing-6)] leading-relaxed">
              Every report blends editorial narrative, data visualization, and
              strategic intelligence into a data-rich PDF branded to you.
              The kind of document that backs up every claim with real
              transaction data.
            </p>
            <p className="font-[family-name:var(--font-inter)] text-sm text-[var(--color-text-tertiary)] mt-[var(--spacing-4)] leading-relaxed">
              10 sections. Confidence ratings. Competitive benchmarks. Buyer persona intelligence. Forward projections. All from one platform.
            </p>
          </div>

          <div className="md:w-1/2">
            <div
              data-testid="report-preview"
              className="bg-[var(--color-surface)] rounded-[var(--radius-md)] shadow-[var(--shadow-lg)] border-l-2 border-[var(--color-accent)] overflow-hidden"
            >
              {/* Report Header */}
              <div className="bg-[var(--color-primary)] px-[var(--spacing-6)] py-[var(--spacing-4)]">
                <div className="font-[family-name:var(--font-playfair)] text-xs text-[var(--color-accent)] uppercase tracking-widest">
                  Naples Intelligence Report
                </div>
                <div className="font-[family-name:var(--font-playfair)] text-sm text-[var(--color-text-inverse)] mt-1">
                  End of 2025 Edition
                </div>
              </div>
              {/* Report Body Preview */}
              <div className="px-[var(--spacing-6)] py-[var(--spacing-4)] space-y-4">
                <div>
                  <div className="font-[family-name:var(--font-playfair)] text-xs text-[var(--color-primary)] font-semibold uppercase tracking-wider">
                    Strategic Overview
                  </div>
                  <div className="mt-2 space-y-1.5">
                    <div className="h-1.5 bg-[var(--color-border)] rounded-full w-full" />
                    <div className="h-1.5 bg-[var(--color-border)] rounded-full w-4/5" />
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-1 bg-[var(--color-primary-light)] rounded-[var(--radius-sm)] p-3 text-center">
                    <div className="font-[family-name:var(--font-inter)] text-lg font-light text-[var(--color-accent)]">
                      9.3
                    </div>
                    <div className="font-[family-name:var(--font-inter)] text-[10px] text-[var(--color-text-secondary)] mt-0.5">
                      Liquidity Index
                    </div>
                  </div>
                  <div className="flex-1 bg-[var(--color-primary-light)] rounded-[var(--radius-sm)] p-3 text-center">
                    <div className="font-[family-name:var(--font-inter)] text-lg font-light text-[var(--color-success)]">
                      A+
                    </div>
                    <div className="font-[family-name:var(--font-inter)] text-[10px] text-[var(--color-text-secondary)] mt-0.5">
                      Ultra-Luxury
                    </div>
                  </div>
                  <div className="flex-1 bg-[var(--color-primary-light)] rounded-[var(--radius-sm)] p-3 text-center">
                    <div className="font-[family-name:var(--font-inter)] text-lg font-light text-[var(--color-accent)]">
                      +4.2%
                    </div>
                    <div className="font-[family-name:var(--font-inter)] text-[10px] text-[var(--color-text-secondary)] mt-0.5">
                      YoY Growth
                    </div>
                  </div>
                </div>
                <div>
                  <div className="font-[family-name:var(--font-playfair)] text-xs text-[var(--color-primary)] font-semibold uppercase tracking-wider">
                    Market Narrative
                  </div>
                  <div className="mt-2 space-y-1.5">
                    <div className="h-1.5 bg-[var(--color-border)] rounded-full w-full" />
                    <div className="h-1.5 bg-[var(--color-border)] rounded-full w-5/6" />
                    <div className="h-1.5 bg-[var(--color-border)] rounded-full w-3/5" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section
        id="how-it-works"
        data-testid="process-narrative"
        className="bg-[var(--color-surface)] py-[var(--spacing-16)] scroll-mt-16"
      >
        <div className="max-w-4xl mx-auto px-[var(--spacing-6)]">
          <p className="font-[family-name:var(--font-inter)] text-xs uppercase tracking-[0.2em] text-[var(--color-accent)] text-center">
            How it works
          </p>
          <h2 className="font-[family-name:var(--font-playfair)] text-2xl md:text-3xl text-[var(--color-primary)] text-center mt-[var(--spacing-3)]">
            From raw data to finished publication
          </h2>
          <div className="w-16 h-0.5 bg-[var(--color-accent)] mx-auto mt-[var(--spacing-4)]" />

          <div className="mt-[var(--spacing-12)] space-y-12 md:space-y-0 md:grid md:grid-cols-3 md:gap-12">
            {PROCESS_STEPS.map((step, i) => (
              <div key={step.number} className="relative">
                <div className="font-[family-name:var(--font-playfair)] text-5xl text-[var(--color-accent)]/20 font-light">
                  {step.number}
                </div>
                <div className="w-8 h-0.5 bg-[var(--color-accent)] mt-[var(--spacing-3)]" />
                <h3 className="font-[family-name:var(--font-inter)] font-semibold text-[var(--color-primary)] mt-[var(--spacing-3)] text-lg">
                  {step.title}
                </h3>
                <p className="font-[family-name:var(--font-inter)] text-sm text-[var(--color-text-secondary)] mt-[var(--spacing-2)] leading-relaxed">
                  {step.description}
                </p>
                {i < PROCESS_STEPS.length - 1 && (
                  <div
                    className="hidden md:block absolute top-8 -right-6 w-px h-16 bg-[var(--color-border)]"
                    aria-hidden="true"
                  />
                )}
              </div>
            ))}
          </div>

          <div className="text-center mt-[var(--spacing-12)]">
            <Link
              href="/sign-up"
              className="inline-block bg-[var(--color-accent)] text-[var(--color-primary)] font-[family-name:var(--font-inter)] text-sm font-medium uppercase tracking-widest px-8 py-3 rounded-[var(--radius-sm)] hover:bg-[var(--color-accent-hover)] transition-colors duration-[var(--duration-default)]"
            >
              Get Started
            </Link>
          </div>
        </div>
      </section>

      {/* ── Inside the Report ── */}
      <section
        data-testid="report-breakdown"
        className="bg-[var(--color-primary)] py-[var(--spacing-16)]"
      >
        <div className="max-w-5xl mx-auto px-[var(--spacing-6)]">
          <p className="font-[family-name:var(--font-inter)] text-xs uppercase tracking-[0.2em] text-[var(--color-accent)] text-center">
            What you get
          </p>
          <h2 className="font-[family-name:var(--font-playfair)] text-2xl md:text-3xl text-[var(--color-text-inverse)] text-center mt-[var(--spacing-3)]">
            Ten sections of strategic intelligence
          </h2>
          <div className="w-16 h-0.5 bg-[var(--color-accent)] mx-auto mt-[var(--spacing-4)]" />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-8 mt-[var(--spacing-12)]">
            {REPORT_SECTIONS.map((section, i) => (
              <div key={section.title} className="flex items-start gap-4">
                <span className="font-[family-name:var(--font-playfair)] text-sm text-[var(--color-accent)]/40 mt-0.5 shrink-0">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div>
                  <div className="font-[family-name:var(--font-inter)] font-medium text-[var(--color-text-inverse)]">
                    {section.title}
                  </div>
                  <p className="font-[family-name:var(--font-inter)] text-sm text-[var(--color-text-tertiary)] mt-1 leading-relaxed">
                    {section.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Intelligence Pillars ── */}
      <section
        data-testid="intelligence-pillars"
        className="bg-[var(--color-report-bg)] py-[var(--spacing-16)]"
      >
        <div className="max-w-5xl mx-auto px-[var(--spacing-6)]">
          <p className="font-[family-name:var(--font-inter)] text-xs uppercase tracking-[0.2em] text-[var(--color-accent)] text-center">
            Why it works
          </p>
          <h2 className="font-[family-name:var(--font-playfair)] text-2xl md:text-3xl text-[var(--color-primary)] text-center mt-[var(--spacing-3)]">
            Intelligence, not information
          </h2>
          <div className="w-16 h-0.5 bg-[var(--color-accent)] mx-auto mt-[var(--spacing-4)]" />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8 mt-[var(--spacing-12)]">
            {PILLARS.map((pillar) => (
              <div key={pillar.title} data-testid="pillar">
                <div className="w-8 h-0.5 bg-[var(--color-accent)]" />
                <h3 className="font-[family-name:var(--font-playfair)] text-xl text-[var(--color-primary)] mt-[var(--spacing-4)]">
                  {pillar.title}
                </h3>
                <p className="font-[family-name:var(--font-inter)] text-sm text-[var(--color-text-secondary)] mt-[var(--spacing-3)] leading-relaxed">
                  {pillar.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Closing CTA ── */}
      <section
        data-testid="closing-statement"
        className="relative min-h-[60vh] flex items-center justify-center bg-[var(--color-primary-hover)]"
      >
        <div className="absolute inset-0 bg-[var(--color-primary)] opacity-90" />

        <div className="relative z-10 text-center max-w-2xl mx-auto px-[var(--spacing-6)]">
          <h2 className="font-[family-name:var(--font-playfair)] text-2xl md:text-3xl font-light text-[var(--color-text-inverse)] leading-tight">
            Your market knowledge is the edge.
            <br />
            This is how you prove it.
          </h2>

          <div className="w-20 h-0.5 bg-[var(--color-accent)] mx-auto mt-[var(--spacing-6)]" />

          <p className="font-[family-name:var(--font-inter)] text-base text-[var(--color-text-tertiary)] mt-[var(--spacing-6)] max-w-md mx-auto leading-relaxed">
            Generate your first report in minutes. Branded to you, grounded in real data, ready to present.
          </p>

          <Link
            href="/sign-up"
            className="inline-block mt-[var(--spacing-8)] bg-[var(--color-accent)] text-[var(--color-primary)] font-[family-name:var(--font-inter)] text-sm font-medium uppercase tracking-widest px-8 py-3 rounded-[var(--radius-sm)] hover:bg-[var(--color-accent-hover)] transition-colors duration-[var(--duration-default)]"
          >
            Get Started
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
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
