import Link from "next/link";
import { LandingNav } from "@/components/marketing/landing-nav";

const CREDIBILITY_STATS = [
  { value: "31", label: "Market indicators tracked per report" },
  { value: "8", label: "Buyer personas with dedicated intelligence lenses" },
  { value: "<2 min", label: "From brief to finished report in your inbox" },
  { value: "10", label: "Sections of strategic intelligence per edition" },
];

const GAP_ROWS = [
  {
    theirs: "A PDF of MLS stats any portal could generate",
    ours: "Proprietary indexes no other agent in your market publishes",
  },
  {
    theirs: "Generic commentary hedged into meaninglessness",
    ours: "Analytical positions your client\u2019s wealth manager will reference",
  },
  {
    theirs: "Positions the agent as a data courier",
    ours: "Your name on the cover as the advisor who commissioned the intelligence",
  },
];

const PROCESS_STEPS = [
  {
    number: "01",
    title: "Brief your market and your client",
    description:
      "Select your geography, choose 1\u20133 client personas, enter your name and your client\u2019s name. Three screens. Under 90 seconds. No research required.",
  },
  {
    number: "02",
    title: "AI agents synthesize the market",
    description:
      "Four specialized agents analyze your market\u2019s full transaction record \u2014 scoring market health across four dimensions, modeling forecasts with explicit confidence ratings, and drafting editorial narrative grounded in real data.",
  },
  {
    number: "03",
    title: "A publication with your name on the cover",
    description:
      "A designed PDF arrives in your inbox \u2014 branded to you, attributed to your client, with your own strategic recommendation pre-drafted for you to customize. Hand it over. Watch how the room changes.",
  },
];

const REPORT_SECTIONS = [
  {
    title: "Strategic Overview & Insights Index",
    description:
      "Headline metrics with confidence ratings across key market forces",
  },
  {
    title: "Executive Summary & Market Matrix",
    description:
      "Segment-by-segment performance with intelligence ratings from A+ to C",
  },
  {
    title: "Key Market Drivers",
    description:
      "Five strategic themes shaping your specific market right now",
  },
  {
    title: "Neighborhood Intelligence",
    description:
      "Micro-market patterns, amenity analysis, and hyperlocal trends",
  },
  {
    title: "The Narrative",
    description:
      "AI editorial analysis that connects the data into a coherent market story",
  },
  {
    title: "Competitive Positioning",
    description:
      "Your market benchmarked against peer luxury markets nationwide",
  },
  {
    title: "Forward Outlook & Forecasts",
    description:
      "Confidence-rated projections with base case scenarios and timing advice",
  },
  {
    title: "Strategic Summary",
    description:
      "Key stats recap with actionable positioning recommendations",
  },
  {
    title: "Methodology & Data Sources",
    description:
      "Transparent methodology so your clients trust the numbers behind the narrative",
  },
  {
    title: "About the Advisor",
    description:
      "Your credentials, market focus, and advisory philosophy — authored by you",
  },
];

const TESTIMONIALS = [
  {
    quote:
      "I handed this to a $7M buyer who\u2019d been working with me for three months without committing. His first words after reading the Narrative section were: \u2018This is exactly what I needed to stop overthinking it.\u2019 We were under contract four days later.",
    name: "Marcus Trevino",
    brokerage: "Sotheby\u2019s International Realty",
    market: "Naples, FL",
  },
  {
    quote:
      "My clients\u2019 wealth manager reached out to me directly after receiving the report. He asked if I could send him the next edition for his own file. That has never happened to me in 14 years of selling luxury real estate.",
    name: "Jennifer Langford",
    brokerage: "Douglas Elliman",
    market: "Miami Beach, FL",
  },
  {
    quote:
      "The confidence ratings section alone changed how I handle listing presentations. When I explain that the forecast is a 7/10 \u2014 not a 9/10 \u2014 and here\u2019s why, sellers stop asking me to justify my price recommendation. The honesty does the work.",
    name: "David Kessler",
    brokerage: "The Agency",
    market: "Aspen, CO",
  },
];

const PRICING_INCLUDES = [
  "Full 10-section intelligence report as a designed PDF",
  "Market Insights Index with confidence ratings",
  "Persona-lensed analysis for 1\u20133 buyer profiles",
  "Advisor\u2019s Strategic Benchmark \u2014 your name on the cover",
  "Pre-written, customizable Strategic Brief",
  "Report stored in your dashboard for 12 months",
];

