import Link from "next/link";
import { LandingNav } from "@/components/marketing/landing-nav";
import { MarketingScripts } from "@/components/marketing/marketing-scripts";

/* ── Data ── */

const STAT_CARDS = [
  {
    number: "85%",
    label:
      "of luxury agents have lost \u2014 or believe they have lost \u2014 a listing to an agent who appeared more sophisticated or credible.",
    source: "Compass Luxury Agent Survey, 2026",
  },
  {
    number: "60%",
    label:
      "do almost nothing for market intelligence. They know it\u2019s a gap. They don\u2019t have the system to fill it.",
    source: "Compass Luxury Agent Survey, 2026",
  },
  {
    number: "#1",
    label:
      "pain point: attracting clients instead of chasing them. Not a skills problem \u2014 an identity problem.",
    source: "Compass Luxury Agent Survey, 2026",
  },
];

const FLYWHEEL_STAGES = [
  {
    number: "01",
    name: "Intelligence",
    product: "Signal Report",
    desc: "Walk into a listing appointment with something no competitor has. Your first client win ignites everything that follows.",
  },
  {
    number: "02",
    name: "Performance",
    product: "Signal Report",
    desc: "A listing won. A buyer converted. A client who says you think about this differently. Performance turns subscribers into believers.",
  },
  {
    number: "03",
    name: "Visibility",
    product: "Signal Voice",
    desc: "Your intelligence published consistently builds authority. Prospects who have never met you already trust you. You stop chasing and start attracting.",
  },
];

/* ── Page ── */

