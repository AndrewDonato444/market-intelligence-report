/**
 * Social Media Agent
 *
 * Standalone Claude-powered agent that reads a finalized report's assembled
 * sections and generates a comprehensive social media content kit.
 *
 * Unlike pipeline agents, this runs independently — not as part of the
 * 4-layer pipeline. Triggered on-demand after a report is finalized.
 */

import Anthropic from "@anthropic-ai/sdk";
import type { SocialMediaKitContent } from "@/lib/db/schema";
import { env } from "@/lib/config/env";
import { stripJsonFences } from "@/lib/utils/json";

// --- Input types ---

export interface SocialMediaAgentInput {
  reportSections: Array<{
    sectionType: string;
    title: string;
    content: any;
  }>;
  computedAnalytics: any;
  market: {
    name: string;
    geography: { city: string; state: string };
    luxuryTier: string;
    priceFloor: number;
    priceCeiling: number | null;
  };
  personas: Array<{
    selectionOrder: number;
    persona: {
      slug: string;
      name: string;
      narrativeFraming: {
        keyVocabulary: string[];
        avoid?: string[];
      };
      [key: string]: any;
    };
  }>;
  /** When set, generate ONLY this content type (per-section regeneration). */
  sectionOnly?: keyof SocialMediaKitContent;
}

// --- Output types ---

export interface SocialMediaAgentResult {
  content: SocialMediaKitContent;
  durationMs: number;
  metadata: {
    promptTokens: number;
    completionTokens: number;
    modelUsed: string;
  };
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
  return `You are an elite luxury real estate social media strategist. You transform market intelligence reports into comprehensive social media content kits for luxury real estate agents.

Your output must:
1. Write ALL content from the luxury agent's voice — "Our latest analysis reveals..." not "Modern Signal Advisory found..."
2. Every stat you quote MUST appear in the Key Metrics Table provided — never fabricate numbers
3. Each post idea must reference a specific report section
4. Tone: authoritative but approachable — an "executive briefing" not a "data dump"
5. Platform-specific formatting:
   - LinkedIn: 150-300 words, thought-leadership framing, professional tone
   - Instagram: 50-150 words, hooks + 10-15 relevant hashtags
   - X/Twitter: Under 280 characters, compelling stat or question
   - Facebook: 100-200 words, community-oriented framing

OUTPUT RULES:
- Format: Valid JSON matching the exact schema requested
- Do not include markdown code fences or any text outside the JSON object
- Every statCallout.stat must be a real number from the Key Metrics Table
- Every postIdea must have a reportSection and insightRef
- If no personas are provided, personaPosts must be an empty array
- Content calendar must span exactly 4 weeks
- CRITICAL: Only reference numbers that appear in the input data`;
}

function buildSectionOnlyPrompt(input: SocialMediaAgentInput): string {
  const { reportSections, computedAnalytics, market, personas, sectionOnly } = input;

  // Same market/analytics/sections context as full prompt
  let prompt = buildUserPrompt({ ...input, sectionOnly: undefined });

  // Override the output schema to request only the target section
  const sectionLabels: Record<string, string> = {
    postIdeas: 'postIdeas (5+ items)',
    captions: 'captions (4+ items, 1 per platform)',
    personaPosts: `personaPosts (${personas.length > 0 ? `2-3 per persona (${personas.length} personas)` : '0 (empty array)'})`,
    polls: 'polls (2+ items)',
    conversationStarters: 'conversationStarters (3+ items)',
    calendarSuggestions: 'calendarSuggestions (exactly 4 weeks)',
    statCallouts: 'statCallouts (4+ items)',
  };

  prompt += `\n\n## SECTION-ONLY REGENERATION

IMPORTANT: You are regenerating ONLY the "${sectionOnly}" section.
Return the SAME full JSON schema as above, but ONLY populate the "${sectionOnly}" array.
All other arrays should be empty [].

Focus on generating fresh, high-quality alternatives for: ${sectionLabels[sectionOnly!] ?? sectionOnly}`;

  return prompt;
}

