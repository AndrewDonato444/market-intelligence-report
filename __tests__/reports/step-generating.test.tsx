import "@testing-library/jest-dom";
import { render, screen, fireEvent, waitFor, act, cleanup } from "@testing-library/react";
import React from "react";
import fs from "fs";
import path from "path";

// Mock framer-motion
jest.mock("framer-motion", () => {
  const React = require("react");
  return {
    motion: {
      div: React.forwardRef(({ initial, animate, exit, variants, whileTap, custom, ...props }: Record<string, unknown>, ref: React.Ref<HTMLDivElement>) => React.createElement("div", { ...props, ref })),
      button: React.forwardRef(({ initial, animate, exit, variants, whileTap, custom, ...props }: Record<string, unknown>, ref: React.Ref<HTMLButtonElement>) => React.createElement("button", { ...props, ref })),
    },
    AnimatePresence: ({ children }: { children: React.ReactNode }) => React.createElement(React.Fragment, null, children),
  };
});

// Mock next/navigation
const mockPush = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

// --- Branded agent names (from spec) ---
const BRANDED_AGENTS = [
  "Chief Architect",
  "Intelligence Analyst",
  "Market Strategist",
  "Editorial Director",
  "Client Communication Strategist",
  "Social Media Strategist",
];

// --- Mock progress responses ---

function makeProgressResponse(overrides: Record<string, unknown> = {}) {
  return {
    reportId: "report-123",
    reportStatus: "generating",
    pipeline: {
      status: "running",
      totalAgents: 4,
      completedAgents: 1,
      currentAgents: ["insight-generator"],
      percentComplete: 30,
    },
    ...overrides,
  };
}

function makeQueuedResponse() {
  return makeProgressResponse({
    reportStatus: "queued",
    pipeline: {
      status: "pending",
      totalAgents: 4,
      completedAgents: 0,
      currentAgents: [],
      percentComplete: 0,
    },
  });
}

function makeDataFetchRunningResponse() {
  return makeProgressResponse({
    reportStatus: "generating",
    pipeline: {
      status: "running",
      totalAgents: 4,
      completedAgents: 0,
      currentAgents: [],
      percentComplete: 0,
    },
  });
}

function makeCompletedResponse() {
  return makeProgressResponse({
    reportStatus: "completed",
    pipeline: {
      status: "completed",
      totalAgents: 4,
      completedAgents: 4,
      currentAgents: [],
      percentComplete: 100,
    },
  });
}

function makeFailedResponse() {
  return makeProgressResponse({
    reportStatus: "failed",
    pipeline: {
      status: "failed",
      totalAgents: 4,
      completedAgents: 2,
      currentAgents: [],
      percentComplete: 40,
    },
  });
}

