/**
 * Unified Content Studio Tests
 *
 * Tests for merging Social Media Kit + Email Campaigns into
 * a single tabbed Content Studio at /reports/[id]/kit.
 *
 * Spec: .specs/features/content-studio/unified-content-studio.feature.md
 */

import "@testing-library/jest-dom";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";

// ---------------------------------------------------------------------------
// Mocks — Next.js
// ---------------------------------------------------------------------------

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({
    href,
    children,
    ...props
  }: {
    href: string;
    children: React.ReactNode;
    [key: string]: unknown;
  }) => React.createElement("a", { href, ...props }, children),
}));

jest.mock("next/navigation", () => ({
  useSearchParams: () => mockSearchParams,
  useRouter: () => mockRouter,
  usePathname: () => "/reports/test-report-id/kit",
  redirect: jest.fn(),
  notFound: jest.fn(),
}));

// ---------------------------------------------------------------------------
// Mocks — Services & Auth
// ---------------------------------------------------------------------------

jest.mock("@/lib/supabase/auth", () => ({
  getAuthUserId: () => Promise.resolve("test-user-id"),
}));

jest.mock("@/lib/services/report", () => ({
  getReportWithMarket: () =>
    Promise.resolve({
      id: "test-report-id",
      status: "completed",
      title: "Naples Luxury Market Q1 2026",
    }),
}));

jest.mock("@/lib/services/social-media-kit", () => ({
  getSocialMediaKit: () => Promise.resolve(mockKitData),
}));

jest.mock("@/lib/services/email-campaign", () => ({
  getEmailCampaign: () => Promise.resolve(mockEmailData),
}));

jest.mock("@/lib/services/entitlement-check", () => ({
  checkEntitlement: (_userId: string, type: string) => {
    if (type === "social_media_kits") return Promise.resolve(mockKitEntitlement);
    if (type === "email_campaigns") return Promise.resolve(mockEmailEntitlement);
    return Promise.resolve({ allowed: true, limit: 5, used: 0, remaining: 5 });
  },
}));

// Mock KitViewer and EmailCampaignViewer as simple stubs — we're testing
// the tabbed wrapper, not the individual viewer internals (those have their own tests).
jest.mock("@/components/reports/kit-viewer", () => ({
  KitViewer: ({ reportId }: { reportId: string }) =>
    React.createElement("div", { "data-testid": "kit-viewer" }, `KitViewer:${reportId}`),
}));

jest.mock("@/components/reports/email-viewer", () => ({
  EmailCampaignViewer: ({ reportId }: { reportId: string }) =>
    React.createElement("div", { "data-testid": "email-viewer" }, `EmailViewer:${reportId}`),
}));

jest.mock("@/components/reports/generate-kit-button", () => ({
  GenerateKitButton: ({ reportId }: { reportId: string }) =>
    React.createElement("button", { "data-testid": "generate-kit-btn" }, `Generate Kit:${reportId}`),
}));

jest.mock("@/components/reports/generate-email-button", () => ({
  GenerateEmailButton: ({ reportId }: { reportId: string }) =>
    React.createElement("button", { "data-testid": "generate-email-btn" }, `Generate Email:${reportId}`),
}));

// ---------------------------------------------------------------------------
// Mock data & state
// ---------------------------------------------------------------------------

let mockSearchParams = new URLSearchParams("");
const mockRouter = {
  push: jest.fn(),
  replace: jest.fn((...args: unknown[]) => {
    // Simulate Next.js behavior: router.replace updates searchParams
    const url = typeof args[0] === "string" ? args[0] : "";
    const qsIndex = url.indexOf("?");
    mockSearchParams = new URLSearchParams(qsIndex >= 0 ? url.slice(qsIndex) : "");
  }),
  back: jest.fn(),
  forward: jest.fn(),
  refresh: jest.fn(),
  prefetch: jest.fn(),
};

let mockKitData: {
  status: string;
  content: Record<string, unknown> | null;
  generatedAt: Date | null;
  errorMessage: string | null;
} | null = null;

let mockEmailData: {
  status: string;
  content: Record<string, unknown> | null;
  generatedAt: Date | null;
  errorMessage: string | null;
} | null = null;

let mockKitEntitlement = { allowed: true, limit: 5, used: 1, remaining: 4 };
let mockEmailEntitlement = { allowed: true, limit: 5, used: 1, remaining: 4 };

