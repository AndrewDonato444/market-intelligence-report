/**
 * Bulk Email Campaign Agent
 *
 * Standalone Claude-powered agent that reads a finalized report's assembled
 * sections and generates comprehensive email campaign content — drip sequences,
 * newsletters, persona-targeted emails, subject lines, CTAs, and re-engagement
 * templates.
 *
 * Unlike pipeline agents, this runs independently — not as part of the
 * 4-layer pipeline. Triggered on-demand after a report is finalized.
 */

import Anthropic from "@anthropic-ai/sdk";
import type { EmailCampaignContent } from "@/lib/db/schema";
import { env } from "@/lib/config/env";
import { stripJsonFences } from "@/lib/utils/json";

// --- Input types ---

export interface EmailCampaignAgentInput {
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
  sectionOnly?: keyof EmailCampaignContent;
}

// --- Output types ---

export interface EmailCampaignAgentResult {
  content: EmailCampaignContent;
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
  return `You are an elite luxury real estate email marketing strategist. You transform market intelligence reports into comprehensive email campaign content for luxury real estate agents.

Your output must:
1. Write ALL content from the luxury agent's voice — "Based on our latest market analysis..." not "Modern Signal Advisory found..."
2. Every stat you quote MUST appear in the Key Metrics Table provided — never fabricate numbers
3. Tone: authoritative advisory — an "intelligence brief" not a "sales blast"
4. Position the agent as a trusted advisor, not a vendor
5. Email best practices:
   - Subject lines MUST be under 60 characters (optimized for mobile inbox preview)
   - Preview text MUST be under 90 characters
   - Each drip email must build on the previous — tell a progressive story
   - CTAs should be varied — not all "Schedule a call"
   - Use advisory language: "intelligence brief" not "market update", "consultation" not "sales call"

OUTPUT RULES:
- Format: Valid JSON matching the exact schema requested
- Do not include markdown code fences or any text outside the JSON object
- Every email must reference specific data points from the report
- If no personas are provided, personaEmails must be an empty array
- Drip sequence must tell a progressive story over 2 weeks (4-5 emails)
- CRITICAL: Only reference numbers that appear in the input data`;
}

function buildSectionOnlyPrompt(input: EmailCampaignAgentInput): string {
  const { personas, sectionOnly } = input;

  let prompt = buildUserPrompt({ ...input, sectionOnly: undefined });

  const sectionLabels: Record<string, string> = {
    dripSequence: "dripSequence (4-5 emails over 2 weeks)",
    newsletter: "newsletter (1 with 3-5 content blocks)",
    personaEmails: `personaEmails (${personas.length > 0 ? `2-3 per persona (${personas.length} personas)` : "0 (empty array)"})`,
    subjectLines: "subjectLines (3-5 sets with 3 variants each)",
    ctaBlocks: "ctaBlocks (3-5 blocks)",
    reEngagementEmails: "reEngagementEmails (2-3 templates)",
  };

  prompt += `\n\n## SECTION-ONLY REGENERATION

IMPORTANT: You are regenerating ONLY the "${sectionOnly}" section.
Return the SAME full JSON schema as above, but ONLY populate the "${sectionOnly}" field.
All other fields should use their empty defaults (empty arrays or empty object).

Focus on generating fresh, high-quality alternatives for: ${sectionLabels[sectionOnly!] ?? sectionOnly}`;

  return prompt;
}

