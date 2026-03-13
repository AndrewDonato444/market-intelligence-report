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
    type: "executive_briefing",
    label: "Executive Briefing",
    description: "Strategic overview with key metrics, ratings, and AI narrative",
    required: true,
  },
  {
    type: "market_insights_index",
    label: "Market Insights Index",
    description: "Composite market health indices and trend indicators",
    required: true,
  },
  {
    type: "luxury_market_dashboard",
    label: "Luxury Market Dashboard",
    description: "Pricing, inventory, and velocity metrics dashboard",
    required: true,
  },
  {
    type: "neighborhood_intelligence",
    label: "Neighborhood Intelligence",
    description: "Neighborhood-level analysis with micro-market patterns",
    required: true,
  },
  {
    type: "the_narrative",
    label: "The Narrative",
    description: "AI-generated editorial analysis of market themes and dynamics",
    required: true,
  },
  {
    type: "forward_look",
    label: "Forward Look",
    description: "Forecast projections with timing guidance and scenarios",
    required: false,
  },
  {
    type: "comparative_positioning",
    label: "Comparative Positioning",
    description: "Peer market comparisons and competitive positioning",
    required: true,
  },
  {
    type: "disclaimer_methodology",
    label: "Disclaimer & Methodology",
    description: "Data sources, confidence levels, and methodology transparency",
    required: true,
  },
  {
    type: "persona_intelligence",
    label: "Persona Intelligence",
    description: "Buyer persona-specific insights and narrative framing",
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
