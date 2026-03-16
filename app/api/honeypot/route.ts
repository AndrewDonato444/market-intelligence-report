import { type NextRequest } from "next/server";

/**
 * Honeypot route — invisible to real users, traps automated scrapers.
 * Not linked anywhere in the UI. Returns 204 No Content.
 * Scrapers that follow every discoverable link will hit this.
 */
export async function GET(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown";

  console.warn(`[honeypot] Scraper trap triggered by IP: ${ip}, UA: ${request.headers.get("user-agent") ?? "none"}`);

  return new Response(null, { status: 204 });
}

export async function POST(request: NextRequest) {
  return GET(request);
}
