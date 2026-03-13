/**
 * PDF Market Intelligence Summary — "At a Glance" page.
 *
 * Renders headline metrics, insights index bar chart, segment distribution,
 * YoY trend indicators, key highlights, and a confidence footer strip.
 */

import React from "react";
import { Page, View, Text } from "@react-pdf/renderer";
import { styles, COLORS } from "../styles";
import {
  HorizontalBarChart,
  SegmentDistributionBar,
  TrendIndicator,
} from "../components/data-viz";
import type { ReportMetadata } from "@/lib/agents/schema";

interface SectionEntry {
  sectionType: string;
  title: string;
  content: unknown;
}

interface InsightsIndexProps {
  metadata: ReportMetadata;
  sections: SectionEntry[];
}

function getConfidenceColor(level: string): string {
  switch (level.toLowerCase()) {
    case "high":
      return COLORS.success;
    case "medium":
      return COLORS.warning;
    case "low":
      return COLORS.error;
    default:
      return COLORS.textSecondary;
  }
}

function formatVolume(value: number): string {
  if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(1)}M`;
  if (value >= 1e3) return `$${(value / 1e3).toFixed(0)}K`;
  return `$${value}`;
}

function formatPrice(value: number): string {
  if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
  if (value >= 1e3) return `$${(value / 1e3).toFixed(0)}K`;
  return `$${value}`;
}

function formatYoY(value: number): string {
  return `${value > 0 ? "+" : ""}${value}%`;
}

export function InsightsIndex({ metadata, sections }: InsightsIndexProps) {
  const generatedDate = new Date(metadata.generatedAt).toLocaleDateString(
    "en-US",
    { month: "long", day: "numeric", year: "numeric" }
  );

  // Extract data from sections
  const execBriefing = sections.find(
    (s) => s.sectionType === "executive_briefing"
  );
  const execContent = execBriefing?.content as {
    medianPrice?: number;
    totalVolume?: number;
    properties?: number;
    yoyChange?: number;
    yoyVolumeChange?: number;
    yoyTransactionCountChange?: number;
    highlights?: string[];
    narrative?: string;
  } | undefined;

  const insightsIndexSection = sections.find(
    (s) => s.sectionType === "market_insights_index"
  );
  const indexContent = insightsIndexSection?.content as {
    liquidity?: { score: number; label: string };
    timing?: { score: number; label: string };
    risk?: { score: number; label: string };
    value?: { score: number; label: string };
  } | undefined;

  const dashboardSection = sections.find(
    (s) => s.sectionType === "luxury_market_dashboard"
  );
  const dashContent = dashboardSection?.content as {
    segments?: Array<{ name: string; count: number; medianPrice: number; rating: string }>;
  } | undefined;

  // Headline metrics
  const totalTransactions = execContent?.properties ?? 0;
  const totalVolume = execContent?.totalVolume ?? 0;
  const medianPrice = execContent?.medianPrice ?? 0;
  const yoyPriceChange = execContent?.yoyChange ?? 0;

  // Insights index dimensions
  const dimensions: Array<{ label: string; score: number }> = [];
  if (indexContent?.liquidity) dimensions.push({ label: indexContent.liquidity.label, score: indexContent.liquidity.score });
  if (indexContent?.timing) dimensions.push({ label: indexContent.timing.label, score: indexContent.timing.score });
  if (indexContent?.risk) dimensions.push({ label: indexContent.risk.label, score: indexContent.risk.score });
  if (indexContent?.value) dimensions.push({ label: indexContent.value.label, score: indexContent.value.score });

  const compositeScore = dimensions.length > 0
    ? Number((dimensions.reduce((sum, d) => sum + d.score, 0) / dimensions.length).toFixed(1))
    : 0;

  // Segments
  const segments = dashContent?.segments ?? [];
  const showSegments = segments.length >= 2;

  // YoY trends
  const yoyVolumeChange = execContent?.yoyVolumeChange ?? 0;
  const yoyTransactionCountChange = execContent?.yoyTransactionCountChange ?? 0;

  // Highlights from executive briefing
  const highlights = (execContent?.highlights ?? []).slice(0, 3);

  const yoyColor = yoyPriceChange >= 0 ? COLORS.success : COLORS.error;

  return (
    <Page size="LETTER" style={styles.page} wrap={false}>
      <View>
        {/* Title */}
        <Text style={styles.heading}>At a Glance</Text>
        <View style={styles.accentLine} />

        {/* Headline Metric Strip — 4 cards in a row */}
        <View
          style={{
            flexDirection: "row",
            gap: 8,
            marginBottom: 16,
          }}
        >
          <View style={{ flex: 1, backgroundColor: COLORS.surface, borderRadius: 4, padding: 8, borderWidth: 1, borderColor: COLORS.border, alignItems: "center" }}>
            <Text style={{ fontFamily: "Playfair Display", fontSize: 16, color: COLORS.primary }}>{totalTransactions.toLocaleString()}</Text>
            <Text style={{ fontFamily: "Inter", fontSize: 8, color: COLORS.textSecondary, marginTop: 2 }}>Transactions</Text>
          </View>
          <View style={{ flex: 1, backgroundColor: COLORS.surface, borderRadius: 4, padding: 8, borderWidth: 1, borderColor: COLORS.border, alignItems: "center" }}>
            <Text style={{ fontFamily: "Playfair Display", fontSize: 16, color: COLORS.primary }}>{formatVolume(totalVolume)}</Text>
            <Text style={{ fontFamily: "Inter", fontSize: 8, color: COLORS.textSecondary, marginTop: 2 }}>Volume</Text>
          </View>
          <View style={{ flex: 1, backgroundColor: COLORS.surface, borderRadius: 4, padding: 8, borderWidth: 1, borderColor: COLORS.border, alignItems: "center" }}>
            <Text style={{ fontFamily: "Playfair Display", fontSize: 16, color: COLORS.primary }}>{formatPrice(medianPrice)}</Text>
            <Text style={{ fontFamily: "Inter", fontSize: 8, color: COLORS.textSecondary, marginTop: 2 }}>Median Price</Text>
          </View>
          <View style={{ flex: 1, backgroundColor: COLORS.surface, borderRadius: 4, padding: 8, borderWidth: 1, borderColor: COLORS.border, alignItems: "center" }}>
            <Text style={{ fontFamily: "Playfair Display", fontSize: 16, color: yoyColor }}>{formatYoY(yoyPriceChange)}</Text>
            <Text style={{ fontFamily: "Inter", fontSize: 8, color: COLORS.textSecondary, marginTop: 2 }}>YoY Price</Text>
          </View>
        </View>

        {/* Market Posture — Horizontal Bar Chart */}
        {dimensions.length > 0 && (
          <View style={{ ...styles.card, padding: 12, marginBottom: 12 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <Text style={{ fontFamily: "Inter", fontSize: 10, fontWeight: 700, color: COLORS.textSecondary, textTransform: "uppercase" }}>Market Posture</Text>
              <Text style={{ fontFamily: "Playfair Display", fontSize: 24, fontWeight: 300, color: COLORS.accent }}>{compositeScore.toFixed(1)}</Text>
            </View>
            <HorizontalBarChart dimensions={dimensions} maxScore={10} />
          </View>
        )}

        {/* Two-column: Segment Distribution + YoY Trends */}
        <View style={{ flexDirection: "row", gap: 8, marginBottom: 12 }}>
          {/* Segment Distribution */}
          {showSegments && (
            <View style={{ flex: 1, ...styles.card, padding: 10 }}>
              <Text style={{ fontFamily: "Inter", fontSize: 9, fontWeight: 700, color: COLORS.textSecondary, textTransform: "uppercase", marginBottom: 6 }}>Transaction Distribution</Text>
              <SegmentDistributionBar segments={segments.map((s) => ({ name: s.name, count: s.count }))} />
            </View>
          )}

          {/* YoY Trend Indicators */}
          <View style={{ flex: 1, ...styles.card, padding: 10 }}>
            <Text style={{ fontFamily: "Inter", fontSize: 9, fontWeight: 700, color: COLORS.textSecondary, textTransform: "uppercase", marginBottom: 6 }}>Year-over-Year</Text>
            <TrendIndicator label="Median Price" value={yoyPriceChange} />
            <TrendIndicator label="Volume" value={yoyVolumeChange} />
            <TrendIndicator label="Transactions" value={yoyTransactionCountChange} />
          </View>
        </View>

        {/* Key Intelligence — Highlights */}
        {highlights.length > 0 && (
          <View style={{ marginBottom: 12 }}>
            <Text style={{ fontFamily: "Inter", fontSize: 9, fontWeight: 700, color: COLORS.accent, textTransform: "uppercase", marginBottom: 6 }}>Key Intelligence</Text>
            {highlights.map((highlight, i) => (
              <View
                key={i}
                style={{
                  flexDirection: "row",
                  alignItems: "flex-start",
                  marginBottom: 4,
                }}
              >
                <Text
                  style={{
                    fontFamily: "Inter",
                    fontSize: 10,
                    color: COLORS.accent,
                    marginRight: 6,
                  }}
                >
                  {"\u2022"}
                </Text>
                <Text
                  style={{
                    fontFamily: "Inter",
                    fontSize: 10,
                    color: COLORS.textPrimary,
                    lineHeight: 1.5,
                    flex: 1,
                  }}
                >
                  {highlight}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Stale Data Warning */}
        {metadata.confidence.staleDataSources.length > 0 && (
          <View
            style={{
              borderWidth: 1,
              borderColor: COLORS.warning,
              borderRadius: 4,
              padding: 8,
              marginBottom: 8,
            }}
          >
            <Text style={{ fontFamily: "Inter", fontSize: 8, color: COLORS.warning }}>
              Data Freshness Notice: {metadata.confidence.staleDataSources.join(", ")}
            </Text>
          </View>
        )}

        {/* Confidence Footer Strip */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            borderTopWidth: 1,
            borderTopColor: COLORS.border,
            paddingTop: 6,
          }}
        >
          <Text
            style={{
              fontFamily: "Inter",
              fontSize: 8,
              fontWeight: 600,
              color: getConfidenceColor(metadata.confidence.level),
            }}
          >
            {metadata.confidence.level.charAt(0).toUpperCase() +
              metadata.confidence.level.slice(1)}
          </Text>
          <Text style={{ fontFamily: "Inter", fontSize: 8, color: COLORS.textTertiary, marginHorizontal: 6 }}>|</Text>
          <Text style={{ fontFamily: "Inter", fontSize: 8, color: COLORS.textTertiary }}>
            {metadata.confidence.sampleSize.toLocaleString()} transactions
          </Text>
          <Text style={{ fontFamily: "Inter", fontSize: 8, color: COLORS.textTertiary, marginHorizontal: 6 }}>|</Text>
          <Text style={{ fontFamily: "Inter", fontSize: 8, color: COLORS.textTertiary }}>
            {generatedDate}
          </Text>
        </View>
      </View>

      <View style={styles.pageFooter} fixed>
        <Text style={styles.pageNumber}>Market Intelligence Summary</Text>
        <Text
          style={styles.pageNumber}
          render={({ pageNumber, totalPages }) =>
            `${pageNumber} / ${totalPages}`
          }
        />
      </View>
    </Page>
  );
}
