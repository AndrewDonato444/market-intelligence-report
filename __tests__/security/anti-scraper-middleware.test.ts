import fs from "fs";
import path from "path";

describe("Anti-Scraper Middleware", () => {
  describe("SVC: Anti-scraper module (lib/security/anti-scraper.ts)", () => {
    let moduleContent: string;

    beforeAll(() => {
      moduleContent = fs.readFileSync(
        path.join(process.cwd(), "lib/security/anti-scraper.ts"),
        "utf8"
      );
    });

    it("SVC-SCRAPER-001: exports isBlockedUserAgent function", () => {
      expect(moduleContent).toContain(
        "export function isBlockedUserAgent"
      );
    });

    it("SVC-SCRAPER-002: exports computeSuspicionScore function", () => {
      expect(moduleContent).toContain(
        "export function computeSuspicionScore"
      );
    });

    it("SVC-SCRAPER-003: exports SUSPICION_THRESHOLD constant", () => {
      expect(moduleContent).toContain("export const SUSPICION_THRESHOLD");
    });

    it("SVC-SCRAPER-004: exports BOT_USER_AGENT_PATTERNS array", () => {
      expect(moduleContent).toContain("export const BOT_USER_AGENT_PATTERNS");
    });

    it("SVC-SCRAPER-005: exports isExemptRoute function", () => {
      expect(moduleContent).toContain("export function isExemptRoute");
    });

    it("SVC-SCRAPER-005b: exports blockIp function", () => {
      expect(moduleContent).toContain("export function blockIp");
    });

    it("SVC-SCRAPER-005c: exports isBlockedIp function", () => {
      expect(moduleContent).toContain("export function isBlockedIp");
    });

    it("SVC-SCRAPER-005d: exports resetBlockedIps function", () => {
      expect(moduleContent).toContain("export function resetBlockedIps");
    });

    it("SVC-SCRAPER-005e: exports getBlockedIpCount function", () => {
      expect(moduleContent).toContain("export function getBlockedIpCount");
    });

    it("SVC-SCRAPER-006: blocks python-requests user-agent", () => {
      expect(moduleContent).toContain("python-requests");
    });

    it("SVC-SCRAPER-007: blocks HeadlessChrome user-agent", () => {
      expect(moduleContent).toContain("HeadlessChrome");
    });

    it("SVC-SCRAPER-008: blocks curl user-agent", () => {
      expect(moduleContent).toMatch(/curl/);
    });

    it("SVC-SCRAPER-009: blocks scrapy user-agent", () => {
      expect(moduleContent).toContain("scrapy");
    });

    it("SVC-SCRAPER-010: blocks empty/missing user-agent", () => {
      // The function should return true (blocked) for null/empty UA
      expect(moduleContent).toContain('ua.trim() === ""');
      expect(moduleContent).toContain("!ua");
    });

    it("SVC-SCRAPER-011: allows Googlebot (legitimate search bot)", () => {
      expect(moduleContent).toContain("Googlebot");
    });

    it("SVC-SCRAPER-012: allows Bingbot (legitimate search bot)", () => {
      expect(moduleContent).toContain("Bingbot");
    });

    it("SVC-SCRAPER-013: checks Accept header for fingerprinting", () => {
      expect(moduleContent).toContain('"accept"');
    });

    it("SVC-SCRAPER-014: checks Accept-Language header for fingerprinting", () => {
      expect(moduleContent).toContain('"accept-language"');
    });

    it("SVC-SCRAPER-015: checks Accept-Encoding header for fingerprinting", () => {
      expect(moduleContent).toContain('"accept-encoding"');
    });

    it("SVC-SCRAPER-016: checks Sec-Fetch-Mode header for fingerprinting", () => {
      expect(moduleContent).toContain('"sec-fetch-mode"');
    });

    it("SVC-SCRAPER-017: exempts _next static routes", () => {
      expect(moduleContent).toContain("/_next");
    });

    it("SVC-SCRAPER-018: exempts /api/health route", () => {
      expect(moduleContent).toContain("/api/health");
    });

    it("SVC-SCRAPER-019: exempts /api/webhooks routes", () => {
      expect(moduleContent).toContain("/api/webhooks");
    });

    it("SVC-SCRAPER-020: SUSPICION_THRESHOLD defaults to 2", () => {
      expect(moduleContent).toContain("SUSPICION_THRESHOLD = 2");
    });

    it("SVC-SCRAPER-021: IP blocklist has a 1-hour TTL", () => {
      expect(moduleContent).toContain("BLOCKLIST_TTL_MS");
      expect(moduleContent).toContain("60 * 60 * 1000");
    });
  });

  describe("SVC: Anti-scraper logic (unit tests)", () => {
    let isBlockedUserAgent: (ua: string | null) => boolean;
    let computeSuspicionScore: (headers: Headers) => number;
    let isExemptRoute: (pathname: string) => boolean;
    let isBlockedIp: (ip: string) => boolean;
    let blockIp: (ip: string) => void;
    let resetBlockedIps: () => void;
    let getBlockedIpCount: () => number;
    let SUSPICION_THRESHOLD: number;

    beforeAll(async () => {
      const mod = await import("@/lib/security/anti-scraper");
      isBlockedUserAgent = mod.isBlockedUserAgent;
      computeSuspicionScore = mod.computeSuspicionScore;
      isExemptRoute = mod.isExemptRoute;
      isBlockedIp = mod.isBlockedIp;
      blockIp = mod.blockIp;
      resetBlockedIps = mod.resetBlockedIps;
      getBlockedIpCount = mod.getBlockedIpCount;
      SUSPICION_THRESHOLD = mod.SUSPICION_THRESHOLD;
    });

    beforeEach(() => {
      resetBlockedIps();
    });

    // --- isBlockedUserAgent ---

    it("SVC-SCRAPER-030: blocks null user-agent", () => {
      expect(isBlockedUserAgent(null)).toBe(true);
    });

    it("SVC-SCRAPER-031: blocks empty string user-agent", () => {
      expect(isBlockedUserAgent("")).toBe(true);
    });

    it("SVC-SCRAPER-032: blocks whitespace-only user-agent", () => {
      expect(isBlockedUserAgent("   ")).toBe(true);
    });

    it("SVC-SCRAPER-033: blocks python-requests UA", () => {
      expect(isBlockedUserAgent("python-requests/2.28.0")).toBe(true);
    });

    it("SVC-SCRAPER-034: blocks HeadlessChrome UA", () => {
      expect(
        isBlockedUserAgent(
          "Mozilla/5.0 (X11; Linux x86_64) HeadlessChrome/91.0.4472.114"
        )
      ).toBe(true);
    });

    it("SVC-SCRAPER-035: blocks curl UA", () => {
      expect(isBlockedUserAgent("curl/7.68.0")).toBe(true);
    });

    it("SVC-SCRAPER-036: blocks wget UA", () => {
      expect(isBlockedUserAgent("Wget/1.21")).toBe(true);
    });

    it("SVC-SCRAPER-037: blocks generic bot UA", () => {
      expect(isBlockedUserAgent("SomeRandomBot/1.0")).toBe(true);
    });

    it("SVC-SCRAPER-038: blocks scrapy UA", () => {
      expect(isBlockedUserAgent("Scrapy/2.5.0")).toBe(true);
    });

    it("SVC-SCRAPER-039: allows normal Chrome UA", () => {
      expect(
        isBlockedUserAgent(
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        )
      ).toBe(false);
    });

    it("SVC-SCRAPER-040: allows normal Firefox UA", () => {
      expect(
        isBlockedUserAgent(
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0"
        )
      ).toBe(false);
    });

    it("SVC-SCRAPER-041: allows normal Safari UA", () => {
      expect(
        isBlockedUserAgent(
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_1) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15"
        )
      ).toBe(false);
    });

    it("SVC-SCRAPER-042: allows Googlebot", () => {
      expect(
        isBlockedUserAgent(
          "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)"
        )
      ).toBe(false);
    });

    it("SVC-SCRAPER-043: allows Bingbot", () => {
      expect(
        isBlockedUserAgent(
          "Mozilla/5.0 (compatible; Bingbot/2.0; +http://www.bing.com/bingbot.htm)"
        )
      ).toBe(false);
    });

    // --- computeSuspicionScore ---

    it("SVC-SCRAPER-050: returns 0 for headers with all standard fields", () => {
      const headers = new Headers({
        accept: "text/html",
        "accept-language": "en-US",
        "accept-encoding": "gzip",
        "sec-fetch-mode": "navigate",
      });
      expect(computeSuspicionScore(headers)).toBe(0);
    });

    it("SVC-SCRAPER-051: returns 4 for completely empty headers", () => {
      const headers = new Headers();
      expect(computeSuspicionScore(headers)).toBe(4);
    });

    it("SVC-SCRAPER-052: returns 1 for one missing header", () => {
      const headers = new Headers({
        accept: "text/html",
        "accept-language": "en-US",
        "accept-encoding": "gzip",
        // missing sec-fetch-mode
      });
      expect(computeSuspicionScore(headers)).toBe(1);
    });

    it("SVC-SCRAPER-053: returns 2 for two missing headers (at threshold)", () => {
      const headers = new Headers({
        accept: "text/html",
        "accept-language": "en-US",
        // missing accept-encoding and sec-fetch-mode
      });
      expect(computeSuspicionScore(headers)).toBe(2);
    });

    it("SVC-SCRAPER-054: SUSPICION_THRESHOLD is 2", () => {
      expect(SUSPICION_THRESHOLD).toBe(2);
    });

    // --- isExemptRoute ---

    it("SVC-SCRAPER-060: exempts /_next/static paths", () => {
      expect(isExemptRoute("/_next/static/chunks/main.js")).toBe(true);
    });

    it("SVC-SCRAPER-061: exempts /api/health", () => {
      expect(isExemptRoute("/api/health")).toBe(true);
    });

    it("SVC-SCRAPER-062: exempts /api/webhooks/stripe", () => {
      expect(isExemptRoute("/api/webhooks/stripe")).toBe(true);
    });

    it("SVC-SCRAPER-063: exempts file extensions (.css, .js, .png)", () => {
      expect(isExemptRoute("/styles/main.css")).toBe(true);
      expect(isExemptRoute("/script.js")).toBe(true);
      expect(isExemptRoute("/logo.png")).toBe(true);
    });

    it("SVC-SCRAPER-064: does NOT exempt /dashboard", () => {
      expect(isExemptRoute("/dashboard")).toBe(false);
    });

    it("SVC-SCRAPER-065: does NOT exempt /api/reports", () => {
      expect(isExemptRoute("/api/reports")).toBe(false);
    });

    it("SVC-SCRAPER-066: does NOT exempt /api/honeypot", () => {
      expect(isExemptRoute("/api/honeypot")).toBe(false);
    });

    // --- IP blocklist (honeypot integration) ---

    it("SVC-SCRAPER-070: blockIp adds IP to blocklist", () => {
      expect(isBlockedIp("10.0.0.1")).toBe(false);
      blockIp("10.0.0.1");
      expect(isBlockedIp("10.0.0.1")).toBe(true);
    });

    it("SVC-SCRAPER-071: isBlockedIp returns false for unknown IPs", () => {
      expect(isBlockedIp("192.168.1.1")).toBe(false);
    });

    it("SVC-SCRAPER-072: resetBlockedIps clears all entries", () => {
      blockIp("10.0.0.1");
      blockIp("10.0.0.2");
      expect(getBlockedIpCount()).toBe(2);
      resetBlockedIps();
      expect(getBlockedIpCount()).toBe(0);
    });

    it("SVC-SCRAPER-073: getBlockedIpCount tracks active blocks", () => {
      expect(getBlockedIpCount()).toBe(0);
      blockIp("10.0.0.1");
      expect(getBlockedIpCount()).toBe(1);
      blockIp("10.0.0.2");
      expect(getBlockedIpCount()).toBe(2);
    });

    it("SVC-SCRAPER-074: multiple blockIp calls for same IP don't duplicate", () => {
      blockIp("10.0.0.1");
      blockIp("10.0.0.1");
      blockIp("10.0.0.1");
      expect(getBlockedIpCount()).toBe(1);
    });
  });

  describe("Integration: Middleware imports anti-scraper", () => {
    let middlewareContent: string;

    beforeAll(() => {
      middlewareContent = fs.readFileSync(
        path.join(process.cwd(), "lib/supabase/middleware.ts"),
        "utf8"
      );
    });

    it("MW-SCRAPER-001: imports isBlockedUserAgent", () => {
      expect(middlewareContent).toContain("isBlockedUserAgent");
    });

    it("MW-SCRAPER-001b: imports isBlockedIp", () => {
      expect(middlewareContent).toContain("isBlockedIp");
    });

    it("MW-SCRAPER-002: imports computeSuspicionScore", () => {
      expect(middlewareContent).toContain("computeSuspicionScore");
    });

    it("MW-SCRAPER-003: imports isExemptRoute", () => {
      expect(middlewareContent).toContain("isExemptRoute");
    });

    it("MW-SCRAPER-004: imports SUSPICION_THRESHOLD", () => {
      expect(middlewareContent).toContain("SUSPICION_THRESHOLD");
    });

    it("MW-SCRAPER-005: returns 403 Forbidden for blocked requests", () => {
      expect(middlewareContent).toContain('"Forbidden"');
      expect(middlewareContent).toContain("403");
    });

    it("MW-SCRAPER-006: anti-scraper runs before Supabase session check", () => {
      // Look for function calls (with parens), not imports
      const scraperIndex = middlewareContent.indexOf("isBlockedUserAgent(");
      const supabaseIndex = middlewareContent.indexOf("createServerClient(");
      expect(scraperIndex).toBeGreaterThan(-1);
      expect(supabaseIndex).toBeGreaterThan(-1);
      expect(scraperIndex).toBeLessThan(supabaseIndex);
    });

    it("MW-SCRAPER-007: checks exempt routes before blocking", () => {
      // Look for function calls (with parens), not imports
      const exemptIndex = middlewareContent.indexOf("isExemptRoute(");
      const blockIndex = middlewareContent.indexOf("isBlockedUserAgent(");
      expect(exemptIndex).toBeLessThan(blockIndex);
    });

    it("MW-SCRAPER-008: checks IP blocklist before UA check", () => {
      const ipBlockIndex = middlewareContent.indexOf("isBlockedIp(");
      const uaBlockIndex = middlewareContent.indexOf("isBlockedUserAgent(");
      expect(ipBlockIndex).toBeGreaterThan(-1);
      expect(uaBlockIndex).toBeGreaterThan(-1);
      expect(ipBlockIndex).toBeLessThan(uaBlockIndex);
    });
  });

  describe("API: Honeypot route (/api/honeypot)", () => {
    let routeContent: string;

    beforeAll(() => {
      routeContent = fs.readFileSync(
        path.join(process.cwd(), "app/api/honeypot/route.ts"),
        "utf8"
      );
    });

    it("API-HONEYPOT-001: exports GET handler", () => {
      expect(routeContent).toContain("export async function GET");
    });

    it("API-HONEYPOT-002: exports POST handler", () => {
      expect(routeContent).toContain("export async function POST");
    });

    it("API-HONEYPOT-003: returns 204 status", () => {
      expect(routeContent).toContain("204");
    });

    it("API-HONEYPOT-004: logs IP address of requester", () => {
      expect(routeContent).toContain("x-forwarded-for");
      expect(routeContent).toContain("console.warn");
    });

    it("API-HONEYPOT-005: logs user-agent of requester", () => {
      expect(routeContent).toContain("user-agent");
    });

    it("API-HONEYPOT-006: contains honeypot identification in log", () => {
      expect(routeContent).toContain("[honeypot]");
    });

    it("API-HONEYPOT-007: calls blockIp to add IP to blocklist", () => {
      expect(routeContent).toContain("blockIp(");
    });

    it("API-HONEYPOT-008: imports blockIp from anti-scraper", () => {
      expect(routeContent).toContain("blockIp");
      expect(routeContent).toContain("@/lib/security/anti-scraper");
    });

    it("API-HONEYPOT-009: skips blocking for unknown IPs", () => {
      expect(routeContent).toContain('"unknown"');
    });
  });

  describe("Security: barrel export includes anti-scraper", () => {
    it("lib/security/index.ts exports anti-scraper functions", () => {
      const content = fs.readFileSync(
        path.join(process.cwd(), "lib/security/index.ts"),
        "utf8"
      );
      expect(content).toContain("isBlockedUserAgent");
      expect(content).toContain("isBlockedIp");
      expect(content).toContain("blockIp");
      expect(content).toContain("resetBlockedIps");
      expect(content).toContain("getBlockedIpCount");
      expect(content).toContain("computeSuspicionScore");
      expect(content).toContain("isExemptRoute");
      expect(content).toContain("SUSPICION_THRESHOLD");
      expect(content).toContain("BOT_USER_AGENT_PATTERNS");
    });
  });
});
