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
}

export function MetadataPage({
  metadata,
  pullQuotes,
  reportTitle,
}: MetadataPageProps) {
  const generatedDate = new Date(metadata.generatedAt).toLocaleDateString(
    "en-US",
    { month: "long", day: "numeric", year: "numeric" }
  );
  const durationSeconds = Math.round(metadata.totalDurationMs / 1000);

  return (
    <Page size="LETTER" style={styles.page}>
      <View>
        <Text style={styles.heading}>Report Information</Text>
        <View style={styles.accentLine} />

        {/* Pull Quotes */}
        {pullQuotes.length > 0 && (
          <View style={{ marginBottom: 24 }}>
            <Text style={styles.subheading}>Key Insights</Text>
            {pullQuotes.map((quote, i) => (
              <View key={i} style={styles.pullQuote}>
                <Text style={styles.pullQuoteText}>
                  &ldquo;{quote.text}&rdquo;
                </Text>
                <Text style={styles.pullQuoteSource}>— {quote.source}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Metadata */}
        <View style={styles.card}>
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

          <Text style={styles.metadataLabel}>Generation Duration</Text>
          <Text style={styles.metadataValue}>{durationSeconds}s</Text>

          {metadata.confidence.staleDataSources.length > 0 && (
            <>
              <Text style={styles.metadataLabel}>Data Sources (Stale)</Text>
              <Text style={styles.metadataValue}>
                {metadata.confidence.staleDataSources.join(", ")}
              </Text>
            </>
          )}
        </View>
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
