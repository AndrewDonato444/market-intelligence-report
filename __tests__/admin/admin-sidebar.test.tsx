/**
 * Admin Sidebar Tests
 *
 * Tests for the AdminSidebar component and the removal of Eval
 * from the user-facing Sidebar.
 *
 * Spec: .specs/features/admin/admin-dashboard.feature.md
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

  // Scenario: Admin sidebar navigation
  it("should render nav items: Back to App, Users, Eval Suite, Data Sources, Pipeline, and System Monitor", () => {
    render(<AdminSidebar />);

    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(6);
    expect(links[0]).toHaveTextContent("Back to App");
    expect(links[1]).toHaveTextContent("Users");
    expect(links[2]).toHaveTextContent("Eval Suite");
    expect(links[3]).toHaveTextContent("Data Sources");
    expect(links[4]).toHaveTextContent("Pipeline");
    expect(links[5]).toHaveTextContent("System Monitor");
  });

  it("should link Back to App to /dashboard", () => {
    render(<AdminSidebar />);

    const backLink = screen.getByText("Back to App");
    expect(backLink).toHaveAttribute("href", "/dashboard");
  });

  it("should link Eval Suite to /admin/eval", () => {
    render(<AdminSidebar />);

    const evalLink = screen.getByText("Eval Suite");
    expect(evalLink).toHaveAttribute("href", "/admin/eval");
  });

  // Scenario: Active page is highlighted
  it("should mark Eval Suite as active when on /admin/eval", () => {
    mockPathname.mockReturnValue("/admin/eval");
    render(<AdminSidebar />);

    // The real component uses className for active state, not data-active
    const evalLink = screen.getByText("Eval Suite").closest("a");
    expect(evalLink?.className).toContain("color-primary");
  });

  it("should not mark Back to App as active when on /admin/eval", () => {
    mockPathname.mockReturnValue("/admin/eval");
    render(<AdminSidebar />);

    const backLink = screen.getByText("Back to App").closest("a");
    expect(backLink?.className).toContain("color-text-secondary");
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

    expect(labels).toEqual(["Dashboard", "Reports", "Markets", "Settings"]);
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
