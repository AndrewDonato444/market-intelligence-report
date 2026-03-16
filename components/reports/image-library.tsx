"use client";

import type { SocialMediaKitContent, StatCallout } from "@/lib/db/schema";

// ---------------------------------------------------------------------------
// Pure helpers (mirrored in tests)
// ---------------------------------------------------------------------------

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/#/g, "")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .trim();
}

function buildFilename(templateName: string, marketSlug: string): string {
  return `${slugify(templateName)}-${slugify(marketSlug)}.svg`;
}

function detectDirection(statText: string): "up" | "down" | "neutral" {
  const lower = statText.toLowerCase();
  if (/decline|drop|fall|decrease|collapse|down/.test(lower)) return "down";
  if (/rise|gain|growth|increase|up|climb|surge/.test(lower)) return "up";
  return "neutral";
}

function getMarketName(content: SocialMediaKitContent): string {
  const firstHashtag = content.captions[0]?.hashtags?.[0] ?? "";
  return firstHashtag.replace("#", "") || "Market Intelligence";
}

// ---------------------------------------------------------------------------
// SVG builders — return raw SVG strings for download
// ---------------------------------------------------------------------------

const NAVY = "#0F172A";
const NAVY2 = "#1E293B";
const NAVY3 = "#0D1525";
const GOLD = "#CA8A04";
const GOLD_LIGHT = "#EAB308";
const WHITE = "#F8FAFC";
const SLATE = "#94A3B8";
const RED = "#B91C1C";
const GREEN = "#15803D";
const SERIF = "Georgia, 'Times New Roman', serif";
const SANS = "system-ui, -apple-system, sans-serif";

function svgStatHero(stat: StatCallout, marketName: string): string {
  const direction = detectDirection(stat.stat);
  const arrow = direction === "up" ? "↑" : direction === "down" ? "↓" : "";
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800" width="800" height="800">
  <rect width="800" height="800" fill="${NAVY}"/>
  <line x1="0" y1="4" x2="800" y2="4" stroke="${GOLD}" stroke-width="8"/>
  <line x1="0" y1="796" x2="800" y2="796" stroke="${GOLD}" stroke-width="8"/>
  <text x="400" y="120" font-family="${SANS}" font-size="13" fill="${SLATE}" text-anchor="middle" letter-spacing="4" font-weight="400">MARKET INTELLIGENCE</text>
  <text x="400" y="400" font-family="${SERIF}" font-size="96" fill="${GOLD}" text-anchor="middle" font-weight="700">${stat.stat.split(" ")[0]}${arrow}</text>
  <text x="400" y="460" font-family="${SERIF}" font-size="28" fill="${WHITE}" text-anchor="middle" font-weight="400">${stat.stat.split(" ").slice(1).join(" ")}</text>
  <line x1="320" y1="498" x2="480" y2="498" stroke="${GOLD}" stroke-width="2"/>
  <text x="400" y="560" font-family="${SANS}" font-size="16" fill="${SLATE}" text-anchor="middle" font-style="italic">${stat.suggestedCaption.slice(0, 60)}${stat.suggestedCaption.length > 60 ? "…" : ""}</text>
  <text x="400" y="700" font-family="${SANS}" font-size="12" fill="${SLATE}" text-anchor="middle" letter-spacing="2">Source: ${stat.source}</text>
  <text x="400" y="740" font-family="${SANS}" font-size="13" fill="${GOLD}" text-anchor="middle" letter-spacing="3">${marketName.toUpperCase()}</text>
</svg>`;
}

function svgMarketSnapshot(stats: StatCallout[], marketName: string): string {
  const rows = stats.slice(0, 3);
  const rowHeight = 180;
  const startY = 200;
  const rowItems = rows.map((s, i) => {
    const y = startY + i * rowHeight;
    const direction = detectDirection(s.stat);
    const arrow = direction === "up" ? " ↑" : direction === "down" ? " ↓" : "";
    return `
  <text x="400" y="${y}" font-family="${SERIF}" font-size="52" fill="${GOLD}" text-anchor="middle" font-weight="700">${s.stat.split(" ")[0]}${arrow}</text>
  <text x="400" y="${y + 36}" font-family="${SANS}" font-size="18" fill="${SLATE}" text-anchor="middle">${s.stat.split(" ").slice(1).join(" ")}</text>
  ${i < rows.length - 1 ? `<line x1="280" y1="${y + 56}" x2="520" y2="${y + 56}" stroke="${NAVY}" stroke-width="1" opacity="0.4"/>` : ""}`;
  }).join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800" width="800" height="800">
  <rect width="800" height="800" fill="#1E293B"/>
  <line x1="0" y1="4" x2="800" y2="4" stroke="${GOLD}" stroke-width="8"/>
  <line x1="0" y1="796" x2="800" y2="796" stroke="${GOLD}" stroke-width="8"/>
  <text x="400" y="100" font-family="${SANS}" font-size="13" fill="${SLATE}" text-anchor="middle" letter-spacing="4">MARKET INTELLIGENCE</text>
  <text x="400" y="140" font-family="${SERIF}" font-size="22" fill="${WHITE}" text-anchor="middle">${marketName}</text>
  ${rowItems}
  <text x="400" y="760" font-family="${SANS}" font-size="12" fill="${SLATE}" text-anchor="middle" letter-spacing="2">QUARTERLY REPORT · 2026</text>
</svg>`;
}