describe("Step 6: Agent Processing Animation (#157)", () => {
  describe("File structure", () => {
    it("CMP-157-01: has StepGenerating component", () => {
      expect(fs.existsSync(path.join(process.cwd(), "components/reports/steps/step-generating.tsx"))).toBe(true);
    });

    it("CMP-157-02: has agent processing animation spec file", () => {
      expect(fs.existsSync(path.join(process.cwd(), ".specs/features/ux-redesign/agent-processing-animation.feature.md"))).toBe(true);
    });
  });

  describe("StepGenerating — Branded Agent Animation", () => {
    let StepGenerating: React.ComponentType<{
      reportId: string;
      reportTitle: string;
      onStepComplete: () => void;
      onValidationChange?: (valid: boolean) => void;
    }>;

    beforeAll(async () => {
      const mod = await import("@/components/reports/steps/step-generating");
      StepGenerating = mod.StepGenerating;
    });

    const originalFetch = global.fetch;

    beforeEach(() => {
      jest.useFakeTimers();
      // Ensure global.fetch exists for spyOn
      if (!global.fetch) global.fetch = originalFetch ?? (jest.fn() as any);
    });

    afterEach(() => {
      cleanup();
      jest.useRealTimers();
      jest.restoreAllMocks();
      mockPush.mockClear();
      global.fetch = originalFetch;
    });

    function renderStep(overrides: Record<string, unknown> = {}) {
      jest.spyOn(global, "fetch").mockImplementation(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(makeProgressResponse()),
        } as Response)
      );

      const defaultProps = {
        reportId: "report-123",
        reportTitle: "Naples Luxury Market Intelligence Report",
        onStepComplete: jest.fn(),
        onValidationChange: jest.fn(),
      };
      const props = { ...defaultProps, ...overrides };
      return { ...render(React.createElement(StepGenerating, props as any)), props };
    }

    // -----------------------------------------------------------------------
    // Branded heading and subtitle
    // -----------------------------------------------------------------------

    it("CMP-157-03: shows branded heading during generation", async () => {
      await act(async () => { renderStep(); });
      expect(screen.getByText("Your Advisory Team Is On It")).toBeInTheDocument();
    });

    it("CMP-157-04: shows branded subtitle", async () => {
      await act(async () => { renderStep(); });
      expect(screen.getByText(/Six specialists are building your intelligence report/)).toBeInTheDocument();
    });

    it("CMP-157-05: renders accent divider", async () => {
      await act(async () => { renderStep(); });
      expect(document.querySelector(".bg-\\[var\\(--color-app-accent\\)\\]")).toBeInTheDocument();
    });

    // -----------------------------------------------------------------------
    // 6 branded agent cards
    // -----------------------------------------------------------------------

    it("CMP-157-06: shows all 6 branded agent names", async () => {
      await act(async () => { renderStep(); });
      for (const name of BRANDED_AGENTS) {
        // Some agent names may appear in both the card and the status line
        const matches = screen.getAllByText(name);
        expect(matches.length).toBeGreaterThanOrEqual(1);
      }
    });

    it("CMP-157-07: shows agent descriptions", async () => {
      await act(async () => { renderStep(); });
      // Pending agents show their role descriptions
      expect(screen.getByText(/90-day projections/i)).toBeInTheDocument();
      expect(screen.getByText(/institutional publication/i)).toBeInTheDocument();
      expect(screen.getByText(/client communication suite/i)).toBeInTheDocument();
      expect(screen.getByText(/complete social media strategy/i)).toBeInTheDocument();
    });

    it("CMP-157-07b: shows Pro badge on virtual agents", async () => {
      await act(async () => { renderStep(); });
      const proBadges = screen.getAllByText("Pro");
      expect(proBadges).toHaveLength(2);
    });

    // -----------------------------------------------------------------------
    // Progress bar
    // -----------------------------------------------------------------------

    it("CMP-157-08: shows progress percentage", async () => {
      await act(async () => { renderStep(); });
      await waitFor(() => {
        // 30% raw agent → 20 + 30*0.8 = 44%
        expect(screen.getByText(/44%/)).toBeInTheDocument();
      });
    });

    it("CMP-157-09: shows estimated time remaining during generation", async () => {
      await act(async () => { renderStep(); });
      await waitFor(() => {
        expect(screen.getByText(/remaining/i)).toBeInTheDocument();
      });
    });

    // -----------------------------------------------------------------------
    // Agent status mapping — active description
    // -----------------------------------------------------------------------

    it("CMP-157-10: shows active description for running agent", async () => {
      await act(async () => { renderStep(); });
      await waitFor(() => {
        // Intelligence Analyst is running (insight-generator in currentAgents)
        // Description appears in both card and status line
        const matches = screen.getAllByText(/transaction patterns.*strategic narratives/i);
        expect(matches.length).toBeGreaterThanOrEqual(1);
      });
    });

    // -----------------------------------------------------------------------
    // Polling
    // -----------------------------------------------------------------------

    it("CMP-157-11: polls for progress", async () => {
      await act(async () => { renderStep(); });
      expect(global.fetch).toHaveBeenCalledTimes(1);
      await act(async () => {
        jest.advanceTimersByTime(3000);
      });
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    it("CMP-157-12: stops polling when completed", async () => {
      jest.spyOn(global, "fetch").mockImplementation(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(makeCompletedResponse()),
        } as Response)
      );

      await act(async () => {
        render(
          React.createElement(StepGenerating, {
            reportId: "report-123",
            reportTitle: "Test Report",
            onStepComplete: jest.fn(),
            onValidationChange: jest.fn(),
          } as any)
        );
      });

      const callCountAfterMount = (global.fetch as jest.Mock).mock.calls.length;

      await act(async () => {
        jest.advanceTimersByTime(6000);
      });

      expect((global.fetch as jest.Mock).mock.calls.length).toBe(callCountAfterMount);
    });

    // -----------------------------------------------------------------------
    // Completed state
    // -----------------------------------------------------------------------

    it("CMP-157-13: shows 'Your Report Is Ready' heading when completed", async () => {
      jest.spyOn(global, "fetch").mockImplementation(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(makeCompletedResponse()),
        } as Response)
      );

      await act(async () => {
        render(
          React.createElement(StepGenerating, {
            reportId: "report-123",
            reportTitle: "Test Report",
            onStepComplete: jest.fn(),
            onValidationChange: jest.fn(),
          } as any)
        );
      });

      expect(screen.getByText("Your Report Is Ready")).toBeInTheDocument();
    });

    it("CMP-157-14: shows View Report button when completed", async () => {
      jest.spyOn(global, "fetch").mockImplementation(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(makeCompletedResponse()),
        } as Response)
      );

      await act(async () => {
        render(
          React.createElement(StepGenerating, {
            reportId: "report-123",
            reportTitle: "Test Report",
            onStepComplete: jest.fn(),
            onValidationChange: jest.fn(),
          } as any)
        );
      });

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /View Report/i })).toBeInTheDocument();
      });
    });

    it("CMP-157-15: View Report navigates to report page", async () => {
      jest.spyOn(global, "fetch").mockImplementation(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(makeCompletedResponse()),
        } as Response)
      );

      await act(async () => {
        render(
          React.createElement(StepGenerating, {
            reportId: "report-123",
            reportTitle: "Test Report",
            onStepComplete: jest.fn(),
            onValidationChange: jest.fn(),
          } as any)
        );
      });

      await waitFor(() => {
        const btn = screen.getByRole("button", { name: /View Report/i });
        fireEvent.click(btn);
      });

      expect(mockPush).toHaveBeenCalledWith("/reports/report-123");
    });

    it("CMP-157-16: shows 100% when completed", async () => {
      jest.spyOn(global, "fetch").mockImplementation(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(makeCompletedResponse()),
        } as Response)
      );

      await act(async () => {
        render(
          React.createElement(StepGenerating, {
            reportId: "report-123",
            reportTitle: "Test Report",
            onStepComplete: jest.fn(),
            onValidationChange: jest.fn(),
          } as any)
        );
      });

      await waitFor(() => {
        expect(screen.getByText(/100%/)).toBeInTheDocument();
      });
    });

    // -----------------------------------------------------------------------
    // Failed state
    // -----------------------------------------------------------------------

    it("CMP-157-17: shows failure heading when failed", async () => {
      jest.spyOn(global, "fetch").mockImplementation(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(makeFailedResponse()),
        } as Response)
      );

      await act(async () => {
        render(
          React.createElement(StepGenerating, {
            reportId: "report-123",
            reportTitle: "Test Report",
            onStepComplete: jest.fn(),
            onValidationChange: jest.fn(),
          } as any)
        );
      });

      await waitFor(() => {
        expect(screen.getByText("Generation Hit a Snag")).toBeInTheDocument();
      });
    });

    it("CMP-157-18: shows Try Again button when failed", async () => {
      jest.spyOn(global, "fetch").mockImplementation(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(makeFailedResponse()),
        } as Response)
      );

      await act(async () => {
        render(
          React.createElement(StepGenerating, {
            reportId: "report-123",
            reportTitle: "Test Report",
            onStepComplete: jest.fn(),
            onValidationChange: jest.fn(),
          } as any)
        );
      });

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /Try Again/i })).toBeInTheDocument();
      });
    });

    it("CMP-157-19: Try Again triggers regeneration", async () => {
      const fetchMock = jest.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(makeFailedResponse()),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ reportId: "report-123", status: "generating" }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(makeProgressResponse()),
        } as Response);

      jest.spyOn(global, "fetch").mockImplementation(fetchMock);

      await act(async () => {
        render(
          React.createElement(StepGenerating, {
            reportId: "report-123",
            reportTitle: "Test Report",
            onStepComplete: jest.fn(),
            onValidationChange: jest.fn(),
          } as any)
        );
      });

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /Try Again/i })).toBeInTheDocument();
      });

      await act(async () => {
        fireEvent.click(screen.getByRole("button", { name: /Try Again/i }));
      });

      await waitFor(() => {
        const calls = (global.fetch as jest.Mock).mock.calls;
        const generateCall = calls.find((c: unknown[]) => {
          const url = typeof c[0] === "string" ? c[0] : "";
          const opts = c[1] as RequestInit | undefined;
          return url.includes("/generate") && opts?.method === "POST";
        });
        expect(generateCall).toBeTruthy();
      });
    });

    // -----------------------------------------------------------------------
    // Validation callback
    // -----------------------------------------------------------------------

    it("CMP-157-20: calls onValidationChange(true) on mount", async () => {
      const { props } = renderStep();
      await act(async () => {});
      expect(props.onValidationChange).toHaveBeenCalledWith(true);
    });

    // -----------------------------------------------------------------------
    // Agent status progression
    // -----------------------------------------------------------------------

    it("CMP-157-21: Chief Architect shows as running when data-fetch is active", async () => {
      jest.spyOn(global, "fetch").mockImplementation(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(makeDataFetchRunningResponse()),
        } as Response)
      );

      await act(async () => {
        render(
          React.createElement(StepGenerating, {
            reportId: "report-123",
            reportTitle: "Test Report",
            onStepComplete: jest.fn(),
            onValidationChange: jest.fn(),
          } as any)
        );
      });

      await waitFor(() => {
        const chiefCard = document.querySelector('[data-agent-card="chief-architect"]');
        expect(chiefCard).toHaveAttribute("data-status", "running");
      });
    });

    it("CMP-157-22: shows active description for Chief Architect during data fetch", async () => {
      jest.spyOn(global, "fetch").mockImplementation(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(makeDataFetchRunningResponse()),
        } as Response)
      );

      await act(async () => {
        render(
          React.createElement(StepGenerating, {
            reportId: "report-123",
            reportTitle: "Test Report",
            onStepComplete: jest.fn(),
            onValidationChange: jest.fn(),
          } as any)
        );
      });

      await waitFor(() => {
        const matches = screen.getAllByText(/Pulling live transaction records/i);
        expect(matches.length).toBeGreaterThanOrEqual(1);
      });
    });

    it("CMP-157-23: completed agents show completed status", async () => {
      // insight-generator running means data-fetch (Chief Architect) completed
      await act(async () => { renderStep(); });

      await waitFor(() => {
        const chiefCard = screen.getByText("Chief Architect").closest("[data-agent-card]");
        expect(chiefCard).toHaveAttribute("data-status", "completed");
      });
    });

    it("CMP-157-24: virtual agents (5 & 6) show as pending during pipeline", async () => {
      await act(async () => { renderStep(); });

      await waitFor(() => {
        const commCard = screen.getByText("Client Communication Strategist").closest("[data-agent-card]");
        const socialCard = screen.getByText("Social Media Strategist").closest("[data-agent-card]");
        expect(commCard).toHaveAttribute("data-status", "pending");
        expect(socialCard).toHaveAttribute("data-status", "pending");
      });
    });

    it("CMP-157-25: all agents show completed when report completes", async () => {
      jest.spyOn(global, "fetch").mockImplementation(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(makeCompletedResponse()),
        } as Response)
      );

      await act(async () => {
        render(
          React.createElement(StepGenerating, {
            reportId: "report-123",
            reportTitle: "Test Report",
            onStepComplete: jest.fn(),
            onValidationChange: jest.fn(),
          } as any)
        );
      });

      await waitFor(() => {
        const agentCards = document.querySelectorAll("[data-agent-card]");
        agentCards.forEach((card) => {
          expect(card).toHaveAttribute("data-status", "completed");
        });
      });
    });

    // -----------------------------------------------------------------------
    // Active status line
    // -----------------------------------------------------------------------

    it("CMP-157-26: shows contextual status line for active agent", async () => {
      await act(async () => { renderStep(); });
      await waitFor(() => {
        // Intelligence Analyst is active (insight-generator)
        // Name and description appear in both card and status line
        const nameMatches = screen.getAllByText(/Intelligence Analyst/);
        expect(nameMatches.length).toBeGreaterThanOrEqual(2); // card + status line
        const descMatches = screen.getAllByText(/strategic narratives/i);
        expect(descMatches.length).toBeGreaterThanOrEqual(1);
      });
    });

    // -----------------------------------------------------------------------
    // Phase 2: Elapsed time counter
    // -----------------------------------------------------------------------

    it("CMP-157-27: shows elapsed time counter starting at 0:00", async () => {
      await act(async () => { renderStep(); });
      await waitFor(() => {
        const el = document.querySelector("[data-testid='elapsed-time']");
        expect(el).toBeInTheDocument();
        expect(el?.textContent).toBe("0:00");
      });
    });

    it("CMP-157-28: elapsed counter increments every second", async () => {
      await act(async () => { renderStep(); });
      const el = document.querySelector("[data-testid='elapsed-time']");
      expect(el?.textContent).toBe("0:00");

      await act(async () => {
        jest.advanceTimersByTime(5000);
      });

      expect(el?.textContent).toBe("0:05");
    });

    it("CMP-157-29: elapsed counter stops when completed", async () => {
      const fetchMock = jest.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(makeProgressResponse()),
        } as Response)
        .mockResolvedValue({
          ok: true,
          json: () => Promise.resolve(makeCompletedResponse()),
        } as Response);

      jest.spyOn(global, "fetch").mockImplementation(fetchMock);

      await act(async () => {
        render(
          React.createElement(StepGenerating, {
            reportId: "report-123",
            reportTitle: "Test Report",
            onStepComplete: jest.fn(),
            onValidationChange: jest.fn(),
          } as any)
        );
      });

      // Advance past first poll to get completed state
      await act(async () => {
        jest.advanceTimersByTime(3000);
      });

      // Capture the elapsed time
      await waitFor(() => {
        expect(screen.getByText("Your Report Is Ready")).toBeInTheDocument();
      });

      const elapsedEl = document.querySelector("[data-testid='elapsed-time']");
      const frozenTime = elapsedEl?.textContent;

      // Advance more time — counter should NOT change
      await act(async () => {
        jest.advanceTimersByTime(5000);
      });

      expect(elapsedEl?.textContent).toBe(frozenTime);
    });

    it("CMP-157-30: elapsed counter uses monospace font", async () => {
      await act(async () => { renderStep(); });
      await waitFor(() => {
        const el = document.querySelector("[data-testid='elapsed-time']");
        expect(el).toBeInTheDocument();
        expect(el?.className).toContain("font-mono");
      });
    });

    // -----------------------------------------------------------------------
    // Phase 2: Activity log
    // -----------------------------------------------------------------------

    it("CMP-157-31: renders activity log container during generation", async () => {
      await act(async () => { renderStep(); });
      await waitFor(() => {
        const log = document.querySelector("[data-testid='activity-log']");
        expect(log).toBeInTheDocument();
      });
    });

    it("CMP-157-32: activity log adds entries over time", async () => {
      await act(async () => { renderStep(); });

      // Initially should have at least one entry (seeded on mount)
      await waitFor(() => {
        const entries = document.querySelectorAll("[data-testid='activity-log'] [data-testid='log-entry']");
        expect(entries.length).toBeGreaterThanOrEqual(1);
      });

      // Advance 6 seconds — should add 2-3 more entries (every 2-3s)
      await act(async () => {
        jest.advanceTimersByTime(6000);
      });

      const entries = document.querySelectorAll("[data-testid='activity-log'] [data-testid='log-entry']");
      expect(entries.length).toBeGreaterThanOrEqual(3);
    });

    it("CMP-157-33: activity log entries have timestamp and message", async () => {
      await act(async () => { renderStep(); });

      await waitFor(() => {
        const firstEntry = document.querySelector("[data-testid='log-entry']");
        expect(firstEntry).toBeInTheDocument();
        // Should contain a timestamp like "0:00" or "0:01"
        expect(firstEntry?.textContent).toMatch(/\d+:\d{2}/);
      });
    });

    it("CMP-157-34: activity log hidden when completed", async () => {
      jest.spyOn(global, "fetch").mockImplementation(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(makeCompletedResponse()),
        } as Response)
      );

      await act(async () => {
        render(
          React.createElement(StepGenerating, {
            reportId: "report-123",
            reportTitle: "Test Report",
            onStepComplete: jest.fn(),
            onValidationChange: jest.fn(),
          } as any)
        );
      });

      expect(document.querySelector("[data-testid='activity-log']")).not.toBeInTheDocument();
    });

    it("CMP-157-35: activity log hidden when failed", async () => {
      jest.spyOn(global, "fetch").mockImplementation(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(makeFailedResponse()),
        } as Response)
      );

      await act(async () => {
        render(
          React.createElement(StepGenerating, {
            reportId: "report-123",
            reportTitle: "Test Report",
            onStepComplete: jest.fn(),
            onValidationChange: jest.fn(),
          } as any)
        );
      });

      expect(document.querySelector("[data-testid='activity-log']")).not.toBeInTheDocument();
    });

    // -----------------------------------------------------------------------
    // Phase 2: Progress bar shimmer
    // -----------------------------------------------------------------------

    it("CMP-157-36: progress bar has shimmer overlay during generation", async () => {
      await act(async () => { renderStep(); });
      await waitFor(() => {
        const shimmer = document.querySelector("[data-testid='progress-shimmer']");
        expect(shimmer).toBeInTheDocument();
      });
    });

    it("CMP-157-37: progress bar shimmer hidden when completed", async () => {
      jest.spyOn(global, "fetch").mockImplementation(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(makeCompletedResponse()),
        } as Response)
      );

      await act(async () => {
        render(
          React.createElement(StepGenerating, {
            reportId: "report-123",
            reportTitle: "Test Report",
            onStepComplete: jest.fn(),
            onValidationChange: jest.fn(),
          } as any)
        );
      });

      expect(document.querySelector("[data-testid='progress-shimmer']")).not.toBeInTheDocument();
    });

    it("CMP-157-38: progress bar shimmer hidden when failed", async () => {
      jest.spyOn(global, "fetch").mockImplementation(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(makeFailedResponse()),
        } as Response)
      );

      await act(async () => {
        render(
          React.createElement(StepGenerating, {
            reportId: "report-123",
            reportTitle: "Test Report",
            onStepComplete: jest.fn(),
            onValidationChange: jest.fn(),
          } as any)
        );
      });

      expect(document.querySelector("[data-testid='progress-shimmer']")).not.toBeInTheDocument();
    });
  });
});