// Minimal valid content objects (actual structure tested in viewer-specific tests)
const COMPLETED_KIT = {
  status: "completed" as const,
  content: { postIdeas: [], captions: [], personaPosts: [], polls: [], conversationStarters: [], calendarSuggestions: [], statCallouts: [] },
  generatedAt: new Date("2026-03-17T12:00:00Z"),
  errorMessage: null,
};

const COMPLETED_EMAIL = {
  status: "completed" as const,
  content: { dripSequence: [], newsletter: {}, personaEmails: [], subjectLines: [], ctaBlocks: [], reEngagementEmails: [] },
  generatedAt: new Date("2026-03-17T12:00:00Z"),
  errorMessage: null,
};

const GENERATING_STATUS = {
  status: "generating" as const,
  content: null,
  generatedAt: null,
  errorMessage: null,
};

const FAILED_STATUS = {
  status: "failed" as const,
  content: null,
  generatedAt: null,
  errorMessage: "Agent timed out",
};

// ---------------------------------------------------------------------------
// Import component under test (dynamic to pick up mocks)
// ---------------------------------------------------------------------------

let ContentStudioPage: React.ComponentType<{
  reportId: string;
  kitStatus: string | null;
  kitContent: Record<string, unknown> | null;
  kitGeneratedAt: string | null;
  emailStatus: string | null;
  emailContent: Record<string, unknown> | null;
  emailGeneratedAt: string | null;
  kitEntitlement: { allowed: boolean; limit: number };
  emailEntitlement: { allowed: boolean; limit: number };
}>;

beforeAll(async () => {
  const mod = await import("@/components/reports/content-studio-page");
  ContentStudioPage = mod.ContentStudioPage;
});

