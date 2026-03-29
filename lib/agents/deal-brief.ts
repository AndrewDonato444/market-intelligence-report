/**
 * Deal Brief Agent
 *
 * Generates a structured Deal Brief for a specific property, combining
 * enriched REAPI property data with the report's pre-computed market analytics
 * and buyer persona specs.
 *
 * Not part of the report pipeline — invoked on-demand per property analysis.
 */

import Anthropic from "@anthropic-ai/sdk";
import type { DealPropertyData, DealBriefContent, MotivatedSellerSignals } from "@/lib/db/schema";
import { env } from "@/lib/config/env";
import { stripJsonFences } from "@/lib/utils/json";

// --- Input types ---

export interface DealBriefInput {
  propertyData: DealPropertyData;
  motivatedSellerScore: number;
  motivatedSellerSignals: MotivatedSellerSignals;
  marketAnalytics: {
    market: {
      totalProperties: number;
      medianPrice: number;
      averagePrice: number;
      medianPricePerSqft: number;
      totalVolume: number;
      rating: string;
    };
    segments: Array<{
      name: string;
      propertyType: string;
      count: number;
      medianPrice: number;
      averagePrice: number;
      minPrice: number;
      maxPrice: number;
      medianPricePerSqft: number;
      rating: string;
      lowSample: boolean;
      yoy?: {
        medianPriceChange?: number;
        volumeChange?: number;
        pricePerSqftChange?: number;
      } | null;
    }>;
    yoy: {
      medianPriceChange?: number | null;
      volumeChange?: number | null;
      pricePerSqftChange?: number | null;
    };
  };
  forecast?: {
    projections: Array<{
      segment: string;
      sixMonth: { medianPrice: number; priceRange: { low: number; high: number }; confidence: string };
      twelveMonth: { medianPrice: number; priceRange: { low: number; high: number }; confidence: string };
    }>;
    timing?: { buyers: string; sellers: string };
  } | null;
  personas: Array<{
    slug: string;
    name: string;
    description?: string;
    decisionDrivers?: Array<{ factor: string; weight: string; description: string }>;
    narrativeFraming?: { languageTone: string; keyVocabulary: string[]; avoid: string[] };
    propertyFilters?: Record<string, unknown>;
  }>;
  marketName: string;
}

// --- Prompt builders ---

