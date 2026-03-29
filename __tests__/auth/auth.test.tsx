import fs from "fs";
import path from "path";

describe("Authentication with Supabase", () => {
  describe("File structure", () => {
    it("has proxy.ts for route protection", () => {
      expect(
        fs.existsSync(path.join(process.cwd(), "proxy.ts"))
      ).toBe(true);
    });

    it("has sign-in page", () => {
      expect(
        fs.existsSync(
          path.join(
            process.cwd(),
            "app/(auth)/sign-in/[[...sign-in]]/page.tsx"
          )
        )
      ).toBe(true);
    });

    it("has sign-up page", () => {
      expect(
        fs.existsSync(
          path.join(
            process.cwd(),
            "app/(auth)/sign-up/[[...sign-up]]/page.tsx"
          )
        )
      ).toBe(true);
    });

    it("has auth layout", () => {
      expect(
        fs.existsSync(path.join(process.cwd(), "app/(auth)/layout.tsx"))
      ).toBe(true);
    });

    it("has protected layout", () => {
      expect(
        fs.existsSync(
          path.join(process.cwd(), "app/(protected)/layout.tsx")
        )
      ).toBe(true);
    });

    it("has dashboard page in protected route", () => {
      expect(
        fs.existsSync(
          path.join(
            process.cwd(),
            "app/(protected)/dashboard/page.tsx"
          )
        )
      ).toBe(true);
    });

    it("has Supabase server client helper", () => {
      expect(
        fs.existsSync(path.join(process.cwd(), "lib/supabase/server.ts"))
      ).toBe(true);
    });

    it("has Supabase browser client helper", () => {
      expect(
        fs.existsSync(path.join(process.cwd(), "lib/supabase/client.ts"))
      ).toBe(true);
    });

    it("has Supabase middleware helper", () => {
      expect(
        fs.existsSync(path.join(process.cwd(), "lib/supabase/middleware.ts"))
      ).toBe(true);
    });
  });

  describe("Proxy configuration", () => {
    let proxyContent: string;

    beforeAll(() => {
      proxyContent = fs.readFileSync(
        path.join(process.cwd(), "proxy.ts"),
        "utf8"
      );
    });

    it("imports Supabase middleware helper", () => {
      expect(proxyContent).toContain("updateSession");
    });

    it("exports matcher config", () => {
      expect(proxyContent).toContain("export const config");
      expect(proxyContent).toContain("matcher");
    });
  });

  describe("Root layout does not use Clerk", () => {
    let layoutContent: string;

    beforeAll(() => {
      layoutContent = fs.readFileSync(
        path.join(process.cwd(), "app/layout.tsx"),
        "utf8"
      );
    });

    it("does not import ClerkProvider", () => {
      expect(layoutContent).not.toContain("ClerkProvider");
    });

    it("does not import from @clerk", () => {
      expect(layoutContent).not.toContain("@clerk");
    });
  });

  describe("Sign-in page uses server API route with Turnstile", () => {
    let signInContent: string;

    beforeAll(() => {
      signInContent = fs.readFileSync(
        path.join(
          process.cwd(),
          "app/(auth)/sign-in/[[...sign-in]]/page.tsx"
        ),
        "utf8"
      );
    });

    it("calls the server-side signin API route", () => {
      expect(signInContent).toContain("/api/auth/signin");
    });

    it("includes TurnstileWidget", () => {
      expect(signInContent).toContain("TurnstileWidget");
    });

    it("sends turnstileToken in the request", () => {
      expect(signInContent).toContain("turnstileToken");
    });
  });

  describe("Sign-up page uses server API route with Turnstile", () => {
    let signUpContent: string;

    beforeAll(() => {
      signUpContent = fs.readFileSync(
        path.join(
          process.cwd(),
          "app/(auth)/sign-up/[[...sign-up]]/page.tsx"
        ),
        "utf8"
      );
    });

    it("calls the server-side signup API route", () => {
      expect(signUpContent).toContain("/api/auth/signup");
    });

    it("includes TurnstileWidget", () => {
      expect(signUpContent).toContain("TurnstileWidget");
    });

    it("sends turnstileToken in the request", () => {
      expect(signUpContent).toContain("turnstileToken");
    });
  });

  describe("Package dependencies", () => {
    let packageJson: Record<string, Record<string, string>>;

    beforeAll(() => {
      packageJson = JSON.parse(
        fs.readFileSync(
          path.join(process.cwd(), "package.json"),
          "utf8"
        )
      );
    });

    it("has @supabase/ssr as dependency", () => {
      expect(packageJson.dependencies["@supabase/ssr"]).toBeDefined();
    });

    it("has @supabase/supabase-js as dependency", () => {
      expect(packageJson.dependencies["@supabase/supabase-js"]).toBeDefined();
    });

    it("does not have @clerk/nextjs as dependency", () => {
      expect(packageJson.dependencies["@clerk/nextjs"]).toBeUndefined();
    });
  });
});
