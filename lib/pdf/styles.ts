/**
 * PDF styles — maps design tokens to React-PDF StyleSheet objects.
 *
 * US Letter: 8.5" x 11" = 612 x 792 points at 72 DPI
 */

import { StyleSheet } from "@react-pdf/renderer";

// Design token color constants
export const COLORS = {
  primary: "#0F172A", // deep navy
  accent: "#CA8A04", // gold
  background: "#FAFAF9", // warm white
  surface: "#FFFFFF",
  textPrimary: "#0F172A",
  textSecondary: "#64748B",
  border: "#E2E8F0",
  success: "#15803D",
  warning: "#B45309",
  error: "#B91C1C",
  textTertiary: "#94A3B8",
  primaryLight: "#F0F4FF",
  accentLight: "#FFFBEB",
  reportAccentLine: "#CA8A04",
  reportPullquoteBg: "#0F172A",
  ratingA: "#15803D",
  ratingB: "#B45309",
  ratingC: "#B91C1C",
};

/**
 * Create a color palette that respects agent brand colors, falling back to defaults.
 */
export function createBrandedColors(brandColors?: {
  primary?: string;
  secondary?: string;
  accent?: string;
}): typeof COLORS {
  if (!brandColors) return { ...COLORS };
  return {
    ...COLORS,
    primary: brandColors.primary ?? COLORS.primary,
    accent: brandColors.accent ?? COLORS.accent,
    textPrimary: brandColors.primary ?? COLORS.textPrimary,
    reportAccentLine: brandColors.accent ?? COLORS.reportAccentLine,
    reportPullquoteBg: brandColors.primary ?? COLORS.reportPullquoteBg,
  };
}

