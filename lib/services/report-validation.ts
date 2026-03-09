/**
 * Report configuration validation.
 *
 * Validates report creation requests and exposes section metadata
 * used by the Report Builder Wizard UI.
 */

// --- Section metadata ---

export interface ReportSectionMeta {
  type: string;
  label: string;
  description: string;
  required: boolean;
}

export const REPORT_SECTIONS: ReportSectionMeta[] = [
  {
    type: "market_overview",
    label: "Market Overview",
    description:
      "Strategic overview with key metrics and ratings",
    required: true,
  },
  {
    type: "executive_summary",
    label: "Executive Summary",
    description:
      "High-level narrative with highlights and timing",
    required: true,
  },
  {
    type: "key_drivers",
    label: "Key Market Drivers",
    description: "Thematic analysis of market forces",
    required: true,
  },
  {
    type: "competitive_market_analysis",
    label: "Competitive Analysis",
    description:
      "Peer market comparisons and positioning",
    required: false,
  },
  {
    type: "forecasts",
    label: "Forecasts & Projections",
    description:
      "6/12-month projections with scenarios",
    required: false,
  },
  {
    type: "strategic_summary",
    label: "Strategic Summary",
    description: "Timing guidance and outlook",
    required: false,
  },
  {
    type: "polished_report",
    label: "Editorial Polish",
    description: "Consistency check and pull quotes",
    required: false,
  },
  {
    type: "methodology",
    label: "Methodology",
    description: "Data sources and confidence levels",
    required: false,
  },
];

export const REQUIRED_SECTIONS = REPORT_SECTIONS.filter(
  (s) => s.required
).map((s) => s.type);

const ALL_SECTION_TYPES = new Set(REPORT_SECTIONS.map((s) => s.type));

// --- Validation ---

export interface ReportConfigInput {
  marketId: string;
  title: string;
  sections: string[];
}

export interface ReportConfigData {
  marketId: string;
  title: string;
  sections: string[];
}

export interface ReportValidationResult {
  success: boolean;
  errors: Record<string, string>;
  data?: ReportConfigData;
}

export function validateReportConfig(
  input: ReportConfigInput
): ReportValidationResult {
  const errors: Record<string, string> = {};

  // Validate marketId
  if (!input.marketId || !input.marketId.trim()) {
    errors.marketId = "Select a market to continue";
  }

  // Validate title
  const title = input.title?.trim() ?? "";
  if (!title) {
    errors.title = "Report title is required";
  } else if (title.length > 500) {
    errors.title = "Report title must be 500 characters or less";
  }

  // Validate sections
  if (!input.sections || input.sections.length === 0) {
    errors.sections = "Select at least one report section";
  } else {
    // Check for unknown section types
    const unknown = input.sections.filter((s) => !ALL_SECTION_TYPES.has(s));
    if (unknown.length > 0) {
      errors.sections = `Unknown section types: ${unknown.join(", ")}`;
    } else {
      // Check required sections are included
      const missing = REQUIRED_SECTIONS.filter(
        (r) => !input.sections.includes(r)
      );
      if (missing.length > 0) {
        errors.sections = missing.join(", ");
      }
    }
  }

  if (Object.keys(errors).length > 0) {
    return { success: false, errors };
  }

  return {
    success: true,
    errors: {},
    data: {
      marketId: input.marketId.trim(),
      title,
      sections: input.sections,
    },
  };
}
