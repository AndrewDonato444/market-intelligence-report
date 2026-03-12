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
      div: React.forwardRef(({ initial, animate, exit, variants, whileTap, ...props }: Record<string, unknown>, ref: React.Ref<HTMLDivElement>) => React.createElement("div", { ...props, ref })),
      button: React.forwardRef(({ initial, animate, exit, variants, whileTap, ...props }: Record<string, unknown>, ref: React.Ref<HTMLButtonElement>) => React.createElement("button", { ...props, ref })),
    },
    AnimatePresence: ({ children }: { children: React.ReactNode }) => React.createElement(React.Fragment, null, children),
  };
});

// Mock next/navigation
const mockPush = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

// --- Mock progress responses ---

function makeProgressResponse(overrides: Record<string, unknown> = {}) {
  return {
    reportId: "report-123",
    reportStatus: "generating",
    pipeline: {
      status: "running",
      totalAgents: 5,
      completedAgents: 1,
      currentAgents: ["insight-generator"],
      percentComplete: 30,
    },
    ...overrides,
  };
}

function makeCompletedResponse() {
  return makeProgressResponse({
    reportStatus: "completed",
    pipeline: {
      status: "completed",
      totalAgents: 5,
      completedAgents: 5,
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
      totalAgents: 5,
      completedAgents: 2,
      currentAgents: [],
      percentComplete: 40,
    },
  });
}

describe("Step 6: Generating (#157)", () => {
  describe("File structure", () => {
    it("CMP-157-01: has StepGenerating component", () => {
      expect(fs.existsSync(path.join(process.cwd(), "components/reports/steps/step-generating.tsx"))).toBe(true);
    });

    it("CMP-157-02: has spec file", () => {
      expect(fs.existsSync(path.join(process.cwd(), ".specs/features/ux-redesign/step-6-generating.feature.md"))).toBe(true);
    });
  });

  describe("StepGenerating", () => {
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

    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      cleanup();
      jest.useRealTimers();
      jest.restoreAllMocks();
      mockPush.mockClear();
    });

    function renderStep(overrides: Record<string, unknown> = {}) {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(makeProgressResponse()),
        } as Response)
      ) as jest.Mock;

      const defaultProps = {
        reportId: "report-123",
        reportTitle: "Naples Luxury Market Intelligence Report",
        onStepComplete: jest.fn(),
        onValidationChange: jest.fn(),
      };
      const props = { ...defaultProps, ...overrides };
      return { ...render(React.createElement(StepGenerating, props as any)), props };
    }

    it("CMP-157-03: renders heading", async () => {
      await act(async () => { renderStep(); });
      expect(screen.getByText("Generating Your Report")).toBeInTheDocument();
    });

    it("CMP-157-04: renders helper text", async () => {
      await act(async () => { renderStep(); });
      expect(screen.getByText(/Sit back/)).toBeInTheDocument();
    });

    it("CMP-157-05: renders accent divider", async () => {
      await act(async () => { renderStep(); });
      expect(document.querySelector(".bg-\\[var\\(--color-accent\\)\\]")).toBeInTheDocument();
    });

    it("CMP-157-06: shows pipeline stages", async () => {
      await act(async () => { renderStep(); });
      expect(screen.getByText("Data Collection")).toBeInTheDocument();
      expect(screen.getByText("Insight Generation")).toBeInTheDocument();
      expect(screen.getByText("Forecast Modeling")).toBeInTheDocument();
      expect(screen.getByText("Editorial Polish")).toBeInTheDocument();
      expect(screen.getByText("Persona Intelligence")).toBeInTheDocument();
    });

    it("CMP-157-07: shows progress percentage", async () => {
      await act(async () => { renderStep(); });
      await waitFor(() => {
        expect(screen.getByText(/44%/)).toBeInTheDocument();
      });
    });

    it("CMP-157-08: polls for progress", async () => {
      await act(async () => { renderStep(); });
      expect(global.fetch).toHaveBeenCalledTimes(1);
      await act(async () => {
        jest.advanceTimersByTime(3000);
      });
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    it("CMP-157-09: shows View Report button when completed", async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(makeCompletedResponse()),
        } as Response)
      ) as jest.Mock;

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

    it("CMP-157-10: View Report navigates to report page", async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(makeCompletedResponse()),
        } as Response)
      ) as jest.Mock;

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

    it("CMP-157-11: shows success message when completed", async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(makeCompletedResponse()),
        } as Response)
      ) as jest.Mock;

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

      expect(screen.getByText("Your report is ready")).toBeInTheDocument();
    });

    it("CMP-157-12: shows error message when failed", async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(makeFailedResponse()),
        } as Response)
      ) as jest.Mock;

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
        expect(screen.getByText(/Report generation failed/i)).toBeInTheDocument();
      });
    });

    it("CMP-157-13: shows Try Again button when failed", async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(makeFailedResponse()),
        } as Response)
      ) as jest.Mock;

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

    it("CMP-157-14: Try Again triggers regeneration", async () => {
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

      global.fetch = fetchMock as jest.Mock;

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

    it("CMP-157-15: stops polling when completed", async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(makeCompletedResponse()),
        } as Response)
      ) as jest.Mock;

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

    it("CMP-157-16: calls onValidationChange(true) on mount", async () => {
      const { props } = renderStep();
      await act(async () => {});
      expect(props.onValidationChange).toHaveBeenCalledWith(true);
    });

    it("CMP-157-17: shows 100% when completed", async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(makeCompletedResponse()),
        } as Response)
      ) as jest.Mock;

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

    it("CMP-157-18: shows estimated time remaining during generation", async () => {
      await act(async () => { renderStep(); });
      await waitFor(() => {
        expect(screen.getByText(/remaining/i)).toBeInTheDocument();
      });
    });
  });
});
