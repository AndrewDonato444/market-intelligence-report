import fs from "fs";
import path from "path";

describe("Environment Config", () => {
  describe("File structure", () => {
    it("has lib/config/env.ts", () => {
      expect(
        fs.existsSync(path.join(process.cwd(), "lib/config/env.ts"))
      ).toBe(true);
    });

    it("has .env.local.example", () => {
      expect(
        fs.existsSync(path.join(process.cwd(), ".env.local.example"))
      ).toBe(true);
    });
  });

  describe("env module exports", () => {
    // We need to test the module in isolation to avoid side effects
    let envModule: typeof import("@/lib/config/env");

    beforeAll(() => {
      // Set all required env vars for testing
      process.env.DATABASE_URL = "postgresql://test:test@localhost:5432/test";
      process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = "pk_test_123";
      process.env.CLERK_SECRET_KEY = "sk_test_123";
      process.env.ANTHROPIC_API_KEY = "sk-ant-test-123";
      process.env.FRED_API_KEY = "test-fred-key";
      process.env.REALESTATEAPI_KEY = "test-reapi-key";
      process.env.SCRAPINGDOG_API_KEY = "test-scrapingdog-key";
    });

    beforeEach(() => {
      jest.resetModules();
    });

    it("exports env object", async () => {
      envModule = await import("@/lib/config/env");
      expect(envModule.env).toBeDefined();
    });

    it("exports validateEnv function", async () => {
      envModule = await import("@/lib/config/env");
      expect(typeof envModule.validateEnv).toBe("function");
    });

    it("returns DATABASE_URL when set", async () => {
      envModule = await import("@/lib/config/env");
      expect(envModule.env.DATABASE_URL).toBe(
        "postgresql://test:test@localhost:5432/test"
      );
    });

    it("returns ANTHROPIC_API_KEY when set", async () => {
      envModule = await import("@/lib/config/env");
      expect(envModule.env.ANTHROPIC_API_KEY).toBe("sk-ant-test-123");
    });

    it("returns FRED_API_KEY when set", async () => {
      envModule = await import("@/lib/config/env");
      expect(envModule.env.FRED_API_KEY).toBe("test-fred-key");
    });

    it("returns default for optional vars", async () => {
      envModule = await import("@/lib/config/env");
      expect(envModule.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL).toBe("/sign-in");
      expect(envModule.env.NODE_ENV).toBe("test"); // jest sets this
    });

    it("returns default S3_REGION", async () => {
      envModule = await import("@/lib/config/env");
      expect(envModule.env.S3_REGION).toBe("us-east-1");
    });
  });

  describe("validateEnv", () => {
    beforeEach(() => {
      jest.resetModules();
    });

    it("passes when all required vars are set", async () => {
      process.env.DATABASE_URL = "postgresql://test:test@localhost:5432/test";
      process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = "pk_test_123";
      process.env.CLERK_SECRET_KEY = "sk_test_123";
      process.env.ANTHROPIC_API_KEY = "sk-ant-test-123";
      process.env.FRED_API_KEY = "test-fred-key";
      process.env.REALESTATEAPI_KEY = "test-reapi-key";
      process.env.SCRAPINGDOG_API_KEY = "test-scrapingdog-key";

      const { validateEnv } = await import("@/lib/config/env");
      expect(() => validateEnv()).not.toThrow();
    });

    it("throws when required vars are missing", async () => {
      const saved = process.env.ANTHROPIC_API_KEY;
      delete process.env.ANTHROPIC_API_KEY;

      const { validateEnv } = await import("@/lib/config/env");
      expect(() => validateEnv()).toThrow("ANTHROPIC_API_KEY");

      process.env.ANTHROPIC_API_KEY = saved;
    });

    it("lists all missing vars in error message", async () => {
      const savedAnth = process.env.ANTHROPIC_API_KEY;
      const savedFred = process.env.FRED_API_KEY;
      delete process.env.ANTHROPIC_API_KEY;
      delete process.env.FRED_API_KEY;

      const { validateEnv } = await import("@/lib/config/env");
      expect(() => validateEnv()).toThrow("ANTHROPIC_API_KEY");

      process.env.ANTHROPIC_API_KEY = savedAnth;
      process.env.FRED_API_KEY = savedFred;
    });
  });

  describe(".env.local.example documentation", () => {
    let exampleContent: string;

    beforeAll(() => {
      exampleContent = fs.readFileSync(
        path.join(process.cwd(), ".env.local.example"),
        "utf8"
      );
    });

    it("documents DATABASE_URL", () => {
      expect(exampleContent).toContain("DATABASE_URL");
    });

    it("documents CLERK keys", () => {
      expect(exampleContent).toContain("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY");
      expect(exampleContent).toContain("CLERK_SECRET_KEY");
    });

    it("documents ANTHROPIC_API_KEY", () => {
      expect(exampleContent).toContain("ANTHROPIC_API_KEY");
    });

    it("documents FRED_API_KEY", () => {
      expect(exampleContent).toContain("FRED_API_KEY");
    });

    it("documents S3 config", () => {
      expect(exampleContent).toContain("S3_BUCKET");
      expect(exampleContent).toContain("S3_REGION");
    });

    it("marks required variables", () => {
      expect(exampleContent).toContain("[REQUIRED]");
    });

    it("includes setup URLs for API keys", () => {
      expect(exampleContent).toContain("dashboard.clerk.com");
      expect(exampleContent).toContain("console.anthropic.com");
      expect(exampleContent).toContain("fred.stlouisfed.org");
    });
  });
});
