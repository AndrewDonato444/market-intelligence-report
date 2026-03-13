/**
 * Data Source Registry — pluggable connector management with health checks.
 *
 * Provides a standard interface for all external data connectors,
 * runtime health checking, and serialization for admin UI.
 */

import { SOURCE_TTLS } from "@/lib/services/cache";

// --- Types ---

export type ConnectorStatus = "healthy" | "degraded" | "unhealthy" | "unknown";

export interface ConnectorHealth {
  status: ConnectorStatus;
  latencyMs: number;
  lastChecked: Date;
  error?: string;
}

export interface DataSourceConnector {
  name: string;
  description: string;
  endpoints: string[];
  cacheTtlSeconds: number;
  requiredEnvVars: string[];
  /** Runs a lightweight check to verify the connector can reach its API. */
  healthCheck: () => Promise<ConnectorHealth>;
}

export interface DataSourceSnapshot {
  name: string;
  description: string;
  endpoints: string[];
  cacheTtlSeconds: number;
  requiredEnvVars: string[];
  envVarsPresent: boolean;
  health: ConnectorHealth | null;
}

// --- Registry ---

export class DataSourceRegistry {
  private connectors = new Map<string, DataSourceConnector>();
  private healthCache = new Map<string, ConnectorHealth>();

  register(connector: DataSourceConnector): void {
    this.connectors.set(connector.name, connector);
  }

  get(name: string): DataSourceConnector | undefined {
    return this.connectors.get(name);
  }

  getAll(): DataSourceConnector[] {
    return Array.from(this.connectors.values());
  }

  async checkHealth(name: string): Promise<ConnectorHealth | null> {
    const connector = this.connectors.get(name);
    if (!connector) return null;

    try {
      const health = await connector.healthCheck();
      this.healthCache.set(name, health);
      return health;
    } catch (err) {
      const health: ConnectorHealth = {
        status: "unhealthy",
        latencyMs: 0,
        lastChecked: new Date(),
        error: err instanceof Error ? err.message : String(err),
      };
      this.healthCache.set(name, health);
      return health;
    }
  }

  async checkAllHealth(): Promise<Record<string, ConnectorHealth>> {
    const results: Record<string, ConnectorHealth> = {};
    for (const connector of this.connectors.values()) {
      const health = await this.checkHealth(connector.name);
      if (health) results[connector.name] = health;
    }
    return results;
  }

  getHealthSnapshot(name: string): ConnectorHealth | null {
    return this.healthCache.get(name) ?? null;
  }

  envVarsPresent(name: string): boolean {
    const connector = this.connectors.get(name);
    if (!connector) return false;
    return connector.requiredEnvVars.every((v) => !!process.env[v]);
  }

  toJSON(): DataSourceSnapshot[] {
    return this.getAll().map((c) => ({
      name: c.name,
      description: c.description,
      endpoints: c.endpoints,
      cacheTtlSeconds: c.cacheTtlSeconds,
      requiredEnvVars: c.requiredEnvVars,
      envVarsPresent: this.envVarsPresent(c.name),
      health: this.healthCache.get(c.name) ?? null,
    }));
  }
}

// --- Built-in connector definitions ---

function makeRealEstateApiConnector(): DataSourceConnector {
  return {
    name: "realestateapi",
    description: "Property search, detail, comps, and valuations for 157M+ US properties",
    endpoints: ["/v2/PropertySearch", "/v2/PropertyDetail", "/v3/PropertyComps"],
    cacheTtlSeconds: SOURCE_TTLS.realestateapi ?? 86400,
    requiredEnvVars: ["REALESTATEAPI_KEY"],
    healthCheck: async () => {
      const start = Date.now();
      const apiKey = process.env.REALESTATEAPI_KEY;

      if (!apiKey) {
        return {
          status: "degraded",
          latencyMs: 0,
          lastChecked: new Date(),
          error: "Missing REALESTATEAPI_KEY environment variable",
        };
      }

      const res = await fetch("https://api.realestateapi.com/v2/PropertySearch", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
        },
        body: JSON.stringify({ city: "Naples", state: "FL", limit: 1 }),
      });

      const latencyMs = Date.now() - start;

      if (!res.ok) {
        return {
          status: "unhealthy",
          latencyMs,
          lastChecked: new Date(),
          error: `API returned ${res.status}: ${res.statusText}`,
        };
      }

      return { status: "healthy", latencyMs, lastChecked: new Date() };
    },
  };
}