function svgPullQuote(template: string, context: string, marketName: string): string {
  const words = template.split(" ");
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    if ((current + " " + word).trim().length > 40) {
      lines.push(current.trim());
      current = word;
    } else {
      current = (current + " " + word).trim();
    }
  }
  if (current) lines.push(current.trim());

  const lineElements = lines.slice(0, 5).map((line, i) =>
    `<text x="400" y="${360 + i * 44}" font-family="${SERIF}" font-size="26" fill="${WHITE}" text-anchor="middle" font-style="italic">${line}</text>`
  ).join("\n  ");

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800" width="800" height="800">
  <rect width="800" height="800" fill="${NAVY}"/>
  <line x1="0" y1="4" x2="800" y2="4" stroke="${GOLD}" stroke-width="8"/>
  <line x1="0" y1="796" x2="800" y2="796" stroke="${GOLD}" stroke-width="8"/>
  <text x="200" y="260" font-family="${SERIF}" font-size="160" fill="${GOLD}" opacity="0.25">"</text>
  ${lineElements}
  <line x1="340" y1="${360 + Math.min(lines.length, 5) * 44 + 20}" x2="460" y2="${360 + Math.min(lines.length, 5) * 44 + 20}" stroke="${GOLD}" stroke-width="2"/>
  <text x="400" y="${360 + Math.min(lines.length, 5) * 44 + 56}" font-family="${SANS}" font-size="13" fill="${GOLD}" text-anchor="middle" letter-spacing="4">${context.toUpperCase()}</text>
  <text x="400" y="740" font-family="${SANS}" font-size="13" fill="${SLATE}" text-anchor="middle" letter-spacing="2">${marketName.toUpperCase()} · MARKET INTELLIGENCE</text>
</svg>`;
}

function svgYoYComparison(statA: StatCallout, statB: StatCallout, marketName: string): string {
  const dirA = detectDirection(statA.stat);
  const dirB = detectDirection(statB.stat);
  const arrowA = dirA === "up" ? "↑" : dirA === "down" ? "↓" : "→";
  const arrowB = dirB === "up" ? "↑" : dirB === "down" ? "↓" : "→";
  const arrowColorA = dirA === "up" ? "#15803D" : dirA === "down" ? "#B91C1C" : GOLD;
  const arrowColorB = dirB === "up" ? "#15803D" : dirB === "down" ? "#B91C1C" : GOLD;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" width="1200" height="630">
  <rect width="1200" height="630" fill="${NAVY}"/>
  <line x1="0" y1="4" x2="1200" y2="4" stroke="${GOLD}" stroke-width="8"/>
  <line x1="0" y1="626" x2="1200" y2="626" stroke="${GOLD}" stroke-width="8"/>
  <text x="600" y="70" font-family="${SANS}" font-size="13" fill="${SLATE}" text-anchor="middle" letter-spacing="4">YEAR-OVER-YEAR · ${marketName.toUpperCase()}</text>
  <!-- Left stat -->
  <text x="300" y="290" font-family="${SERIF}" font-size="72" fill="${GOLD}" text-anchor="middle" font-weight="700">${statA.stat.split(" ")[0]}</text>
  <text x="300" y="350" font-family="${SANS}" font-size="20" fill="${WHITE}" text-anchor="middle">${statA.stat.split(" ").slice(1).join(" ")}</text>
  <text x="300" y="400" font-family="${SANS}" font-size="48" fill="${arrowColorA}" text-anchor="middle">${arrowA}</text>
  <!-- Divider -->
  <line x1="600" y1="120" x2="600" y2="510" stroke="${GOLD}" stroke-width="1" opacity="0.4"/>
  <!-- Right stat -->
  <text x="900" y="290" font-family="${SERIF}" font-size="72" fill="${GOLD}" text-anchor="middle" font-weight="700">${statB.stat.split(" ")[0]}</text>
  <text x="900" y="350" font-family="${SANS}" font-size="20" fill="${WHITE}" text-anchor="middle">${statB.stat.split(" ").slice(1).join(" ")}</text>
  <text x="900" y="400" font-family="${SANS}" font-size="48" fill="${arrowColorB}" text-anchor="middle">${arrowB}</text>
  <text x="600" y="580" font-family="${SANS}" font-size="12" fill="${SLATE}" text-anchor="middle" letter-spacing="3">QUARTERLY MARKET INTELLIGENCE · 2026</text>
</svg>`;
}

