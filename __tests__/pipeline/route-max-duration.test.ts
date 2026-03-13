/**
 * Route maxDuration Export Tests
 *
 * Regression: Vercel kills fire-and-forget pipeline execution when
 * the route handler's default timeout (15-60s) expires. Pipeline
 * needs several minutes for data fetch + Claude agent calls.
 *
 * These tests verify that routes which trigger pipeline execution
 * export maxDuration so Vercel allows sufficient execution time.
 *
 * ID: SVC-REAP-003 through SVC-REAP-005
 *
 * @jest-environment node
 */

// We read the actual source files to check for maxDuration exports
// rather than importing (which would trigger all module deps).

import { readFileSync } from "fs";
import { join } from "path";

function routeSource(routePath: string): string {
  return readFileSync(join(process.cwd(), routePath), "utf-8");
}

describe("Pipeline route maxDuration exports", () => {
  it("SVC-REAP-003: Regression — POST /api/reports exports maxDuration >= 300", () => {
    const src = routeSource("app/api/reports/route.ts");
    const match = src.match(/export\s+const\s+maxDuration\s*=\s*(\d+)/);
    expect(match).not.toBeNull();
    expect(Number(match![1])).toBeGreaterThanOrEqual(300);
  });

  it("SVC-REAP-004: Regression — POST /api/admin/reports/[id]/retry exports maxDuration >= 300", () => {
    const src = routeSource("app/api/admin/reports/[id]/retry/route.ts");
    const match = src.match(/export\s+const\s+maxDuration\s*=\s*(\d+)/);
    expect(match).not.toBeNull();
    expect(Number(match![1])).toBeGreaterThanOrEqual(300);
  });

  it("SVC-REAP-005: Regression — admin report detail route calls reapStaleReports", () => {
    const src = routeSource("app/api/admin/reports/[id]/route.ts");
    expect(src).toContain("reapStaleReports");
  });
});
