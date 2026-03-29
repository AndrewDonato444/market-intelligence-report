import { type NextRequest } from "next/server";
import { blockIp } from "@/lib/security/anti-scraper";

/**
 * Honeypot route — invisible to real users, traps automated scrapers.
 * Not linked anywhere in the UI. Returns 204 No Content.
 * Scrapers that follow every discoverable link will hit this.
 *
 * On hit: the IP is added to a blocklist checked by the anti-scraper
 * middleware, so all subsequent requests from that IP are rejected.
 */
export async function GET(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown";

  console.warn(`[honeypot] Scraper trap triggered by IP: ${ip}, UA: ${request.headers.get("user-agent") ?? "none"}`);

  // Block this IP for 1 hour — all subsequent requests will be 403'd
  if (ip !== "unknown") {
    blockIp(ip);
  }

  return new Response(null, { status: 204 });
}

export async function POST(request: NextRequest) {
  return GET(request);
}