function svgStory(stat: StatCallout, marketName: string): string {
  const direction = detectDirection(stat.stat);
  const arrow = direction === "up" ? " ↑" : direction === "down" ? " ↓" : "";
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 1350" width="1080" height="1350">
  <rect width="1080" height="1350" fill="${NAVY}"/>
  <line x1="0" y1="6" x2="1080" y2="6" stroke="${GOLD}" stroke-width="12"/>
  <line x1="0" y1="1344" x2="1080" y2="1344" stroke="${GOLD}" stroke-width="12"/>
  <text x="540" y="160" font-family="${SANS}" font-size="22" fill="${SLATE}" text-anchor="middle" letter-spacing="6">MARKET INTELLIGENCE</text>
  <text x="540" y="520" font-family="${SERIF}" font-size="140" fill="${GOLD}" text-anchor="middle" font-weight="700">${stat.stat.split(" ")[0]}${arrow}</text>
  <text x="540" y="610" font-family="${SERIF}" font-size="40" fill="${WHITE}" text-anchor="middle">${stat.stat.split(" ").slice(1).join(" ")}</text>
  <line x1="420" y1="670" x2="660" y2="670" stroke="${GOLD}" stroke-width="3"/>
  <text x="540" y="740" font-family="${SERIF}" font-size="36" fill="${SLATE}" text-anchor="middle">${marketName}</text>
  <text x="540" y="1100" font-family="${SANS}" font-size="24" fill="${SLATE}" text-anchor="middle" font-style="italic">"${stat.suggestedCaption.slice(0, 50)}${stat.suggestedCaption.length > 50 ? "…" : ""}"</text>
  <text x="540" y="1270" font-family="${SANS}" font-size="18" fill="${GOLD}" text-anchor="middle" letter-spacing="4">QUARTERLY REPORT · 2026</text>
</svg>`;
}

function svgLinkedInBanner(stat: StatCallout, marketName: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1584 396" width="1584" height="396">
  <rect width="1584" height="396" fill="${NAVY}"/>
  <line x1="0" y1="4" x2="1584" y2="4" stroke="${GOLD}" stroke-width="8"/>
  <line x1="0" y1="392" x2="1584" y2="392" stroke="${GOLD}" stroke-width="8"/>
  <!-- Left: market name -->
  <text x="80" y="160" font-family="${SERIF}" font-size="52" fill="${WHITE}" font-weight="700">${marketName}</text>
  <text x="80" y="210" font-family="${SANS}" font-size="18" fill="${SLATE}" letter-spacing="3">LUXURY REAL ESTATE</text>
  <text x="80" y="320" font-family="${SANS}" font-size="14" fill="${GOLD}" letter-spacing="2">QUARTERLY MARKET INTELLIGENCE · 2026</text>
  <!-- Vertical divider -->
  <line x1="760" y1="60" x2="760" y2="336" stroke="${GOLD}" stroke-width="1" opacity="0.5"/>
  <!-- Right: top stat -->
  <text x="920" y="180" font-family="${SERIF}" font-size="80" fill="${GOLD}" font-weight="700">${stat.stat.split(" ")[0]}</text>
  <text x="920" y="230" font-family="${SANS}" font-size="22" fill="${WHITE}">${stat.stat.split(" ").slice(1).join(" ")}</text>
  <text x="920" y="310" font-family="${SANS}" font-size="13" fill="${SLATE}" font-style="italic">${stat.suggestedCaption.slice(0, 55)}${stat.suggestedCaption.length > 55 ? "…" : ""}</text>
</svg>`;
}

