import fs from "fs";
import path from "path";

describe("Authentication with Clerk", () => {
  describe("File structure", () => {
    it("has middleware.ts for route protection", () => {
      expect(
        fs.existsSync(path.join(process.cwd(), "middleware.ts"))
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
  });

  describe("Middleware configuration", () => {
    let middlewareContent: string;

    beforeAll(() => {
      middlewareContent = fs.readFileSync(
        path.join(process.cwd(), "middleware.ts"),
        "utf8"
      );
    });

    it("imports clerkMiddleware", () => {
      expect(middlewareContent).toContain("clerkMiddleware");
    });

    it("imports createRouteMatcher", () => {
      expect(middlewareContent).toContain("createRouteMatcher");
    });

    it("defines public routes including landing page", () => {
      expect(middlewareContent).toContain('"/",');
    });

    it("defines sign-in as public route", () => {
      expect(middlewareContent).toContain("sign-in");
    });

    it("defines sign-up as public route", () => {
      expect(middlewareContent).toContain("sign-up");
    });

    it("defines webhook routes as public", () => {
      expect(middlewareContent).toContain("webhooks");
    });

    it("calls auth.protect() for non-public routes", () => {
      expect(middlewareContent).toContain("auth.protect()");
    });

    it("exports matcher config", () => {
      expect(middlewareContent).toContain("export const config");
      expect(middlewareContent).toContain("matcher");
    });
  });

  describe("Root layout includes ClerkProvider", () => {
    let layoutContent: string;

    beforeAll(() => {
      layoutContent = fs.readFileSync(
        path.join(process.cwd(), "app/layout.tsx"),
        "utf8"
      );
    });

    it("imports ClerkProvider", () => {
      expect(layoutContent).toContain("ClerkProvider");
    });

    it("wraps app with ClerkProvider", () => {
      expect(layoutContent).toContain("<ClerkProvider>");
    });
  });

  describe("Sign-in page", () => {
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

    it("imports SignIn component from Clerk", () => {
      expect(signInContent).toContain("SignIn");
      expect(signInContent).toContain("@clerk/nextjs");
    });

    it("renders the SignIn component", () => {
      expect(signInContent).toContain("<SignIn");
    });
  });

  describe("Sign-up page", () => {
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

    it("imports SignUp component from Clerk", () => {
      expect(signUpContent).toContain("SignUp");
      expect(signUpContent).toContain("@clerk/nextjs");
    });

    it("renders the SignUp component", () => {
      expect(signUpContent).toContain("<SignUp");
    });
  });

  describe("Dashboard page", () => {
    let dashboardContent: string;

    beforeAll(() => {
      dashboardContent = fs.readFileSync(
        path.join(
          process.cwd(),
          "app/(protected)/dashboard/page.tsx"
        ),
        "utf8"
      );
    });

    it("imports UserButton from Clerk", () => {
      expect(dashboardContent).toContain("UserButton");
    });

    it("imports currentUser for server-side auth", () => {
      expect(dashboardContent).toContain("currentUser");
    });

    it("redirects to sign-in if no user", () => {
      expect(dashboardContent).toContain('redirect("/sign-in")');
    });

    it("uses design tokens for styling", () => {
      expect(dashboardContent).toContain("var(--color-primary)");
      expect(dashboardContent).toContain("var(--color-accent)");
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

    it("has @clerk/nextjs as dependency", () => {
      expect(packageJson.dependencies["@clerk/nextjs"]).toBeDefined();
    });
  });
});
