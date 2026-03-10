import "@testing-library/jest-dom";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { PipelineVisualizer } from "@/components/admin/pipeline-visualizer";

// Mock fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

const mockRuns = [
  {
    id: "run-1",
    title: "Naples Q1 2026",
    marketName: "Naples, FL",
    status: "completed",
    generationStartedAt: "2026-03-09T14:23:00Z",
    generationCompletedAt: "2026-03-09T14:23:42Z",
    errorMessage: null,
    durationMs: 42300,
    sectionCount: 9,
    apiCallCount: 12,
    totalCost: "0.034",
    sections: [
      { sectionType: "executive_briefing", title: "Executive Briefing", agentName: "insight-generator", generatedAt: "2026-03-09T14:23:20Z" },
      { sectionType: "market_forecast", title: "Market Forecast", agentName: "forecast-modeler", generatedAt: "2026-03-09T14:23:30Z" },
      { sectionType: "methodology", title: "Methodology", agentName: "polish-agent", generatedAt: "2026-03-09T14:23:40Z" },
    ],
  },
  {
    id: "run-2",
    title: "Aspen Report",
    marketName: "Aspen, CO",
    status: "failed",
    generationStartedAt: "2026-03-09T12:01:00Z",
    generationCompletedAt: "2026-03-09T12:01:18Z",
    errorMessage: "Insight generator timed out after 30s",
    durationMs: 18700,
    sectionCount: 0,
    apiCallCount: 3,
    totalCost: "0.008",
    sections: [],
  },
];

beforeEach(() => {
  mockFetch.mockReset();
});

describe("PipelineVisualizer", () => {
  describe("Loading state", () => {
    it("shows loading spinner while fetching", () => {
      mockFetch.mockReturnValue(new Promise(() => {})); // never resolves
      render(<PipelineVisualizer />);
      expect(screen.getByText("Loading pipeline runs...")).toBeInTheDocument();
    });
  });

  describe("Empty state", () => {
    it("shows empty message when no runs exist", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ runs: [] }),
      });

      render(<PipelineVisualizer />);

      await waitFor(() => {
        expect(screen.getByText("No pipeline runs found.")).toBeInTheDocument();
      });
    });
  });

  describe("Pipeline runs table", () => {
    it("renders pipeline runs with title, market, status, duration", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ runs: mockRuns }),
      });

      render(<PipelineVisualizer />);

      await waitFor(() => {
        expect(screen.getByText("Naples Q1 2026")).toBeInTheDocument();
      });

      expect(screen.getByText("Naples, FL")).toBeInTheDocument();
      expect(screen.getByText("Aspen Report")).toBeInTheDocument();
      expect(screen.getByText("Aspen, CO")).toBeInTheDocument();
      expect(screen.getByText("42.3s")).toBeInTheDocument();
      expect(screen.getByText("18.7s")).toBeInTheDocument();
    });

    it("shows status badges with correct labels", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ runs: mockRuns }),
      });

      render(<PipelineVisualizer />);

      await waitFor(() => {
        expect(screen.getByText("Completed")).toBeInTheDocument();
      });
      expect(screen.getByText("Failed")).toBeInTheDocument();
    });

    it("shows section count for each run", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ runs: mockRuns }),
      });

      render(<PipelineVisualizer />);

      await waitFor(() => {
        expect(screen.getByText("9")).toBeInTheDocument();
      });
    });
  });

  describe("Expanded details", () => {
    it("shows agent breakdown when row is clicked", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ runs: mockRuns }),
      });

      render(<PipelineVisualizer />);

      await waitFor(() => {
        expect(screen.getByText("Naples Q1 2026")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId("pipeline-run-run-1"));

      expect(screen.getByText("insight-generator")).toBeInTheDocument();
      expect(screen.getByText("forecast-modeler")).toBeInTheDocument();
      expect(screen.getByText("polish-agent")).toBeInTheDocument();
    });

    it("shows API cost and call count in expanded view", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ runs: mockRuns }),
      });

      render(<PipelineVisualizer />);

      await waitFor(() => {
        expect(screen.getByText("Naples Q1 2026")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId("pipeline-run-run-1"));

      expect(screen.getByText("12")).toBeInTheDocument();
      expect(screen.getByText("$0.0340")).toBeInTheDocument();
    });

    it("shows error message for failed runs", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ runs: mockRuns }),
      });

      render(<PipelineVisualizer />);

      await waitFor(() => {
        expect(screen.getByText("Aspen Report")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId("pipeline-run-run-2"));

      expect(
        screen.getByText("Insight generator timed out after 30s")
      ).toBeInTheDocument();
    });
  });

  describe("Status filtering", () => {
    it("calls API with status filter when tab is clicked", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ runs: mockRuns }),
      });

      render(<PipelineVisualizer />);

      await waitFor(() => {
        expect(screen.getByText("Naples Q1 2026")).toBeInTheDocument();
      });

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ runs: [mockRuns[1]] }),
      });

      fireEvent.click(screen.getByRole("tab", { name: "Failed" }));

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining("status=failed")
        );
      });
    });
  });

  describe("Summary stats", () => {
    it("shows summary stats when runs are loaded", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ runs: mockRuns }),
      });

      render(<PipelineVisualizer />);

      await waitFor(() => {
        expect(screen.getByText("Total Runs")).toBeInTheDocument();
      });

      expect(screen.getByText("Avg Duration")).toBeInTheDocument();
    });
  });

  describe("Error handling", () => {
    it("shows error message when API fails", async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ error: "Internal server error" }),
      });

      render(<PipelineVisualizer />);

      await waitFor(() => {
        expect(
          screen.getByText("Failed to fetch pipeline runs: 500")
        ).toBeInTheDocument();
      });
    });
  });

  describe("Refresh", () => {
    it("has a refresh button that re-fetches data", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ runs: mockRuns }),
      });

      render(<PipelineVisualizer />);

      await waitFor(() => {
        expect(screen.getByText("Refresh")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText("Refresh"));

      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });
});