// ---------------------------------------------------------------------------
// Download helper
// ---------------------------------------------------------------------------

function downloadSvg(svgString: string, filename: string): void {
  const blob = new Blob([svgString], { type: "image/svg+xml" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ---------------------------------------------------------------------------
// Individual graphic card
// ---------------------------------------------------------------------------

function GraphicCard({
  label,
  platform,
  svgString,
  filename,
  preview,
}: {
  label: string;
  platform: string;
  svgString: string;
  filename: string;
  preview: React.ReactNode;
}) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-sm)] overflow-hidden hover:shadow-[var(--shadow-md)] transition-shadow">
      {/* Preview */}
      <div className="w-full bg-[var(--color-background)] flex items-center justify-center p-3">
        <div className="w-full overflow-hidden rounded-[var(--radius-md)]">
          {preview}
        </div>
      </div>
      {/* Footer */}
      <div className="px-3 py-2.5 flex items-center justify-between gap-2 border-t border-[var(--color-border)]">
        <div>
          <p className="font-[family-name:var(--font-sans)] text-xs font-medium text-[var(--color-text)]">
            {label}
          </p>
          <p className="font-[family-name:var(--font-sans)] text-[10px] text-[var(--color-text-tertiary)]">
            {platform}
          </p>
        </div>
        <button
          onClick={() => downloadSvg(svgString, filename)}
          className="font-[family-name:var(--font-sans)] text-xs px-2.5 py-1 rounded-[var(--radius-sm)] border border-[var(--color-border)] hover:bg-[var(--color-primary-light)] transition-colors whitespace-nowrap shrink-0"
        >
          Download SVG
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Inline preview components (small-scale renders of the SVGs)
// ---------------------------------------------------------------------------

function StatHeroPreview({ stat }: { stat: StatCallout }) {
  const direction = detectDirection(stat.stat);
  const arrow = direction === "up" ? " ↑" : direction === "down" ? " ↓" : "";
  return (
    // Stat Hero: single dramatic number centered on a radial gold glow — maximum impact
    <div
      className="w-full flex flex-col items-center justify-center py-6 px-4 text-center relative overflow-hidden"
      style={{ aspectRatio: "1/1", background: NAVY }}
    >
      {/* Radial glow behind the number */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: `radial-gradient(ellipse 60% 50% at 50% 50%, ${GOLD}22 0%, transparent 70%)`
      }} />
      <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ backgroundColor: GOLD }} />
      <p className="font-[family-name:var(--font-sans)] text-[9px] tracking-[0.25em] mb-3 select-none" style={{ color: SLATE }}>
        MARKET INTELLIGENCE
      </p>
      <p className="font-[family-name:var(--font-serif)] font-bold leading-none select-none" style={{ color: GOLD_LIGHT, fontSize: "clamp(32px, 8vw, 52px)" }}>
        {stat.stat.split(" ")[0]}{arrow}
      </p>
      <p className="font-[family-name:var(--font-serif)] text-[11px] mt-1 select-none" style={{ color: WHITE }}>
        {stat.stat.split(" ").slice(1).join(" ")}
      </p>
      <div className="w-10 h-px my-3" style={{ backgroundColor: GOLD }} />
      <p className="font-[family-name:var(--font-sans)] text-[9px] italic select-none px-4 leading-relaxed" style={{ color: SLATE }}>
        "{stat.suggestedCaption.slice(0, 50)}{stat.suggestedCaption.length > 50 ? "…" : ""}"
      </p>
      <div className="absolute bottom-0 left-0 right-0 h-[3px]" style={{ backgroundColor: GOLD }} />
    </div>
  );
}

