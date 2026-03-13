/**
 * Section emptiness checker — determines whether a report section has
 * substantive content worth rendering in the customer-facing PDF.
 *
 * Empty sections are omitted entirely (no page, no title, no accent line).
 * Unknown section types are also omitted to prevent raw JSON dumps.
 *
 * See: .specs/features/report-template/pdf-formatting-flow.feature.md
 */

interface Section {
  sectionType: string;
  title?: string;
  content: unknown;
}

/**
 * Returns true if the section has no substantive content and should be
 * omitted from the PDF. Each section type has its own emptiness rule.
 */
export function isSectionEmpty(section: Section): boolean {
  const c = section.content as Record<string, unknown> | null | undefined;

  switch (section.sectionType) {
    // --- v2 section types ---

    case "executive_briefing": {
      const headline = c?.headline as Record<string, unknown> | undefined;
      return !headline || (headline.totalProperties as number) === 0;
    }

    case "market_insights_index": {
      const insightsIndex = c?.insightsIndex as Record<string, unknown> | undefined;
      if (!insightsIndex) return true;
      // Empty if the index object has no dimensions
      return Object.keys(insightsIndex).length === 0;
    }

    case "luxury_market_dashboard": {
      const dashboard = c?.dashboard as Record<string, unknown> | undefined;
      if (!dashboard) return true;
      const powerFour = dashboard.powerFour as unknown[] | undefined;
      const supportingMetrics = dashboard.supportingMetrics as unknown[] | undefined;
      return (
        (!powerFour || powerFour.length === 0) &&
        (!supportingMetrics || supportingMetrics.length === 0)
      );
    }

    case "neighborhood_intelligence": {
      const neighborhoods = c?.neighborhoods as unknown[] | undefined;
      return !neighborhoods || neighborhoods.length === 0;
    }

    case "the_narrative": {
      const narrative = c?.narrative as string | null | undefined;
      const themes = c?.themes as unknown[] | null | undefined;
      const hasNarrative = !!narrative && narrative.trim().length > 0;
      const hasThemes = !!themes && themes.length > 0;
      return !hasNarrative && !hasThemes;
    }

    case "forward_look": {
      // v2 uses forecast/guidance; v1 uses scenarios/projections
      const forecast = c?.forecast as string | null | undefined;
      const guidance = c?.guidance as unknown;
      const scenarios = c?.scenarios as Record<string, unknown> | null | undefined;
      const projections = c?.projections as unknown[] | null | undefined;
      const hasForecast = !!forecast && forecast.trim().length > 0;
      const hasGuidance = !!guidance;
      const hasScenarios = !!scenarios && Object.keys(scenarios).length > 0;
      const hasProjections = !!projections && projections.length > 0;
      return !hasForecast && !hasGuidance && !hasScenarios && !hasProjections;
    }

    case "comparative_positioning": {
      // v2 uses peerComparisons; fallback check peerMarkets for compat
      const peerComparisons = c?.peerComparisons as unknown[] | undefined;
      const peerMarkets = c?.peerMarkets as unknown[] | undefined;
      const hasPeerComparisons = !!peerComparisons && peerComparisons.length > 0;
      const hasPeerMarkets = !!peerMarkets && peerMarkets.length > 0;
      return !hasPeerComparisons && !hasPeerMarkets;
    }

    case "disclaimer_methodology":
      // Never empty — always include disclaimer
      return false;

    case "persona_intelligence": {
      const personas = c?.personas as unknown[] | undefined;
      return !personas || personas.length === 0;
    }

    // --- v1 section types ---

    case "market_overview": {
      const narrative = c?.narrative as string | null | undefined;
      const highlights = c?.highlights as unknown[] | null | undefined;
      const hasNarrative = !!narrative && narrative.trim().length > 0;
      const hasHighlights = !!highlights && highlights.length > 0;
      return !hasNarrative && !hasHighlights;
    }

    case "key_drivers": {
      const themes = c?.themes as unknown[] | null | undefined;
      return !themes || themes.length === 0;
    }

    case "forecasts": {
      const projections = c?.projections as unknown[] | null | undefined;
      const scenarios = c?.scenarios as Record<string, unknown> | null | undefined;
      const hasProjections = !!projections && projections.length > 0;
      const hasScenarios = !!scenarios && Object.keys(scenarios).length > 0;
      return !hasProjections && !hasScenarios;
    }

    case "executive_summary":
    case "strategic_summary": {
      const narrative = c?.narrative as string | null | undefined;
      const highlights = c?.highlights as unknown[] | null | undefined;
      const hasNarrative = !!narrative && narrative.trim().length > 0;
      const hasHighlights = !!highlights && highlights.length > 0;
      return !hasNarrative && !hasHighlights;
    }

    case "competitive_market_analysis": {
      const narrative = c?.narrative as string | null | undefined;
      const comparisons = c?.comparisons as unknown[] | null | undefined;
      const hasNarrative = !!narrative && narrative.trim().length > 0;
      const hasComparisons = !!comparisons && comparisons.length > 0;
      return !hasNarrative && !hasComparisons;
    }

    case "polished_report":
    case "methodology": {
      const narrative = c?.narrative as string | null | undefined;
      return !narrative || narrative.trim().length === 0;
    }

    default:
      // Unknown section types → treat as empty to prevent JSON dumps
      return true;
  }
}

/**
 * Filter an array of sections, removing empty ones.
 * Used by document.tsx before rendering and by TableOfContents.
 */
export function filterSections<T extends Section>(sections: T[]): T[] {
  return sections.filter((s) => !isSectionEmpty(s));
}
