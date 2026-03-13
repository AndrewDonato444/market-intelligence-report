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

// --- Horizontal Bar Chart ---

interface BarDimension {
  label: string;
  score: number;
}

interface HorizontalBarChartProps {
  dimensions: BarDimension[];
  maxScore: number;
}

const CHART_COLORS = {
  barFill: COLORS.primary,
  barTrack: "#F1F5F9",
  gridLine: COLORS.border,
  label: COLORS.textSecondary,
};

export function HorizontalBarChart({ dimensions, maxScore }: HorizontalBarChartProps) {
  const scaleMarkers = [0, 2, 4, 6, 8, 10];

  return (
    <View>
      {dimensions.map((dim, i) => (
        <View
          key={i}
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginBottom: 6,
          }}
        >
          <Text
            style={{
              width: 100,
              fontFamily: "Inter",
              fontSize: 9,
              color: COLORS.textPrimary,
            }}
          >
            {dim.label}
          </Text>
          <View
            style={{
              flex: 1,
              height: 12,
              backgroundColor: CHART_COLORS.barTrack,
              borderRadius: 2,
              position: "relative",
            }}
          >
            <View
              style={{
                width: `${(dim.score / maxScore) * 100}%`,
                height: 12,
                backgroundColor: CHART_COLORS.barFill,
                borderRadius: 2,
              }}
            />
          </View>
          <Text
            style={{
              width: 30,
              textAlign: "right",
              fontFamily: "Inter",
              fontSize: 9,
              fontWeight: 600,
              color: COLORS.textPrimary,
            }}
          >
            {dim.score.toFixed(1)}
          </Text>
        </View>
      ))}
      {/* Scale axis */}
      <View
        style={{
          flexDirection: "row",
          marginLeft: 100,
          marginTop: 2,
        }}
      >
        {scaleMarkers.map((mark) => (
          <Text
            key={mark}
            style={{
              flex: mark === 0 ? 0 : 1,
              fontFamily: "Inter",
              fontSize: 7,
              color: CHART_COLORS.label,
              textAlign: mark === 0 ? "left" : "right",
              ...(mark === 0 ? { width: 10 } : {}),
            }}
          >
            {String(mark)}
          </Text>
        ))}
      </View>
    </View>
  );
}

// --- Segment Distribution Bar ---

interface SegmentItem {
  name: string;
  count: number;
}

interface SegmentDistributionBarProps {
  segments: SegmentItem[];
}

const SEGMENT_COLORS = ["#0F172A", "#334155", "#64748B", "#CA8A04"];

export function SegmentDistributionBar({ segments }: SegmentDistributionBarProps) {
  const total = segments.reduce((sum, s) => sum + s.count, 0);
  if (total === 0) return <View />;

  // Group segments < 3% into "Other"
  const threshold = total * 0.03;
  const visible: SegmentItem[] = [];
  let otherCount = 0;

  for (const seg of segments) {
    if (seg.count < threshold) {
      otherCount += seg.count;
    } else {
      visible.push(seg);
    }
  }
  if (otherCount > 0) {
    visible.push({ name: "Other", count: otherCount });
  }

  return (
    <View>
      {visible.map((seg, i) => {
        const pct = Math.round((seg.count / total) * 100);
        return (
          <View
            key={i}
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginBottom: 4,
            }}
          >
            <View
              style={{
                flex: 1,
                height: 10,
                backgroundColor: "#F1F5F9",
                borderRadius: 2,
              }}
            >
              <View
                style={{
                  width: `${pct}%`,
                  height: 10,
                  backgroundColor: SEGMENT_COLORS[i % SEGMENT_COLORS.length],
                  borderRadius: 2,
                }}
              />
            </View>
            <Text
              style={{
                width: 50,
                fontFamily: "Inter",
                fontSize: 8,
                color: COLORS.textPrimary,
                marginLeft: 6,
              }}
            >
              {seg.name}
            </Text>
            <Text
              style={{
                width: 30,
                fontFamily: "Inter",
                fontSize: 8,
                color: COLORS.textSecondary,
                textAlign: "right",
              }}
            >
              {pct}%
            </Text>
          </View>
        );
      })}
    </View>
  );
}

// --- Trend Indicator ---

interface TrendIndicatorProps {
  label: string;
  value: number;
}

export function TrendIndicator({ label, value }: TrendIndicatorProps) {
  const isFlat = Math.abs(value) < 1;
  const isPositive = value > 0;

  const arrow = isFlat ? "\u2014" : isPositive ? "\u25B2" : "\u25BC";
  const color = isFlat
    ? COLORS.textSecondary
    : isPositive
      ? COLORS.success
      : COLORS.error;

  const formatted = `${value > 0 ? "+" : ""}${value}%`;

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 4,
      }}
    >
      <Text
        style={{
          flex: 1,
          fontFamily: "Inter",
          fontSize: 9,
          color: COLORS.textPrimary,
        }}
      >
        {label}
      </Text>
      <Text
        style={{
          fontFamily: "Inter",
          fontSize: 9,
          fontWeight: 600,
          color,
          marginRight: 4,
        }}
      >
        {formatted}
      </Text>
      <Text
        style={{
          fontFamily: "Inter",
          fontSize: 8,
          color,
        }}
      >
        {arrow}
      </Text>
    </View>
  );
}