beforeEach(() => {
  jest.clearAllMocks();
  mockSearchParams = new URLSearchParams("");
  mockKitData = { ...COMPLETED_KIT };
  mockEmailData = { ...COMPLETED_EMAIL };
  mockKitEntitlement = { allowed: true, limit: 5, used: 1, remaining: 4 };
  mockEmailEntitlement = { allowed: true, limit: 5, used: 1, remaining: 4 };
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("Unified Content Studio", () => {
  // -------------------------------------------------------------------------
  // CMP-CS-001: Default tab is Social Media
  // -------------------------------------------------------------------------
  describe("CMP-CS-001: Default tab rendering", () => {
    it("shows Content Studio header with two tabs", () => {
      render(
        <ContentStudioPage
          reportId="test-report-id"
          kitStatus="completed"
          kitContent={COMPLETED_KIT.content}
          kitGeneratedAt={COMPLETED_KIT.generatedAt!.toISOString()}
          emailStatus="completed"
          emailContent={COMPLETED_EMAIL.content as Record<string, unknown>}
          emailGeneratedAt={COMPLETED_EMAIL.generatedAt!.toISOString()}
          kitEntitlement={{ allowed: true, limit: 5 }}
          emailEntitlement={{ allowed: true, limit: 5 }}
        />
      );

      expect(screen.getByText("Content Studio")).toBeInTheDocument();
      expect(screen.getByText("Social Media")).toBeInTheDocument();
      expect(screen.getByText("Email Campaigns")).toBeInTheDocument();
    });

    it("shows Social Media tab as active by default", () => {
      render(
        <ContentStudioPage
          reportId="test-report-id"
          kitStatus="completed"
          kitContent={COMPLETED_KIT.content}
          kitGeneratedAt={COMPLETED_KIT.generatedAt!.toISOString()}
          emailStatus="completed"
          emailContent={COMPLETED_EMAIL.content as Record<string, unknown>}
          emailGeneratedAt={COMPLETED_EMAIL.generatedAt!.toISOString()}
          kitEntitlement={{ allowed: true, limit: 5 }}
          emailEntitlement={{ allowed: true, limit: 5 }}
        />
      );

      expect(screen.getByTestId("kit-viewer")).toBeInTheDocument();
      expect(screen.queryByTestId("email-viewer")).not.toBeInTheDocument();
    });
  });

  // -------------------------------------------------------------------------
  // CMP-CS-002: Tab switching
  // -------------------------------------------------------------------------
  describe("CMP-CS-002: Tab switching", () => {
    it("calls router.replace with ?tab=email when Email Campaigns tab is clicked", () => {
      render(
        <ContentStudioPage
          reportId="test-report-id"
          kitStatus="completed"
          kitContent={COMPLETED_KIT.content}
          kitGeneratedAt={COMPLETED_KIT.generatedAt!.toISOString()}
          emailStatus="completed"
          emailContent={COMPLETED_EMAIL.content as Record<string, unknown>}
          emailGeneratedAt={COMPLETED_EMAIL.generatedAt!.toISOString()}
          kitEntitlement={{ allowed: true, limit: 5 }}
          emailEntitlement={{ allowed: true, limit: 5 }}
        />
      );

      fireEvent.click(screen.getByText("Email Campaigns"));

      expect(mockRouter.replace).toHaveBeenCalledWith(
        expect.stringContaining("tab=email"),
        expect.anything()
      );
    });

    it("shows email viewer when tab=email is active", () => {
      mockSearchParams = new URLSearchParams("tab=email");

      render(
        <ContentStudioPage
          reportId="test-report-id"
          kitStatus="completed"
          kitContent={COMPLETED_KIT.content}
          kitGeneratedAt={COMPLETED_KIT.generatedAt!.toISOString()}
          emailStatus="completed"
          emailContent={COMPLETED_EMAIL.content as Record<string, unknown>}
          emailGeneratedAt={COMPLETED_EMAIL.generatedAt!.toISOString()}
          kitEntitlement={{ allowed: true, limit: 5 }}
          emailEntitlement={{ allowed: true, limit: 5 }}
        />
      );

      expect(screen.getByTestId("email-viewer")).toBeInTheDocument();
      expect(screen.queryByTestId("kit-viewer")).not.toBeInTheDocument();
    });

    it("calls router.replace without tab param when switching back to Social Media", () => {
      mockSearchParams = new URLSearchParams("tab=email");

      render(
        <ContentStudioPage
          reportId="test-report-id"
          kitStatus="completed"
          kitContent={COMPLETED_KIT.content}
          kitGeneratedAt={COMPLETED_KIT.generatedAt!.toISOString()}
          emailStatus="completed"
          emailContent={COMPLETED_EMAIL.content as Record<string, unknown>}
          emailGeneratedAt={COMPLETED_EMAIL.generatedAt!.toISOString()}
          kitEntitlement={{ allowed: true, limit: 5 }}
          emailEntitlement={{ allowed: true, limit: 5 }}
        />
      );

      fireEvent.click(screen.getByText("Social Media"));

      expect(mockRouter.replace).toHaveBeenCalledWith(
        expect.not.stringContaining("tab="),
        expect.anything()
      );
    });
  });

  // -------------------------------------------------------------------------
  // CMP-CS-003: Deep link to email tab
  // -------------------------------------------------------------------------
  describe("CMP-CS-003: Deep link via ?tab=email", () => {
    it("opens Email Campaigns tab when ?tab=email is in URL", () => {
      mockSearchParams = new URLSearchParams("tab=email");

      render(
        <ContentStudioPage
          reportId="test-report-id"
          kitStatus="completed"
          kitContent={COMPLETED_KIT.content}
          kitGeneratedAt={COMPLETED_KIT.generatedAt!.toISOString()}
          emailStatus="completed"
          emailContent={COMPLETED_EMAIL.content as Record<string, unknown>}
          emailGeneratedAt={COMPLETED_EMAIL.generatedAt!.toISOString()}
          kitEntitlement={{ allowed: true, limit: 5 }}
          emailEntitlement={{ allowed: true, limit: 5 }}
        />
      );

      expect(screen.getByTestId("email-viewer")).toBeInTheDocument();
      expect(screen.queryByTestId("kit-viewer")).not.toBeInTheDocument();
    });
  });

  // -------------------------------------------------------------------------
  // CMP-CS-004: Only kit exists (no email campaign)
  // -------------------------------------------------------------------------
  describe("CMP-CS-004: Only social media kit exists", () => {
    it("shows kit viewer on Social Media tab", () => {
      render(
        <ContentStudioPage
          reportId="test-report-id"
          kitStatus="completed"
          kitContent={COMPLETED_KIT.content}
          kitGeneratedAt={COMPLETED_KIT.generatedAt!.toISOString()}
          emailStatus={null}
          emailContent={null}
          emailGeneratedAt={null}
          kitEntitlement={{ allowed: true, limit: 5 }}
          emailEntitlement={{ allowed: true, limit: 5 }}
        />
      );

      expect(screen.getByTestId("kit-viewer")).toBeInTheDocument();
    });

    it("shows generate CTA on Email tab when no campaign exists", () => {
      mockSearchParams = new URLSearchParams("tab=email");

      render(
        <ContentStudioPage
          reportId="test-report-id"
          kitStatus="completed"
          kitContent={COMPLETED_KIT.content}
          kitGeneratedAt={COMPLETED_KIT.generatedAt!.toISOString()}
          emailStatus={null}
          emailContent={null}
          emailGeneratedAt={null}
          kitEntitlement={{ allowed: true, limit: 5 }}
          emailEntitlement={{ allowed: true, limit: 5 }}
        />
      );

      expect(screen.getByTestId("generate-email-btn")).toBeInTheDocument();
      expect(screen.queryByTestId("email-viewer")).not.toBeInTheDocument();
    });
  });

  // -------------------------------------------------------------------------
  // CMP-CS-005: Only email campaign exists (no kit)
  // -------------------------------------------------------------------------
  describe("CMP-CS-005: Only email campaign exists", () => {
    it("shows generate CTA on Social Media tab when no kit exists", () => {
      render(
        <ContentStudioPage
          reportId="test-report-id"
          kitStatus={null}
          kitContent={null}
          kitGeneratedAt={null}
          emailStatus="completed"
          emailContent={COMPLETED_EMAIL.content as Record<string, unknown>}
          emailGeneratedAt={COMPLETED_EMAIL.generatedAt!.toISOString()}
          kitEntitlement={{ allowed: true, limit: 5 }}
          emailEntitlement={{ allowed: true, limit: 5 }}
        />
      );

      expect(screen.getByTestId("generate-kit-btn")).toBeInTheDocument();
      expect(screen.queryByTestId("kit-viewer")).not.toBeInTheDocument();
    });

    it("shows email viewer on Email tab", () => {
      mockSearchParams = new URLSearchParams("tab=email");

      render(
        <ContentStudioPage
          reportId="test-report-id"
          kitStatus={null}
          kitContent={null}
          kitGeneratedAt={null}
          emailStatus="completed"
          emailContent={COMPLETED_EMAIL.content as Record<string, unknown>}
          emailGeneratedAt={COMPLETED_EMAIL.generatedAt!.toISOString()}
          kitEntitlement={{ allowed: true, limit: 5 }}
          emailEntitlement={{ allowed: true, limit: 5 }}
        />
      );

      expect(screen.getByTestId("email-viewer")).toBeInTheDocument();
    });
  });

  // -------------------------------------------------------------------------
  // CMP-CS-006: Neither content exists
  // -------------------------------------------------------------------------
  describe("CMP-CS-006: Neither content exists", () => {
    it("shows generate kit CTA on Social Media tab", () => {
      render(
        <ContentStudioPage
          reportId="test-report-id"
          kitStatus={null}
          kitContent={null}
          kitGeneratedAt={null}
          emailStatus={null}
          emailContent={null}
          emailGeneratedAt={null}
          kitEntitlement={{ allowed: true, limit: 5 }}
          emailEntitlement={{ allowed: true, limit: 5 }}
        />
      );

      expect(screen.getByText("Content Studio")).toBeInTheDocument();
      expect(screen.getByTestId("generate-kit-btn")).toBeInTheDocument();
    });

    it("shows generate email CTA on Email tab", () => {
      mockSearchParams = new URLSearchParams("tab=email");

      render(
        <ContentStudioPage
          reportId="test-report-id"
          kitStatus={null}
          kitContent={null}
          kitGeneratedAt={null}
          emailStatus={null}
          emailContent={null}
          emailGeneratedAt={null}
          kitEntitlement={{ allowed: true, limit: 5 }}
          emailEntitlement={{ allowed: true, limit: 5 }}
        />
      );

      expect(screen.getByTestId("generate-email-btn")).toBeInTheDocument();
    });
  });

  // -------------------------------------------------------------------------
  // CMP-CS-007: Generating status on email tab
  // -------------------------------------------------------------------------
  describe("CMP-CS-007: Generating status per tab", () => {
    it("shows kit viewer on Social Media tab", () => {
      render(
        <ContentStudioPage
          reportId="test-report-id"
          kitStatus="completed"
          kitContent={COMPLETED_KIT.content}
          kitGeneratedAt={COMPLETED_KIT.generatedAt!.toISOString()}
          emailStatus="generating"
          emailContent={null}
          emailGeneratedAt={null}
          kitEntitlement={{ allowed: true, limit: 5 }}
          emailEntitlement={{ allowed: true, limit: 5 }}
        />
      );

      expect(screen.getByTestId("kit-viewer")).toBeInTheDocument();
    });

    it("shows generating state on Email tab", () => {
      mockSearchParams = new URLSearchParams("tab=email");

      render(
        <ContentStudioPage
          reportId="test-report-id"
          kitStatus="completed"
          kitContent={COMPLETED_KIT.content}
          kitGeneratedAt={COMPLETED_KIT.generatedAt!.toISOString()}
          emailStatus="generating"
          emailContent={null}
          emailGeneratedAt={null}
          kitEntitlement={{ allowed: true, limit: 5 }}
          emailEntitlement={{ allowed: true, limit: 5 }}
        />
      );

      expect(screen.getByTestId("generate-email-btn")).toBeInTheDocument();
    });
  });

  // -------------------------------------------------------------------------
  // CMP-CS-008: Entitlement gating — Starter tier
  // -------------------------------------------------------------------------
  describe("CMP-CS-008: Entitlement gating", () => {
    it("shows upgrade prompt on Social Media tab for Starter tier", () => {
      render(
        <ContentStudioPage
          reportId="test-report-id"
          kitStatus={null}
          kitContent={null}
          kitGeneratedAt={null}
          emailStatus={null}
          emailContent={null}
          emailGeneratedAt={null}
          kitEntitlement={{ allowed: false, limit: 0 }}
          emailEntitlement={{ allowed: false, limit: 0 }}
        />
      );

      expect(screen.getByText(/social media kit.*professional feature/i)).toBeInTheDocument();
      expect(screen.queryByTestId("generate-kit-btn")).not.toBeInTheDocument();
    });

    it("shows upgrade prompt on Email tab for Starter tier", () => {
      mockSearchParams = new URLSearchParams("tab=email");

      render(
        <ContentStudioPage
          reportId="test-report-id"
          kitStatus={null}
          kitContent={null}
          kitGeneratedAt={null}
          emailStatus={null}
          emailContent={null}
          emailGeneratedAt={null}
          kitEntitlement={{ allowed: false, limit: 0 }}
          emailEntitlement={{ allowed: false, limit: 0 }}
        />
      );

      expect(screen.getByText(/email campaigns.*professional feature/i)).toBeInTheDocument();
      expect(screen.queryByTestId("generate-email-btn")).not.toBeInTheDocument();
    });
  });

  // -------------------------------------------------------------------------
  // CMP-CS-009: Back to Report link
  // -------------------------------------------------------------------------
  describe("CMP-CS-009: Navigation", () => {
    it("shows Back to Report link pointing to report detail", () => {
      render(
        <ContentStudioPage
          reportId="test-report-id"
          kitStatus="completed"
          kitContent={COMPLETED_KIT.content}
          kitGeneratedAt={COMPLETED_KIT.generatedAt!.toISOString()}
          emailStatus="completed"
          emailContent={COMPLETED_EMAIL.content as Record<string, unknown>}
          emailGeneratedAt={COMPLETED_EMAIL.generatedAt!.toISOString()}
          kitEntitlement={{ allowed: true, limit: 5 }}
          emailEntitlement={{ allowed: true, limit: 5 }}
        />
      );

      const backLink = screen.getByText(/back to report/i);
      expect(backLink).toBeInTheDocument();
      expect(backLink.closest("a")).toHaveAttribute("href", "/reports/test-report-id");
    });
  });

  // -------------------------------------------------------------------------
  // CMP-CS-010: Failed email campaign shows error on tab
  // -------------------------------------------------------------------------
  describe("CMP-CS-010: Failed status per tab", () => {
    it("shows failed state with retry on Email tab when campaign failed", () => {
      mockSearchParams = new URLSearchParams("tab=email");

      render(
        <ContentStudioPage
          reportId="test-report-id"
          kitStatus="completed"
          kitContent={COMPLETED_KIT.content}
          kitGeneratedAt={COMPLETED_KIT.generatedAt!.toISOString()}
          emailStatus="failed"
          emailContent={null}
          emailGeneratedAt={null}
          kitEntitlement={{ allowed: true, limit: 5 }}
          emailEntitlement={{ allowed: true, limit: 5 }}
        />
      );

      // Email tab shows generate button (handles failed state)
      expect(screen.getByTestId("generate-email-btn")).toBeInTheDocument();
    });
  });
});
