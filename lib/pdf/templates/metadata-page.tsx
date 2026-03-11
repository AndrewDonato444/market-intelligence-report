/**
 * PDF metadata page — confidence level, generation info, pull quotes.
 * Rendered as the last page of the report.
 */

import React from "react";
import { Page, View, Text } from "@react-pdf/renderer";
import { styles, COLORS } from "../styles";
import type { ReportMetadata } from "@/lib/agents/schema";

interface MetadataPageProps {
  metadata: ReportMetadata;
  pullQuotes: Array<{ text: string; source: string }>;
  reportTitle: string;
  disclaimer?: string;
}

export function MetadataPage({
  metadata,
  pullQuotes,
  reportTitle,
  disclaimer,
}: MetadataPageProps) {
  const generatedDate = new Date(metadata.generatedAt).toLocaleDateString(
    "en-US",
    { month: "long", day: "numeric", year: "numeric" }
  );
  const durationSeconds = Math.round(metadata.totalDurationMs / 1000);

  return (
    <Page size="LETTER" style={styles.page} wrap>
      <View>
        <Text style={styles.heading}>Report Information</Text>
        <View style={styles.accentLine} />

        {/* Pull Quotes */}
        {pullQuotes.length > 0 && (
          <View style={{ marginBottom: 24 }}>
            <Text style={styles.subheading}>Key Insights</Text>
            {pullQuotes.map((quote, i) => (
              <View key={i} style={styles.pullQuote} wrap={false}>
                <Text style={styles.pullQuoteText}>
                  &ldquo;{quote.text}&rdquo;
                </Text>
                <Text style={styles.pullQuoteSource}>— {quote.source}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Metadata */}
        <View style={styles.card} wrap={false}>
          <Text style={styles.metadataLabel}>Confidence Level</Text>
          <Text style={styles.metadataValue}>
            {metadata.confidence.level.charAt(0).toUpperCase() +
              metadata.confidence.level.slice(1)}
          </Text>

          <Text style={styles.metadataLabel}>Sample Size</Text>
          <Text style={styles.metadataValue}>
            {metadata.confidence.sampleSize} data points
          </Text>

          <Text style={styles.metadataLabel}>Generated</Text>
          <Text style={styles.metadataValue}>{generatedDate}</Text>

          {metadata.confidence.staleDataSources.length > 0 && (
            <>
              <Text style={styles.metadataLabel}>Data Sources (Stale)</Text>
              <Text style={styles.metadataValue}>
                {metadata.confidence.staleDataSources.join(", ")}
              </Text>
            </>
          )}
        </View>

        {/* Disclaimer */}
        {disclaimer && (
          <View style={{ marginTop: 24, paddingTop: 16, borderTopWidth: 1, borderTopColor: COLORS.border }}>
            <Text style={styles.bodySmall}>{disclaimer}</Text>
          </View>
        )}
      </View>

      <View style={styles.pageFooter} fixed>
        <Text style={styles.pageNumber}>{reportTitle}</Text>
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
