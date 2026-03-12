/**
 * PDF section renderers — type-specific content rendering for each section type.
 */

import React from "react";
import { View, Text } from "@react-pdf/renderer";
import { styles, COLORS } from "../styles";

// --- Types ---

interface SectionContent {
  sectionType: string;
  title: string;
  content: unknown;
}

type SectionRenderer = React.FC<{ section: SectionContent }>;

// --- Market Overview ---

interface MarketOverviewContent {
  narrative: string;
  highlights?: string[];
  recommendations?: string[];
}

export const MarketOverviewPdf: SectionRenderer = ({ section }) => {
  const content = section.content as MarketOverviewContent;
  return (
    <View>
      {content.narrative && <Text style={styles.body}>{content.narrative}</Text>}
      {content.highlights && content.highlights.length > 0 && (
        <View style={{ marginTop: 12 }}>
          <Text style={styles.subheading}>Highlights</Text>
          {content.highlights.map((item, i) => (
            <Text key={i} style={styles.bulletItem}>
              {"•  "}
              {item}
            </Text>
          ))}
        </View>
      )}
      {content.recommendations && content.recommendations.length > 0 && (
        <View style={{ marginTop: 12 }}>
          <Text style={styles.subheading}>Recommendations</Text>
          {content.recommendations.map((item, i) => (
            <Text key={i} style={styles.bulletItem}>
              {"•  "}
              {item}
            </Text>
          ))}
        </View>
      )}
    </View>
  );
};

// --- Key Drivers ---

interface KeyDriversContent {
  themes?: Array<{
    name: string;
    impact: string;
    trend: string;
    narrative: string;
  }>;
}

export const KeyDriversPdf: SectionRenderer = ({ section }) => {
  const content = section.content as KeyDriversContent;
  return (
    <View>
      {content.themes?.map((theme, i) => (
        <View key={i} style={styles.card} wrap={false}>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              marginBottom: 8,
            }}
          >
            <Text style={styles.subheading}>{theme.name}</Text>
            <View style={{ flexDirection: "row", gap: 8 }}>
              <Text
                style={{
                  ...styles.badge,
                  backgroundColor:
                    theme.impact === "high"
                      ? COLORS.success
                      : theme.impact === "medium"
                        ? COLORS.warning
                        : COLORS.textSecondary,
                }}
              >
                {theme.impact}
              </Text>
              <Text
                style={{
                  ...styles.badge,
                  backgroundColor: COLORS.primary,
                }}
              >
                {theme.trend === "up" ? "↑" : theme.trend === "down" ? "↓" : "→"}{" "}
                {theme.trend}
              </Text>
            </View>
          </View>
          <Text style={styles.body}>{theme.narrative}</Text>
        </View>
      ))}
    </View>
  );
};

// --- Forecasts ---

interface ForecastsContent {
  projections?: Array<{
    segment: string;
    sixMonth?: { medianPrice: number; confidence: string };
    twelveMonth?: { medianPrice: number; confidence: string };
  }>;
  scenarios?: {
    base?: ScenarioContent;
    bull?: ScenarioContent;
    bear?: ScenarioContent;
  };
}

interface ScenarioContent {
  narrative: string;
  assumptions?: string[];
  medianPriceChange?: number;
  volumeChange?: number;
}

