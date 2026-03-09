import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import fs from "fs";
import path from "path";

// Mock next/navigation
jest.mock("next/navigation", () => ({
  usePathname: () => "/dashboard",
}));

// Mock @clerk/nextjs
jest.mock("@clerk/nextjs", () => ({
  UserButton: () => <div data-testid="user-button">UserButton</div>,
}));

import { TopNav } from "@/components/layout/top-nav";
import { Sidebar } from "@/components/layout/sidebar";
import { PageShell } from "@/components/layout/page-shell";

describe("Base App Layout", () => {
  describe("File structure", () => {
    it("has top-nav component", () => {
      expect(
        fs.existsSync(
          path.join(process.cwd(), "components/layout/top-nav.tsx")
        )
      ).toBe(true);
    });

    it("has sidebar component", () => {
      expect(
        fs.existsSync(
          path.join(process.cwd(), "components/layout/sidebar.tsx")
        )
      ).toBe(true);
    });

    it("has page-shell component", () => {
      expect(
        fs.existsSync(
          path.join(process.cwd(), "components/layout/page-shell.tsx")
        )
      ).toBe(true);
    });

    it("has barrel export", () => {
      expect(
        fs.existsSync(
          path.join(process.cwd(), "components/layout/index.ts")
        )
      ).toBe(true);
    });

    it("has protected layout using components", () => {
      const content = fs.readFileSync(
        path.join(process.cwd(), "app/(protected)/layout.tsx"),
        "utf8"
      );
      expect(content).toContain("TopNav");
      expect(content).toContain("Sidebar");
      expect(content).toContain("PageShell");
    });
  });

  describe("TopNav component", () => {
    it("renders the brand name", () => {
      render(<TopNav />);
      expect(
        screen.getByText("Modern Signal Advisory")
      ).toBeInTheDocument();
    });

    it("renders the platform label", () => {
      render(<TopNav />);
      expect(
        screen.getByText("Intelligence Platform")
      ).toBeInTheDocument();
    });

    it("renders the UserButton", () => {
      render(<TopNav />);
      expect(screen.getByTestId("user-button")).toBeInTheDocument();
    });
  });

  describe("Sidebar component", () => {
    it("renders Dashboard link", () => {
      render(<Sidebar />);
      expect(screen.getByText("Dashboard")).toBeInTheDocument();
    });

    it("renders Reports link", () => {
      render(<Sidebar />);
      expect(screen.getByText("Reports")).toBeInTheDocument();
    });

    it("renders Markets link", () => {
      render(<Sidebar />);
      expect(screen.getByText("Markets")).toBeInTheDocument();
    });

    it("renders Settings link", () => {
      render(<Sidebar />);
      expect(screen.getByText("Settings")).toBeInTheDocument();
    });

    it("renders footer text", () => {
      render(<Sidebar />);
      expect(
        screen.getByText("Modern Signal Advisory")
      ).toBeInTheDocument();
    });

    it("has correct href for Dashboard", () => {
      render(<Sidebar />);
      const link = screen.getByText("Dashboard").closest("a");
      expect(link).toHaveAttribute("href", "/dashboard");
    });

    it("has correct href for Reports", () => {
      render(<Sidebar />);
      const link = screen.getByText("Reports").closest("a");
      expect(link).toHaveAttribute("href", "/reports");
    });
  });

  describe("PageShell component", () => {
    it("renders children", () => {
      render(
        <PageShell>
          <p>Test content</p>
        </PageShell>
      );
      expect(screen.getByText("Test content")).toBeInTheDocument();
    });
  });

  describe("Protected pages exist", () => {
    it("has reports page", () => {
      expect(
        fs.existsSync(
          path.join(process.cwd(), "app/(protected)/reports/page.tsx")
        )
      ).toBe(true);
    });

    it("has markets page", () => {
      expect(
        fs.existsSync(
          path.join(process.cwd(), "app/(protected)/markets/page.tsx")
        )
      ).toBe(true);
    });

    it("has settings page", () => {
      expect(
        fs.existsSync(
          path.join(process.cwd(), "app/(protected)/settings/page.tsx")
        )
      ).toBe(true);
    });
  });
});