function MarketSnapshotPreview({ stats, marketName }: { stats: StatCallout[]; marketName: string }) {
  return (
    // Market Snapshot: left-aligned dashboard grid on medium slate — editorial digest feel
    <div
      className="w-full flex flex-col justify-between py-4 px-4 relative"
      style={{ aspectRatio: "1/1", background: NAVY2 }}
    >
      {/* Left accent bar */}
      <div className="absolute left-0 top-0 bottom-0 w-[3px]" style={{ backgroundColor: GOLD }} />
      <div>
        <p className="font-[family-name:var(--font-sans)] text-[9px] tracking-[0.25em] mb-0.5 select-none" style={{ color: SLATE }}>
          MARKET INTELLIGENCE
        </p>
        <p className="font-[family-name:var(--font-serif)] text-[11px] select-none" style={{ color: WHITE }}>
          {marketName}
        </p>
      </div>
      <div className="flex flex-col gap-2 my-2">
        {stats.slice(0, 3).map((s, i) => {
          const dir = detectDirection(s.stat);
          const arr = dir === "up" ? " ↑" : dir === "down" ? " ↓" : "";
          const col = dir === "up" ? GREEN : dir === "down" ? RED : GOLD;
          return (
            <div key={i} className="flex items-baseline gap-2">
              <p className="font-[family-name:var(--font-serif)] font-bold leading-none select-none" style={{ color: col, fontSize: "clamp(16px, 4vw, 22px)" }}>
                {s.stat.split(" ")[0]}{arr}
              </p>
              <p className="font-[family-name:var(--font-sans)] text-[9px] select-none" style={{ color: SLATE }}>
                {s.stat.split(" ").slice(1).join(" ")}
              </p>
            </div>
          );
        })}
      </div>
      <p className="font-[family-name:var(--font-sans)] text-[9px] tracking-widest select-none" style={{ color: GOLD }}>
        Q1 2026
      </p>
    </div>
  );
}

function PullQuotePreview({ template, context }: { template: string; context: string }) {
  return (
    // Pull Quote: oversized quote mark dominates left side, text bottom-right — editorial magazine feel
    <div
      className="w-full flex flex-col justify-end py-5 px-4 relative overflow-hidden"
      style={{ aspectRatio: "1/1", background: NAVY3 }}
    >
      {/* Giant decorative quote mark — takes up most of the card */}
      <div className="absolute top-0 left-1 select-none pointer-events-none leading-none" style={{
        fontFamily: SERIF,
        fontSize: "clamp(80px, 22vw, 130px)",
        color: GOLD,
        opacity: 0.18,
        lineHeight: 1,
      }}>"</div>
      {/* Content pinned to bottom */}
      <p className="font-[family-name:var(--font-serif)] text-[11px] italic leading-relaxed select-none mb-2 relative z-10" style={{ color: WHITE }}>
        "{template.slice(0, 70)}{template.length > 70 ? "…" : ""}"
      </p>
      <div className="w-6 h-px mb-1.5 relative z-10" style={{ backgroundColor: GOLD }} />
      <p className="font-[family-name:var(--font-sans)] text-[9px] tracking-widest select-none relative z-10" style={{ color: GOLD }}>
        {context.toUpperCase()}
      </p>
    </div>
  );
}

