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
  executive_summary: NarrativeSectionPdf,
  strategic_summary: NarrativeSectionPdf,
};

export function getSectionRenderer(sectionType: string): SectionRenderer {
  return RENDERER_MAP[sectionType] || GenericSectionPdf;
}
