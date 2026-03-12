import fs from "fs";
import path from "path";

describe("Email Confirmation Flow", () => {
  describe("Auth callback route exists", () => {
    it("has /auth/callback route handler", () => {
      expect(
        fs.existsSync(
          path.join(process.cwd(), "app/auth/callback/route.ts")
        )
      ).toBe(true);
    });

    it("auth callback exchanges code for session", () => {
      const content = fs.readFileSync(
        path.join(process.cwd(), "app/auth/callback/route.ts"),
        "utf8"
      );
      expect(content).toContain("exchangeCodeForSession");
    });

    it("auth callback redirects to dashboard on success", () => {
      const content = fs.readFileSync(
        path.join(process.cwd(), "app/auth/callback/route.ts"),
        "utf8"
      );
      expect(content).toContain("/dashboard");
    });

    it("auth callback handles errors gracefully", () => {
      const content = fs.readFileSync(
        path.join(process.cwd(), "app/auth/callback/route.ts"),
        "utf8"
      );
      // Should redirect to an error page or sign-in on failure
      expect(content).toContain("/sign-in");
    });
  });

  describe("Sign-up page handles email confirmation", () => {
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

    it("passes emailRedirectTo option to signUp", () => {
      expect(signUpContent).toContain("emailRedirectTo");
    });

    it("shows confirmation message after signup", () => {
      // Should have a state for showing "check your email"
      expect(signUpContent).toContain("confirmationSent");
    });

    it("checks for confirmation-needed before redirecting to dashboard", () => {
      // The signUp handler should check whether email confirmation is required
      // before redirecting. It should set confirmationSent=true when no session
      // is returned (i.e. email confirmation is pending).
      expect(signUpContent).toContain("setConfirmationSent(true)");
      expect(signUpContent).toContain("data.session");
    });

    it("includes auth/callback in the redirect URL", () => {
      expect(signUpContent).toContain("/auth/callback");
    });
  });

  describe("Middleware allows auth callback", () => {
    it("auth/callback is in public routes", () => {
      const middlewareContent = fs.readFileSync(
        path.join(process.cwd(), "lib/supabase/middleware.ts"),
        "utf8"
      );
      expect(middlewareContent).toContain("/auth/callback");
    });
  });
});