function YoYPreview({ statA, statB }: { statA: StatCallout; statB: StatCallout }) {
  const dirA = detectDirection(statA.stat);
  const dirB = detectDirection(statB.stat);
  const arrA = dirA === "up" ? "↑" : dirA === "down" ? "↓" : "→";
  const arrB = dirB === "up" ? "↑" : dirB === "down" ? "↓" : "→";
  const colA = dirA === "up" ? GREEN : dirA === "down" ? RED : GOLD;
  const colB = dirB === "up" ? GREEN : dirB === "down" ? RED : GOLD;
  return (
    // YoY: split layout — each half has its own background tint + large colored arrow indicator
    <div className="w-full flex" style={{ aspectRatio: "16/9" }}>
      {/* Left panel */}
      <div className="flex-1 flex flex-col items-center justify-center text-center px-3 py-3 relative" style={{ background: NAVY }}>
        <p className="font-[family-name:var(--font-sans)] text-[8px] tracking-widest select-none mb-1" style={{ color: SLATE }}>
          METRIC A
        </p>
        <p className="font-[family-name:var(--font-serif)] font-bold leading-none select-none" style={{ color: GOLD, fontSize: "clamp(16px, 4vw, 24px)" }}>
          {statA.stat.split(" ")[0]}
        </p>
        <p className="font-[family-name:var(--font-sans)] text-[8px] select-none my-0.5" style={{ color: SLATE }}>
          {statA.stat.split(" ").slice(1).join(" ")}
        </p>
        <p className="font-bold select-none leading-none" style={{ color: colA, fontSize: "clamp(18px, 5vw, 28px)" }}>{arrA}</p>
      </div>
      {/* Gold divider */}
      <div className="w-px self-stretch" style={{ backgroundColor: GOLD, opacity: 0.6 }} />
      {/* Right panel — slightly different bg */}
      <div className="flex-1 flex flex-col items-center justify-center text-center px-3 py-3" style={{ background: NAVY2 }}>
        <p className="font-[family-name:var(--font-sans)] text-[8px] tracking-widest select-none mb-1" style={{ color: SLATE }}>
          METRIC B
        </p>
        <p className="font-[family-name:var(--font-serif)] font-bold leading-none select-none" style={{ color: GOLD, fontSize: "clamp(16px, 4vw, 24px)" }}>
          {statB.stat.split(" ")[0]}
        </p>
        <p className="font-[family-name:var(--font-sans)] text-[8px] select-none my-0.5" style={{ color: SLATE }}>
          {statB.stat.split(" ").slice(1).join(" ")}
        </p>
        <p className="font-bold select-none leading-none" style={{ color: colB, fontSize: "clamp(18px, 5vw, 28px)" }}>{arrB}</p>
      </div>
    </div>
  );
}

function StoryPreview({ stat, marketName }: { stat: StatCallout; marketName: string }) {
  const dir = detectDirection(stat.stat);
  const arr = dir === "up" ? " ↑" : dir === "down" ? " ↓" : "";
  const arrowColor = dir === "up" ? GREEN : dir === "down" ? RED : GOLD;
  return (
    // Story: vertical 4:5 with a diagonal gradient, market name at top, giant number center, caption bottom
    <div
      className="w-full flex flex-col justify-between py-4 px-3 text-center relative overflow-hidden"
      style={{ aspectRatio: "4/5", background: `linear-gradient(160deg, ${NAVY} 0%, #162035 60%, ${NAVY2} 100%)` }}
    >
      {/* Top gold accent line */}
      <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ backgroundColor: GOLD }} />
      {/* Market name top */}
      <div>
        <p className="font-[family-name:var(--font-sans)] text-[8px] tracking-[0.2em] select-none" style={{ color: SLATE }}>
          MARKET INTELLIGENCE
        </p>
        <p className="font-[family-name:var(--font-serif)] text-[10px] select-none mt-0.5" style={{ color: WHITE }}>
          {marketName}
        </p>
      </div>
      {/* Giant stat center */}
      <div className="flex flex-col items-center">
        <p className="font-[family-name:var(--font-serif)] font-bold leading-none select-none" style={{ color: GOLD_LIGHT, fontSize: "clamp(30px, 9vw, 52px)" }}>
          {stat.stat.split(" ")[0]}
        </p>
        <p className="font-bold select-none leading-none mt-0.5" style={{ color: arrowColor, fontSize: "clamp(14px, 4vw, 20px)" }}>{arr}</p>
        <div className="w-8 h-px my-1.5" style={{ backgroundColor: GOLD }} />
        <p className="font-[family-name:var(--font-serif)] text-[10px] select-none" style={{ color: WHITE }}>
          {stat.stat.split(" ").slice(1).join(" ")}
        </p>
      </div>
      {/* Caption bottom */}
      <p className="font-[family-name:var(--font-sans)] text-[8px] italic select-none leading-relaxed" style={{ color: SLATE }}>
        "{stat.suggestedCaption.slice(0, 40)}{stat.suggestedCaption.length > 40 ? "…" : ""}"
      </p>
      {/* Bottom gold accent line */}
      <div className="absolute bottom-0 left-0 right-0 h-[3px]" style={{ backgroundColor: GOLD }} />
    </div>
  );
}