export default function Home() {
  return (
    <main
      className="min-h-screen overflow-x-hidden"
      style={{
        fontFamily: "var(--font-body)",
        background: "var(--color-mkt-bg)",
        color: "var(--color-mkt-text)",
        lineHeight: 1.7,
        fontSize: "16px",
        WebkitFontSmoothing: "antialiased",
      }}
    >
      <LandingNav />

      {/* ── Hero ── */}
      <section
        data-testid="hero-section"
        className="relative min-h-screen flex flex-col justify-center items-center text-center overflow-hidden"
        style={{ padding: "140px 40px 100px" }}
      >
        {/* Subtle radial gradients */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 80% 60% at 50% 40%, rgba(184,151,90,0.06), transparent), radial-gradient(ellipse 60% 50% at 20% 80%, rgba(74,124,89,0.04), transparent)",
          }}
        />

        <div
          className="font-[family-name:var(--font-body)] text-xs font-medium tracking-[0.25em] uppercase text-[var(--color-mkt-accent)] mb-10"
          style={{
            opacity: 0,
            animation: "mktFadeUp 1s var(--ease-mkt-out-expo) 0.3s forwards",
          }}
        >
          The Intelligence Era of Real Estate
        </div>

        <h1
          className="font-[family-name:var(--font-display)] font-light text-[var(--color-mkt-text)] leading-[1.1] max-w-[900px] mb-4"
          style={{
            fontSize: "clamp(42px, 6vw, 80px)",
            opacity: 0,
            animation: "mktFadeUp 1.1s var(--ease-mkt-out-expo) 0.5s forwards",
          }}
        >
          Your market tells a story.
          <br />
          <em className="italic text-[var(--color-mkt-accent)]">
            Most agents can&rsquo;t tell it.
          </em>
        </h1>

        <p
          className="font-[family-name:var(--font-display)] font-light text-[var(--color-mkt-text-secondary)] max-w-[680px] leading-[1.5] mb-14"
          style={{
            fontSize: "clamp(20px, 2.5vw, 28px)",
            opacity: 0,
            animation: "mktFadeUp 1.1s var(--ease-mkt-out-expo) 0.7s forwards",
          }}
        >
          Modern Signal Advisory gives you the intelligence, the voice, and the
          system to tell it &mdash; with authority, in your words, every month
          without fail.
        </p>

        <div
          className="flex flex-col items-center gap-4"
          style={{
            opacity: 0,
            animation: "mktFadeUp 1s var(--ease-mkt-out-expo) 0.9s forwards",
          }}
        >
          <Link
            href="/waitlist"
            className="inline-block font-[family-name:var(--font-body)] text-[13px] font-semibold tracking-[0.1em] uppercase bg-[var(--color-mkt-text)] text-[var(--color-mkt-surface)] px-10 py-4 hover:bg-[var(--color-mkt-darkest)] transition-all duration-300"
          >
            Join the Waitlist
          </Link>
          <p className="text-[13px] text-[var(--color-mkt-border-muted)] tracking-[0.02em]">
            <strong className="text-[var(--color-mkt-text-secondary)] font-medium">
              Founding cohort
            </strong>{" "}
            &mdash; limited to 25 agents &middot;{" "}
            <span className="text-[var(--color-mkt-accent)] font-medium">
              7 spots remaining
            </span>
          </p>
        </div>

        {/* Scroll indicator */}
        <div
          className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
          style={{
            opacity: 0,
            animation: "mktFadeUp 1s var(--ease-mkt-out-expo) 1.3s forwards",
          }}
        >
          <div className="w-px h-10 bg-[var(--color-mkt-border-muted)] relative overflow-hidden">
            <div
              className="absolute left-0 w-full h-full bg-[var(--color-mkt-accent)]"
              style={{ animation: "mktScrollPulse 2s ease-in-out infinite" }}
            />
          </div>
        </div>
      </section>

      {/* ── Brand Statement ── */}
      <section
        data-testid="brand-statement"
        className="text-center relative"
        style={{
          padding: "120px 40px",
          background: "var(--color-mkt-dark)",
          color: "var(--color-mkt-text-inverse)",
        }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 70% 50% at 50% 50%, rgba(184,151,90,0.05), transparent)",
          }}
        />
        <div className="max-w-[1200px] mx-auto relative mkt-fade-in">
          <p
            className="font-[family-name:var(--font-display)] font-light leading-[1.6] max-w-[800px] mx-auto"
            style={{
              fontSize: "clamp(22px, 3vw, 34px)",
              color: "rgba(253,252,250,0.7)",
            }}
          >
            Real estate has an old playbook.{" "}
            <strong className="text-[var(--color-mkt-text-inverse)] font-normal">
              The intelligence era is here.
            </strong>{" "}
            Modern Signal Advisory builds the brand system to prove{" "}
            <em className="italic text-[var(--color-mkt-accent-light)]">
              you belong at the front of it.
            </em>
          </p>
        </div>
      </section>

      {/* ── The Opportunity ── */}
      <section
        data-testid="opportunity-section"
        id="opportunity"
        style={{ padding: "140px 40px" }}
      >
        <div className="max-w-[1200px] mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-20 items-start">
            <div className="mkt-fade-in">
              <div className="text-[11px] font-semibold tracking-[0.2em] uppercase text-[var(--color-mkt-accent)] mb-8">
                The Opportunity
              </div>
              <h2
                className="font-[family-name:var(--font-display)] font-light leading-[1.2] text-[var(--color-mkt-text)] mb-8"
                style={{ fontSize: "clamp(32px, 4vw, 48px)" }}
              >
                The listing goes to the agent who can say what no one else can.
              </h2>
              <p className="text-[17px] leading-[1.8] text-[var(--color-mkt-text-secondary)] max-w-[500px]">
                Luxury agents know what wins a listing: the ability to say
                something no other agent in the room can say. But building
                genuine market intelligence takes 15&ndash;20 hours a month.
                Producing content that reflects it takes another 10. Most agents
                default to generic CMAs, recycled commentary, and social posts
                that could belong to anyone.
              </p>
              <br />
              <p className="text-[17px] leading-[1.8] text-[var(--color-mkt-text-secondary)] max-w-[500px]">
                The result: they feel interchangeable. Their clients treat them
                as transaction facilitators. They lose to agents who simply{" "}
                <em>appear</em> more sophisticated.
              </p>
            </div>

            <div className="flex flex-col gap-6 mkt-fade-in mkt-delay-1">
              {STAT_CARDS.map((stat) => (
                <div
                  key={stat.number}
                  className="p-10 bg-[var(--color-mkt-surface)] border border-[var(--color-mkt-border)] transition-all duration-400 hover:border-[var(--color-mkt-accent)] hover:shadow-[0_8px_40px_rgba(184,151,90,0.08)]"
                  style={{
                    transitionTimingFunction: "var(--ease-mkt-out-quart)",
                  }}
                >
                  <div className="font-[family-name:var(--font-display)] text-[52px] font-light text-[var(--color-mkt-accent)] leading-none mb-3">
                    {stat.number}
                  </div>
                  <div className="text-[15px] leading-[1.6] text-[var(--color-mkt-text-secondary)]">
                    {stat.label}
                  </div>
                  <div className="text-[11px] text-[var(--color-mkt-border-muted)] tracking-[0.05em] mt-4">
                    {stat.source}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── The Platform ── */}
      <section
        data-testid="platform-section"
        id="platform"
        className="bg-[var(--color-mkt-surface)]"
        style={{ padding: "140px 40px" }}
      >
        <div className="max-w-[1200px] mx-auto">
          <div className="text-center mb-20 mkt-fade-in">
            <div className="text-[11px] font-semibold tracking-[0.2em] uppercase text-[var(--color-mkt-accent)] mb-6">
              The Platform
            </div>
            <h2
              className="font-[family-name:var(--font-display)] font-light leading-[1.2] text-[var(--color-mkt-text)] mb-5"
              style={{ fontSize: "clamp(32px, 4vw, 48px)" }}
            >
              Intelligence. Voice. Proof.
            </h2>
            <p className="text-[17px] text-[var(--color-mkt-text-secondary)] max-w-[600px] mx-auto">
              Two integrated products that work together &mdash; one builds your
              intelligence, the other builds your presence. Together, they change
              how clients see you.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-[1000px] mx-auto">
            {/* Signal Report */}
            <div className="relative overflow-hidden p-14 bg-[var(--color-mkt-bg)] border border-[var(--color-mkt-border)] transition-all duration-500 hover:border-[var(--color-mkt-accent)] hover:-translate-y-1 hover:shadow-[0_16px_48px_rgba(0,0,0,0.06)] group mkt-fade-in">
              <div className="absolute top-0 left-0 w-full h-[3px] bg-[var(--color-mkt-accent)] origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500" style={{ transitionTimingFunction: "var(--ease-mkt-out-expo)" }} />
              <div className="w-12 h-12 flex items-center justify-center mb-7 text-[var(--color-mkt-accent)]">
                <svg width="40" height="40" viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="4" y="6" width="32" height="28" rx="2" />
                  <line x1="4" y1="14" x2="36" y2="14" />
                  <line x1="12" y1="20" x2="28" y2="20" />
                  <line x1="12" y1="26" x2="24" y2="26" />
                </svg>
              </div>
              <div className="font-[family-name:var(--font-display)] text-[28px] font-normal text-[var(--color-mkt-text)] mb-2">
                Signal Report
              </div>
              <div className="text-xs font-medium tracking-[0.15em] uppercase text-[var(--color-mkt-accent)] mb-5">
                The Proof Mechanism
              </div>
              <div className="text-[15px] leading-[1.75] text-[var(--color-mkt-text-secondary)]">
                A done-for-you monthly intelligence report built on your market
                data, lensed through your client&rsquo;s decision framework,
                delivered with your name on the cover. Eight client personas.
                Institutional quality. Under ten minutes.
              </div>
            </div>

            {/* Signal Voice */}
            <div className="relative overflow-hidden p-14 bg-[var(--color-mkt-bg)] border border-[var(--color-mkt-border)] transition-all duration-500 hover:border-[var(--color-mkt-accent)] hover:-translate-y-1 hover:shadow-[0_16px_48px_rgba(0,0,0,0.06)] group mkt-fade-in mkt-delay-1">
              <div className="absolute top-0 left-0 w-full h-[3px] bg-[var(--color-mkt-accent)] origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500" style={{ transitionTimingFunction: "var(--ease-mkt-out-expo)" }} />
              <div className="w-12 h-12 flex items-center justify-center mb-7 text-[var(--color-mkt-accent)]">
                <svg width="40" height="40" viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M8 32 L8 14 L20 6 L32 14 L32 32" />
                  <circle cx="20" cy="22" r="6" />
                  <line x1="20" y1="16" x2="20" y2="28" />
                  <line x1="14" y1="22" x2="26" y2="22" />
                </svg>
              </div>
              <div className="font-[family-name:var(--font-display)] text-[28px] font-normal text-[var(--color-mkt-text)] mb-2">
                Signal Voice
              </div>
              <div className="text-xs font-medium tracking-[0.15em] uppercase text-[var(--color-mkt-accent)] mb-5">
                The Reach Mechanism
              </div>
              <div className="text-[15px] leading-[1.75] text-[var(--color-mkt-text-secondary)]">
                Your monthly intelligence transformed into LinkedIn posts,
                Instagram content, client emails, and listing-day talking points
                &mdash; every piece grounded in real market data from your Signal
                Report. Content that gives you something worth saying, every
                month without fail.
              </div>
            </div>
          </div>

          <div className="text-center mt-14 pt-10 border-t border-[var(--color-mkt-border)] mkt-fade-in mkt-delay-2">
            <p className="font-[family-name:var(--font-display)] text-xl font-light italic text-[var(--color-mkt-text-secondary)]">
              The platform is expanding &mdash; with an advisor training course
              and private community{" "}
              <em className="text-[var(--color-mkt-accent)]">
                arriving later this year.
              </em>
            </p>
          </div>
        </div>
      </section>

      {/* ── Growth Flywheel ── */}
      <section
        data-testid="flywheel-section"
        id="flywheel"
        className="relative overflow-hidden"
        style={{
          padding: "140px 40px",
          background: "var(--color-mkt-dark)",
          color: "var(--color-mkt-text-inverse)",
        }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 80% 60% at 30% 70%, rgba(74,124,89,0.06), transparent)",
          }}
        />

        <div className="max-w-[1200px] mx-auto relative">
          <div className="text-center mb-20 mkt-fade-in">
            <div className="text-[11px] font-semibold tracking-[0.2em] uppercase text-[var(--color-mkt-accent-light)] mb-6">
              The Growth Flywheel
            </div>
            <h2
              className="font-[family-name:var(--font-display)] font-light text-[var(--color-mkt-text-inverse)] mb-5"
              style={{ fontSize: "clamp(32px, 4vw, 48px)" }}
            >
              Not a subscription. A compounding asset.
            </h2>
            <p
              className="text-[17px] max-w-[600px] mx-auto"
              style={{ color: "rgba(253,252,250,0.5)" }}
            >
              The more you use Modern Signal Advisory, the more prepared you
              are, the more clients trust you, the more business finds you.
            </p>
          </div>

          <div className="flex flex-col md:flex-row max-w-[1100px] mx-auto mkt-fade-in mkt-delay-1">
            {FLYWHEEL_STAGES.map((stage, i) => (
              <div
                key={stage.number}
                className={`flex-1 px-7 py-10 relative transition-all duration-400 hover:bg-[rgba(253,252,250,0.03)] ${
                  i > 0
                    ? "border-t md:border-t-0 md:border-l border-[rgba(253,252,250,0.08)]"
                    : ""
                }`}
                style={{
                  transitionTimingFunction: "var(--ease-mkt-out-quart)",
                }}
              >
                <div
                  className="font-[family-name:var(--font-display)] text-[48px] font-light leading-none mb-5"
                  style={{ color: "rgba(184,151,90,0.25)" }}
                >
                  {stage.number}
                </div>
                <div className="font-[family-name:var(--font-display)] text-[22px] font-normal text-[var(--color-mkt-text-inverse)] mb-2">
                  {stage.name}
                </div>
                <div className="text-[11px] font-medium tracking-[0.15em] uppercase text-[var(--color-mkt-accent-light)] mb-4">
                  {stage.product}
                </div>
                <div
                  className="text-sm leading-[1.7]"
                  style={{ color: "rgba(253,252,250,0.45)" }}
                >
                  {stage.desc}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Promise ── */}
      <section
        data-testid="promise-section"
        className="text-center"
        style={{
          padding: "100px 40px",
          background: "var(--color-mkt-dark-mid)",
        }}
      >
        <div className="max-w-[1200px] mx-auto mkt-fade-in">
          <blockquote
            className="font-[family-name:var(--font-display)] font-light italic leading-[1.7] max-w-[800px] mx-auto"
            style={{
              fontSize: "clamp(20px, 2.5vw, 28px)",
              color: "rgba(253,252,250,0.75)",
            }}
          >
            &ldquo;Once you learn how to read your market, speak to it with
            authority, and show clients something no one else can &mdash;{" "}
            <strong className="text-[var(--color-mkt-accent-light)] font-normal">
              that doesn&rsquo;t go away.
            </strong>{" "}
            The relationships you build, the reputation you earn, the position
            you hold &mdash;{" "}
            <strong className="text-[var(--color-mkt-accent-light)] font-normal">
              those belong to you forever.
            </strong>
            &rdquo;
          </blockquote>
        </div>
      </section>

      {/* ── Proof / Knox Brothers ── */}
      <section
        data-testid="proof-section"
        id="proof"
        style={{ padding: "140px 40px" }}
      >
        <div className="max-w-[1200px] mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-20 items-center">
            <div className="mkt-fade-in">
              <div className="text-[11px] font-semibold tracking-[0.2em] uppercase text-[var(--color-mkt-accent)] mb-8">
                Built by Advisors, Not Technologists
              </div>
              <h2
                className="font-[family-name:var(--font-display)] font-light leading-[1.25] text-[var(--color-mkt-text)] mb-6"
                style={{ fontSize: "clamp(28px, 3.5vw, 42px)" }}
              >
                This platform was proven before it was productized.
              </h2>
              <p className="text-base leading-[1.8] text-[var(--color-mkt-text-secondary)] mb-4">
                Modern Signal Advisory was not invented in a lab. It was built by
                a luxury real estate team that needed it &mdash; and proved it
                worked at the individual level before systematizing it as a
                platform.
              </p>
              <p className="text-base leading-[1.8] text-[var(--color-mkt-text-secondary)]">
                The intelligence framework, the client persona system, the voice
                architecture, the content methodology &mdash; all of it was
                tested in a real market, with real clients, producing real
                results.
              </p>

              <div className="flex gap-12 mt-10">
                <div>
                  <div className="font-[family-name:var(--font-display)] text-4xl font-light text-[var(--color-mkt-accent)] leading-[1.2]">
                    $117M
                  </div>
                  <div className="text-[13px] text-[var(--color-mkt-border-muted)] mt-1">
                    2025 Sales Volume
                  </div>
                </div>
                <div>
                  <div className="font-[family-name:var(--font-display)] text-4xl font-light text-[var(--color-mkt-accent)] leading-[1.2]">
                    Top 1%
                  </div>
                  <div className="text-[13px] text-[var(--color-mkt-border-muted)] mt-1">
                    Producer at Compass
                  </div>
                </div>
              </div>
            </div>

            <div
              className="flex items-center justify-center min-h-[400px] p-[60px] mkt-fade-in mkt-delay-1"
              style={{ background: "var(--color-mkt-dark)" }}
            >
              <div className="text-center">
                <div className="text-[11px] font-semibold tracking-[0.2em] uppercase text-[var(--color-mkt-accent-light)] mb-6">
                  The Knox Brothers Precedent
                </div>
                <p
                  className="font-[family-name:var(--font-display)] text-2xl font-light italic leading-[1.6] max-w-[360px]"
                  style={{ color: "rgba(253,252,250,0.7)" }}
                >
                  &ldquo;Every subscriber is building what the founders have
                  already done. The platform exists because we proved it worked
                  on ourselves first.&rdquo;
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Bottom CTA ── */}
      <section
        data-testid="bottom-cta"
        id="join"
        className="text-center relative overflow-hidden"
        style={{
          padding: "140px 40px",
          background: "var(--color-mkt-dark)",
        }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 50% 40% at 50% 50%, rgba(184,151,90,0.08), transparent)",
          }}
        />

        <div className="max-w-[1200px] mx-auto relative">
          <div className="text-[11px] font-semibold tracking-[0.2em] uppercase text-[var(--color-mkt-accent-light)] mb-8 mkt-fade-in">
            Founding Cohort &mdash; Now Forming
          </div>

          <h2
            className="font-[family-name:var(--font-display)] font-light text-[var(--color-mkt-text-inverse)] leading-[1.15] mb-5 mkt-fade-in mkt-delay-1"
            style={{ fontSize: "clamp(32px, 4.5vw, 56px)" }}
          >
            The intelligence era
            <br />
            isn&rsquo;t{" "}
            <em className="italic text-[var(--color-mkt-accent-light)]">
              coming.
            </em>{" "}
            It&rsquo;s here.
          </h2>

          <p
            className="text-[17px] max-w-[560px] mx-auto mb-12 relative mkt-fade-in mkt-delay-2"
            style={{ color: "rgba(253,252,250,0.75)" }}
          >
            25 founding members. Founding pricing. Direct access to the team
            building the platform. Join the waitlist to reserve your position.
          </p>

          <div className="mkt-fade-in mkt-delay-3">
            <Link
              href="/waitlist"
              className="inline-block font-[family-name:var(--font-body)] text-[13px] font-semibold tracking-[0.1em] uppercase bg-[var(--color-mkt-accent)] text-[var(--color-mkt-darkest)] px-10 py-4 hover:bg-[var(--color-mkt-accent-light)] transition-all duration-300"
            >
              Reserve My Spot
            </Link>
          </div>

          <p
            className="text-[13px] mt-5 mkt-fade-in mkt-delay-3"
            style={{ color: "rgba(253,252,250,0.3)" }}
          >
            No commitment. We&rsquo;ll reach out personally when the founding
            cohort opens.
          </p>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer
        data-testid="marketing-footer"
        className="flex flex-col md:flex-row justify-between items-center gap-4"
        style={{
          padding: "60px 40px",
          background: "var(--color-mkt-darkest)",
        }}
      >
        <div
          className="font-[family-name:var(--font-display)] text-sm font-medium tracking-[0.12em] uppercase"
          style={{ color: "rgba(253,252,250,0.3)" }}
        >
          Modern{" "}
          <span className="text-[var(--color-mkt-accent)]">Signal</span>{" "}
          Advisory
        </div>
        <div
          className="text-xs tracking-[0.04em]"
          style={{ color: "rgba(253,252,250,0.2)" }}
        >
          &copy; 2026 Modern Signal Advisory, LLC &middot; Confidential
        </div>
      </footer>

      {/* ── Intersection Observer for fade-ins ── */}
      <MarketingScripts />
    </main>
  );
}
