import fs from "fs";
import path from "path";
import "@testing-library/jest-dom";

describe("Pipeline Status Dashboard", () => {
  describe("File structure", () => {
    it("has report detail page", () => {
      expect(
        fs.existsSync(
          path.join(process.cwd(), "app/(protected)/reports/[id]/page.tsx")
        )
      ).toBe(true);
    });

    it("has report status API route", () => {
      expect(
        fs.existsSync(
          path.join(process.cwd(), "app/api/reports/[id]/status/route.ts")
        )
      ).toBe(true);
    });

    it("has PipelineStatusDashboard component", () => {
      expect(
        fs.existsSync(
          path.join(process.cwd(), "components/reports/pipeline-status.tsx")
        )
      ).toBe(true);
    });
  });

  describe("Pipeline stages configuration", () => {
    let PIPELINE_STAGES: Array<{
      agentName: string;
      label: string;
      description: string;
    }>;

    beforeAll(async () => {
      const mod = await import("@/components/reports/pipeline-status");
      PIPELINE_STAGES = mod.PIPELINE_STAGES;
    });

    it("defines all 5 pipeline agents in order", () => {
      expect(PIPELINE_STAGES).toHaveLength(5);
      expect(PIPELINE_STAGES[0].agentName).toBe("data-analyst");
      expect(PIPELINE_STAGES[1].agentName).toBe("insight-generator");
      expect(PIPELINE_STAGES[2].agentName).toBe("competitive-analyst");
      expect(PIPELINE_STAGES[3].agentName).toBe("forecast-modeler");
      expect(PIPELINE_STAGES[4].agentName).toBe("polish-agent");
    });

    it("includes label and description for each stage", () => {
      for (const stage of PIPELINE_STAGES) {
        expect(stage.label).toBeTruthy();
        expect(stage.description).toBeTruthy();
      }
    });
  });

  describe("PipelineStatusDashboard component", () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const React = require("react");
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { render, screen } = require("@testing-library/react");

    jest.mock("next/navigation", () => ({
      useRouter: () => ({ push: jest.fn(), refresh: jest.fn() }),
      usePathname: () => "/reports/test-id",
    }));

    const baseReport = {
      id: "report-1",
      title: "Naples Intelligence Report",
      status: "queued" as const,
      marketName: "Naples Luxury",
      config: {
        sections: [
          "market_overview",
          "executive_summary",
          "key_drivers",
          "forecasts",
        ],
      },
      createdAt: "2026-03-09T12:00:00Z",
      generationStartedAt: null,
      generationCompletedAt: null,
      errorMessage: null,
    };

    it("renders the report title", async () => {
      const { PipelineStatusDashboard } = await import(
        "@/components/reports/pipeline-status"
      );
      render(
        React.createElement(PipelineStatusDashboard, { report: baseReport })
      );

      expect(
        screen.getByText("Naples Intelligence Report")
      ).toBeInTheDocument();
    });

    it("displays market name", async () => {
      const { PipelineStatusDashboard } = await import(
        "@/components/reports/pipeline-status"
      );
      render(
        React.createElement(PipelineStatusDashboard, { report: baseReport })
      );

      expect(screen.getByText(/Naples Luxury/)).toBeInTheDocument();
    });

    it("shows queued state with 0% progress", async () => {
      const { PipelineStatusDashboard } = await import(
        "@/components/reports/pipeline-status"
      );
      render(
        React.createElement(PipelineStatusDashboard, { report: baseReport })
      );

      expect(screen.getByText("Queued")).toBeInTheDocument();
    });

    it("shows all pipeline stages", async () => {
      const { PipelineStatusDashboard } = await import(
        "@/components/reports/pipeline-status"
      );
      render(
        React.createElement(PipelineStatusDashboard, { report: baseReport })
      );

      expect(screen.getByText("Data Analysis")).toBeInTheDocument();
      expect(screen.getByText("Insight Generation")).toBeInTheDocument();
      expect(screen.getByText("Competitive Analysis")).toBeInTheDocument();
      expect(screen.getByText("Forecast Modeling")).toBeInTheDocument();
      expect(screen.getByText("Editorial Polish")).toBeInTheDocument();
    });

    it("shows generating state", async () => {
      const { PipelineStatusDashboard } = await import(
        "@/components/reports/pipeline-status"
      );
      const generatingReport = {
        ...baseReport,
        status: "generating" as const,
        generationStartedAt: "2026-03-09T12:01:00Z",
      };
      render(
        React.createElement(PipelineStatusDashboard, {
          report: generatingReport,
        })
      );

      expect(screen.getByText("Generating")).toBeInTheDocument();
    });

    it("shows completed state with success message", async () => {
      const { PipelineStatusDashboard } = await import(
        "@/components/reports/pipeline-status"
      );
      const completedReport = {
        ...baseReport,
        status: "completed" as const,
        generationStartedAt: "2026-03-09T12:01:00Z",
        generationCompletedAt: "2026-03-09T12:02:30Z",
      };
      render(
        React.createElement(PipelineStatusDashboard, {
          report: completedReport,
        })
      );

      expect(screen.getByText("Completed")).toBeInTheDocument();
    });

    it("shows failed state with error message", async () => {
      const { PipelineStatusDashboard } = await import(
        "@/components/reports/pipeline-status"
      );
      const failedReport = {
        ...baseReport,
        status: "failed" as const,
        errorMessage: "Data Analyst agent timed out",
      };
      render(
        React.createElement(PipelineStatusDashboard, {
          report: failedReport,
        })
      );

      expect(screen.getByText("Failed")).toBeInTheDocument();
      expect(
        screen.getByText(/Data Analyst agent timed out/)
      ).toBeInTheDocument();
    });
  });

  describe("Report status API route", () => {
    it("route file exports GET handler", () => {
      const routeContent = fs.readFileSync(
        path.join(
          process.cwd(),
          "app/api/reports/[id]/status/route.ts"
        ),
        "utf8"
      );
      expect(routeContent).toContain("export async function GET");
    });

    it("route uses Supabase auth", () => {
      const routeContent = fs.readFileSync(
        path.join(
          process.cwd(),
          "app/api/reports/[id]/status/route.ts"
        ),
        "utf8"
      );
      expect(routeContent).toContain("@/lib/supabase/auth");
      expect(routeContent).toContain("getAuthUserId");
    });

    it("route returns 401 for unauthenticated requests", () => {
      const routeContent = fs.readFileSync(
        path.join(
          process.cwd(),
          "app/api/reports/[id]/status/route.ts"
        ),
        "utf8"
      );
      expect(routeContent).toContain("401");
    });

    it("route returns 404 for missing reports", () => {
      const routeContent = fs.readFileSync(
        path.join(
          process.cwd(),
          "app/api/reports/[id]/status/route.ts"
        ),
        "utf8"
      );
      expect(routeContent).toContain("404");
    });
  });

  describe("Report detail page", () => {
    it("uses getReport service", () => {
      const pageContent = fs.readFileSync(
        path.join(
          process.cwd(),
          "app/(protected)/reports/[id]/page.tsx"
        ),
        "utf8"
      );
      expect(pageContent).toContain("getReport");
    });

    it("renders PipelineStatusDashboard component", () => {
      const pageContent = fs.readFileSync(
        path.join(
          process.cwd(),
          "app/(protected)/reports/[id]/page.tsx"
        ),
        "utf8"
      );
      expect(pageContent).toContain("PipelineStatusDashboard");
    });

    it("handles report not found", () => {
      const pageContent = fs.readFileSync(
        path.join(
          process.cwd(),
          "app/(protected)/reports/[id]/page.tsx"
        ),
        "utf8"
      );
      expect(pageContent).toContain("notFound");
    });
  });
});
