import fs from "fs";
import path from "path";
import "@testing-library/jest-dom";

describe("Data Visualization Components", () => {
  describe("File structure", () => {
    it("has data-viz component file", () => {
      expect(
        fs.existsSync(
          path.join(process.cwd(), "lib/pdf/components/data-viz.tsx")
        )
      ).toBe(true);
    });
  });

  describe("ConfidenceDots", () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const React = require("react");
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { render, screen } = require("@testing-library/react");

    it("exports ConfidenceDots component", async () => {
      const mod = await import("@/lib/pdf/components/data-viz");
      expect(mod.ConfidenceDots).toBeDefined();
      expect(typeof mod.ConfidenceDots).toBe("function");
    });

    it("renders for high confidence", async () => {
      const { ConfidenceDots } = await import("@/lib/pdf/components/data-viz");

      const { container } = render(React.createElement(ConfidenceDots, { level: "high" }));

      // View mock renders as div — the outer row + 3 dot divs
      const dots = container.querySelectorAll("div > div > div");
      expect(dots.length).toBe(3);
    });

    it("renders for medium confidence", async () => {
      const { ConfidenceDots } = await import("@/lib/pdf/components/data-viz");

      const { container } = render(React.createElement(ConfidenceDots, { level: "medium" }));
      const dots = container.querySelectorAll("div > div > div");
      expect(dots.length).toBe(3);
    });

    it("renders for low confidence", async () => {
      const { ConfidenceDots } = await import("@/lib/pdf/components/data-viz");

      const { container } = render(React.createElement(ConfidenceDots, { level: "low" }));
      const dots = container.querySelectorAll("div > div > div");
      expect(dots.length).toBe(3);
    });
  });

  describe("RatingBadge", () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const React = require("react");
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { render, screen } = require("@testing-library/react");

    it("exports RatingBadge component", async () => {
      const mod = await import("@/lib/pdf/components/data-viz");
      expect(mod.RatingBadge).toBeDefined();
    });

    it("renders A rating", async () => {
      const { RatingBadge } = await import("@/lib/pdf/components/data-viz");

      render(React.createElement(RatingBadge, { rating: "A" }));
      expect(screen.getByText("A")).toBeInTheDocument();
    });

    it("renders B+ rating", async () => {
      const { RatingBadge } = await import("@/lib/pdf/components/data-viz");

      render(React.createElement(RatingBadge, { rating: "B+" }));
      expect(screen.getByText("B+")).toBeInTheDocument();
    });

    it("renders C rating", async () => {
      const { RatingBadge } = await import("@/lib/pdf/components/data-viz");

      render(React.createElement(RatingBadge, { rating: "C" }));
      expect(screen.getByText("C")).toBeInTheDocument();
    });
  });

  describe("SegmentMatrix", () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const React = require("react");
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { render, screen } = require("@testing-library/react");

    it("exports SegmentMatrix component", async () => {
      const mod = await import("@/lib/pdf/components/data-viz");
      expect(mod.SegmentMatrix).toBeDefined();
    });

    it("renders segment rows with headers", async () => {
      const { SegmentMatrix } = await import("@/lib/pdf/components/data-viz");

      const segments = [
        { name: "single_family", count: 450, medianPrice: 2500000, rating: "A" },
        { name: "condo", count: 200, medianPrice: 1200000, rating: "B+" },
      ];

      render(React.createElement(SegmentMatrix, { segments }));

      expect(screen.getByText("single family")).toBeInTheDocument();
      expect(screen.getByText("condo")).toBeInTheDocument();
      expect(screen.getAllByText("A").length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText("B+").length).toBeGreaterThanOrEqual(1);
    });

    it("handles empty segments array", async () => {
      const { SegmentMatrix } = await import("@/lib/pdf/components/data-viz");

      expect(() => {
        render(React.createElement(SegmentMatrix, { segments: [] }));
      }).not.toThrow();
    });
  });

  describe("MetricCard", () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const React = require("react");
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { render, screen } = require("@testing-library/react");

    it("exports MetricCard component", async () => {
      const mod = await import("@/lib/pdf/components/data-viz");
      expect(mod.MetricCard).toBeDefined();
    });

    it("renders label and value", async () => {
      const { MetricCard } = await import("@/lib/pdf/components/data-viz");

      render(
        React.createElement(MetricCard, {
          label: "Total Volume",
          value: "$6.58B",
        })
      );

      expect(screen.getByText("Total Volume")).toBeInTheDocument();
      expect(screen.getByText("$6.58B")).toBeInTheDocument();
    });
  });
});