function makeScrapingDogConnector(): DataSourceConnector {
  return {
    name: "scrapingdog",
    description: "Neighborhood intelligence — local amenities, business listings, area context",
    endpoints: ["/google_local", "/scrape"],
    cacheTtlSeconds: SOURCE_TTLS.scrapingdog ?? 604800,
    requiredEnvVars: ["SCRAPINGDOG_API_KEY"],
    healthCheck: async () => {
      const start = Date.now();
      const apiKey = process.env.SCRAPINGDOG_API_KEY;

      if (!apiKey) {
        return {
          status: "degraded",
          latencyMs: 0,
          lastChecked: new Date(),
          error: "Missing SCRAPINGDOG_API_KEY environment variable",
        };
      }

      const url = new URL("https://api.scrapingdog.com/google_local");
      url.searchParams.set("api_key", apiKey);
      url.searchParams.set("query", "test");
      url.searchParams.set("page", "0");

      const res = await fetch(url.toString());
      const latencyMs = Date.now() - start;

      if (!res.ok) {
        return {
          status: "unhealthy",
          latencyMs,
          lastChecked: new Date(),
          error: `API returned ${res.status}: ${res.statusText}`,
        };
      }

      // ScrapingDog returns 200 with { success: false } for auth errors
      const body = await res.json();
      if (body.success === false) {
        return {
          status: "unhealthy",
          latencyMs,
          lastChecked: new Date(),
          error: "API key unauthorized — check plan/credits",
        };
      }

      return { status: "healthy", latencyMs, lastChecked: new Date() };
    },
  };
}

function makeGrokConnector(): DataSourceConnector {
  return {
    name: "grok",
    description: "X social sentiment via Grok x_search — real-time market intelligence from X posts",
    endpoints: ["/v1/responses (x_search)"],
    cacheTtlSeconds: SOURCE_TTLS.grok ?? 604800,
    requiredEnvVars: ["XAI_API_KEY"],
    healthCheck: async () => {
      const start = Date.now();
      const apiKey = process.env.XAI_API_KEY;

      if (!apiKey) {
        return {
          status: "degraded",
          latencyMs: 0,
          lastChecked: new Date(),
          error: "Missing XAI_API_KEY environment variable (optional)",
        };
      }

      // Lightweight check: call the API with a minimal prompt (no x_search tool)
      // to verify auth without consuming x_search credits
      try {
        const res = await fetch("https://api.x.ai/v1/responses", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: "grok-4",
            input: [{ role: "user", content: "ping" }],
            max_output_tokens: 10,
          }),
        });

        const latencyMs = Date.now() - start;

        if (!res.ok) {
          return {
            status: "unhealthy",
            latencyMs,
            lastChecked: new Date(),
            error: `API returned ${res.status}: ${res.statusText}`,
          };
        }

        return { status: "healthy", latencyMs, lastChecked: new Date() };
      } catch (err) {
        return {
          status: "unhealthy",
          latencyMs: Date.now() - start,
          lastChecked: new Date(),
          error: err instanceof Error ? err.message : String(err),
        };
      }
    },
  };
}

// --- Default registry singleton ---

export const registry = new DataSourceRegistry();
registry.register(makeRealEstateApiConnector());
registry.register(makeScrapingDogConnector());
registry.register(makeGrokConnector());
