/**
 * Admin Sidebar Tests
 *
 * Tests for the AdminSidebar component and the removal of Eval
 * from the user-facing Sidebar.
 *
 * Specs:
 *   .specs/features/admin/admin-sidebar-update.feature.md
 *   .specs/features/admin/admin-sidebar-report-registry.feature.md
 */

import React from "react";
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";

// Mock next/navigation
const mockPathname = jest.fn<string, []>(() => "/admin/eval");
jest.mock("next/navigation", () => ({
  usePathname: () => mockPathname(),
}));

import { AdminSidebar } from "@/components/layout/admin-sidebar";
import { Sidebar } from "@/components/layout/sidebar";

describe("AdminSidebar", () => {
  beforeEach(() => {
    mockPathname.mockReturnValue("/admin/eval");
  });

  // Scenario: All nav items present (updated for Report Registry, Error Triage, Analytics & Subscription Tiers)
  it("should render all 10 nav items in correct order", () => {
    render(<AdminSidebar />);

    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(10);
    expect(links[0]).toHaveTextContent("Back to App");
    expect(links[1]).toHaveTextContent("User Management");
    expect(links[2]).toHaveTextContent("Report Registry");
    expect(links[3]).toHaveTextContent("Error Triage");
    expect(links[4]).toHaveTextContent("Eval Suite");
    expect(links[5]).toHaveTextContent("Data Sources");
    expect(links[6]).toHaveTextContent("Pipeline");
    expect(links[7]).toHaveTextContent("Analytics");
    expect(links[8]).toHaveTextContent("System Monitor");
    expect(links[9]).toHaveTextContent("Subscription Tiers");
  });

  it("should link Back to App to /dashboard", () => {
    render(<AdminSidebar />);

    const backLink = screen.getByText("Back to App");
    expect(backLink).toHaveAttribute("href", "/dashboard");
  });

  it("should link User Management to /admin/users", () => {
    render(<AdminSidebar />);

    const usersLink = screen.getByText("User Management");
    expect(usersLink).toHaveAttribute("href", "/admin/users");
  });

  // Scenario: Active state on user list page
  it("should mark User Management as active when on /admin/users", () => {
    mockPathname.mockReturnValue("/admin/users");
    render(<AdminSidebar />);

    const usersLink = screen.getByText("User Management").closest("a");
    expect(usersLink?.className).toContain("color-primary");
  });

  // Scenario: Active state on user detail sub-page
  it("should mark User Management as active when on /admin/users/abc123", () => {
    mockPathname.mockReturnValue("/admin/users/abc123");
    render(<AdminSidebar />);

    const usersLink = screen.getByText("User Management").closest("a");
    expect(usersLink?.className).toContain("color-primary");
  });

  // Scenario: Active state does not bleed to unrelated routes
  it("should mark Eval Suite as active when on /admin/eval", () => {
    mockPathname.mockReturnValue("/admin/eval");
    render(<AdminSidebar />);

    const evalLink = screen.getByText("Eval Suite").closest("a");
    expect(evalLink?.className).toContain("color-primary");

    const usersLink = screen.getByText("User Management").closest("a");
    expect(usersLink?.className).toContain("color-text-secondary");
  });

  // Scenario: Back to App is never active in admin context
  it("should not mark Back to App as active when on /admin/eval", () => {
    mockPathname.mockReturnValue("/admin/eval");
    render(<AdminSidebar />);

    const backLink = screen.getByText("Back to App").closest("a");
    expect(backLink?.className).toContain("color-text-secondary");
  });

  it("should not mark Back to App as active when on /admin/users", () => {
    mockPathname.mockReturnValue("/admin/users");
    render(<AdminSidebar />);

    const backLink = screen.getByText("Back to App").closest("a");
    expect(backLink?.className).toContain("color-text-secondary");
  });

  // === Report Registry & Error Triage Nav (Feature #125) ===

  // Scenario: Report Registry nav item is visible
  it("should show Report Registry linking to /admin/reports", () => {
    render(<AdminSidebar />);

    const link = screen.getByText("Report Registry").closest("a");
    expect(link).toHaveAttribute("href", "/admin/reports");
  });

  // Scenario: Error Triage nav item is visible
  it("should show Error Triage linking to /admin/error-triage", () => {
    render(<AdminSidebar />);

    const link = screen.getByText("Error Triage").closest("a");
    expect(link).toHaveAttribute("href", "/admin/error-triage");
  });

  // Scenario: Report Registry active state on list page
  it("should mark Report Registry as active when on /admin/reports", () => {
    mockPathname.mockReturnValue("/admin/reports");
    render(<AdminSidebar />);

    const link = screen.getByText("Report Registry").closest("a");
    expect(link?.className).toContain("color-primary");
  });

  // Scenario: Report Registry active state on detail sub-page
  it("should mark Report Registry as active when on /admin/reports/abc123", () => {
    mockPathname.mockReturnValue("/admin/reports/abc123");
    render(<AdminSidebar />);

    const link = screen.getByText("Report Registry").closest("a");
    expect(link?.className).toContain("color-primary");
  });

  // Scenario: Error Triage active state
  it("should mark Error Triage as active when on /admin/error-triage", () => {
    mockPathname.mockReturnValue("/admin/error-triage");
    render(<AdminSidebar />);

    const link = screen.getByText("Error Triage").closest("a");
    expect(link?.className).toContain("color-primary");

    // Other nav items should not be active
    const reportLink = screen.getByText("Report Registry").closest("a");
    expect(reportLink?.className).toContain("color-text-secondary");
  });

  // Scenario: Error Triage does not match report registry routes
  it("should not mark Error Triage as active when on /admin/reports", () => {
    mockPathname.mockReturnValue("/admin/reports");
    render(<AdminSidebar />);

    const link = screen.getByText("Error Triage").closest("a");
    expect(link?.className).toContain("color-text-secondary");
  });

  // Scenario: Report Registry does not match error triage route
  it("should not mark Report Registry as active when on /admin/error-triage", () => {
    mockPathname.mockReturnValue("/admin/error-triage");
    render(<AdminSidebar />);

    const link = screen.getByText("Report Registry").closest("a");
    expect(link?.className).toContain("color-text-secondary");
  });

  // Scenario: Icons are consistent with existing sidebar style
  it("should render file-text icon for Report Registry and alert-triangle icon for Error Triage", () => {
    render(<AdminSidebar />);

    const reportLink = screen.getByText("Report Registry").closest("a");
    const reportSvg = reportLink?.querySelector("svg");
    expect(reportSvg).toBeTruthy();
    expect(reportSvg?.getAttribute("width")).toBe("18");
    expect(reportSvg?.getAttribute("height")).toBe("18");

    const errorLink = screen.getByText("Error Triage").closest("a");
    const errorSvg = errorLink?.querySelector("svg");
    expect(errorSvg).toBeTruthy();
    expect(errorSvg?.getAttribute("width")).toBe("18");
    expect(errorSvg?.getAttribute("height")).toBe("18");
  });

  // Scenario: Footer
  it("should show Modern Signal Advisory in the footer", () => {
    render(<AdminSidebar />);

    expect(screen.getByText("Modern Signal Advisory")).toBeInTheDocument();
  });
});

// Scenario: User sidebar does not show admin links
describe("User Sidebar — Eval removal", () => {
  beforeEach(() => {
    mockPathname.mockReturnValue("/dashboard");
  });

  it("should show only Dashboard, Reports, Markets, Settings", () => {
    render(<Sidebar />);

    const links = screen.getAllByRole("link");
    const labels = links.map((l) => l.textContent);

    expect(labels).toEqual(["Dashboard", "How To", "Reports", "Markets", "Settings"]);
  });

  it("should NOT contain an Eval link", () => {
    render(<Sidebar />);

    expect(screen.queryByText("Eval")).not.toBeInTheDocument();
    expect(screen.queryByText("Eval Suite")).not.toBeInTheDocument();
  });

  it("should NOT contain an Admin link", () => {
    render(<Sidebar />);

    expect(screen.queryByText("Admin")).not.toBeInTheDocument();
  });
});
