/**
 * Persona Intelligence Agent
 *
 * Receives selected buyer persona specs from the database and all upstream
 * outputs (computedAnalytics + insight-generator, forecast-modeler, polish-agent
 * narratives), then reframes market intelligence through each persona's lens.
 *
 * Generates persona-specific talking points, narrative overlays, metric emphasis,
 * and vocabulary-adapted content.
 *
 * Dependencies: insight-generator, forecast-modeler, polish-agent (runs after all 3)
 */

import Anthropic from "@anthropic-ai/sdk";
import type {
  AgentContext,
  AgentDefinition,
  AgentResult,
  SectionOutput,
} from "@/lib/agents/orchestrator";
import { env } from "@/lib/config/env";
import { stripJsonFences } from "@/lib/utils/json";
import { getReportPersonas } from "@/lib/services/buyer-personas";

// --- Output types ---

export interface PersonaIntelligenceOutput {
  personas: PersonaContent[];
  blended: BlendedContent | null;
  meta: {
    personaCount: number;
    primaryPersona: string;
    modelUsed: string;
    promptTokens: number;
    completionTokens: number;
  };
}

export interface PersonaContent {
  personaSlug: string;
  personaName: string;
  selectionOrder: number;
  talkingPoints: TalkingPoint[];
  narrativeOverlay: {
    perspective: string;
    emphasis: string[];
    deEmphasis: string[];
    toneGuidance: string;
  };
  metricEmphasis: MetricInterpretation[];
  vocabulary: {
    preferred: string[];
    avoid: string[];
  };
}

export interface TalkingPoint {
  headline: string;
  detail: string;
  dataSource: string;
  relevance: string;
}

export interface MetricInterpretation {
  metricName: string;
  currentValue: string;
  interpretation: string;
  priority: "primary" | "secondary";
}

export interface BlendedContent {
  metricUnion: string[];
  filterIntersection: {
    priceRange: { min: number; max: number | null };
    propertyTypes: string[];
    communityTypes: string[];
  };
  blendedTalkingPoints: TalkingPoint[];
  conflicts: Array<{
    metric: string;
    emphasizedBy: string;
    deEmphasizedBy: string;
    resolution: string;
  }>;
}

// --- Helpers ---

