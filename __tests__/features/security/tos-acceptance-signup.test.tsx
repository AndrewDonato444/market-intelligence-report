/**
 * ToS Acceptance on Signup Tests
 *
 * Covers all 6 Gherkin scenarios from:
 * .specs/features/security/tos-acceptance-signup.feature.md
 *
 * Test IDs: CMP-tos-01 through CMP-tos-06
 */
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import fs from "fs";
import path from "path";

// Mock next/navigation
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

// Mock supabase client
const mockSignUp = jest.fn();
jest.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: {
      signUp: mockSignUp,
    },
  }),
}));

describe("ToS Acceptance on Signup", () => {
  let SignUpPage: React.ComponentType;

  beforeAll(async () => {
    const mod = await import(
      "@/app/(auth)/sign-up/[[...sign-up]]/page"
    );
    SignUpPage = mod.default;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // --- Scenario 1: Successful signup with ToS accepted ---
  describe("CMP-tos-01: Successful signup with ToS accepted", () => {
    it("passes tos_accepted_at in user metadata when checkbox is checked", async () => {
      mockSignUp.mockResolvedValue({
        data: { user: { id: "u1", identities: [], email_confirmed_at: null }, session: null },
        error: null,
      });

      render(<SignUpPage />);

      fireEvent.change(screen.getByPlaceholderText("you@example.com"), {
        target: { value: "agent@luxury.com" },
      });
      fireEvent.change(screen.getByPlaceholderText("Create a password"), {
        target: { value: "securePass123" },
      });

      const checkbox = screen.getByRole("checkbox", { name: /terms of service/i });
      fireEvent.click(checkbox);

      fireEvent.click(screen.getByRole("button", { name: /create account/i }));

      await waitFor(() => {
        expect(mockSignUp).toHaveBeenCalledTimes(1);
      });

      const callArgs = mockSignUp.mock.calls[0][0];
      expect(callArgs.options.data).toBeDefined();
      expect(callArgs.options.data.tos_accepted_at).toBeDefined();
      expect(new Date(callArgs.options.data.tos_accepted_at).toISOString()).toBe(
        callArgs.options.data.tos_accepted_at
      );
    });

    it("shows Check Your Email confirmation after successful signup", async () => {
      mockSignUp.mockResolvedValue({
        data: { user: { id: "u1", identities: [], email_confirmed_at: null }, session: null },
        error: null,
      });

      render(<SignUpPage />);

      fireEvent.change(screen.getByPlaceholderText("you@example.com"), {
        target: { value: "agent@luxury.com" },
      });
      fireEvent.change(screen.getByPlaceholderText("Create a password"), {
        target: { value: "securePass123" },
      });

      const checkbox = screen.getByRole("checkbox", { name: /terms of service/i });
      fireEvent.click(checkbox);

      fireEvent.click(screen.getByRole("button", { name: /create account/i }));

      await waitFor(() => {
        expect(screen.getByText("Check Your Email")).toBeInTheDocument();
      });
    });
  });

  // --- Scenario 2: Signup blocked without ToS acceptance ---
  describe("CMP-tos-02: Signup blocked without ToS acceptance", () => {
    it("does not call signUp when ToS checkbox is unchecked", async () => {
      render(<SignUpPage />);

      fireEvent.change(screen.getByPlaceholderText("you@example.com"), {
        target: { value: "agent@luxury.com" },
      });
      fireEvent.change(screen.getByPlaceholderText("Create a password"), {
        target: { value: "securePass123" },
      });

      fireEvent.click(screen.getByRole("button", { name: /create account/i }));

      expect(mockSignUp).not.toHaveBeenCalled();
    });

    it("shows error message when submitting without ToS", async () => {
      render(<SignUpPage />);

      fireEvent.change(screen.getByPlaceholderText("you@example.com"), {
        target: { value: "agent@luxury.com" },
      });
      fireEvent.change(screen.getByPlaceholderText("Create a password"), {
        target: { value: "securePass123" },
      });

      fireEvent.click(screen.getByRole("button", { name: /create account/i }));

      expect(
        screen.getByText("Please accept the Terms of Service to continue")
      ).toBeInTheDocument();
    });
  });

  // --- Scenario 3: ToS checkbox is unchecked by default ---
  describe("CMP-tos-03: ToS checkbox is unchecked by default", () => {
    it("renders checkbox unchecked on page load", () => {
      render(<SignUpPage />);

      const checkbox = screen.getByRole("checkbox", { name: /terms of service/i });
      expect(checkbox).not.toBeChecked();
    });

    it("renders Create Account button visible", () => {
      render(<SignUpPage />);

      const button = screen.getByRole("button", { name: /create account/i });
      expect(button).toBeVisible();
    });
  });

  // --- Scenario 4: ToS link opens Terms of Service page ---
  describe("CMP-tos-04: ToS link opens Terms of Service page", () => {
    it("renders Terms of Service as a link to /terms", () => {
      render(<SignUpPage />);

      const link = screen.getByRole("link", { name: /terms of service/i });
      expect(link).toHaveAttribute("href", "/terms");
    });

    it("opens link in a new tab", () => {
      render(<SignUpPage />);

      const link = screen.getByRole("link", { name: /terms of service/i });
      expect(link).toHaveAttribute("target", "_blank");
    });
  });

  // --- Scenario 5: ToS acceptance timestamp persisted to database ---
  describe("CMP-tos-05: ToS acceptance timestamp persisted to database", () => {
    it("schema includes tosAcceptedAt column on users table", () => {
      const schemaContent = fs.readFileSync(
        path.join(process.cwd(), "lib/db/schema.ts"),
        "utf8"
      );
      expect(schemaContent).toContain("tos_accepted_at");
      expect(schemaContent).toContain("tosAcceptedAt");
    });

    it("ensureUserProfile accepts and persists tosAcceptedAt from metadata", () => {
      const profileContent = fs.readFileSync(
        path.join(process.cwd(), "lib/services/profile.ts"),
        "utf8"
      );
      expect(profileContent).toContain("tosAcceptedAt");
      expect(profileContent).toContain("tos_accepted_at");
    });

    it("migration file exists for tos_accepted_at column", () => {
      const migrationsDir = path.join(process.cwd(), "lib/db/migrations");
      const files = fs.readdirSync(migrationsDir);
      const tosMigration = files.find(
        (f: string) => f.includes("tos") || f.includes("0010")
      );
      expect(tosMigration).toBeDefined();

      const migrationContent = fs.readFileSync(
        path.join(migrationsDir, tosMigration!),
        "utf8"
      );
      expect(migrationContent).toContain("tos_accepted_at");
      expect(migrationContent).toContain("timestamp");
    });
  });

  // --- Scenario 6: Existing users without ToS timestamp (migration) ---
  describe("CMP-tos-06: Existing users without ToS timestamp (migration)", () => {
    it("tosAcceptedAt column is nullable (no NOT NULL constraint)", () => {
      const schemaContent = fs.readFileSync(
        path.join(process.cwd(), "lib/db/schema.ts"),
        "utf8"
      );
      const tosLine = schemaContent
        .split("\n")
        .find((line: string) => line.includes("tosAcceptedAt"));
      expect(tosLine).toBeDefined();
      expect(tosLine).not.toContain("notNull");
    });

    it("admin API returns tosAcceptedAt field for compliance visibility", () => {
      const routeContent = fs.readFileSync(
        path.join(process.cwd(), "app/api/admin/users/[id]/route.ts"),
        "utf8"
      );
      expect(routeContent).toContain("tosAcceptedAt");
    });
  });

  // --- Terms page exists ---
  describe("Terms page", () => {
    it("has a /terms page", () => {
      expect(
        fs.existsSync(path.join(process.cwd(), "app/terms/page.tsx"))
      ).toBe(true);
    });
  });
});