function buildUserPrompt(input: EmailCampaignAgentInput): string {
  const { reportSections, computedAnalytics, market, personas } = input;
  const analytics = computedAnalytics;

  let prompt = `## Market Context

MARKET: ${market.name}
LOCATION: ${market.geography.city}, ${market.geography.state}
TIER: ${market.luxuryTier}
PRICE FLOOR: ${formatCurrency(market.priceFloor)}`;

  if (analytics?.market) {
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
${(analytics.segments ?? []).map((s: any) =>
  `- ${s.name}: ${s.count} properties, median ${formatCurrency(s.medianPrice)}, ${s.medianPricePerSqft ? `$${s.medianPricePerSqft}/sqft` : "N/A psf"}, rating: ${s.rating}`
).join("\n")}

YEAR-OVER-YEAR:
- Median Price Change: ${formatPercent(analytics.yoy?.medianPriceChange)}
- Volume Change: ${formatPercent(analytics.yoy?.volumeChange)}
- Price/SqFt Change: ${formatPercent(analytics.yoy?.pricePerSqftChange)}

DATA CONFIDENCE: ${analytics.confidence?.level ?? "unknown"} (sample: ${analytics.confidence?.sampleSize ?? "N/A"})`;
  }

  prompt += `\n\n## Report Sections (read like a human would)\n`;
  for (const section of reportSections) {
    const narrative = typeof section.content === "string"
      ? section.content
      : section.content?.narrative || JSON.stringify(section.content).slice(0, 500);
    prompt += `\n### ${section.title} (${section.sectionType})\n${narrative}\n`;
  }

  if (personas.length > 0) {
    prompt += `\n\n## Selected Buyer Personas\n`;
    prompt += `Generate 2-3 persona-targeted email variants PER persona using their vocabulary.\n`;
    for (const { selectionOrder, persona } of personas) {
      prompt += `\n### Persona ${selectionOrder}: ${persona.name} (${persona.slug})`;
      prompt += `\n- Key Vocabulary: ${persona.narrativeFraming.keyVocabulary.join(", ")}`;
      if (persona.narrativeFraming.avoid?.length) {
        prompt += `\n- Avoid: ${persona.narrativeFraming.avoid.join(", ")}`;
      }
      prompt += `\n`;
    }
  } else {
    prompt += `\n\n## Personas\nNo buyer personas selected. Set personaEmails to an empty array.\n`;
  }

  prompt += `\n\n## Required Output (exact JSON schema)

Return ONLY valid JSON with this structure:
{
  "dripSequence": [
    { "sequenceOrder": 1, "dayOffset": 0, "subject": "string (<60 chars)", "previewText": "string (<90 chars)", "body": "string (2-4 paragraphs)", "cta": "string", "reportSection": "section_type" }
  ],
  "newsletter": {
    "headline": "string",
    "subheadline": "string",
    "contentBlocks": [
      { "heading": "string", "body": "string (2-3 paragraphs)", "keyMetric": "specific number from Key Metrics Table" }
    ],
    "footerCta": "string"
  },
  "personaEmails": [
    { "personaSlug": "slug", "personaName": "Name", "subject": "string (<60 chars)", "previewText": "string (<90 chars)", "body": "string (2-4 paragraphs)", "cta": "string", "vocabularyUsed": ["word"] }
  ],
  "subjectLines": [
    { "emailContext": "which email this is for", "variants": [
      { "style": "data-forward", "subject": "string (<60 chars)", "previewText": "string (<90 chars)" },
      { "style": "curiosity-driven", "subject": "string (<60 chars)", "previewText": "string (<90 chars)" },
      { "style": "urgency-based", "subject": "string (<60 chars)", "previewText": "string (<90 chars)" }
    ]}
  ],
  "ctaBlocks": [
    { "context": "where in the email to place it", "buttonText": "string", "supportingCopy": "string", "placement": "primary|inline" }
  ],
  "reEngagementEmails": [
    { "hook": "surprising insight opener", "body": "string (1-2 paragraphs)", "cta": "low-friction CTA", "tone": "warm|curious|advisory" }
  ]
}

CONTENT REQUIREMENTS:
- dripSequence: 4-5 emails over 2 weeks (day 0, 3, 7, 10, 14)
  - Email 1: "thank you + one compelling stat" opener (day 0)
  - Email 2: "key driver deep dive" with a specific market theme (day 3)
  - Email 3: "competitive positioning" comparing their market to peers (day 7)
  - Email 4: "forward outlook" with forecast highlights and timing signals (day 10)
  - Email 5: "call to action" closing with a specific recommendation (day 14)
  - Each email MUST build on the previous — tell a progressive story
- newsletter: 1 newsletter with 3-5 content blocks mapping to report sections
  - Tone: authoritative advisory — an "intelligence brief" not a "market update"
- personaEmails: ${personas.length > 0 ? `2-3 per persona (${personas.length} personas = ${personas.length * 2}-${personas.length * 3} emails)` : "0 (empty array — no personas selected)"}
  - Use each persona's key vocabulary in subject lines and body
  - Avoid words from the persona's avoid list
- subjectLines: 3-5 sets, each with 3 variants (data-forward, curiosity-driven, urgency-based)
  - Data-forward: include a specific number from Key Metrics Table
  - Curiosity-driven: pose a question
  - Urgency-based: reference timing signals
  - ALL subjects under 60 characters
- ctaBlocks: 3-5 varied CTAs (not all "Schedule a call")
  - Include: "View the full intelligence brief", "See your market's forecast", "Book a market advisory session", "Download the report"
  - Specify placement: "primary" (end of email) or "inline" (mid-content)
- reEngagementEmails: 2-3 templates for dormant contacts (3-6 months inactive)
  - Lead with a surprising or contrarian insight
  - Low-friction CTA ("Reply with 'interested' for the full briefing")
  - Warm, non-pushy tone — reconnecting as an advisor, not selling`;

  return prompt;
}

// --- Main execution ---

export async function executeEmailCampaignAgent(
  input: EmailCampaignAgentInput
): Promise<EmailCampaignAgentResult> {
  const start = Date.now();

  const systemPrompt = buildSystemPrompt();
  const userPrompt = input.sectionOnly
    ? buildSectionOnlyPrompt(input)
    : buildUserPrompt(input);

  let content: EmailCampaignContent;
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
      content = JSON.parse(stripJsonFences(text)) as EmailCampaignContent;
    } catch {
      const parseError = new Error(
        `Failed to parse Email Campaign Agent response as JSON: ${text.slice(0, 200)}`
      );
      (parseError as Error & { retriable: boolean }).retriable = true;
      throw parseError;
    }
  } catch (err: unknown) {
    if (
      err instanceof Error &&
      "retriable" in err &&
      typeof (err as Error & { retriable: boolean }).retriable === "boolean"
    ) {
      throw err;
    }

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
