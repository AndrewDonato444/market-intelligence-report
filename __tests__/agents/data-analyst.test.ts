import {
  computeSegmentMetrics,
  computeYoY,
  assignRating,
} from "@/lib/agents/data-analyst";

// --- Test fixtures ---

function makeProperty(overrides: Record<string, unknown> = {}) {
  return {
    id: "prop-1",
    address: "123 Ocean Blvd",
    city: "Palm Beach",
    state: "FL",
    zip: "33480",
    price: 5500000,
    sqft: 4200,
    bedrooms: 5,
    bathrooms: 4,
    propertyType: "single_family",
    yearBuilt: 2015,
    lastSaleDate: "2026-01-15",
    lastSalePrice: 5500000,
    ...overrides,
  };
}

describe("Data Analyst — Computation Functions", () => {
  describe("computeSegmentMetrics", () => {
    it("computes metrics for a segment with multiple properties", () => {
      const properties = [
        makeProperty({ price: 5000000, sqft: 4000, propertyType: "single_family" }),
        makeProperty({ price: 7000000, sqft: 5000, propertyType: "single_family" }),
        makeProperty({ price: 6000000, sqft: 4500, propertyType: "single_family" }),
      ];

      const metrics = computeSegmentMetrics(properties, "single_family");

      expect(metrics.name).toBe("single_family");
      expect(metrics.count).toBe(3);
      expect(metrics.medianPrice).toBe(6000000);
      expect(metrics.averagePrice).toBeCloseTo(6000000);
      expect(metrics.minPrice).toBe(5000000);
      expect(metrics.maxPrice).toBe(7000000);
      expect(metrics.medianPricePerSqft).toBeCloseTo(1333.33, 0);
      expect(metrics.lowSample).toBe(false);
    });

    it("flags segments with fewer than 3 properties as low sample", () => {
      const properties = [
        makeProperty({ price: 5000000, propertyType: "estate" }),
        makeProperty({ price: 7000000, propertyType: "estate" }),
      ];

      const metrics = computeSegmentMetrics(properties, "estate");

      expect(metrics.count).toBe(2);
      expect(metrics.lowSample).toBe(true);
    });

    it("handles null sqft gracefully", () => {
      const properties = [
        makeProperty({ price: 5000000, sqft: null }),
        makeProperty({ price: 6000000, sqft: null }),
        makeProperty({ price: 7000000, sqft: null }),
      ];

      const metrics = computeSegmentMetrics(properties, "single_family");

      expect(metrics.medianPricePerSqft).toBeNull();
    });

    it("handles single property", () => {
      const properties = [makeProperty({ price: 8000000, sqft: 5000 })];
      const metrics = computeSegmentMetrics(properties, "single_family");

      expect(metrics.count).toBe(1);
      expect(metrics.medianPrice).toBe(8000000);
      expect(metrics.averagePrice).toBe(8000000);
      expect(metrics.lowSample).toBe(true);
    });
  });

  describe("computeYoY", () => {
    it("calculates year-over-year changes", () => {
      const currentYear = [
        makeProperty({ lastSalePrice: 6000000, sqft: 4000 }),
        makeProperty({ lastSalePrice: 7000000, sqft: 5000 }),
      ];
      const priorYear = [
        makeProperty({ lastSalePrice: 5000000, sqft: 4000 }),
        makeProperty({ lastSalePrice: 6000000, sqft: 5000 }),
      ];

      const yoy = computeYoY(currentYear, priorYear);

      // Median current: 6.5M, median prior: 5.5M → change ≈ 0.1818
      expect(yoy.medianPriceChange).toBeCloseTo(0.1818, 2);
      // Volume: 2 vs 2 → 0
      expect(yoy.volumeChange).toBe(0);
    });

    it("returns null YoY values when prior year has no data", () => {
      const currentYear = [makeProperty({ lastSalePrice: 6000000 })];
      const priorYear: ReturnType<typeof makeProperty>[] = [];

      const yoy = computeYoY(currentYear, priorYear);

      expect(yoy.medianPriceChange).toBeNull();
      expect(yoy.volumeChange).toBeNull();
    });

    it("computes price-per-sqft change", () => {
      const currentYear = [
        makeProperty({ lastSalePrice: 6000000, sqft: 4000 }),
      ];
      const priorYear = [
        makeProperty({ lastSalePrice: 5000000, sqft: 4000 }),
      ];

      const yoy = computeYoY(currentYear, priorYear);

      // 1500 vs 1250 → 0.20
      expect(yoy.pricePerSqftChange).toBeCloseTo(0.20, 2);
    });
  });

  describe("assignRating", () => {
    it("assigns A+ for strong growth and volume", () => {
      const rating = assignRating(0.12, 0.05, 50);
      expect(rating).toBe("A+");
    });

    it("assigns A for moderate growth", () => {
      const rating = assignRating(0.07, 0.0, 50);
      expect(rating).toBe("A");
    });

    it("assigns B+ for slight growth", () => {
      const rating = assignRating(0.03, 0.0, 50);
      expect(rating).toBe("B+");
    });

    it("assigns B for flat market", () => {
      const rating = assignRating(0.0, 0.0, 50);
      expect(rating).toBe("B");
    });

    it("assigns C+ for declining metrics", () => {
      const rating = assignRating(-0.03, -0.05, 50);
      expect(rating).toBe("C+");
    });

    it("assigns C for insufficient data", () => {
      const rating = assignRating(null, null, 2);
      expect(rating).toBe("C");
    });
  });

});
