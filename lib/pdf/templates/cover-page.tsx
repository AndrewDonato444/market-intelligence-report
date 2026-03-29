/**
 * PDF cover page — title, market, agent branding, key themes summary,
 * "How to Read This Report" legend, and generation date.
 */

import React from "react";
import { Page, View, Text, Image, Link } from "@react-pdf/renderer";
import { styles, COLORS } from "../styles";
import { getCopyrightLine, CONFIDENTIALITY_NOTICE } from "../copyright";

export interface CoverKeyTheme {
  name: string;
  impact: "high" | "medium" | "low";
  trend: "up" | "down" | "neutral";
}

interface CoverPageProps {
  title: string;
  marketName: string;
  agentName: string;
  company?: string;
  generatedAt: string;
  logoUrl?: string;
  phone?: string;
  email?: string;
  agentTitle?: string;
  brandColors?: { primary?: string; secondary?: string; accent?: string };
  keyThemes?: CoverKeyTheme[];
}

const IMPACT_COLORS: Record<string, string> = {
  high: COLORS.success,
  medium: COLORS.warning,
  low: COLORS.textSecondary,
};

const TREND_LABELS: Record<string, string> = {
  up: "\u2191",
  down: "\u2193",
  neutral: "\u2192",
};

export function CoverPage({
  title,
  marketName,
  agentName,
  company,
  generatedAt,
  logoUrl,
  phone,
  email,
  agentTitle,
  brandColors,
  keyThemes,
}: CoverPageProps) {
  const date = new Date(generatedAt);
  const formattedDate = date.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const accentColor = brandColors?.accent ?? "#CA8A04";
  const bgColor = brandColors?.primary ?? undefined;

  // Show at most 3 themes
  const displayThemes = (keyThemes ?? []).slice(0, 3);
  const hasThemes = displayThemes.length > 0;

  return (
    <Page
      size="LETTER"
      style={bgColor ? { ...styles.coverPage, backgroundColor: bgColor } : styles.coverPage}
    >
      <View>
        <Text style={styles.coverSubtitle}>Market Intelligence Report</Text>
        <Text style={styles.coverTitle}>{title}</Text>
        <View style={{ ...styles.accentLine, backgroundColor: accentColor }} />
        <Text style={{ ...styles.coverSubtitle, marginBottom: 0 }}>
          {marketName}
        </Text>

        {/* Key Themes summary */}
        {hasThemes && (
          <View style={{ marginTop: 24 }}>
            <Text style={{ fontFamily: "Inter", fontSize: 9, fontWeight: 700, color: accentColor, textTransform: "uppercase" as const, letterSpacing: 0.5, marginBottom: 8 }}>
              Key Themes
            </Text>
            {displayThemes.map((theme, i) => (
              <View key={i} style={{ flexDirection: "row" as const, alignItems: "center" as const, marginBottom: 4 }}>
                <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: IMPACT_COLORS[theme.impact] ?? COLORS.textSecondary, marginRight: 8 }} />
                <Text style={{ fontFamily: "Inter", fontSize: 10, color: COLORS.surface, flex: 1 }}>
                  {theme.name}
                </Text>
                <Text style={{ fontFamily: "Inter", fontSize: 9, color: "#94A3B8", marginLeft: 8 }}>
                  {theme.impact.toUpperCase()} {TREND_LABELS[theme.trend] ?? "\u2192"}
                </Text>
              </View>
            ))}
          </View>
        )}
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
          {agentTitle ? `, ${agentTitle}` : ""}
        </Text>
        {company && (
          <Text style={styles.coverBranding}>{company}</Text>
        )}
        {(phone || email) && (
          <View style={{ flexDirection: "row", marginTop: 4 }}>
            {phone && (
              <Link src={`tel:${phone}`} style={{ textDecoration: "none" }}>
                <Text style={{ ...styles.coverBranding, marginTop: 0 }}>{phone}</Text>
              </Link>
            )}
            {phone && email && (
              <Text style={{ ...styles.coverBranding, marginTop: 0 }}> | </Text>
            )}
            {email && (
              <Link src={`mailto:${email}`} style={{ textDecoration: "none" }}>
                <Text style={{ ...styles.coverBranding, marginTop: 0 }}>{email}</Text>
              </Link>
            )}
          </View>
        )}
        <Text style={styles.coverDate}>{formattedDate}</Text>

        {/* How to Read This Report legend */}
        <View style={{ marginTop: 16, borderTopWidth: 1, borderTopColor: "#334155", paddingTop: 12 }}>
          <Text style={{ fontFamily: "Inter", fontSize: 8, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase" as const, letterSpacing: 0.5, marginBottom: 6 }}>
            How to Read This Report
          </Text>
          <Text style={{ fontFamily: "Inter", fontSize: 8, color: "#94A3B8", lineHeight: 1.6 }}>
            Ratings: A = Strong  B = Stable  C = Watch
          </Text>
          <Text style={{ fontFamily: "Inter", fontSize: 8, color: "#94A3B8", lineHeight: 1.6 }}>
            Impact: High  Medium  Low
          </Text>
          <Text style={{ fontFamily: "Inter", fontSize: 8, color: "#94A3B8", lineHeight: 1.6 }}>
            Trends: {"\u2191"} Improving  {"\u2193"} Declining  {"\u2192"} Stable
          </Text>
        </View>

        {/* Confidentiality notice */}
        <Text style={{ ...styles.coverConfidentiality, marginTop: 12 }}>
          {CONFIDENTIALITY_NOTICE}
        </Text>

        {/* Copyright line */}
        <Text style={{ ...styles.copyrightText, color: COLORS.surface, opacity: 0.6, marginTop: 8 }}>
          {getCopyrightLine()}
        </Text>
      </View>
    </Page>
  );
}
