/**
 * In-memory IP blocklist populated by honeypot hits.
 * IPs are auto-expired after BLOCKLIST_TTL_MS to avoid unbounded growth.
 */
const blockedIps = new Map<string, number>(); // ip → expiry timestamp
const BLOCKLIST_TTL_MS = 60 * 60 * 1000; // 1 hour

/**
 * Add an IP to the blocklist (called by honeypot route).
 */
export function blockIp(ip: string): void {
  blockedIps.set(ip, Date.now() + BLOCKLIST_TTL_MS);
}

/**
 * Check if an IP is on the blocklist (with lazy expiry cleanup).
 */
export function isBlockedIp(ip: string): boolean {
  const expiry = blockedIps.get(ip);
  if (expiry === undefined) return false;

  if (Date.now() > expiry) {
    blockedIps.delete(ip);
    return false;
  }

  return true;
}

/**
 * Get the number of currently blocked IPs. Used for monitoring/tests.
 */
export function getBlockedIpCount(): number {
  // Lazy cleanup while counting
  const now = Date.now();
  for (const [ip, expiry] of blockedIps) {
    if (now > expiry) blockedIps.delete(ip);
  }
  return blockedIps.size;
}

/**
 * Clear all blocked IPs. Used for testing.
 */
export function resetBlockedIps(): void {
  blockedIps.clear();
}

/**
 * Known bot/scraper user-agent patterns (case-insensitive).
 * Covers common HTTP libraries, headless browsers, and generic bot strings.
 */
export const BOT_USER_AGENT_PATTERNS: RegExp[] = [
  /python-requests/i,
  /python-urllib/i,
  /python-httpx/i,
  /scrapy/i,
  /beautifulsoup/i,
  /curl\//i,
  /wget\//i,
  /Go-http-client/i,
  /Java\//i,
  /Apache-HttpClient/i,
  /HeadlessChrome/i,
  /PhantomJS/i,
  /Puppeteer/i,
  /bot\b/i,
  /crawler\b/i,
  /spider\b/i,
  /scraper\b/i,
];

/**
 * Legitimate bot patterns that should NOT be blocked.
 * These respect robots.txt and are beneficial for SEO/monitoring.
 */
const ALLOWED_BOT_PATTERNS: RegExp[] = [
  /Googlebot/i,
  /Bingbot/i,
  /Slurp/i, // Yahoo
  /DuckDuckBot/i,
  /facebookexternalhit/i,
  /Twitterbot/i,
  /LinkedInBot/i,
  /UptimeRobot/i,
  /Pingdom/i,
];

/** Suspicion score threshold — block if score >= this value */
export const SUSPICION_THRESHOLD = 2;

/**
 * Routes exempt from anti-scraper checks.
 * These either serve static assets, handle external webhooks,
 * or are monitoring endpoints that need to stay open.
 */
export function isExemptRoute(pathname: string): boolean {
  // Static assets
  if (pathname.startsWith("/_next")) return true;

  // Health check
  if (pathname.startsWith("/api/health")) return true;

  // Webhooks (have their own auth)
  if (pathname.startsWith("/api/webhooks")) return true;

  // File extensions (static resources)
  if (/\.\w{2,4}$/.test(pathname)) return true;

  return false;
}

/**
 * Check if a user-agent string matches known bot/scraper patterns.
 * Returns true if the UA should be blocked.
 */
export function isBlockedUserAgent(ua: string | null): boolean {
  // Empty or missing UA → block
  if (!ua || ua.trim() === "") return true;

  // Check if it's an allowed bot first
  for (const pattern of ALLOWED_BOT_PATTERNS) {
    if (pattern.test(ua)) return false;
  }

  // Check against known bot patterns
  for (const pattern of BOT_USER_AGENT_PATTERNS) {
    if (pattern.test(ua)) return true;
  }

  return false;
}

/**
 * Compute a suspicion score based on missing browser-standard headers.
 * Real browsers always send Accept, Accept-Language, Accept-Encoding.
 * Automated tools often omit them.
 */
export function computeSuspicionScore(headers: Headers): number {
  let score = 0;

  if (!headers.get("accept")) score++;
  if (!headers.get("accept-language")) score++;
  if (!headers.get("accept-encoding")) score++;
  if (!headers.get("sec-fetch-mode")) score++;

  return score;
}