function buildUserPrompt(input: SocialMediaAgentInput): string {
  const { reportSections, computedAnalytics, market, personas } = input;
  const analytics = computedAnalytics;

  // Market context
  let prompt = `## Market Context

MARKET: ${market.name}
LOCATION: ${market.geography.city}, ${market.geography.state}
TIER: ${market.luxuryTier}
PRICE FLOOR: ${formatCurrency(market.priceFloor)}`;

  // Key metrics table
  if (analytics) {
    prompt += `

## Key Metrics Table (ONLY quote these numbers)

OVERALL:
- Total Properties: ${analytics.market.totalProperties}
- Median Price: ${formatCurrency(analytics.market.medianPrice)}
- Average Price: ${formatCurrency(analytics.market.averagePrice)}
- Median Price/SqFt: ${analytics.market.medianPricePerSqft ? `$${analytics.market.medianPricePerSqft}` : "N/A"}
- Total Volume: ${formatCurrency(analytics.market.totalVolume)}
- Rating: ${analytics.market.rating}

SEGMENTS:
${analytics.segments.map((s: any) =>
  `- ${s.name}: ${s.count} properties, median ${formatCurrency(s.medianPrice)}, ${s.medianPricePerSqft ? `$${s.medianPricePerSqft}/sqft` : "N/A psf"}, rating: ${s.rating}`
).join("\n")}

YEAR-OVER-YEAR:
- Median Price Change: ${formatPercent(analytics.yoy.medianPriceChange)}
- Volume Change: ${formatPercent(analytics.yoy.volumeChange)}
- Price/SqFt Change: ${formatPercent(analytics.yoy.pricePerSqftChange)}

DATA CONFIDENCE: ${analytics.confidence.level} (sample: ${analytics.confidence.sampleSize})`;
  }

  // Report sections
  prompt += `\n\n## Report Sections (read like a human would)\n`;
  for (const section of reportSections) {
    const narrative = typeof section.content === "string"
      ? section.content
      : section.content?.narrative || JSON.stringify(section.content).slice(0, 500);
    prompt += `\n### ${section.title} (${section.sectionType})\n${narrative}\n`;
  }

  // Personas (if any)
  if (personas.length > 0) {
    prompt += `\n\n## Selected Buyer Personas\n`;
    prompt += `Generate 2-3 persona-targeted posts PER persona using their vocabulary.\n`;
    for (const { selectionOrder, persona } of personas) {
      prompt += `\n### Persona ${selectionOrder}: ${persona.name} (${persona.slug})`;
      prompt += `\n- Key Vocabulary: ${persona.narrativeFraming.keyVocabulary.join(", ")}`;
      if (persona.narrativeFraming.avoid?.length) {
        prompt += `\n- Avoid: ${persona.narrativeFraming.avoid.join(", ")}`;
      }
      prompt += `\n`;
    }
  } else {
    prompt += `\n\n## Personas\nNo buyer personas selected. Set personaPosts to an empty array.\n`;
  }

  // Output schema
  prompt += `\n\n## Required Output (exact JSON schema)

Return ONLY valid JSON with this structure:
{
  "postIdeas": [
    { "title": "string", "body": "string", "platforms": ["linkedin"|"instagram"|"x"|"facebook"], "reportSection": "section_type", "insightRef": "metric_key" }
  ],
  "captions": [
    { "platform": "linkedin"|"instagram"|"x"|"facebook", "caption": "string", "hashtags": ["#Tag"], "characterCount": number }
  ],
  "personaPosts": [
    { "personaSlug": "slug", "personaName": "Name", "post": "string", "platform": "string", "vocabularyUsed": ["word"] }
  ],
  "polls": [
    { "question": "string", "options": ["string"], "dataContext": "string", "platform": "string" }
  ],
  "conversationStarters": [
    { "context": "when to use it", "template": "the response template" }
  ],
  "calendarSuggestions": [
    { "week": 1, "theme": "string", "postIdeas": ["string"], "platforms": ["string"] }
  ],
  "statCallouts": [
    { "stat": "the number", "context": "why it matters", "source": "section_type", "suggestedCaption": "ready-to-post snippet" }
  ]
}

MINIMUM COUNTS:
- postIdeas: 5+
- captions: 4 (1 per platform minimum)
- personaPosts: ${personas.length > 0 ? `2-3 per persona (${personas.length} personas = ${personas.length * 2}-${personas.length * 3} posts)` : "0 (empty array)"}
- polls: 2+
- conversationStarters: 3+
- calendarSuggestions: exactly 4 (weeks 1-4)
- statCallouts: 4+`;

  return prompt;
}

// --- Main execution ---

export async function executeSocialMediaAgent(
  input: SocialMediaAgentInput
): Promise<SocialMediaAgentResult> {
  const start = Date.now();

  const systemPrompt = buildSystemPrompt();
  const userPrompt = input.sectionOnly
    ? buildSectionOnlyPrompt(input)
    : buildUserPrompt(input);

  let content: SocialMediaKitContent;
  let promptTokens = 0;
  let completionTokens = 0;

  try {
    const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 16000,
      temperature: 0.7,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    });

    promptTokens = response.usage?.input_tokens ?? 0;
    completionTokens = response.usage?.output_tokens ?? 0;

    const text =
      response.content[0].type === "text" ? response.content[0].text : "";

    try {
      content = JSON.parse(stripJsonFences(text)) as SocialMediaKitContent;
    } catch {
      const parseError = new Error(
        `Failed to parse Social Media Agent response as JSON: ${text.slice(0, 200)}`
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

  return {
    content,
    durationMs: Date.now() - start,
    metadata: {
      promptTokens,
      completionTokens,
      modelUsed: "claude-haiku-4-5-20251001",
    },
  };
}
