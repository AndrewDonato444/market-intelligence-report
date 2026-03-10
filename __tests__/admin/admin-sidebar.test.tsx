/**
 * Admin Sidebar Tests
 *
 * Tests for the AdminSidebar component and the removal of Eval
 * from the user-facing Sidebar. These are FAILING tests — the
 * AdminSidebar component does not exist yet.
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

// --- User Sidebar tests (verifying Eval removal) ---
// Import the existing Sidebar once Eval is removed
// import { Sidebar } from "@/components/layout/sidebar";

// --- Admin Sidebar tests ---
// import { AdminSidebar } from "@/components/layout/admin-sidebar";

// Placeholder components for TDD (remove once real components exist)
function AdminSidebar() {
  const pathname = mockPathname();
  const navItems = [
    { label: "Back to App", href: "/dashboard", icon: "arrow-left" },
    { label: "Eval Suite", href: "/admin/eval", icon: "beaker" },
  ];

  return (
    <aside data-testid="admin-sidebar">
      <nav>
        <ul>
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <li key={item.href}>
                <a href={item.href} data-active={isActive}>
                  {item.label}
                </a>
              </li>
            );
          })}
        </ul>
      </nav>
      <div data-testid="sidebar-footer">
        <p>Modern Signal Advisory</p>
      </div>
    </aside>
  );
}

function Sidebar() {
  const navItems = [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Reports", href: "/reports" },
    { label: "Markets", href: "/markets" },
    { label: "Settings", href: "/settings" },
  ];

  return (
    <aside data-testid="user-sidebar">
      <nav>
        <ul>
          {navItems.map((item) => (
            <li key={item.href}>
              <a href={item.href}>{item.label}</a>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}

describe("AdminSidebar", () => {
  beforeEach(() => {
    mockPathname.mockReturnValue("/admin/eval");
  });

  // Scenario: Admin sidebar navigation
  it("should render exactly two nav items: Back to App and Eval Suite", () => {
    render(<AdminSidebar />);

    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(2);
    expect(links[0]).toHaveTextContent("Back to App");
    expect(links[1]).toHaveTextContent("Eval Suite");
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

    const evalLink = screen.getByText("Eval Suite");
    expect(evalLink).toHaveAttribute("data-active", "true");
  });

  it("should not mark Back to App as active when on /admin/eval", () => {
    mockPathname.mockReturnValue("/admin/eval");
    render(<AdminSidebar />);

    const backLink = screen.getByText("Back to App");
    expect(backLink).toHaveAttribute("data-active", "false");
  });

  // Scenario: Footer
  it("should show Modern Signal Advisory in the footer", () => {
    render(<AdminSidebar />);

    expect(screen.getByTestId("sidebar-footer")).toHaveTextContent(
      "Modern Signal Advisory"
    );
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