export const styles = StyleSheet.create({
  page: {
    width: 612,
    height: 792,
    paddingTop: 64,
    paddingBottom: 72,
    paddingLeft: 64,
    paddingRight: 64,
    backgroundColor: COLORS.background,
    fontFamily: "Inter",
    fontSize: 10,
    color: COLORS.textPrimary,
  },
  // Cover page
  coverPage: {
    width: 612,
    height: 792,
    backgroundColor: COLORS.primary,
    padding: 64,
    justifyContent: "center",
  },
  coverTitle: {
    fontFamily: "Playfair Display",
    fontSize: 36,
    color: COLORS.surface,
    marginBottom: 16,
  },
  coverSubtitle: {
    fontFamily: "Inter",
    fontSize: 14,
    color: COLORS.accent,
    marginBottom: 48,
  },
  coverBranding: {
    fontFamily: "Inter",
    fontSize: 12,
    color: "#94A3B8",
    marginTop: 24,
  },
  coverDate: {
    fontFamily: "Inter",
    fontSize: 11,
    color: "#94A3B8",
    marginTop: 8,
  },
  // Section headings
  heading: {
    fontFamily: "Playfair Display",
    fontSize: 24,
    color: COLORS.primary,
    marginBottom: 16,
  },
  subheading: {
    fontFamily: "Playfair Display",
    fontSize: 16,
    color: COLORS.primary,
    marginBottom: 8,
  },
  // Body text
  body: {
    fontFamily: "Inter",
    fontSize: 10,
    color: COLORS.textPrimary,
    lineHeight: 1.6,
    marginBottom: 8,
  },
  bodySmall: {
    fontFamily: "Inter",
    fontSize: 9,
    color: COLORS.textSecondary,
    lineHeight: 1.5,
  },
  // Lists
  bulletItem: {
    fontFamily: "Inter",
    fontSize: 10,
    color: COLORS.textPrimary,
    marginBottom: 4,
    paddingLeft: 12,
  },
  // Accent elements
  accentLine: {
    width: 48,
    height: 2,
    backgroundColor: COLORS.accent,
    marginBottom: 16,
  },
  // Cards/boxes
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 4,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  // Tables
  tableRow: {
    flexDirection: "row" as const,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingVertical: 6,
  },
  tableHeader: {
    fontFamily: "Inter",
    fontSize: 9,
    fontWeight: 700,
    color: COLORS.textSecondary,
    textTransform: "uppercase" as const,
  },
  tableCell: {
    fontFamily: "Inter",
    fontSize: 10,
    color: COLORS.textPrimary,
    flex: 1,
  },
  // Pull quotes
  pullQuote: {
    backgroundColor: COLORS.reportPullquoteBg,
    padding: 20,
    borderRadius: 4,
    marginVertical: 16,
  },
  pullQuoteText: {
    fontFamily: "Playfair Display",
    fontSize: 14,
    color: COLORS.surface,
    fontStyle: "italic" as const,
  },
  pullQuoteSource: {
    fontFamily: "Inter",
    fontSize: 9,
    color: COLORS.accent,
    marginTop: 8,
  },
  // Page footer
  pageFooter: {
    position: "absolute" as const,
    bottom: 32,
    left: 64,
    right: 64,
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 8,
  },
  pageNumber: {
    fontFamily: "Inter",
    fontSize: 8,
    color: COLORS.textSecondary,
  },
  // Impact/trend badges
  badge: {
    fontFamily: "Inter",
    fontSize: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    color: COLORS.surface,
  },
  // Metadata section
  metadataLabel: {
    fontFamily: "Inter",
    fontSize: 9,
    fontWeight: 700,
    color: COLORS.textSecondary,
    textTransform: "uppercase" as const,
    marginBottom: 4,
  },
  metadataValue: {
    fontFamily: "Inter",
    fontSize: 10,
    color: COLORS.textPrimary,
    marginBottom: 12,
  },
  // Persona Intelligence styles
  personaCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 4,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  personaCardPrimary: {
    backgroundColor: COLORS.surface,
    borderRadius: 4,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.accent,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    borderRightWidth: 1,
    borderRightColor: COLORS.border,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  personaName: {
    fontFamily: "Playfair Display",
    fontSize: 16,
    color: COLORS.primary,
    marginBottom: 4,
  },
  primaryPersonaLabel: {
    fontFamily: "Inter",
    fontSize: 8,
    fontWeight: 700,
    color: COLORS.accent,
    textTransform: "uppercase" as const,
    marginBottom: 12,
  },
  sectionLabel: {
    fontFamily: "Inter",
    fontSize: 9,
    fontWeight: 700,
    color: COLORS.textSecondary,
    textTransform: "uppercase" as const,
    letterSpacing: 0.5,
    marginBottom: 8,
    marginTop: 12,
  },
  talkingPointHeadline: {
    fontFamily: "Inter",
    fontSize: 10,
    fontWeight: 600,
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  talkingPointDetail: {
    fontFamily: "Inter",
    fontSize: 10,
    color: COLORS.textPrimary,
    lineHeight: 1.6,
    marginBottom: 2,
  },
  talkingPointSource: {
    fontFamily: "Inter",
    fontSize: 8,
    color: COLORS.textTertiary,
    marginBottom: 12,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    marginVertical: 12,
  },
  vocabTagPreferred: {
    fontFamily: "Inter",
    fontSize: 8,
    backgroundColor: COLORS.primaryLight,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginRight: 4,
    marginBottom: 4,
  },
  vocabTagAvoid: {
    fontFamily: "Inter",
    fontSize: 8,
    backgroundColor: COLORS.surface,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.error,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginRight: 4,
    marginBottom: 4,
    textDecorationLine: "line-through" as const,
  },
  blendedSection: {
    backgroundColor: COLORS.accentLight,
    borderRadius: 4,
    padding: 16,
    marginTop: 16,
  },
  conflictBox: {
    borderLeftWidth: 2,
    borderLeftColor: COLORS.warning,
    backgroundColor: COLORS.accentLight,
    padding: 8,
    marginBottom: 8,
    borderRadius: 2,
  },
  personaCallout: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: 4,
    padding: 12,
    marginTop: 16,
  },
  personaCalloutLabel: {
    fontFamily: "Inter",
    fontSize: 8,
    fontWeight: 600,
    color: COLORS.accent,
    marginBottom: 4,
  },
  personaCalloutBody: {
    fontFamily: "Inter",
    fontSize: 9,
    color: COLORS.textSecondary,
    lineHeight: 1.5,
    marginBottom: 4,
  },
  personaCalloutFocus: {
    fontFamily: "Inter",
    fontSize: 8,
    color: COLORS.textSecondary,
  },
  // Executive Brief Improvements
  metricExplainer: {
    fontFamily: "Inter",
    fontSize: 10,
    color: COLORS.textTertiary,
    marginTop: 4,
    textAlign: "center" as const,
    lineHeight: 1.4,
  },
  subsectionHeader: {
    fontFamily: "Inter",
    fontSize: 12,
    fontWeight: 600,
    color: COLORS.textSecondary,
    textTransform: "uppercase" as const,
    letterSpacing: 0.5,
    marginBottom: 8,
    marginTop: 16,
  },
  dataFreshness: {
    fontFamily: "Inter",
    fontSize: 10,
    color: COLORS.textTertiary,
    marginBottom: 16,
  },
});
