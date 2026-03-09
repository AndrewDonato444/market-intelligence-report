/**
 * PDF data visualization components — confidence dots, rating badges,
 * segment matrices, and metric cards.
 *
 * These are React-PDF native components using View/Text primitives.
 */

import React from "react";
import { View, Text } from "@react-pdf/renderer";
import { COLORS } from "../styles";

// --- Confidence Dots ---

interface ConfidenceDotsProps {
  level: "high" | "medium" | "low" | string;
}

function getFilledCount(level: string): number {
  switch (level.toLowerCase()) {
    case "high":
      return 3;
    case "medium":
      return 2;
    case "low":
      return 1;
    default:
      return 0;
  }
}

export function ConfidenceDots({ level }: ConfidenceDotsProps) {
  const filled = getFilledCount(level);
  const total = 3;

  return (
    <View style={{ flexDirection: "row", gap: 4 }}>
      {Array.from({ length: total }, (_, i) => (
        <View
          key={i}
          data-testid={`confidence-dot-${i}`}
          style={{
            width: 10,
            height: 10,
            borderRadius: 5,
            backgroundColor:
              i < filled ? COLORS.primary : COLORS.border,
          }}
        />
      ))}
    </View>
  );
}

// --- Rating Badge ---

interface RatingBadgeProps {
  rating: string;
}

function getRatingBgColor(rating: string): string {
  if (rating.startsWith("A")) return COLORS.success;
  if (rating.startsWith("B")) return COLORS.warning;
  return COLORS.error;
}

export function RatingBadge({ rating }: RatingBadgeProps) {
  return (
    <View
      style={{
        backgroundColor: getRatingBgColor(rating),
        borderRadius: 4,
        paddingHorizontal: 8,
        paddingVertical: 2,
        alignSelf: "flex-start",
      }}
    >
      <Text
        style={{
          fontFamily: "Inter",
          fontSize: 10,
          fontWeight: 700,
          color: "#FFFFFF",
        }}
      >
        {rating}
      </Text>
    </View>
  );
}

// --- Segment Matrix ---

interface SegmentRow {
  name: string;
  count: number;
  medianPrice: number;
  rating: string;
}

interface SegmentMatrixProps {
  segments: SegmentRow[];
}

export function SegmentMatrix({ segments }: SegmentMatrixProps) {
  if (segments.length === 0) return <View />;

  return (
    <View>
      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          borderBottomWidth: 2,
          borderBottomColor: COLORS.border,
          paddingBottom: 6,
          marginBottom: 4,
        }}
      >
        <Text
          style={{
            flex: 2,
            fontFamily: "Inter",
            fontSize: 9,
            fontWeight: 700,
            color: COLORS.textSecondary,
            textTransform: "uppercase",
          }}
        >
          Segment
        </Text>
        <Text
          style={{
            flex: 1,
            fontFamily: "Inter",
            fontSize: 9,
            fontWeight: 700,
            color: COLORS.textSecondary,
            textTransform: "uppercase",
          }}
        >
          Count
        </Text>
        <Text
          style={{
            flex: 1,
            fontFamily: "Inter",
            fontSize: 9,
            fontWeight: 700,
            color: COLORS.textSecondary,
            textTransform: "uppercase",
          }}
        >
          Median Price
        </Text>
        <Text
          style={{
            flex: 1,
            fontFamily: "Inter",
            fontSize: 9,
            fontWeight: 700,
            color: COLORS.textSecondary,
            textTransform: "uppercase",
          }}
        >
          Rating
        </Text>
      </View>
      {/* Rows */}
      {segments.map((seg, i) => (
        <View
          key={i}
          style={{
            flexDirection: "row",
            paddingVertical: 6,
            borderBottomWidth: 1,
            borderBottomColor: COLORS.border,
            backgroundColor: i % 2 === 0 ? "transparent" : "#F8FAFC",
          }}
        >
          <Text
            style={{
              flex: 2,
              fontFamily: "Inter",
              fontSize: 10,
              color: COLORS.textPrimary,
            }}
          >
            {seg.name.replace(/_/g, " ")}
          </Text>
          <Text
            style={{
              flex: 1,
              fontFamily: "Inter",
              fontSize: 10,
              color: COLORS.textPrimary,
            }}
          >
            {seg.count.toLocaleString()}
          </Text>
          <Text
            style={{
              flex: 1,
              fontFamily: "Inter",
              fontSize: 10,
              color: COLORS.textPrimary,
            }}
          >
            ${(seg.medianPrice / 1000000).toFixed(1)}M
          </Text>
          <Text
            style={{
              flex: 1,
              fontFamily: "Inter",
              fontSize: 10,
              fontWeight: 700,
              color: getRatingBgColor(seg.rating),
            }}
          >
            {seg.rating}
          </Text>
        </View>
      ))}
    </View>
  );
}

// --- Metric Card ---

interface MetricCardProps {
  label: string;
  value: string;
  accent?: boolean;
}

export function MetricCard({ label, value, accent }: MetricCardProps) {
  return (
    <View
      style={{
        backgroundColor: "#FFFFFF",
        borderRadius: 4,
        padding: 16,
        borderWidth: 1,
        borderColor: COLORS.border,
        alignItems: "center",
      }}
    >
      <Text
        style={{
          fontFamily: "Inter",
          fontSize: 9,
          fontWeight: 700,
          color: COLORS.textSecondary,
          textTransform: "uppercase",
          marginBottom: 4,
        }}
      >
        {label}
      </Text>
      <Text
        style={{
          fontFamily: "Playfair Display",
          fontSize: 20,
          color: accent ? COLORS.accent : COLORS.primary,
        }}
      >
        {value}
      </Text>
    </View>
  );
}