export const ForecastsPdf: SectionRenderer = ({ section }) => {
  const content = section.content as ForecastsContent;
  return (
    <View>
      {content.projections && content.projections.length > 0 && (
        <View style={{ marginBottom: 16 }}>
          <Text style={styles.subheading}>Projections</Text>
          {/* Table header */}
          <View style={{ ...styles.tableRow, borderBottomWidth: 2 }}>
            <Text style={{ ...styles.tableHeader, flex: 1 }}>Segment</Text>
            <Text style={{ ...styles.tableHeader, flex: 1 }}>6-Month</Text>
            <Text style={{ ...styles.tableHeader, flex: 1 }}>12-Month</Text>
          </View>
          {content.projections.map((proj, i) => (
            <View key={i} style={styles.tableRow}>
              <Text style={styles.tableCell}>
                {proj.segment.replace(/_/g, " ")}
              </Text>
              <Text style={styles.tableCell}>
                {proj.sixMonth
                  ? `$${(proj.sixMonth.medianPrice / 1000000).toFixed(1)}M`
                  : "—"}
              </Text>
              <Text style={styles.tableCell}>
                {proj.twelveMonth
                  ? `$${(proj.twelveMonth.medianPrice / 1000000).toFixed(1)}M`
                  : "—"}
              </Text>
            </View>
          ))}
        </View>
      )}
      {content.scenarios && (
        <View>
          <Text style={styles.subheading}>Scenarios</Text>
          {(["base", "bull", "bear"] as const).map((scenarioKey) => {
            const scenario = content.scenarios?.[scenarioKey];
            if (!scenario) return null;
            return (
              <View key={scenarioKey} style={styles.card} wrap={false}>
                <Text style={{ ...styles.subheading, textTransform: "capitalize" }}>
                  {scenarioKey} Case
                </Text>
                <Text style={styles.body}>{scenario.narrative}</Text>
                {scenario.medianPriceChange !== undefined && (
                  <Text style={styles.bodySmall}>
                    Price change: {(scenario.medianPriceChange * 100).toFixed(1)}%
                  </Text>
                )}
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
};

// --- Narrative Section (executive_summary, strategic_summary) ---

interface NarrativeContent {
  narrative?: string;
  highlights?: string[];
  timing?: Record<string, string>;
}

export const NarrativeSectionPdf: SectionRenderer = ({ section }) => {
  const content = section.content as NarrativeContent;
  return (
    <View>
      {content.narrative && <Text style={styles.body}>{content.narrative}</Text>}
      {content.highlights && content.highlights.length > 0 && (
        <View style={{ marginTop: 12 }}>
          {content.highlights.map((item, i) => (
            <Text key={i} style={styles.bulletItem}>
              {"•  "}
              {item}
            </Text>
          ))}
        </View>
      )}
      {content.timing && Object.keys(content.timing).length > 0 && (
        <View style={{ marginTop: 12 }}>
          <Text style={styles.subheading}>Timing Guidance</Text>
          {Object.entries(content.timing).map(([key, value]) => (
            <View key={key} style={{ marginBottom: 8 }}>
              <Text style={styles.metadataLabel}>{key}</Text>
              <Text style={styles.body}>{value}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

// --- Executive Summary (enhanced with segment metrics) ---

interface ExecutiveSummaryContent {
  narrative?: string;
  highlights?: string[];
  timing?: Record<string, string>;
  segments?: Array<{
    name: string;
    count: number;
    medianPrice: number;
    rating: string;
  }>;
  overallRating?: string;
}

function getRatingColor(rating?: string): string {
  if (!rating) return COLORS.textSecondary;
  if (rating.startsWith("A")) return COLORS.success;
  if (rating.startsWith("B")) return COLORS.warning;
  return COLORS.error;
}

export const ExecutiveSummaryPdf: SectionRenderer = ({ section }) => {
  const content = section.content as ExecutiveSummaryContent;
  return (
    <View>
      {content.narrative && <Text style={styles.body}>{content.narrative}</Text>}
      {content.highlights && content.highlights.length > 0 && (
        <View style={{ marginTop: 12 }}>
          {content.highlights.map((item, i) => (
            <Text key={i} style={styles.bulletItem}>
              {"•  "}
              {item}
            </Text>
          ))}
        </View>
      )}
      {content.segments && content.segments.length > 0 && (
        <View style={{ marginTop: 16 }}>
          <Text style={styles.subheading}>Market Analysis Matrix</Text>
          <View style={{ ...styles.tableRow, borderBottomWidth: 2 }}>
            <Text style={{ ...styles.tableHeader, flex: 2 }}>Segment</Text>
            <Text style={{ ...styles.tableHeader, flex: 1 }}>Count</Text>
            <Text style={{ ...styles.tableHeader, flex: 1 }}>Median Price</Text>
            <Text style={{ ...styles.tableHeader, flex: 1 }}>Rating</Text>
          </View>
          {content.segments.map((seg, i) => (
            <View key={i} style={styles.tableRow}>
              <Text style={{ ...styles.tableCell, flex: 2 }}>
                {seg.name.replace(/_/g, " ")}
              </Text>
              <Text style={{ ...styles.tableCell, flex: 1 }}>
                {seg.count.toLocaleString()}
              </Text>
              <Text style={{ ...styles.tableCell, flex: 1 }}>
                ${(seg.medianPrice / 1000000).toFixed(1)}M
              </Text>
              <Text
                style={{
                  ...styles.tableCell,
                  flex: 1,
                  color: getRatingColor(seg.rating),
                  fontWeight: 700,
                }}
              >
                {seg.rating}
              </Text>
            </View>
          ))}
        </View>
      )}
      {content.timing && Object.keys(content.timing).length > 0 && (
        <View style={{ marginTop: 16 }}>
          <Text style={styles.subheading}>Timing Guidance</Text>
          {Object.entries(content.timing).map(([key, value]) => (
            <View key={key} style={{ marginBottom: 8 }}>
              <Text style={styles.metadataLabel}>{key}</Text>
              <Text style={styles.body}>{value}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

// --- Competitive Market Analysis ---

interface CompetitiveAnalysisContent {
  narrative?: string;
  comparisons?: Array<{
    market: string;
    medianPrice?: number;
    advantage?: string;
  }>;
}

export const CompetitiveAnalysisPdf: SectionRenderer = ({ section }) => {
  const content = section.content as CompetitiveAnalysisContent;
  return (
    <View>
      {content.narrative && <Text style={styles.body}>{content.narrative}</Text>}
      {content.comparisons && content.comparisons.length > 0 && (
        <View style={{ marginTop: 16 }}>
          <Text style={styles.subheading}>Peer Market Comparison</Text>
          {content.comparisons.map((comp, i) => (
            <View key={i} style={styles.card} wrap={false}>
              <Text style={styles.subheading}>{comp.market}</Text>
              {comp.medianPrice && (
                <Text style={styles.bodySmall}>
                  Median: ${(comp.medianPrice / 1000000).toFixed(1)}M
                </Text>
              )}
              {comp.advantage && (
                <Text style={styles.body}>{comp.advantage}</Text>
              )}
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

// --- Polished Report (pull quotes + methodology) ---

interface PolishedReportContent {
  pullQuotes?: Array<{ text: string; source: string }>;
  methodology?: string;
  narrative?: string;
}

export const PolishedReportPdf: SectionRenderer = ({ section }) => {
  const content = section.content as PolishedReportContent;
  return (
    <View>
      {content.narrative && <Text style={styles.body}>{content.narrative}</Text>}
      {content.pullQuotes && content.pullQuotes.length > 0 && (
        <View style={{ marginTop: 16 }}>
          {content.pullQuotes.map((quote, i) => (
            <View key={i} style={styles.pullQuote}>
              <Text style={styles.pullQuoteText}>
                &ldquo;{quote.text}&rdquo;
              </Text>
              <Text style={styles.pullQuoteSource}>— {quote.source}</Text>
            </View>
          ))}
        </View>
      )}
      {content.methodology && (
        <View style={{ marginTop: 16 }}>
          <Text style={styles.subheading}>Methodology</Text>
          <Text style={styles.body}>{content.methodology}</Text>
        </View>
      )}
    </View>
  );
};

// --- Methodology Section ---

interface MethodologyContent {
  narrative?: string;
  dataSources?: string[];
  confidenceNotes?: string;
}

export const MethodologySectionPdf: SectionRenderer = ({ section }) => {
  const content = section.content as MethodologyContent;
  return (
    <View>
      {content.narrative && <Text style={styles.body}>{content.narrative}</Text>}
      {content.dataSources && content.dataSources.length > 0 && (
        <View style={{ marginTop: 12 }}>
          <Text style={styles.subheading}>Data Sources</Text>
          {content.dataSources.map((source, i) => (
            <Text key={i} style={styles.bulletItem}>
              {"•  "}
              {source}
            </Text>
          ))}
        </View>
      )}
      {content.confidenceNotes && (
        <View style={{ marginTop: 12 }}>
          <Text style={styles.subheading}>Confidence Notes</Text>
          <Text style={styles.body}>{content.confidenceNotes}</Text>
        </View>
      )}
    </View>
  );
};

// --- Persona Intelligence (Section 10) ---

interface PersonaIntelligenceContent {
  strategy: string;
  personas: Array<{
    personaSlug: string;
    personaName: string;
    selectionOrder: number;
    talkingPoints: Array<{
      headline: string;
      detail: string;
      dataSource: string;
      relevance: string;
    }>;
    narrativeOverlay: {
      perspective: string;
      emphasis: string[];
      deEmphasis: string[];
      toneGuidance: string;
    };
    metricEmphasis: Array<{
      metricName: string;
      currentValue: string;
      interpretation: string;
      priority: "primary" | "secondary";
    }>;
    vocabulary: {
      preferred: string[];
      avoid: string[];
    };
  }>;
  blended: {
    metricUnion: string[];
    filterIntersection: {
      priceRange: { min: number; max: number | null };
      propertyTypes: string[];
      communityTypes: string[];
    };
    blendedTalkingPoints: Array<{
      headline: string;
      detail: string;
      dataSource: string;
      relevance: string;
    }>;
    conflicts: Array<{
      metric: string;
      emphasizedBy: string;
      deEmphasizedBy: string;
      resolution: string;
    }>;
  } | null;
  meta: {
    personaCount: number;
    primaryPersona: string;
    modelUsed: string;
    promptTokens: number;
    completionTokens: number;
  };
}

/**
 * Humanize a dataSource key like "yoy.volumeChange" → "YoY Volume Change"
 */
function humanizeDataSource(key: string): string {
  // Split on dots, then camelCase → words
  return key
    .split(".")
    .map((segment) => {
      // Special case: "yoy" → "YoY"
      if (segment.toLowerCase() === "yoy") return "YoY";
      // camelCase → space-separated, capitalize each word
      return segment
        .replace(/([a-z])([A-Z])/g, "$1 $2")
        .replace(/^./, (c) => c.toUpperCase());
    })
    .join(" ");
}

function TalkingPointPdf({ tp }: { tp: { headline: string; detail: string; dataSource: string } }) {
  return (
    <View style={{ marginBottom: 12 }} wrap={false}>
      <Text style={styles.talkingPointHeadline}>{tp.headline}</Text>
      <Text style={styles.talkingPointDetail}>{tp.detail}</Text>
      <Text style={styles.talkingPointSource}>Source: {humanizeDataSource(tp.dataSource)}</Text>
    </View>
  );
}

function PersonaCardPdf({ persona }: { persona: PersonaIntelligenceContent["personas"][0] }) {
  const isPrimary = persona.selectionOrder === 1;
  return (
    <View style={isPrimary ? styles.personaCardPrimary : styles.personaCard}>
      {/* Persona name */}
      <Text style={styles.personaName}>{persona.personaName}</Text>
      {isPrimary && <Text style={styles.primaryPersonaLabel}>PRIMARY PERSONA</Text>}

      {/* Talking Points */}
      <Text style={styles.sectionLabel}>TALKING POINTS</Text>
      {persona.talkingPoints.map((tp, i) => (
        <TalkingPointPdf key={i} tp={tp} />
      ))}

      <View style={styles.divider} />

      {/* Narrative Lens */}
      <View wrap={false}>
        <Text style={styles.sectionLabel}>NARRATIVE LENS</Text>
        <Text style={styles.body}>{persona.narrativeOverlay.perspective}</Text>
        <Text style={styles.bodySmall}>
          {"Emphasize: "}
          {persona.narrativeOverlay.emphasis.map((item, i) => (
            <Text key={i}>
              <Text style={{ color: COLORS.success }}>{"\u25CF "}</Text>
              {item}
              {i < persona.narrativeOverlay.emphasis.length - 1 ? "  " : ""}
            </Text>
          ))}
        </Text>
        <Text style={styles.bodySmall}>
          {"De-emphasize: "}
          {persona.narrativeOverlay.deEmphasis.map((item, i) => (
            <Text key={i}>
              <Text style={{ color: COLORS.textSecondary }}>{"\u25CB "}</Text>
              {item}
              {i < persona.narrativeOverlay.deEmphasis.length - 1 ? "  " : ""}
            </Text>
          ))}
        </Text>
        <Text style={{ ...styles.bodySmall, fontStyle: "italic" }}>
          {persona.narrativeOverlay.toneGuidance}
        </Text>
      </View>

      <View style={styles.divider} />

      {/* Key Metrics */}
      <Text style={styles.sectionLabel}>KEY METRICS</Text>
      <View style={{ ...styles.tableRow, borderBottomWidth: 2 }}>
        <Text style={{ ...styles.tableHeader, flex: 2 }}>Metric</Text>
        <Text style={{ ...styles.tableHeader, flex: 1.5 }}>Value</Text>
        <Text style={{ ...styles.tableHeader, flex: 4 }}>Interpretation</Text>
      </View>
      {persona.metricEmphasis.map((metric, i) => (
        <View key={i} style={styles.tableRow} wrap={false}>
          <Text
            style={{
              ...styles.tableCell,
              flex: 2,
              fontWeight: metric.priority === "primary" ? 700 : 400,
            }}
          >
            {metric.metricName}
          </Text>
          <Text style={{ ...styles.tableCell, flex: 1.5 }}>{metric.currentValue}</Text>
          <Text style={{ ...styles.tableCell, flex: 4 }}>{metric.interpretation}</Text>
        </View>
      ))}

      <View style={styles.divider} />

      {/* Vocabulary Guide */}
      <View wrap={false}>
        <Text style={styles.sectionLabel}>VOCABULARY GUIDE</Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", marginBottom: 4 }}>
          <Text style={styles.bodySmall}>Use: </Text>
          {persona.vocabulary.preferred.map((term, i) => (
            <Text key={i} style={styles.vocabTagPreferred}>{term}</Text>
          ))}
        </View>
        <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
          <Text style={styles.bodySmall}>Avoid: </Text>
          {persona.vocabulary.avoid.map((term, i) => (
            <Text key={i} style={styles.vocabTagAvoid}>{term}</Text>
          ))}
        </View>
      </View>
    </View>
  );
}

function BlendedInsightsPdf({ blended }: { blended: NonNullable<PersonaIntelligenceContent["blended"]> }) {
  const { filterIntersection: fi } = blended;
  const priceLabel = fi.priceRange.max
    ? `$${(fi.priceRange.min / 1_000_000).toFixed(0)}M–$${(fi.priceRange.max / 1_000_000).toFixed(0)}M`
    : `$${(fi.priceRange.min / 1_000_000).toFixed(0)}M+`;

  return (
    <View style={styles.blendedSection}>
      <Text style={{ ...styles.personaName, marginBottom: 12 }}>BLENDED INTELLIGENCE</Text>

      {/* Combined Talking Points */}
      <Text style={styles.sectionLabel}>COMBINED TALKING POINTS</Text>
      {blended.blendedTalkingPoints.map((tp, i) => (
        <TalkingPointPdf key={i} tp={tp} />
      ))}

      <View style={styles.divider} />

      {/* Metric Union */}
      <Text style={styles.sectionLabel}>METRIC UNION</Text>
      <Text style={styles.body}>
        {blended.metricUnion
          .map((m) => (typeof m === "string" ? m : typeof m === "object" && m !== null ? ((m as Record<string, unknown>).metricName ?? (m as Record<string, unknown>).name ?? JSON.stringify(m)) : String(m)))
          .join(" \u2022 ")}
      </Text>

      {/* Filter Overlap */}
      <Text style={styles.sectionLabel}>FILTER OVERLAP</Text>
      <Text style={styles.body}>
        Price: {priceLabel}  |  Types: {fi.propertyTypes.join(", ")}
      </Text>
      <Text style={styles.body}>
        Communities: {fi.communityTypes.join(", ")}
      </Text>

      {/* Conflicts */}
      {blended.conflicts.length > 0 && (
        <View style={{ marginTop: 8 }}>
          <Text style={styles.sectionLabel}>CONFLICTS</Text>
          {blended.conflicts.map((conflict, i) => (
            <View key={i} style={styles.conflictBox}>
              <Text style={styles.body}>
                &ldquo;{conflict.metric}&rdquo;{conflict.emphasizedBy ? ` — emphasized by ${conflict.emphasizedBy}` : ""}{conflict.deEmphasizedBy ? `, de-emphasized by ${conflict.deEmphasizedBy}` : ""}.
              </Text>
              <Text style={{ ...styles.bodySmall, fontStyle: "italic" }}>
                {conflict.resolution}
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

export const PersonaIntelligencePdf: SectionRenderer = ({ section }) => {
  const content = section.content as PersonaIntelligenceContent;
  const sortedPersonas = [...content.personas].sort(
    (a, b) => a.selectionOrder - b.selectionOrder
  );

  return (
    <View>
      {sortedPersonas.map((persona, i) => (
        <PersonaCardPdf key={i} persona={persona} />
      ))}
      {content.blended && <BlendedInsightsPdf blended={content.blended} />}
    </View>
  );
};

// --- PersonaFraming Callout (injected into narrative sections 1, 5, 6, 8) ---

interface PersonaFramingData {
  personaName: string;
  perspective: string;
  emphasis: string[];
  deEmphasis: string[];
  toneGuidance: string;
}

export const PersonaFramingCallout: React.FC<{
  personaFraming: PersonaFramingData | null | undefined;
}> = ({ personaFraming }) => {
  if (!personaFraming) return null;
  return (
    <View style={styles.personaCallout}>
      <Text style={styles.personaCalloutLabel}>
        Persona Lens: {personaFraming.personaName}
      </Text>
      <Text style={styles.personaCalloutBody}>
        {personaFraming.perspective}
      </Text>
      <Text style={styles.personaCalloutFocus}>
        Focus: {personaFraming.emphasis.join(" \u2022 ")}
      </Text>
    </View>
  );
};

// =====================================================================
// V2 PIPELINE RENDERERS
// =====================================================================

// --- Executive Briefing (v2) ---

interface ExecutiveBriefingContent {
  headline: {
    rating: string;
    medianPrice: number;
    yoyPriceChange: number;
    totalProperties: number;
  };
  narrative: string | null;
  confidence: { level: string; sampleSize: number };
  personaFraming?: unknown;
}

export const ExecutiveBriefingPdf: SectionRenderer = ({ section }) => {
  const c = section.content as ExecutiveBriefingContent;
  const h = c.headline;
  const priceFmt = h.medianPrice >= 1_000_000
    ? `$${(h.medianPrice / 1_000_000).toFixed(1)}M`
    : `$${(h.medianPrice / 1_000).toFixed(0)}K`;
  const yoyPct = (h.yoyPriceChange * 100).toFixed(1);
  const yoyDir = h.yoyPriceChange > 0 ? "↑" : h.yoyPriceChange < 0 ? "↓" : "→";

  return (
    <View>
      {/* Headline metrics row */}
      <View style={{ flexDirection: "row", marginBottom: 16, gap: 12 }}>
        <View style={{ ...styles.card, flex: 1, alignItems: "center" }} wrap={false}>
          <Text style={styles.metadataLabel}>Market Rating</Text>
          <Text style={{ fontFamily: "Playfair Display", fontSize: 28, color: getRatingColor(h.rating) }}>{h.rating}</Text>
        </View>
        <View style={{ ...styles.card, flex: 1, alignItems: "center" }} wrap={false}>
          <Text style={styles.metadataLabel}>Median Price</Text>
          <Text style={{ fontFamily: "Playfair Display", fontSize: 20, color: COLORS.primary }}>{priceFmt}</Text>
        </View>
        <View style={{ ...styles.card, flex: 1, alignItems: "center" }} wrap={false}>
          <Text style={styles.metadataLabel}>YoY Change</Text>
          <Text style={{ fontFamily: "Inter", fontSize: 16, color: h.yoyPriceChange >= 0 ? COLORS.success : COLORS.error }}>{yoyDir} {yoyPct}%</Text>
        </View>
        <View style={{ ...styles.card, flex: 1, alignItems: "center" }} wrap={false}>
          <Text style={styles.metadataLabel}>Properties</Text>
          <Text style={{ fontFamily: "Inter", fontSize: 16, color: COLORS.primary }}>{h.totalProperties}</Text>
        </View>
      </View>
      {c.narrative && <Text style={styles.body}>{c.narrative}</Text>}
      <Text style={styles.bodySmall}>
        Confidence: {c.confidence.level} (n={c.confidence.sampleSize})
      </Text>
    </View>
  );
};

// --- Market Insights Index (v2) ---

interface InsightDimension {
  label: string;
  score: number | null;
  components: Record<string, number | null>;
}

interface MarketInsightsIndexContent {
  insightsIndex: {
    risk: InsightDimension;
    value: InsightDimension;
    timing: InsightDimension;
    liquidity: InsightDimension;
  };
}

export const MarketInsightsIndexPdf: SectionRenderer = ({ section }) => {
  const c = section.content as MarketInsightsIndexContent;
  const dimensions = [
    { key: "risk", data: c.insightsIndex.risk },
    { key: "value", data: c.insightsIndex.value },
    { key: "timing", data: c.insightsIndex.timing },
    { key: "liquidity", data: c.insightsIndex.liquidity },
  ];

  return (
    <View>
      {dimensions.map(({ key, data }) => (
        <View key={key} style={styles.card} wrap={false}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 6 }}>
            <Text style={styles.subheading}>{key.charAt(0).toUpperCase() + key.slice(1)}</Text>
            <Text style={{ ...styles.badge, backgroundColor: data.score != null && data.score >= 7 ? COLORS.success : data.score != null && data.score >= 4 ? COLORS.warning : COLORS.textSecondary }}>
              {data.label}
            </Text>
          </View>
          {data.score != null && (
            <Text style={{ fontFamily: "Inter", fontSize: 24, color: COLORS.accent, marginBottom: 4 }}>{data.score}/10</Text>
          )}
          {Object.entries(data.components).map(([compKey, val]) => (
            <Text key={compKey} style={styles.bodySmall}>
              {compKey.replace(/([A-Z])/g, " $1").replace(/^./, (ch) => ch.toUpperCase())}: {val != null ? (typeof val === "number" && Math.abs(val) < 1 ? `${(val * 100).toFixed(1)}%` : val.toLocaleString()) : "N/A"}
            </Text>
          ))}
        </View>
      ))}
    </View>
  );
};

// --- Luxury Market Dashboard (v2) ---

interface DashboardMetric {
  name: string;
  value: number | string | null;
  trend: string | null;
  trendValue: number | null;
  category: string;
}

interface LuxuryMarketDashboardContent {
  dashboard: {
    powerFive: DashboardMetric[];
    tierTwo: DashboardMetric[];
    tierThree: DashboardMetric[];
  };
  detailMetrics: Record<string, number | null>;
}

// Metrics displayed as percentages (e.g. 0.4 → "40%" or legacy 40 → "40%")
const PERCENTAGE_METRICS = new Set([
  "Flood Zone Exposure",
  "Investor Activity Rate",
  "Free & Clear %",
  "Cash Buyer %",
]);

// Metrics displayed as plain counts (no $ or %)
const COUNT_METRICS = new Set([
  "Median Days on Market",
  "Transaction Volume",
]);

function formatMetricValue(val: number | string | null, metricName?: string): string {
  if (val == null) return "N/A";
  if (typeof val === "string") return val;

  // List-to-Sale Ratio: raw decimal ~1.0 means 100%
  if (metricName === "List-to-Sale Ratio") {
    if (val > 0.5 && val < 2) return `${(val * 100).toFixed(1)}%`;
    // Legacy pre-scaled: values 50-200 are already percentages
    if (val >= 50 && val <= 200) return `${val.toFixed(1)}%`;
    return val.toLocaleString();
  }

  // Percentage metrics: raw decimal (0-1) or legacy pre-multiplied (>=1)
  if (metricName && PERCENTAGE_METRICS.has(metricName)) {
    if (val > 0 && val < 1) return `${(val * 100).toFixed(1)}%`;
    return `${val}%`;
  }

  // Count metrics: plain number
  if (metricName && COUNT_METRICS.has(metricName)) {
    return val.toLocaleString();
  }

  // Default: dollar formatting
  if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(1)}M`;
  if (val >= 1_000) return `$${(val / 1_000).toFixed(0)}K`;
  if (val > 0 && val < 1) return `${(val * 100).toFixed(1)}%`;
  return val.toLocaleString();
}

function trendArrow(trend: string | null): string {
  if (trend === "up") return "↑";
  if (trend === "down") return "↓";
  if (trend === "flat") return "→";
  return "";
}

function MetricTier({ label, metrics }: { label: string; metrics: DashboardMetric[] }) {
  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={styles.sectionLabel}>{label}</Text>
      <View style={{ ...styles.tableRow, borderBottomWidth: 2 }}>
        <Text style={{ ...styles.tableHeader, flex: 3 }}>Metric</Text>
        <Text style={{ ...styles.tableHeader, flex: 2 }}>Value</Text>
        <Text style={{ ...styles.tableHeader, flex: 1 }}>Trend</Text>
      </View>
      {metrics.map((m, i) => (
        <View key={i} style={styles.tableRow}>
          <Text style={{ ...styles.tableCell, flex: 3 }}>{m.name}</Text>
          <Text style={{ ...styles.tableCell, flex: 2 }}>{formatMetricValue(m.value, m.name)}</Text>
          <Text style={{ ...styles.tableCell, flex: 1, color: m.trend === "up" ? COLORS.success : m.trend === "down" ? COLORS.error : COLORS.textSecondary }}>
            {trendArrow(m.trend)}{m.trendValue != null ? ` ${(m.trendValue * 100).toFixed(1)}%` : ""}
          </Text>
        </View>
      ))}
    </View>
  );
}

export const LuxuryMarketDashboardPdf: SectionRenderer = ({ section }) => {
  const c = section.content as LuxuryMarketDashboardContent;
  return (
    <View>
      <MetricTier label="POWER FIVE INDICATORS" metrics={c.dashboard.powerFive} />
      <MetricTier label="TIER TWO METRICS" metrics={c.dashboard.tierTwo} />
      <MetricTier label="TIER THREE METRICS" metrics={c.dashboard.tierThree} />
    </View>
  );
};

// --- Neighborhood Intelligence (v2) ---

interface NeighborhoodIntelligenceContent {
  narrative: string | null;
  neighborhoods: Array<{
    name: string;
    zipCode: string;
    amenities: string[];
    medianPrice: number;
    propertyCount: number;
    yoyPriceChange: number | null;
  }>;
}

export const NeighborhoodIntelligencePdf: SectionRenderer = ({ section }) => {
  const c = section.content as NeighborhoodIntelligenceContent;
  return (
    <View>
      {c.narrative && <Text style={styles.body}>{c.narrative}</Text>}
      {c.neighborhoods.length > 0 && (
        <View style={{ marginTop: 12 }}>
          <View style={{ ...styles.tableRow, borderBottomWidth: 2 }}>
            <Text style={{ ...styles.tableHeader, flex: 2 }}>Neighborhood</Text>
            <Text style={{ ...styles.tableHeader, flex: 1 }}>ZIP</Text>
            <Text style={{ ...styles.tableHeader, flex: 1 }}>Median Price</Text>
            <Text style={{ ...styles.tableHeader, flex: 1 }}>Count</Text>
            <Text style={{ ...styles.tableHeader, flex: 1 }}>YoY</Text>
          </View>
          {c.neighborhoods.map((n, i) => (
            <View key={i} style={styles.tableRow}>
              <Text style={{ ...styles.tableCell, flex: 2 }}>{n.name}</Text>
              <Text style={{ ...styles.tableCell, flex: 1 }}>{n.zipCode}</Text>
              <Text style={{ ...styles.tableCell, flex: 1 }}>
                {n.medianPrice >= 1_000_000 ? `$${(n.medianPrice / 1_000_000).toFixed(1)}M` : `$${(n.medianPrice / 1_000).toFixed(0)}K`}
              </Text>
              <Text style={{ ...styles.tableCell, flex: 1 }}>{n.propertyCount}</Text>
              <Text style={{ ...styles.tableCell, flex: 1, color: n.yoyPriceChange != null && n.yoyPriceChange >= 0 ? COLORS.success : COLORS.error }}>
                {n.yoyPriceChange != null ? `${(n.yoyPriceChange * 100).toFixed(1)}%` : "N/A"}
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

// --- The Narrative (v2) ---

interface TheNarrativeTheme {
  name: string;
  impact: string;
  trend: string;
  narrative: string;
}

interface TheNarrativeContent {
  editorial: string | null;
  themes: Array<TheNarrativeTheme | string>;
  marketContext: {
    rating: string;
    yoy: { medianPriceChange: number; volumeChange: number; pricePerSqftChange: number | null };
    segments: Array<{ name: string; count: number; rating: string; medianPrice: number; propertyType: string }>;
  };
  personaFraming?: unknown;
}

export const TheNarrativePdf: SectionRenderer = ({ section }) => {
  const c = section.content as TheNarrativeContent;
  return (
    <View>
      {c.editorial && <Text style={styles.body}>{c.editorial}</Text>}
      {c.themes.length > 0 && (
        <View style={{ marginTop: 12 }}>
          <Text style={styles.subheading}>Key Themes</Text>
          {c.themes.map((theme, i) => {
            // Handle both string themes (legacy) and object themes
            if (typeof theme === "string") {
              return (
                <View key={i} style={styles.card} wrap={false}>
                  <Text style={{ ...styles.subheading, marginBottom: 0 }}>{theme}</Text>
                </View>
              );
            }
            return (
              <View key={i} style={styles.card} wrap={false}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 6 }}>
                  <Text style={{ ...styles.subheading, marginBottom: 0 }}>{theme.name}</Text>
                  <Text style={{ ...styles.badge, backgroundColor: theme.impact === "high" ? COLORS.success : theme.impact === "medium" ? COLORS.warning : COLORS.textSecondary }}>
                    {theme.impact} {theme.trend === "up" ? "\u2191" : theme.trend === "down" ? "\u2193" : "\u2192"}
                  </Text>
                </View>
                {theme.narrative && <Text style={styles.body}>{theme.narrative}</Text>}
              </View>
            );
          })}
        </View>
      )}
      {c.marketContext.segments.length > 0 && (
        <View style={{ marginTop: 12 }}>
          <Text style={styles.subheading}>Market Segments</Text>
          <View style={{ ...styles.tableRow, borderBottomWidth: 2 }}>
            <Text style={{ ...styles.tableHeader, flex: 2 }}>Segment</Text>
            <Text style={{ ...styles.tableHeader, flex: 1 }}>Count</Text>
            <Text style={{ ...styles.tableHeader, flex: 1 }}>Median</Text>
            <Text style={{ ...styles.tableHeader, flex: 1 }}>Rating</Text>
          </View>
          {c.marketContext.segments.map((seg, i) => (
            <View key={i} style={styles.tableRow}>
              <Text style={{ ...styles.tableCell, flex: 2 }}>{seg.name}</Text>
              <Text style={{ ...styles.tableCell, flex: 1 }}>{seg.count}</Text>
              <Text style={{ ...styles.tableCell, flex: 1 }}>
                {seg.medianPrice >= 1_000_000 ? `$${(seg.medianPrice / 1_000_000).toFixed(1)}M` : `$${(seg.medianPrice / 1_000).toFixed(0)}K`}
              </Text>
              <Text style={{ ...styles.tableCell, flex: 1, color: getRatingColor(seg.rating), fontWeight: 700 }}>
                {seg.rating}
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

// --- Forward Look (v2) ---

interface ForwardLookContent {
  forecast: string | null;
  guidance: string | { buyers: string; sellers: string } | null;
  personaFraming?: unknown;
}

export const ForwardLookPdf: SectionRenderer = ({ section }) => {
  const c = section.content as ForwardLookContent;
  if (!c.forecast && !c.guidance) {
    return <Text style={styles.bodySmall}>Forecast data not available for this market. Insufficient historical data for projections.</Text>;
  }
  return (
    <View>
      {c.forecast && (
        <View style={{ marginBottom: 12 }}>
          <Text style={styles.subheading}>Forecast</Text>
          <Text style={styles.body}>{c.forecast}</Text>
        </View>
      )}
      {c.guidance && (
        <View>
          <Text style={styles.subheading}>Guidance</Text>
          {typeof c.guidance === "string" ? (
            <Text style={styles.body}>{c.guidance}</Text>
          ) : (
            <View>
              <View style={{ marginBottom: 8 }}>
                <Text style={{ ...styles.body, fontWeight: 700, marginBottom: 2 }}>For Buyers</Text>
                <Text style={styles.body}>{c.guidance.buyers}</Text>
              </View>
              <View>
                <Text style={{ ...styles.body, fontWeight: 700, marginBottom: 2 }}>For Sellers</Text>
                <Text style={styles.body}>{c.guidance.sellers}</Text>
              </View>
            </View>
          )}
        </View>
      )}
    </View>
  );
};

// --- Comparative Positioning (v2) ---

interface ComparativePositioningContent {
  peerRankings: Array<{ metric: string; targetRank: number; totalMarkets: number }>;
  peerComparisons: Array<{
    name: string;
    rating: string;
    medianPrice: number;
    totalProperties: number;
    geography: { city: string; state: string };
    yoy: { medianPriceChange: number; volumeChange: number };
  }>;
}

export const ComparativePositioningPdf: SectionRenderer = ({ section }) => {
  const c = section.content as ComparativePositioningContent;
  return (
    <View>
      {c.peerRankings.length > 0 && (
        <View style={{ marginBottom: 16 }}>
          <Text style={styles.subheading}>Market Rankings</Text>
          {c.peerRankings.map((r, i) => (
            <View key={i} style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: COLORS.border }}>
              <Text style={styles.body}>{r.metric}</Text>
              <Text style={{ ...styles.body, fontWeight: 700, color: r.targetRank === 1 ? COLORS.success : COLORS.textPrimary }}>
                #{r.targetRank} of {r.totalMarkets}
              </Text>
            </View>
          ))}
        </View>
      )}
      {c.peerComparisons.length > 0 && (
        <View>
          <Text style={styles.subheading}>Peer Markets</Text>
          {c.peerComparisons.map((peer, i) => (
            <View key={i} style={styles.card} wrap={false}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 6 }}>
                <Text style={styles.subheading}>{peer.name}, {peer.geography.state}</Text>
                <Text style={{ ...styles.badge, backgroundColor: getRatingColor(peer.rating) }}>{peer.rating}</Text>
              </View>
              <Text style={styles.body}>
                Median: {peer.medianPrice >= 1_000_000 ? `$${(peer.medianPrice / 1_000_000).toFixed(1)}M` : `$${(peer.medianPrice / 1_000).toFixed(0)}K`}  |  Properties: {peer.totalProperties}
              </Text>
              <Text style={styles.bodySmall}>
                YoY Price: {(peer.yoy.medianPriceChange * 100).toFixed(1)}%  |  YoY Volume: {(peer.yoy.volumeChange * 100).toFixed(1)}%
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

// --- Strategic Benchmark (v2) ---

interface StrategicBenchmarkContent {
  narrative: string | null;
  scorecard: Array<{
    segment: string;
    rating: string;
    medianPrice: number;
    yoyChange: number;
    trend: string;
    propertyCount: number;
  }>;
  personaFraming?: unknown;
}

export const StrategicBenchmarkPdf: SectionRenderer = ({ section }) => {
  const c = section.content as StrategicBenchmarkContent;
  return (
    <View>
      {c.narrative && <Text style={styles.body}>{c.narrative}</Text>}
      {c.scorecard.length > 0 && (
        <View style={{ marginTop: 12 }}>
          <Text style={styles.subheading}>Market Scorecard</Text>
          <View style={{ ...styles.tableRow, borderBottomWidth: 2 }}>
            <Text style={{ ...styles.tableHeader, flex: 2 }}>Segment</Text>
            <Text style={{ ...styles.tableHeader, flex: 1 }}>Rating</Text>
            <Text style={{ ...styles.tableHeader, flex: 1 }}>Median</Text>
            <Text style={{ ...styles.tableHeader, flex: 1 }}>YoY</Text>
            <Text style={{ ...styles.tableHeader, flex: 1 }}>Trend</Text>
            <Text style={{ ...styles.tableHeader, flex: 1 }}>Count</Text>
          </View>
          {c.scorecard.map((row, i) => (
            <View key={i} style={styles.tableRow}>
              <Text style={{ ...styles.tableCell, flex: 2 }}>{row.segment}</Text>
              <Text style={{ ...styles.tableCell, flex: 1, color: getRatingColor(row.rating), fontWeight: 700 }}>{row.rating}</Text>
              <Text style={{ ...styles.tableCell, flex: 1 }}>
                {row.medianPrice >= 1_000_000 ? `$${(row.medianPrice / 1_000_000).toFixed(1)}M` : `$${(row.medianPrice / 1_000).toFixed(0)}K`}
              </Text>
              <Text style={{ ...styles.tableCell, flex: 1, color: row.yoyChange >= 0 ? COLORS.success : COLORS.error }}>
                {(row.yoyChange * 100).toFixed(1)}%
              </Text>
              <Text style={{ ...styles.tableCell, flex: 1 }}>
                {row.trend === "up" ? "↑" : row.trend === "down" ? "↓" : "→"}
              </Text>
              <Text style={{ ...styles.tableCell, flex: 1 }}>{row.propertyCount}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

// --- Disclaimer & Methodology (v2) ---

interface DisclaimerMethodologyContent {
  disclaimer: string;
  methodology: string | null;
  dataSources: Array<{ name: string; status: string }>;
  confidence: { level: string; sampleSize: number; detailCoverage: number; staleDataSources: string[] };
}

export const DisclaimerMethodologyPdf: SectionRenderer = ({ section }) => {
  const c = section.content as DisclaimerMethodologyContent;
  return (
    <View>
      {c.disclaimer && (
        <View style={{ marginBottom: 16 }}>
          <Text style={styles.subheading}>Disclaimer</Text>
          <Text style={styles.bodySmall}>{c.disclaimer}</Text>
        </View>
      )}
      {c.methodology && (
        <View style={{ marginBottom: 16 }}>
          <Text style={styles.subheading}>Methodology</Text>
          <Text style={styles.body}>{c.methodology}</Text>
        </View>
      )}
      {c.dataSources.length > 0 && (
        <View style={{ marginBottom: 16 }}>
          <Text style={styles.subheading}>Data Sources</Text>
          {c.dataSources.map((src, i) => (
            <View key={i} style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: COLORS.border }}>
              <Text style={styles.body}>{src.name}</Text>
              <Text style={{ ...styles.badge, backgroundColor: src.status === "fresh" ? COLORS.success : COLORS.warning }}>{src.status}</Text>
            </View>
          ))}
        </View>
      )}
      <View>
        <Text style={styles.subheading}>Confidence</Text>
        <Text style={styles.body}>
          Level: {c.confidence.level}  |  Sample size: {c.confidence.sampleSize}  |  Detail coverage: {(c.confidence.detailCoverage * 100).toFixed(0)}%
        </Text>
        {c.confidence.staleDataSources.length > 0 && (
          <Text style={styles.bodySmall}>
            Stale sources: {c.confidence.staleDataSources.join(", ")}
          </Text>
        )}
      </View>
    </View>
  );
};

// --- Generic Section (fallback) ---

export const GenericSectionPdf: SectionRenderer = ({ section }) => {
  const content = section.content;
  if (typeof content === "string") {
    return <Text style={styles.body}>{content}</Text>;
  }
  return (
    <Text style={styles.body}>
      {JSON.stringify(content, null, 2)}
    </Text>
  );
};

// --- Renderer dispatch ---

const RENDERER_MAP: Record<string, SectionRenderer> = {
  // v1 section types (kept for backward compatibility)
  market_overview: MarketOverviewPdf,
  key_drivers: KeyDriversPdf,
  forecasts: ForecastsPdf,
  executive_summary: ExecutiveSummaryPdf,
  strategic_summary: NarrativeSectionPdf,
  competitive_market_analysis: CompetitiveAnalysisPdf,
  polished_report: PolishedReportPdf,
  methodology: MethodologySectionPdf,
  // v2 section types
  executive_briefing: ExecutiveBriefingPdf,
  market_insights_index: MarketInsightsIndexPdf,
  luxury_market_dashboard: LuxuryMarketDashboardPdf,
  neighborhood_intelligence: NeighborhoodIntelligencePdf,
  the_narrative: TheNarrativePdf,
  forward_look: ForwardLookPdf,
  comparative_positioning: ComparativePositioningPdf,
  strategic_benchmark: StrategicBenchmarkPdf,
  disclaimer_methodology: DisclaimerMethodologyPdf,
  persona_intelligence: PersonaIntelligencePdf,
};

export function getSectionRenderer(sectionType: string): SectionRenderer {
  return RENDERER_MAP[sectionType] || GenericSectionPdf;
}
