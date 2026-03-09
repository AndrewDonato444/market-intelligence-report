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
        <View key={i} style={styles.card}>
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
              <View key={scenarioKey} style={styles.card}>
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

function getRatingColor(rating: string): string {
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
            <View key={i} style={styles.card}>
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
  market_overview: MarketOverviewPdf,
  key_drivers: KeyDriversPdf,
  forecasts: ForecastsPdf,
  executive_summary: ExecutiveSummaryPdf,
  strategic_summary: NarrativeSectionPdf,
  competitive_market_analysis: CompetitiveAnalysisPdf,
  polished_report: PolishedReportPdf,
  methodology: MethodologySectionPdf,
};

export function getSectionRenderer(sectionType: string): SectionRenderer {
  return RENDERER_MAP[sectionType] || GenericSectionPdf;
}
