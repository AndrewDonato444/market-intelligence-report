/**
 * Shared formatter for X Social Sentiment prompt sections.
 *
 * Used by insight-generator and forecast-modeler to inject
 * Grok x_search data into Claude prompts.
 */

import type { XSentimentBrief } from "@/lib/connectors/grok";

/**
 * Format an XSentimentBrief into a human-readable prompt section
 * for inclusion in Claude agent prompts.
 */
export function formatXSentimentForPrompt(brief: XSentimentBrief): string {
  const lines: string[] = [];
  lines.push(`  Overall Sentiment: ${brief.sentiment}`);
  lines.push(`  Summary: ${brief.summary}`);
  if (brief.bullThemes.length > 0) {
    lines.push(`  Bull Themes: ${brief.bullThemes.join("; ")}`);
  }
  if (brief.bearSignals.length > 0) {
    lines.push(`  Bear Signals: ${brief.bearSignals.join("; ")}`);
  }
  if (brief.notableQuotes.length > 0) {
    lines.push(`  Notable Quotes:`);
    for (const q of brief.notableQuotes.slice(0, 5)) {
      lines.push(`    - "${q.text}" — ${q.attribution}`);
    }
  }
  if (brief.stale) lines.push(`  ⚠️ Stale data — cached from a prior fetch.`);
  return lines.join("\n");
}
