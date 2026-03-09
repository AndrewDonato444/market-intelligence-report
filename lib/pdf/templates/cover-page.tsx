/**
 * PDF cover page — title, market, agent branding, generation date.
 */

import React from "react";
import { Page, View, Text, Image } from "@react-pdf/renderer";
import { styles } from "../styles";

interface CoverPageProps {
  title: string;
  marketName: string;
  agentName: string;
  company?: string;
  generatedAt: string;
  logoUrl?: string;
}

export function CoverPage({
  title,
  marketName,
  agentName,
  company,
  generatedAt,
  logoUrl,
}: CoverPageProps) {
  const date = new Date(generatedAt);
  const formattedDate = date.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  return (
    <Page size="LETTER" style={styles.coverPage}>
      <View>
        <Text style={styles.coverSubtitle}>Market Intelligence Report</Text>
        <Text style={styles.coverTitle}>{title}</Text>
        <View style={{ ...styles.accentLine, backgroundColor: "#CA8A04" }} />
        <Text style={{ ...styles.coverSubtitle, marginBottom: 0 }}>
          {marketName}
        </Text>
      </View>
      <View style={{ marginTop: "auto" }}>
        {logoUrl && (
          <Image
            src={logoUrl}
            style={{ width: 120, height: 40, marginBottom: 16, objectFit: "contain" as const }}
          />
        )}
        <Text style={styles.coverBranding}>
          Prepared by {agentName}
          {company ? ` — ${company}` : ""}
        </Text>
        <Text style={styles.coverDate}>{formattedDate}</Text>
      </View>
    </Page>
  );
}
