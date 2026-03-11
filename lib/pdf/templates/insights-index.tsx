/**
 * PDF insights index — headline metrics, confidence ratings, and key highlights.
 */

import React from "react";
import { Page, View, Text } from "@react-pdf/renderer";
import { styles, COLORS } from "../styles";
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

export function InsightsIndex({ metadata, sections }: InsightsIndexProps) {
  const generatedDate = new Date(metadata.generatedAt).toLocaleDateString(
    "en-US",
    { month: "long", day: "numeric", year: "numeric" }
  );

  // Extract highlights from market overview if available
  const marketOverview = sections.find(
    (s) => s.sectionType === "market_overview"
  );
  const overviewContent = marketOverview?.content as {
    narrative?: string;
    highlights?: string[];
  } | undefined;

  return (
    <Page size="LETTER" style={styles.page} wrap>
      <View>
        <Text style={styles.heading}>Market Intelligence Summary</Text>
        <View style={styles.accentLine} />

        {/* Confidence & Data Overview */}
        <View
          style={{
            flexDirection: "row",
            gap: 16,
            marginBottom: 24,
          }}
        >
          {/* Confidence Badge */}
          <View style={{ ...styles.card, flex: 1, alignItems: "center" }} wrap={false}>
            <Text style={styles.metadataLabel}>Confidence Level</Text>
            <Text
              style={{
                fontFamily: "Playfair Display",
                fontSize: 20,
                color: getConfidenceColor(metadata.confidence.level),
                marginTop: 4,
              }}
            >
              {metadata.confidence.level.charAt(0).toUpperCase() +
                metadata.confidence.level.slice(1)}
            </Text>
          </View>

          {/* Sample Size */}
          <View style={{ ...styles.card, flex: 1, alignItems: "center" }} wrap={false}>
            <Text style={styles.metadataLabel}>Sample Size</Text>
            <Text
              style={{
                fontFamily: "Playfair Display",
                fontSize: 20,
                color: COLORS.primary,
                marginTop: 4,
              }}
            >
              {metadata.confidence.sampleSize.toLocaleString()}
            </Text>
          </View>

          {/* Generation Date */}
          <View style={{ ...styles.card, flex: 1, alignItems: "center" }} wrap={false}>
            <Text style={styles.metadataLabel}>Report Date</Text>
            <Text
              style={{
                fontFamily: "Inter",
                fontSize: 11,
                color: COLORS.primary,
                marginTop: 4,
              }}
            >
              {generatedDate}
            </Text>
          </View>
        </View>

        {/* Sections Included */}
        <View style={{ marginBottom: 24 }}>
          <Text style={styles.subheading}>Sections Included</Text>
          <Text style={styles.bodySmall}>
            This report contains {sections.length} section
            {sections.length !== 1 ? "s" : ""} of market intelligence analysis.
          </Text>
        </View>

        {/* Key Highlights */}
        {overviewContent?.highlights && overviewContent.highlights.length > 0 && (
          <View style={{ marginBottom: 24 }}>
            <Text style={styles.subheading}>Key Highlights</Text>
            {overviewContent.highlights.map((highlight, i) => (
              <View
                key={i}
                style={{
                  flexDirection: "row",
                  alignItems: "flex-start",
                  marginBottom: 6,
                }}
              >
                <Text
                  style={{
                    fontFamily: "Inter",
                    fontSize: 10,
                    color: COLORS.accent,
                    marginRight: 8,
                  }}
                >
                  {"\u2022"}
                </Text>
                <Text style={styles.body}>{highlight}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Stale Data Warning */}
        {metadata.confidence.staleDataSources.length > 0 && (
          <View
            style={{
              ...styles.card,
              borderColor: COLORS.warning,
              borderWidth: 1,
            }}
            wrap={false}
          >
            <Text style={{ ...styles.metadataLabel, color: COLORS.warning }}>
              Data Freshness Notice
            </Text>
            <Text style={styles.bodySmall}>
              Some data sources may be stale:{" "}
              {metadata.confidence.staleDataSources.join(", ")}
            </Text>
          </View>
        )}
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