function formatCurrency(value: number): string {
  if (value >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(value % 1_000_000 === 0 ? 0 : 1)}M`;
  }
  return `$${value.toLocaleString()}`;
}

function formatPercent(value: number | null): string {
  if (value == null) return "N/A";
  return `${(value * 100).toFixed(1)}%`;
}

// --- Prompts ---

function buildSystemPrompt(): string {
  return `You are a luxury real estate intelligence advisor specializing in persona-targeted market briefings. You transform market data and analysis into content tailored for specific buyer archetypes.

Your output must:
1. Use each persona's EXACT vocabulary (provided in keyVocabulary) — these are the words their wealth managers, attorneys, and advisors use
2. AVOID words in each persona's avoid list — these trigger skepticism
3. Reference REAL numbers from the provided market data — never fabricate metrics
4. Address each persona's specific decision drivers in priority order
5. Frame insights through the persona's buying lens

You are writing FOR a luxury real estate agent, not TO the buyer. The agent will use these talking points and narrative framings in conversations with their clients.

OUTPUT RULES:
- Format: Valid JSON matching the exact schema requested. Do not include markdown, code fences, or any text outside the JSON object.
- Each persona gets 5-7 data-backed talking points with headline (1 line) and supporting detail (2-3 sentences)
- Narrative overlays must use the persona's exact vocabulary and avoid their avoid list
- Metric emphasis must reference actual numbers from the provided data
- When multiple personas are provided, generate blended content following the Knox Brothers rules
- CRITICAL: Only reference numbers that appear in the input data. Do NOT fabricate metrics.`;
}

function buildUserPrompt(
  context: AgentContext,
  personas: Array<{ selectionOrder: number; persona: any }>,
  missingUpstream: string[]
): string {
  const analytics = context.computedAnalytics;
  const { market } = context;

  // Market data summary
  let marketSummary = `## Market Data Summary

MARKET: ${market.name}
LOCATION: ${market.geography.city}, ${market.geography.state}`;

  if (analytics) {
    marketSummary += `
OVERALL METRICS:
- Total Properties: ${analytics.market.totalProperties}
- Median Price: ${formatCurrency(analytics.market.medianPrice)}
- Average Price: ${formatCurrency(analytics.market.averagePrice)}
- Median Price/SqFt: ${analytics.market.medianPricePerSqft ? `$${analytics.market.medianPricePerSqft}` : "N/A"}
- Total Volume: ${formatCurrency(analytics.market.totalVolume)}
- Overall Rating: ${analytics.market.rating}

SEGMENTS:
${analytics.segments.map((s: any) =>
  `  - ${s.name}: ${s.count} properties, median ${formatCurrency(s.medianPrice)}, ${s.medianPricePerSqft ? `$${s.medianPricePerSqft}/sqft` : "N/A psf"}, rating: ${s.rating}`
).join("\n")}

YEAR-OVER-YEAR:
- Median Price Change: ${formatPercent(analytics.yoy.medianPriceChange)}
- Volume Change: ${formatPercent(analytics.yoy.volumeChange)}
- Price/SqFt Change: ${formatPercent(analytics.yoy.pricePerSqftChange)}

DATA CONFIDENCE: ${analytics.confidence.level} (sample: ${analytics.confidence.sampleSize})`;
  }

  // Upstream narratives
  let upstreamSection = "\n\n## Upstream Narratives\n";
  const expectedUpstream = ["insight-generator", "forecast-modeler", "polish-agent"];

  for (const agentName of expectedUpstream) {
    const result = context.upstreamResults[agentName];
    if (result) {
      const meta = result.metadata as Record<string, any>;
      if (agentName === "insight-generator" && meta.insights) {
        upstreamSection += `\n### Insight Generator\n`;
        upstreamSection += `Themes: ${(meta.themes || []).join(", ")}\n`;
        upstreamSection += `Briefing: ${meta.executiveBriefing || "N/A"}\n`;
      } else if (agentName === "forecast-modeler" && meta.guidance) {
        upstreamSection += `\n### Forecast Modeler\nGuidance: ${meta.guidance}\n`;
      } else if (agentName === "polish-agent" && meta.strategicBrief) {
        upstreamSection += `\n### Polish Agent\nStrategic Brief: ${meta.strategicBrief}\n`;
      }
    }
  }

  if (missingUpstream.length > 0) {
    upstreamSection += `\n⚠️ Missing upstream: ${missingUpstream.join(", ")} — generate content from market data only for those areas.\n`;
  }

  // Persona specs
  let personaSection = "\n\n## Selected Personas (in priority order)\n";

  for (const { selectionOrder, persona } of personas) {
    const isPrimary = selectionOrder === 1;
    personaSection += `\n### Persona ${selectionOrder}${isPrimary ? " (PRIMARY)" : ""}: ${persona.name}\n`;
    personaSection += `- Slug: ${persona.slug}\n`;
    personaSection += `- Buying Lens: ${persona.buyingLens}\n`;
    personaSection += `- Primary Motivation: ${persona.primaryMotivation}\n`;
    personaSection += `- Decision Drivers: ${persona.decisionDrivers.map((d: any) => `${d.factor} [${d.weight}]`).join(", ")}\n`;
    personaSection += `- Report Metrics: ${persona.reportMetrics.join(", ")}\n`;
    personaSection += `- Language Tone: ${persona.narrativeFraming.languageTone}\n`;
    personaSection += `- keyVocabulary: ${persona.narrativeFraming.keyVocabulary.join(", ")}\n`;
    personaSection += `- Avoid: ${persona.narrativeFraming.avoid.join(", ")}\n`;
    personaSection += `- Talking Point Templates: ${persona.talkingPointTemplates.join("; ")}\n`;
  }

  // Instructions
  let instructions = `\n\n## Instructions

For each persona, generate:
1. 5-7 talking points with headline + detail + dataSource + relevance
2. Narrative overlay (perspective, emphasis, deEmphasis, toneGuidance)
3. Metric emphasis (match report_metrics to actual data, interpret through lens)
4. Vocabulary (preferred from keyVocabulary, avoid from avoid list)`;

  if (personas.length >= 2) {
    instructions += `

Since ${personas.length} personas are selected, also generate blended content:
- Metric Union: include all primary metrics from all selected personas
- Filter Intersection: note the most restrictive filter overlap
- Blended Talking Points: maximum 7 talking points addressing overlapping concerns
- Conflicts: metrics emphasized by one but de-emphasized by another are flagged as secondary
- Narrative Hierarchy: ${personas[0].persona.name} (first) sets primary tone`;
  }

  instructions += `

Return JSON in this exact structure:
{
  "personas": [
    {
      "personaSlug": "slug",
      "personaName": "Name",
      "selectionOrder": 1,
      "talkingPoints": [{ "headline": "...", "detail": "...", "dataSource": "...", "relevance": "..." }],
      "narrativeOverlay": { "perspective": "...", "emphasis": ["..."], "deEmphasis": ["..."], "toneGuidance": "..." },
      "metricEmphasis": [{ "metricName": "...", "currentValue": "...", "interpretation": "...", "priority": "primary|secondary" }],
      "vocabulary": { "preferred": ["..."], "avoid": ["..."] }
    }
  ],
  "blended": ${personas.length >= 2 ? '{ "metricUnion": [...], "filterIntersection": { "priceRange": { "min": N, "max": N|null }, "propertyTypes": [...], "communityTypes": [...] }, "blendedTalkingPoints": [...], "conflicts": [...] }' : "null"},
  "meta": {
    "personaCount": ${personas.length},
    "primaryPersona": "${personas[0].persona.slug}",
    "modelUsed": "claude-sonnet-4-6",
    "promptTokens": 0,
    "completionTokens": 0
  }
}`;

  return marketSummary + upstreamSection + personaSection + instructions;
}

