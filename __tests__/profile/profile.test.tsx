import fs from "fs";
import path from "path";
import "@testing-library/jest-dom";

describe("Agent Profile + Branding", () => {
  describe("File structure", () => {
    it("has profile page at settings/profile", () => {
      expect(
        fs.existsSync(
          path.join(process.cwd(), "app/(protected)/settings/profile/page.tsx")
        )
      ).toBe(true);
    });

    it("has profile API route", () => {
      expect(
        fs.existsSync(path.join(process.cwd(), "app/api/profile/route.ts"))
      ).toBe(true);
    });

    it("has profile service", () => {
      expect(
        fs.existsSync(path.join(process.cwd(), "lib/services/profile.ts"))
      ).toBe(true);
    });

    it("has profile validation module", () => {
      expect(
        fs.existsSync(
          path.join(process.cwd(), "lib/services/profile-validation.ts")
        )
      ).toBe(true);
    });

    it("has ProfileForm component", () => {
      expect(
        fs.existsSync(
          path.join(process.cwd(), "components/profile/profile-form.tsx")
        )
      ).toBe(true);
    });

    it("has BrandPreview component", () => {
      expect(
        fs.existsSync(
          path.join(process.cwd(), "components/profile/brand-preview.tsx")
        )
      ).toBe(true);
    });
  });

  describe("Profile validation", () => {
    let validateProfileData: typeof import("@/lib/services/profile-validation")["validateProfileData"];

    beforeAll(async () => {
      const mod = await import("@/lib/services/profile-validation");
      validateProfileData = mod.validateProfileData;
    });

    it("passes with valid data", () => {
      const result = validateProfileData({
        name: "Victoria Ashford",
        company: "Ashford & Associates",
        title: "Principal Broker",
        phone: "(239) 555-0147",
        bio: "Specializing in Naples waterfront estates.",
      });
      expect(result.success).toBe(true);
    });

    it("fails when name is empty", () => {
      const result = validateProfileData({
        name: "",
        company: "Test Co",
      });
      expect(result.success).toBe(false);
      expect(result.errors).toHaveProperty("name");
    });

    it("fails when name is missing", () => {
      const result = validateProfileData({
        company: "Test Co",
      } as any);
      expect(result.success).toBe(false);
      expect(result.errors).toHaveProperty("name");
    });

    it("accepts valid phone formats", () => {
      const formats = [
        "(239) 555-0147",
        "239-555-0147",
        "2395550147",
        "+1 239 555 0147",
        "+12395550147",
      ];
      for (const phone of formats) {
        const result = validateProfileData({ name: "Test", phone });
        expect(result.success).toBe(true);
      }
    });

    it("rejects clearly invalid phone numbers", () => {
      const result = validateProfileData({
        name: "Test",
        phone: "not-a-phone",
      });
      expect(result.success).toBe(false);
      expect(result.errors).toHaveProperty("phone");
    });

    it("validates hex color format for brand colors", () => {
      const result = validateProfileData({
        name: "Test",
        brandColors: {
          primary: "not-a-color",
          secondary: "#CA8A04",
        },
      });
      expect(result.success).toBe(false);
      expect(result.errors).toHaveProperty("brandColors");
    });

    it("accepts valid hex colors", () => {
      const result = validateProfileData({
        name: "Test",
        brandColors: {
          primary: "#0F172A",
          secondary: "#CA8A04",
          accent: "#1E3A5F",
        },
      });
      expect(result.success).toBe(true);
    });

    it("allows optional fields to be omitted", () => {
      const result = validateProfileData({
        name: "Test Agent",
      });
      expect(result.success).toBe(true);
    });

    it("trims whitespace from string fields", () => {
      const result = validateProfileData({
        name: "  Victoria Ashford  ",
        company: "  Ashford & Associates  ",
      });
      expect(result.success).toBe(true);
      expect(result.data?.name).toBe("Victoria Ashford");
      expect(result.data?.company).toBe("Ashford & Associates");
    });
  });

  describe("ProfileForm component", () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const React = require("react");
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { render, screen } = require("@testing-library/react");

    it("renders profile form fields", async () => {
      const { ProfileForm } = await import(
        "@/components/profile/profile-form"
      );
      render(
        React.createElement(ProfileForm, {
          initialData: {
            name: "Victoria Ashford",
            email: "victoria@ashford.com",
            company: "",
            title: "",
            phone: "",
            bio: "",
            brandColors: null,
          },
        })
      );

      expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/company/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/phone/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/bio/i)).toBeInTheDocument();
    });

    it("shows email as read-only", async () => {
      const { ProfileForm } = await import(
        "@/components/profile/profile-form"
      );
      render(
        React.createElement(ProfileForm, {
          initialData: {
            name: "Test",
            email: "test@example.com",
            company: "",
            title: "",
            phone: "",
            bio: "",
            brandColors: null,
          },
        })
      );

      const emailField = screen.getByDisplayValue("test@example.com");
      expect(emailField).toHaveAttribute("readOnly");
    });

    it("renders brand color inputs", async () => {
      const { ProfileForm } = await import(
        "@/components/profile/profile-form"
      );
      render(
        React.createElement(ProfileForm, {
          initialData: {
            name: "Test",
            email: "test@example.com",
            company: "",
            title: "",
            phone: "",
            bio: "",
            brandColors: {
              primary: "#0F172A",
              secondary: "#CA8A04",
              accent: "#1E3A5F",
            },
          },
        })
      );

      expect(screen.getByText(/primary/i)).toBeInTheDocument();
      expect(screen.getByText(/secondary/i)).toBeInTheDocument();
      expect(screen.getByText(/accent/i)).toBeInTheDocument();
    });

    it("renders save button", async () => {
      const { ProfileForm } = await import(
        "@/components/profile/profile-form"
      );
      render(
        React.createElement(ProfileForm, {
          initialData: {
            name: "Test",
            email: "test@example.com",
            company: "",
            title: "",
            phone: "",
            bio: "",
            brandColors: null,
          },
        })
      );

      expect(
        screen.getByRole("button", { name: /save profile/i })
      ).toBeInTheDocument();
    });

    it("pre-populates fields from initial data", async () => {
      const { ProfileForm } = await import(
        "@/components/profile/profile-form"
      );
      render(
        React.createElement(ProfileForm, {
          initialData: {
            name: "Victoria Ashford",
            email: "victoria@ashford.com",
            company: "Ashford & Associates",
            title: "Principal Broker",
            phone: "(239) 555-0147",
            bio: "Luxury specialist",
            brandColors: null,
          },
        })
      );

      expect(screen.getByDisplayValue("Victoria Ashford")).toBeInTheDocument();
      expect(
        screen.getByDisplayValue("Ashford & Associates")
      ).toBeInTheDocument();
      expect(screen.getByDisplayValue("Principal Broker")).toBeInTheDocument();
      expect(screen.getByDisplayValue("(239) 555-0147")).toBeInTheDocument();
    });
  });

  describe("BrandPreview component", () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const React = require("react");
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { render, screen } = require("@testing-library/react");

    it("renders preview with company name", async () => {
      const { BrandPreview } = await import(
        "@/components/profile/brand-preview"
      );
      render(
        React.createElement(BrandPreview, {
          company: "Ashford & Associates",
          colors: {
            primary: "#0F172A",
            secondary: "#CA8A04",
            accent: "#1E3A5F",
          },
        })
      );

      expect(screen.getByText("Ashford & Associates")).toBeInTheDocument();
    });

    it("renders with default colors when none provided", async () => {
      const { BrandPreview } = await import(
        "@/components/profile/brand-preview"
      );
      const { container } = render(
        React.createElement(BrandPreview, {
          company: "Test Co",
          colors: null,
        })
      );

      expect(container.firstChild).toBeTruthy();
    });
  });

  describe("API route", () => {
    it("route file exports GET and PUT handlers", () => {
      // Verify the route file exists and has proper content
      const routeContent = fs.readFileSync(
        path.join(process.cwd(), "app/api/profile/route.ts"),
        "utf8"
      );
      expect(routeContent).toContain("export async function GET");
      expect(routeContent).toContain("export async function PUT");
    });

    it("route uses Clerk auth", () => {
      const routeContent = fs.readFileSync(
        path.join(process.cwd(), "app/api/profile/route.ts"),
        "utf8"
      );
      expect(routeContent).toContain("@clerk/nextjs/server");
      expect(routeContent).toContain("auth()");
    });

    it("route validates input with validateProfileData", () => {
      const routeContent = fs.readFileSync(
        path.join(process.cwd(), "app/api/profile/route.ts"),
        "utf8"
      );
      expect(routeContent).toContain("validateProfileData");
    });

    it("route returns 401 for unauthenticated requests", () => {
      const routeContent = fs.readFileSync(
        path.join(process.cwd(), "app/api/profile/route.ts"),
        "utf8"
      );
      expect(routeContent).toContain("401");
      expect(routeContent).toContain("Unauthorized");
    });

    it("route returns 422 for validation errors", () => {
      const routeContent = fs.readFileSync(
        path.join(process.cwd(), "app/api/profile/route.ts"),
        "utf8"
      );
      expect(routeContent).toContain("422");
    });
  });

  describe("Settings page redirects to profile", () => {
    it("settings page redirects to /settings/profile", () => {
      const settingsContent = fs.readFileSync(
        path.join(process.cwd(), "app/(protected)/settings/page.tsx"),
        "utf8"
      );
      expect(settingsContent).toContain('redirect("/settings/profile")');
    });
  });
});
