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
  const pct = (value * 100).toFixed(1);
  return `${value > 0 ? "+" : ""}${pct}%`;
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
    headline?: {
      medianPrice?: number;
      totalProperties?: number;
      totalVolume?: number;
      rating?: string;
      yoyPriceChange?: number | null;
      yoyVolumeChange?: number | null;
      yoyTransactionCountChange?: number | null;
    };
    highlights?: string[];
    narrative?: string;
    analysisPeriod?: {
      current: { min: string; max: string; count: number };
      prior: { min: string; max: string; count: number };
    };
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

  // Headline metrics — read from nested headline object
  const headline = execContent?.headline;
  const totalTransactions = headline?.totalProperties ?? 0;
  const totalVolume = headline?.totalVolume ?? 0;
  const medianPrice = headline?.medianPrice ?? 0;
  const yoyPriceChange = headline?.yoyPriceChange ?? 0;
  const hasTransactionData = totalTransactions > 0;

  // Analysis period labels
  const analysisPeriod = execContent?.analysisPeriod;
  const formatPeriodDate = (dateStr: string) => {
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
  };
  const periodLabel = analysisPeriod
    ? `${formatPeriodDate(analysisPeriod.current.min)} \u2013 ${formatPeriodDate(analysisPeriod.current.max)}`
    : null;
  const comparisonLabel = analysisPeriod
    ? `${formatPeriodDate(analysisPeriod.current.min)} \u2013 ${formatPeriodDate(analysisPeriod.current.max)} vs. ${formatPeriodDate(analysisPeriod.prior.min)} \u2013 ${formatPeriodDate(analysisPeriod.prior.max)}`
    : null;
  const priorCount = analysisPeriod?.prior.count ?? 0;

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

  // YoY trends — read from nested headline object
  const yoyVolumeChange = headline?.yoyVolumeChange ?? 0;
  const yoyTransactionCountChange = headline?.yoyTransactionCountChange ?? 0;

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
            <Text style={{ fontFamily: "Playfair Display", fontSize: 16, color: COLORS.primary }}>{hasTransactionData ? totalTransactions.toLocaleString() : "\u2014"}</Text>
            <Text style={{ fontFamily: "Inter", fontSize: 8, color: COLORS.textSecondary, marginTop: 2 }}>Transactions (12 mo)</Text>
          </View>
          <View style={{ flex: 1, backgroundColor: COLORS.surface, borderRadius: 4, padding: 8, borderWidth: 1, borderColor: COLORS.border, alignItems: "center" }}>
            <Text style={{ fontFamily: "Playfair Display", fontSize: 16, color: COLORS.primary }}>{hasTransactionData ? formatVolume(totalVolume) : "\u2014"}</Text>
            <Text style={{ fontFamily: "Inter", fontSize: 8, color: COLORS.textSecondary, marginTop: 2 }}>Volume (12 mo)</Text>
          </View>
          <View style={{ flex: 1, backgroundColor: COLORS.surface, borderRadius: 4, padding: 8, borderWidth: 1, borderColor: COLORS.border, alignItems: "center" }}>
            <Text style={{ fontFamily: "Playfair Display", fontSize: 16, color: COLORS.primary }}>{hasTransactionData ? formatPrice(medianPrice) : "\u2014"}</Text>
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
            <Text style={{ fontFamily: "Inter", fontSize: 9, fontWeight: 700, color: COLORS.textSecondary, textTransform: "uppercase", marginBottom: 2 }}>Year-over-Year</Text>
            {comparisonLabel && (
              <Text style={{ fontFamily: "Inter", fontSize: 7, color: COLORS.textTertiary, marginBottom: 6 }}>{comparisonLabel}</Text>
            )}
            <TrendIndicator label="Median Price" value={yoyPriceChange} />
            <TrendIndicator label="Volume" value={yoyVolumeChange} />
            <TrendIndicator label={`Transactions${priorCount > 0 ? ` (${totalTransactions} vs. ${priorCount})` : ""}`} value={yoyTransactionCountChange} />
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

        {/* Generated date + analysis window footer */}
        <View
          style={{
            borderTopWidth: 1,
            borderTopColor: COLORS.border,
            paddingTop: 6,
          }}
        >
          <Text style={{ fontFamily: "Inter", fontSize: 8, color: COLORS.textTertiary }}>
            {periodLabel
              ? `${periodLabel}  \u00B7  ${totalTransactions} transactions analyzed  \u00B7  ${generatedDate}`
              : generatedDate}
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