function formatCurrency(value: number): string {
  if (value >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(value % 1_000_000 === 0 ? 0 : 1)}M`;
  }
  return `$${value.toLocaleString()}`;
}

function formatPercent(value: number | null | undefined): string {
  if (value == null) return "N/A";
  return `${(value * 100).toFixed(1)}%`;
}

function buildSystemPrompt(): string {
  return `You are a specialized deal analysis agent for a luxury real estate market intelligence platform.

YOUR ROLE:
You analyze a specific property in the context of its market and generate a structured Deal Brief that a real estate agent can use in a buyer meeting. Your output must be grounded in the data provided — every claim must reference a specific number from the input.

TARGET USER:
A luxury real estate agent sitting across from a high-net-worth buyer. They need instant, data-backed context: where this property sits relative to the market, which buyer persona it fits, negotiation leverage points, and whether now is the right time to move.

VOICE:
- Authoritative and concise — an advisor, not a narrator
- Use specific numbers, never vague qualifiers ("good value", "nice area")
- Take a stance on buy/wait/neutral — don't hedge with "it depends"
- Summary should be 2-3 sentences, not a paragraph

OUTPUT RULES:
- Format: Valid JSON matching the exact schema requested. No markdown, no code fences.
- Every pricing comparison must cite the actual numbers (e.g., "$8.5M vs $7.2M segment median")
- Talking points must be single sentences the agent can say verbatim
- Negotiation leverage must reference specific data points (not generic advice like "negotiate hard")
- Risk factors must be specific to this property and market (not generic warnings)
- If motivated seller signals are provided and score >= 50, weave them into negotiation leverage
- If no buyer personas are provided, use bestFitPersona = "general" and give broad buyer appeal

CRITICAL: Do NOT fabricate data. If a metric is not in the input, do not reference it. Use ONLY the numbers provided.`;
}

function buildUserPrompt(input: DealBriefInput): string {
  const { propertyData: p, marketAnalytics: ma, forecast, personas, motivatedSellerScore, motivatedSellerSignals } = input;

  // Find matching segment
  const matchingSegment = ma.segments.find(
    (s) => s.propertyType === p.propertyType || s.name.toLowerCase().includes(p.propertyType?.toLowerCase() ?? "")
  );

  const segmentSummary = ma.segments
    .map((s) => {
      const yoyParts: string[] = [];
      if (s.yoy?.medianPriceChange != null) yoyParts.push(`price ${formatPercent(s.yoy.medianPriceChange)}`);
      if (s.yoy?.volumeChange != null) yoyParts.push(`volume ${formatPercent(s.yoy.volumeChange)}`);
      const yoyStr = yoyParts.length > 0 ? `, YoY: ${yoyParts.join(", ")}` : "";
      return `  - ${s.name}: ${s.count} properties, median ${formatCurrency(s.medianPrice)}, $${s.medianPricePerSqft}/sqft, rating: ${s.rating}${yoyStr}`;
    })
    .join("\n");

  let forecastSection = "";
  if (forecast?.projections && forecast.projections.length > 0) {
    const projLines = forecast.projections
      .map(
        (proj) =>
          `  - ${proj.segment}: 6mo median ${formatCurrency(proj.sixMonth.medianPrice)} (${proj.sixMonth.confidence}), 12mo median ${formatCurrency(proj.twelveMonth.medianPrice)} (${proj.twelveMonth.confidence})`
      )
      .join("\n");
    forecastSection = `\nFORECAST PROJECTIONS:\n${projLines}`;
    if (forecast.timing) {
      forecastSection += `\n  Buyer timing: ${forecast.timing.buyers}`;
      forecastSection += `\n  Seller timing: ${forecast.timing.sellers}`;
    }
  }

  let personaSection = "";
  if (personas.length > 0) {
    const personaLines = personas
      .map((persona) => {
        let line = `  - ${persona.name} (${persona.slug})`;
        if (persona.description) line += `: ${persona.description}`;
        if (persona.decisionDrivers) {
          line += `\n    Decision drivers: ${persona.decisionDrivers.map((d) => `${d.factor} (${d.weight})`).join(", ")}`;
        }
        if (persona.narrativeFraming) {
          line += `\n    Vocabulary: use ${persona.narrativeFraming.keyVocabulary.join(", ")}`;
          line += `\n    Avoid: ${persona.narrativeFraming.avoid.join(", ")}`;
        }
        return line;
      })
      .join("\n");
    personaSection = `\nBUYER PERSONAS (select bestFitPersona from these slugs ONLY: ${personas.map((p) => p.slug).join(", ")}):\n${personaLines}`;
  } else {
    personaSection = `\nBUYER PERSONAS: None linked. Use bestFitPersona = "general" and provide broad buyer appeal.`;
  }

  let sellerSection = "";
  if (motivatedSellerScore >= 50) {
    const firedSignals = Object.entries(motivatedSellerSignals)
      .filter(([key, val]) => key !== "totalScore" && typeof val === "object" && val.fired)
      .map(([key, val]) => {
        const v = val as { fired: boolean; weight: number; yearsHeld?: number; mortgageCount?: number; equityPercent?: number };
        let detail = `${key} (weight: ${v.weight})`;
        if (v.yearsHeld) detail += ` — held ${v.yearsHeld} years`;
        if (v.mortgageCount) detail += ` — ${v.mortgageCount} active mortgages`;
        if (v.equityPercent) detail += ` — ${v.equityPercent}% equity`;
        return detail;
      });
    sellerSection = `\nMOTIVATED SELLER SIGNALS (score: ${motivatedSellerScore}/100 — HIGH, weave into negotiation leverage):\n  Fired signals: ${firedSignals.join(", ")}`;
  } else {
    sellerSection = `\nMOTIVATED SELLER SCORE: ${motivatedSellerScore}/100 (low — do not fabricate seller motivation)`;
  }

  return `Generate a Deal Brief for the following property.

PROPERTY:
  Address: ${p.address}, ${p.city}, ${p.state} ${p.zip}
  Type: ${p.propertyType}
  Bedrooms: ${p.bedrooms ?? "N/A"} | Bathrooms: ${p.bathrooms ?? "N/A"}
  SqFt: ${p.squareFeet?.toLocaleString() ?? "N/A"} | Lot: ${p.lotSize?.toLocaleString() ?? "N/A"} sqft
  Year Built: ${p.yearBuilt ?? "N/A"}
  Estimated Value: ${p.estimatedValue ? formatCurrency(p.estimatedValue) : "N/A"}
  Last Sale: ${p.lastSaleDate ?? "N/A"} for ${p.lastSaleAmount ? formatCurrency(p.lastSaleAmount) : "N/A"}
  Price/SqFt: ${p.pricePerSqFt ? `$${p.pricePerSqFt.toLocaleString()}` : "N/A"}
  Owner Occupied: ${p.ownerOccupied ?? "N/A"}
  Flood Zone: ${p.floodZone ?? "N/A"}
  Tax Assessment: ${p.taxAssessment ? formatCurrency(p.taxAssessment) : "N/A"}
  Annual Taxes: ${p.annualTaxes ? formatCurrency(p.annualTaxes) : "N/A"}
${p.saleHistory && p.saleHistory.length > 0 ? `  Sale History:\n${p.saleHistory.map((s) => `    ${s.date}: ${formatCurrency(s.amount)}${s.buyer ? ` (buyer: ${s.buyer})` : ""}${s.seller ? ` (seller: ${s.seller})` : ""}`).join("\n")}` : ""}
${p.mortgageHistory && p.mortgageHistory.length > 0 ? `  Active Mortgages:\n${p.mortgageHistory.map((m) => `    ${formatCurrency(m.amount)} @ ${m.rate ?? "N/A"}% from ${m.lender ?? "N/A"} (${m.type ?? "N/A"})`).join("\n")}` : ""}

MARKET: ${input.marketName}
  Total Properties: ${ma.market.totalProperties}
  Median Price: ${formatCurrency(ma.market.medianPrice)}
  Average Price: ${formatCurrency(ma.market.averagePrice)}
  Median $/SqFt: $${ma.market.medianPricePerSqft}
  Overall Rating: ${ma.market.rating}
  YoY Median Price Change: ${formatPercent(ma.yoy.medianPriceChange)}
  YoY Volume Change: ${formatPercent(ma.yoy.volumeChange)}

SEGMENTS:
${segmentSummary || "  No segment data available"}
${matchingSegment ? `\nMATCHING SEGMENT (${matchingSegment.name}):\n  Median Price: ${formatCurrency(matchingSegment.medianPrice)}\n  Median $/SqFt: $${matchingSegment.medianPricePerSqft}\n  Count: ${matchingSegment.count} properties\n  Rating: ${matchingSegment.rating}` : ""}
${forecastSection}${personaSection}${sellerSection}

Respond with a JSON object matching this exact schema:
{
  "summary": "2-3 sentence executive summary mentioning address, key positioning metric, and a stance",
  "pricingAssessment": {
    "narrative": "1-2 paragraph analysis of pricing relative to market",
    "vsMedian": "comparison string (e.g. '+18% above segment median')",
    "vsSegmentComps": "comparison to similar properties in the segment",
    "pricePerSqFtContext": "$/sqft comparison (e.g. '$2,024/sqft vs $1,850 segment median')"
  },
  "personaMatch": {
    "bestFitPersona": "persona slug from the provided list, or 'general' if none provided",
    "matchRationale": "why this persona fits this property",
    "talkingPoints": ["3-5 single-sentence talking points using the persona's vocabulary"]
  },
  "negotiationPoints": {
    "leverageItems": ["3-5 leverage items grounded in property/market data"],
    "dataBackedArguments": ["2-4 specific data points to cite in negotiation"],
    "riskFactors": ["2-3 property-specific risks"]
  },
  "marketTiming": {
    "signal": "buy|wait|neutral",
    "rationale": "data-backed explanation for the signal",
    "forecastContext": "what the forecast says about this segment's trajectory"
  }
}`;
}

// --- Validation ---

function isValidBriefContent(data: unknown): data is DealBriefContent {
  if (!data || typeof data !== "object") return false;
  const d = data as Record<string, unknown>;
  if (typeof d.summary !== "string") return false;

  const pa = d.pricingAssessment as Record<string, unknown> | undefined;
  if (!pa || typeof pa.narrative !== "string" || typeof pa.vsMedian !== "string" ||
      typeof pa.vsSegmentComps !== "string" || typeof pa.pricePerSqFtContext !== "string") return false;

  const pm = d.personaMatch as Record<string, unknown> | undefined;
  if (!pm || typeof pm.bestFitPersona !== "string" || typeof pm.matchRationale !== "string" ||
      !Array.isArray(pm.talkingPoints)) return false;

  const np = d.negotiationPoints as Record<string, unknown> | undefined;
  if (!np || !Array.isArray(np.leverageItems) || !Array.isArray(np.dataBackedArguments) ||
      !Array.isArray(np.riskFactors)) return false;

  const mt = d.marketTiming as Record<string, unknown> | undefined;
  if (!mt || !["buy", "wait", "neutral"].includes(mt.signal as string) ||
      typeof mt.rationale !== "string" || typeof mt.forecastContext !== "string") return false;

  return true;
}

// --- Main execution ---

export async function executeDealBrief(input: DealBriefInput): Promise<DealBriefContent> {
  const systemPrompt = buildSystemPrompt();
  const userPrompt = buildUserPrompt(input);

  const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });

  let lastError: Error | null = null;

  // Try up to 2 times (initial + 1 retry)
  for (let attempt = 0; attempt < 2; attempt++) {
    const messages: Anthropic.MessageParam[] = [{ role: "user", content: userPrompt }];

    if (attempt > 0) {
      // Add corrective instruction on retry
      messages.push({
        role: "assistant",
        content: "I'll provide the response as valid JSON.",
      });
      messages.push({
        role: "user",
        content: "Your previous response was not valid JSON. Please respond with ONLY a valid JSON object matching the schema above. No markdown, no code fences, no extra text.",
      });
    }

    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      temperature: 0.5,
      system: systemPrompt,
      messages,
    });

    const rawText = response.content
      .filter((block): block is Anthropic.TextBlock => block.type === "text")
      .map((block) => block.text)
      .join("");

    try {
      const cleaned = stripJsonFences(rawText);
      const parsed = JSON.parse(cleaned);

      if (isValidBriefContent(parsed)) {
        return parsed;
      }

      lastError = new Error("Response does not match DealBriefContent schema");
    } catch (e) {
      lastError = e instanceof Error ? e : new Error("JSON parse failed");
    }
  }

  throw lastError ?? new Error("Deal Brief generation failed");
}