function LinkedInBannerPreview({ stat, marketName }: { stat: StatCallout; marketName: string }) {
  return (
    // LinkedIn Banner: horizontal gradient, market name dominates left, stat card on right
    <div
      className="w-full flex items-stretch relative overflow-hidden"
      style={{ aspectRatio: "4/1", background: `linear-gradient(90deg, ${NAVY} 0%, #0E1E35 60%, ${NAVY2} 100%)` }}
    >
      {/* Top + bottom gold rules */}
      <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ backgroundColor: GOLD }} />
      <div className="absolute bottom-0 left-0 right-0 h-[2px]" style={{ backgroundColor: GOLD }} />
      {/* Left: market name */}
      <div className="flex-1 flex flex-col justify-center px-4 py-2 min-w-0">
        <p className="font-[family-name:var(--font-serif)] font-bold leading-tight select-none truncate" style={{ color: WHITE, fontSize: "clamp(11px, 3vw, 18px)" }}>
          {marketName}
        </p>
        <p className="font-[family-name:var(--font-sans)] text-[8px] tracking-[0.15em] mt-0.5 select-none" style={{ color: SLATE }}>
          LUXURY REAL ESTATE
        </p>
        <p className="font-[family-name:var(--font-sans)] text-[7px] tracking-widest mt-1 select-none" style={{ color: GOLD }}>
          QUARTERLY MARKET INTELLIGENCE
        </p>
      </div>
      {/* Gold vertical divider */}
      <div className="w-px self-stretch my-2" style={{ backgroundColor: GOLD, opacity: 0.5 }} />
      {/* Right: top stat */}
      <div className="shrink-0 flex flex-col justify-center text-right px-4 py-2">
        <p className="font-[family-name:var(--font-serif)] font-bold leading-none select-none" style={{ color: GOLD_LIGHT, fontSize: "clamp(14px, 4vw, 22px)" }}>
          {stat.stat.split(" ")[0]}
        </p>
        <p className="font-[family-name:var(--font-sans)] text-[8px] select-none mt-0.5" style={{ color: WHITE }}>
          {stat.stat.split(" ").slice(1).join(" ")}
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

interface ImageLibraryProps {
  content: SocialMediaKitContent;
}

export function ImageLibrary({ content }: ImageLibraryProps) {
  if (content.statCallouts.length === 0) return null;

  const marketName = getMarketName(content);
  const stats = content.statCallouts;
  const starter = content.conversationStarters[0];
  const [statA, statB] = stats.length >= 2 ? [stats[0], stats[1]] : [stats[0], stats[0]];
  const slug = slugify(marketName);

  const graphics = [
    {
      label: "Stat Hero",
      platform: "All platforms · Square",
      svgString: svgStatHero(stats[0], marketName),
      filename: buildFilename("Stat Hero", marketName),
      preview: <StatHeroPreview stat={stats[0]} />,
    },
    {
      label: "Market Snapshot",
      platform: "All platforms · Square",
      svgString: svgMarketSnapshot(stats.slice(0, 3), marketName),
      filename: buildFilename("Market Snapshot", marketName),
      preview: <MarketSnapshotPreview stats={stats.slice(0, 3)} marketName={marketName} />,
    },
    ...(starter ? [{
      label: "Pull Quote",
      platform: "All platforms · Square",
      svgString: svgPullQuote(starter.template, starter.context, marketName),
      filename: buildFilename("Pull Quote", marketName),
      preview: <PullQuotePreview template={starter.template} context={starter.context} />,
    }] : []),
    {
      label: "YoY Comparison",
      platform: "LinkedIn · Wide (16:9)",
      svgString: svgYoYComparison(statA, statB, marketName),
      filename: buildFilename("YoY Comparison", marketName),
      preview: <YoYPreview statA={statA} statB={statB} />,
    },
    {
      label: "Story",
      platform: "Instagram / Facebook · 4:5",
      svgString: svgStory(stats[0], marketName),
      filename: buildFilename("Story", marketName),
      preview: <StoryPreview stat={stats[0]} marketName={marketName} />,
    },
    {
      label: "LinkedIn Banner",
      platform: "LinkedIn · Wide (1.91:1)",
      svgString: svgLinkedInBanner(stats[0], marketName),
      filename: buildFilename("LinkedIn Banner", marketName),
      preview: <LinkedInBannerPreview stat={stats[0]} marketName={marketName} />,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {graphics.map((g) => (
        <GraphicCard key={g.label} {...g} />
      ))}
    </div>
  );
}