// --- Main execution ---

export async function executePersonaIntelligence(
  context: AgentContext
): Promise<AgentResult> {
  const start = Date.now();

  // Check abort signal before starting
  if (context.abortSignal.aborted) {
    const error = new Error("Persona Intelligence aborted before execution");
    (error as Error & { retriable: boolean }).retriable = false;
    throw error;
  }

  // Fetch personas from database
  const reportPersonas = await getReportPersonas(context.reportId);

  // Skip if no personas selected
  if (reportPersonas.length === 0) {
    return {
      agentName: "persona-intelligence",
      sections: [],
      metadata: {
        skipped: true,
        reason: "no_personas_selected",
      },
      durationMs: Date.now() - start,
    };
  }

  // Check which upstream agents are missing
  const expectedUpstream = ["insight-generator", "forecast-modeler", "polish-agent"];
  const missingUpstream = expectedUpstream.filter(
    (name) => !context.upstreamResults[name]
  );

  // Build prompts
  const systemPrompt = buildSystemPrompt();
  const userPrompt = buildUserPrompt(context, reportPersonas, missingUpstream);

  // Check abort signal before API call
  if (context.abortSignal.aborted) {
    const error = new Error("Persona Intelligence aborted before API call");
    (error as Error & { retriable: boolean }).retriable = false;
    throw error;
  }

  // Call Claude
  let output: PersonaIntelligenceOutput;
  try {
    const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 8000,
      temperature: 0.6,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    });

    // Parse response
    const text =
      response.content[0].type === "text" ? response.content[0].text : "";

    try {
      output = JSON.parse(stripJsonFences(text)) as PersonaIntelligenceOutput;
    } catch {
      const parseError = new Error(
        `Failed to parse Persona Intelligence response as JSON: ${text.slice(0, 200)}`
      );
      (parseError as Error & { retriable: boolean }).retriable = true;
      throw parseError;
    }
  } catch (err: unknown) {
    // Re-throw if already tagged
    if (
      err instanceof Error &&
      "retriable" in err &&
      typeof (err as Error & { retriable: boolean }).retriable === "boolean"
    ) {
      throw err;
    }

    // Tag API errors
    const status = (err as { status?: number }).status;
    const retriable = status === 429 || status === 500 || status === 503;
    const wrappedError = new Error(
      (err as Error).message || "Claude API error"
    );
    (wrappedError as Error & { retriable: boolean }).retriable = retriable;
    throw wrappedError;
  }

  // Build sections
  const sections: SectionOutput[] = [
    {
      sectionType: "persona_intelligence",
      title: "Persona Intelligence",
      content: output,
    },
  ];

  return {
    agentName: "persona-intelligence",
    sections,
    metadata: {
      personaIntelligence: output,
      ...(missingUpstream.length > 0 ? { missingUpstream } : {}),
    },
    durationMs: Date.now() - start,
  };
}

// --- Agent Definition ---

export const personaIntelligenceAgent: AgentDefinition = {
  name: "persona-intelligence",
  description:
    "Reframes market intelligence through buyer persona lenses — generates persona-specific talking points, narrative overlays, and metric emphasis via Claude",
  dependencies: ["insight-generator", "forecast-modeler", "polish-agent"],
  execute: executePersonaIntelligence,
};