export default function Home() {
  return (
    <main className="min-h-screen">
      <LandingNav />

      {/* ── Hero ── */}
      <section
        data-testid="hero-section"
        className="relative min-h-screen flex items-center bg-[var(--color-primary)]"
      >
        <div className="absolute inset-0 bg-[var(--color-primary)] opacity-85" />

        <div className="relative z-10 max-w-6xl mx-auto px-[var(--spacing-6)] w-full flex flex-col md:flex-row items-center gap-12 md:gap-16 py-24">
          {/* Left: Copy */}
          <div className="md:w-1/2 text-center md:text-left">
            <p className="font-[family-name:var(--font-inter)] text-xs uppercase tracking-[0.2em] text-[var(--color-accent)] mb-[var(--spacing-6)]">
              Luxury Market Intelligence
            </p>

            <h1 className="font-[family-name:var(--font-playfair)] text-3xl md:text-5xl font-light text-[var(--color-text-inverse)] leading-tight">
              Walk into the room as the advisor who brought the research.
            </h1>

            <div
              data-testid="accent-line"
              className="w-20 h-0.5 bg-[var(--color-accent)] mx-auto md:mx-0 mt-[var(--spacing-6)]"
            />

            <p className="font-[family-name:var(--font-inter)] text-lg text-[var(--color-text-tertiary)] mt-[var(--spacing-6)] max-w-lg mx-auto md:mx-0 leading-relaxed">
              AI-powered intelligence reports that give you institutional-grade
              analysis &mdash; branded to you, grounded in real transaction data,
              ready to hand to your most important clients.
            </p>

            <div className="flex flex-col sm:flex-row items-center md:items-start gap-4 mt-[var(--spacing-8)]">
              <Link
                href="/create"
                className="inline-block bg-[var(--color-accent)] text-[var(--color-primary)] font-[family-name:var(--font-inter)] text-sm font-medium uppercase tracking-widest px-8 py-3 rounded-[var(--radius-sm)] hover:bg-[var(--color-accent-hover)] transition-colors duration-[var(--duration-default)]"
              >
                Commission Your First Report
              </Link>
              <a
                href="#how-it-works"
                className="inline-flex items-center gap-1.5 text-[var(--color-accent)] font-[family-name:var(--font-inter)] text-sm hover:text-[var(--color-accent-hover)] transition-colors duration-[var(--duration-default)]"
              >
                See how it works
                <span aria-hidden="true">&rarr;</span>
              </a>
            </div>
          </div>

          {/* Right: Mock Report Card */}
          <div className="md:w-1/2 flex justify-center md:justify-end">
            <div
              data-testid="report-preview"
              className="bg-[var(--color-surface)] rounded-[var(--radius-md)] shadow-[var(--shadow-lg)] border-l-2 border-[var(--color-accent)] overflow-hidden w-full max-w-sm"
            >
              {/* Report Header */}
              <div className="bg-[var(--color-primary)] px-[var(--spacing-6)] py-[var(--spacing-4)]">
                <div className="font-[family-name:var(--font-inter)] text-[10px] text-[var(--color-accent)] uppercase tracking-widest">
                  Commissioned by Brian Knox &middot; Knox Brothers &middot; Compass
                </div>
                <div className="font-[family-name:var(--font-playfair)] text-sm text-[var(--color-text-inverse)] mt-1.5">
                  Naples Luxury Market Intelligence Report
                </div>
                <div className="font-[family-name:var(--font-inter)] text-[10px] text-[var(--color-text-tertiary)] mt-0.5">
                  Q1 2026 &middot; 34102 &middot; Investor &amp; Finance Lens
                </div>
              </div>

              {/* Four Dimension Scores */}
              <div className="px-[var(--spacing-6)] py-[var(--spacing-3)]">
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { label: "Liquidity", score: "8.4" },
                    { label: "Timing", score: "7.1" },
                    { label: "Risk Mgmt", score: "6.8" },
                    { label: "Value Opp.", score: "7.6" },
                  ].map((dim) => (
                    <div key={dim.label} className="bg-[var(--color-primary-light)] rounded-[var(--radius-sm)] p-2 text-center">
                      <div className="font-[family-name:var(--font-inter)] text-lg font-light text-[var(--color-accent)]">
                        {dim.score}
                      </div>
                      <div className="font-[family-name:var(--font-inter)] text-[9px] text-[var(--color-text-secondary)] mt-0.5 leading-tight">
                        {dim.label}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Segment Table */}
              <div className="px-[var(--spacing-6)] pb-[var(--spacing-4)]">
                <div className="space-y-2">
                  {[
                    { segment: "Waterfront SFH $5M+", grade: "A+", rec: "Strong seller leverage" },
                    { segment: "Golf Community $1M\u2013$3M", grade: "B+", rec: "Balanced conditions" },
                    { segment: "High-Rise Condo $2M+", grade: "B\u2013", rec: "Elevated inventory" },
                  ].map((row) => (
                    <div key={row.segment} className="flex items-center gap-2">
                      <span className="font-[family-name:var(--font-inter)] text-xs font-semibold text-[var(--color-accent)] w-6 shrink-0">
                        {row.grade}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="font-[family-name:var(--font-inter)] text-xs text-[var(--color-primary)] font-medium truncate">
                          {row.segment}
                        </div>
                        <div className="font-[family-name:var(--font-inter)] text-[10px] text-[var(--color-text-secondary)]">
                          {row.rec}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Footer bar */}
              <div className="bg-[var(--color-primary-light)] px-[var(--spacing-6)] py-[var(--spacing-2)] flex items-center justify-between">
                <span className="font-[family-name:var(--font-inter)] text-[10px] text-[var(--color-text-secondary)]">
                  Commissioned by Brian Knox
                </span>
                <span className="font-[family-name:var(--font-inter)] text-[10px] text-[var(--color-text-tertiary)]">
                  Powered by Modern Signal Advisory
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Credibility Strip ── */}
      <section
        data-testid="data-callouts"
        className="bg-[var(--color-surface)] py-[var(--spacing-10)] border-b border-[var(--color-border)]"
      >
        <div className="max-w-5xl mx-auto px-[var(--spacing-6)] flex flex-wrap items-center justify-center gap-8 md:gap-16 lg:gap-24">
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

      {/* ── The Gap ── */}
      <section className="bg-[var(--color-report-bg)] py-[var(--spacing-16)]">
        <div className="max-w-5xl mx-auto px-[var(--spacing-6)]">
          <h2 className="font-[family-name:var(--font-playfair)] text-2xl md:text-3xl text-[var(--color-primary)] text-center leading-tight">
            Your clients make $1M decisions.{" "}
            <br className="hidden md:block" />
            The market update you&rsquo;re sending them doesn&rsquo;t reflect
            that.
          </h2>
          <div className="w-16 h-0.5 bg-[var(--color-accent)] mx-auto mt-[var(--spacing-4)]" />

          <p className="font-[family-name:var(--font-inter)] text-base text-[var(--color-text-secondary)] text-center mt-[var(--spacing-6)] max-w-2xl mx-auto leading-relaxed">
            The luxury advisor who keeps clients for decades isn&rsquo;t the one
            with the most listings. It&rsquo;s the one who shows up as the most
            informed person in the room &mdash; every time.
          </p>

          <div className="mt-[var(--spacing-12)]">
            {/* Column headers */}
            <div className="hidden md:grid md:grid-cols-2 gap-8 mb-[var(--spacing-6)]">
              <div className="font-[family-name:var(--font-inter)] text-xs uppercase tracking-[0.2em] text-[var(--color-text-tertiary)]">
                What most agents deliver
              </div>
              <div className="font-[family-name:var(--font-inter)] text-xs uppercase tracking-[0.2em] text-[var(--color-accent)]">
                What Modern Signal delivers
              </div>
            </div>

            {/* Rows */}
            <div className="space-y-6">
              {GAP_ROWS.map((row) => (
                <div
                  key={row.theirs}
                  className="flex flex-col md:grid md:grid-cols-2 gap-3 md:gap-8"
                >
                  <div className="flex items-start gap-3">
                    <span className="text-[var(--color-text-tertiary)] text-sm mt-0.5 shrink-0">
                      &times;
                    </span>
                    <p className="font-[family-name:var(--font-inter)] text-base text-[var(--color-text-tertiary)]">
                      {row.theirs}
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-4 h-0.5 bg-[var(--color-accent)] mt-2.5 shrink-0" />
                    <p className="font-[family-name:var(--font-inter)] text-base text-[var(--color-text)] font-medium">
                      {row.ours}
                    </p>
                  </div>
                </div>
              ))}
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
            From raw data to finished publication.
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
        </div>
      </section>

      {/* ── The Report ── */}
      <section
        id="the-report"
        data-testid="report-breakdown"
        className="bg-[var(--color-primary)] py-[var(--spacing-16)] scroll-mt-16"
      >
        <div className="max-w-5xl mx-auto px-[var(--spacing-6)]">
          <h2 className="font-[family-name:var(--font-playfair)] text-2xl md:text-3xl text-[var(--color-text-inverse)] text-center">
            Ten sections. Zero filler.
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

      {/* ── Testimonials ── */}
      <section
        data-testid="testimonials"
        className="bg-[var(--color-report-bg)] py-[var(--spacing-16)]"
      >
        <div className="max-w-5xl mx-auto px-[var(--spacing-6)]">
          <h2 className="font-[family-name:var(--font-playfair)] text-2xl md:text-3xl text-[var(--color-primary)] text-center">
            The room changed.
          </h2>
          <div className="w-16 h-0.5 bg-[var(--color-accent)] mx-auto mt-[var(--spacing-4)]" />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-[var(--spacing-12)]">
            {TESTIMONIALS.map((t, i) => (
              <div key={i} className="space-y-4">
                <div className="w-8 h-0.5 bg-[var(--color-accent)]" />
                <p className="font-[family-name:var(--font-playfair)] text-base text-[var(--color-primary)] italic leading-relaxed">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <div>
                  <div className="font-[family-name:var(--font-inter)] text-sm font-medium text-[var(--color-primary)]">
                    {t.name}
                  </div>
                  <div className="font-[family-name:var(--font-inter)] text-xs text-[var(--color-text-secondary)]">
                    {t.brokerage}
                  </div>
                  <div className="font-[family-name:var(--font-inter)] text-xs text-[var(--color-text-tertiary)]">
                    {t.market}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section
        id="pricing"
        data-testid="pricing"
        className="bg-[var(--color-surface)] py-[var(--spacing-16)] scroll-mt-16"
      >
        <div className="max-w-3xl mx-auto px-[var(--spacing-6)] text-center">
          <h2 className="font-[family-name:var(--font-playfair)] text-2xl md:text-3xl text-[var(--color-primary)]">
            One report. One relationship redefined.
          </h2>
          <div className="w-16 h-0.5 bg-[var(--color-accent)] mx-auto mt-[var(--spacing-4)]" />

          <p className="font-[family-name:var(--font-inter)] text-base text-[var(--color-text-secondary)] mt-[var(--spacing-6)] max-w-lg mx-auto leading-relaxed">
            Consider what&rsquo;s at stake in the meeting where you hand this
            over. A single retained client at the luxury tier is worth multiples
            of the cost &mdash; for years.
          </p>

          <div className="mt-[var(--spacing-12)]">
            <div className="font-[family-name:var(--font-playfair)] text-5xl md:text-6xl text-[var(--color-accent)] font-light">
              $500
            </div>
            <p className="font-[family-name:var(--font-inter)] text-base text-[var(--color-text-secondary)] mt-[var(--spacing-2)]">
              per report
            </p>
            <p className="font-[family-name:var(--font-inter)] text-sm text-[var(--color-text-tertiary)]">
              no subscription required
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 mt-[var(--spacing-10)] max-w-md mx-auto text-left">
            {PRICING_INCLUDES.map((item) => (
              <div key={item} className="flex items-start gap-2">
                <div className="w-4 h-0.5 bg-[var(--color-accent)] mt-2.5 shrink-0" />
                <span className="font-[family-name:var(--font-inter)] text-sm text-[var(--color-text-secondary)]">
                  {item}
                </span>
              </div>
            ))}
          </div>

          <p className="font-[family-name:var(--font-inter)] text-sm text-[var(--color-text-tertiary)] mt-[var(--spacing-6)]">
            Founding advisor rate &middot; Quarterly subscription: $1,497/quarter
          </p>

          <Link
            href="/create"
            className="inline-block mt-[var(--spacing-8)] bg-[var(--color-accent)] text-[var(--color-primary)] font-[family-name:var(--font-inter)] text-sm font-medium uppercase tracking-widest px-8 py-3 rounded-[var(--radius-sm)] hover:bg-[var(--color-accent-hover)] transition-colors duration-[var(--duration-default)]"
          >
            Commission Your Report
          </Link>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section
        data-testid="closing-statement"
        className="relative min-h-[60vh] flex items-center justify-center bg-[var(--color-primary-hover)]"
      >
        <div className="absolute inset-0 bg-[var(--color-primary)] opacity-90" />

        <div className="relative z-10 text-center max-w-2xl mx-auto px-[var(--spacing-6)]">
          <h2 className="font-[family-name:var(--font-playfair)] text-2xl md:text-3xl font-light text-[var(--color-text-inverse)] leading-tight">
            Your market expertise is real.
            <br />
            Prove it in the room.
          </h2>

          <div className="w-20 h-0.5 bg-[var(--color-accent)] mx-auto mt-[var(--spacing-6)]" />

          <p className="font-[family-name:var(--font-inter)] text-base text-[var(--color-text-tertiary)] mt-[var(--spacing-6)] max-w-lg mx-auto leading-relaxed">
            The advisor who brought the research desk to the table doesn&rsquo;t
            lose clients to competitors who seem smarter. Generate your first
            report in under two minutes.
          </p>

          <Link
            href="/create"
            className="inline-block mt-[var(--spacing-8)] bg-[var(--color-accent)] text-[var(--color-primary)] font-[family-name:var(--font-inter)] text-sm font-medium uppercase tracking-widest px-8 py-3 rounded-[var(--radius-sm)] hover:bg-[var(--color-accent-hover)] transition-colors duration-[var(--duration-default)]"
          >
            Commission Your Intelligence Report
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
