/**
 * Regression tests for admin data-sources route auth.
 *
 * Bug: GET and POST /api/admin/data-sources had no requireAdmin() check,
 * meaning any authenticated (or unauthenticated) user could access admin
 * data-source endpoints.
 *
 * Fix: Added requireAdmin() to both handlers, returning 403 for non-admins.
 */
import fs from "fs";
import path from "path";

describe("Admin Data Sources Route — Auth (Regression)", () => {
  const routePath = path.join(
    process.cwd(),
    "app/api/admin/data-sources/route.ts"
  );

  it("API-DSR-R1: route file exists", () => {
    expect(fs.existsSync(routePath)).toBe(true);
  });

  it("API-DSR-R2: Regression: route imports requireAdmin", () => {
    const content = fs.readFileSync(routePath, "utf-8");
    expect(content).toContain('import { requireAdmin }');
  });

  it("API-DSR-R3: Regression: GET handler calls requireAdmin", () => {
    const content = fs.readFileSync(routePath, "utf-8");
    // Extract the GET function body
    const getMatch = content.match(
      /export async function GET\b[\s\S]*?^}/m
    );
    expect(getMatch).toBeTruthy();
    expect(getMatch![0]).toContain("requireAdmin()");
  });

  it("API-DSR-R4: Regression: GET handler returns 403 for non-admin", () => {
    const content = fs.readFileSync(routePath, "utf-8");
    const getMatch = content.match(
      /export async function GET\b[\s\S]*?^}/m
    );
    expect(getMatch).toBeTruthy();
    expect(getMatch![0]).toContain("403");
  });

  it("API-DSR-R5: Regression: POST handler calls requireAdmin", () => {
    const content = fs.readFileSync(routePath, "utf-8");
    // Extract everything from "export async function POST" onwards
    const postMatch = content.match(
      /export async function POST\b[\s\S]*/
    );
    expect(postMatch).toBeTruthy();
    expect(postMatch![0]).toContain("requireAdmin()");
  });

  it("API-DSR-R6: Regression: POST handler returns 403 for non-admin", () => {
    const content = fs.readFileSync(routePath, "utf-8");
    const postMatch = content.match(
      /export async function POST\b[\s\S]*/
    );
    expect(postMatch).toBeTruthy();
    expect(postMatch![0]).toContain("403");
  });
});
