import fs from "fs";
import path from "path";

describe("Anti-Bot Protection: Cloudflare Turnstile", () => {
  describe("SVC: Server-side token verification utility", () => {
    let verifyModule: string;

    beforeAll(() => {
      verifyModule = fs.readFileSync(
        path.join(process.cwd(), "lib/security/verify-turnstile.ts"),
        "utf8"
      );
    });

    it("SVC-TURNSTILE-001: exports verifyTurnstileToken function", () => {
      expect(verifyModule).toContain("export async function verifyTurnstileToken");
    });

    it("SVC-TURNSTILE-002: posts to Cloudflare siteverify endpoint", () => {
      expect(verifyModule).toContain(
        "challenges.cloudflare.com/turnstile/v0/siteverify"
      );
    });

    it("SVC-TURNSTILE-003: uses TURNSTILE_SECRET_KEY env var", () => {
      expect(verifyModule).toContain("TURNSTILE_SECRET_KEY");
    });

    it("SVC-TURNSTILE-004: handles timeout with AbortController", () => {
      expect(verifyModule).toContain("AbortController");
      expect(verifyModule).toContain("AbortError");
    });

    it("SVC-TURNSTILE-005: returns success when no secret key (dev mode)", () => {
      expect(verifyModule).toContain('return { success: true }');
    });

    it("SVC-TURNSTILE-006: sends secret and response in body", () => {
      expect(verifyModule).toContain("secret: secretKey");
      expect(verifyModule).toContain("response: token");
    });

    it("SVC-TURNSTILE-007: optionally includes remoteip", () => {
      expect(verifyModule).toContain("remoteip");
    });
  });

  describe("API: Signup route with Turnstile verification", () => {
    let signupRoute: string;

    beforeAll(() => {
      signupRoute = fs.readFileSync(
        path.join(process.cwd(), "app/api/auth/signup/route.ts"),
        "utf8"
      );
    });

    it("API-SIGNUP-001: imports verifyTurnstileToken", () => {
      expect(signupRoute).toContain("verifyTurnstileToken");
    });

    it("API-SIGNUP-002: verifies turnstile token before auth", () => {
      const verifyIndex = signupRoute.indexOf("verifyTurnstileToken");
      const signUpIndex = signupRoute.indexOf("auth.signUp");
      expect(verifyIndex).toBeLessThan(signUpIndex);
    });

    it("API-SIGNUP-003: returns 403 when token is missing and Turnstile configured", () => {
      expect(signupRoute).toContain("Verification required");
      expect(signupRoute).toContain("403");
    });

    it("API-SIGNUP-004: returns 403 when token verification fails", () => {
      expect(signupRoute).toContain("Verification failed");
    });

    it("API-SIGNUP-005: returns 400 when email or password missing", () => {
      expect(signupRoute).toContain("Email and password are required");
      expect(signupRoute).toContain("400");
    });

    it("API-SIGNUP-006: creates Supabase server client for auth", () => {
      expect(signupRoute).toContain("createServerClient");
    });

    it("API-SIGNUP-007: rejects signup when tosAcceptedAt is missing", () => {
      expect(signupRoute).toContain("You must accept the Terms of Service to create an account");
    });

    it("API-SIGNUP-008: validates tosAcceptedAt is a string", () => {
      expect(signupRoute).toContain('typeof tosAcceptedAt !== "string"');
    });

    it("API-SIGNUP-009: validates tosAcceptedAt is a valid ISO timestamp", () => {
      expect(signupRoute).toContain("isNaN(tosDate.getTime())");
      expect(signupRoute).toContain("Invalid Terms of Service acceptance timestamp");
    });

    it("API-SIGNUP-010: ToS validation runs before Turnstile check", () => {
      const tosIndex = signupRoute.indexOf("You must accept the Terms of Service");
      const turnstileIndex = signupRoute.indexOf("verifyTurnstileToken(");
      expect(tosIndex).toBeGreaterThan(-1);
      expect(turnstileIndex).toBeGreaterThan(-1);
      expect(tosIndex).toBeLessThan(turnstileIndex);
    });
  });

  describe("API: Signin route with Turnstile verification", () => {
    let signinRoute: string;

    beforeAll(() => {
      signinRoute = fs.readFileSync(
        path.join(process.cwd(), "app/api/auth/signin/route.ts"),
        "utf8"
      );
    });

    it("API-SIGNIN-001: imports verifyTurnstileToken", () => {
      expect(signinRoute).toContain("verifyTurnstileToken");
    });

    it("API-SIGNIN-002: verifies turnstile token before auth", () => {
      const verifyIndex = signinRoute.indexOf("verifyTurnstileToken");
      const signInIndex = signinRoute.indexOf("signInWithPassword");
      expect(verifyIndex).toBeLessThan(signInIndex);
    });

    it("API-SIGNIN-003: returns 403 when token is missing and Turnstile configured", () => {
      expect(signinRoute).toContain("Verification required");
      expect(signinRoute).toContain("403");
    });

    it("API-SIGNIN-004: returns 403 when token verification fails", () => {
      expect(signinRoute).toContain("Verification failed");
    });

    it("API-SIGNIN-005: returns 401 for invalid credentials", () => {
      expect(signinRoute).toContain("401");
    });
  });

  describe("CMP: TurnstileWidget component", () => {
    let widgetContent: string;

    beforeAll(() => {
      widgetContent = fs.readFileSync(
        path.join(process.cwd(), "components/ui/turnstile-widget.tsx"),
        "utf8"
      );
    });

    it("CMP-TURNSTILE-001: uses @marsidev/react-turnstile", () => {
      expect(widgetContent).toContain("@marsidev/react-turnstile");
    });

    it("CMP-TURNSTILE-002: reads NEXT_PUBLIC_TURNSTILE_SITE_KEY", () => {
      expect(widgetContent).toContain("NEXT_PUBLIC_TURNSTILE_SITE_KEY");
    });

    it("CMP-TURNSTILE-003: calls onSuccess callback with token", () => {
      expect(widgetContent).toContain("onSuccess");
    });

    it("CMP-TURNSTILE-004: handles error state with user-friendly message", () => {
      expect(widgetContent).toContain(
        "Security verification unavailable"
      );
    });

    it("CMP-TURNSTILE-005: returns null when no site key configured", () => {
      expect(widgetContent).toContain("return null");
    });

    it("CMP-TURNSTILE-006: uses invisible size by default", () => {
      expect(widgetContent).toContain('"invisible"');
    });

    it("CMP-TURNSTILE-007: uses light theme", () => {
      expect(widgetContent).toContain('"light"');
    });
  });

  describe("Integration: Auth pages include Turnstile", () => {
    it("signup page imports TurnstileWidget", () => {
      const content = fs.readFileSync(
        path.join(
          process.cwd(),
          "app/(auth)/sign-up/[[...sign-up]]/page.tsx"
        ),
        "utf8"
      );
      expect(content).toContain("TurnstileWidget");
      expect(content).toContain("turnstileToken");
    });

    it("signin page imports TurnstileWidget", () => {
      const content = fs.readFileSync(
        path.join(
          process.cwd(),
          "app/(auth)/sign-in/[[...sign-in]]/page.tsx"
        ),
        "utf8"
      );
      expect(content).toContain("TurnstileWidget");
      expect(content).toContain("turnstileToken");
    });

    it("signup page disables submit on turnstile error", () => {
      const content = fs.readFileSync(
        path.join(
          process.cwd(),
          "app/(auth)/sign-up/[[...sign-up]]/page.tsx"
        ),
        "utf8"
      );
      expect(content).toContain("turnstileError");
    });

    it("signin page disables submit on turnstile error", () => {
      const content = fs.readFileSync(
        path.join(
          process.cwd(),
          "app/(auth)/sign-in/[[...sign-in]]/page.tsx"
        ),
        "utf8"
      );
      expect(content).toContain("turnstileError");
    });
  });

  describe("Security: barrel export", () => {
    it("lib/security/index.ts exports verifyTurnstileToken", () => {
      const content = fs.readFileSync(
        path.join(process.cwd(), "lib/security/index.ts"),
        "utf8"
      );
      expect(content).toContain("verifyTurnstileToken");
    });
  });

  describe("Package dependency", () => {
    it("has @marsidev/react-turnstile in dependencies", () => {
      const pkg = JSON.parse(
        fs.readFileSync(path.join(process.cwd(), "package.json"), "utf8")
      );
      expect(pkg.dependencies["@marsidev/react-turnstile"]).toBeDefined();
    });
  });
});
