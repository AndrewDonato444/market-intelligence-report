import { median, average, clamp, percentChange, removeOutliers } from "@/lib/utils/math";

describe("Math Utilities", () => {
  describe("median", () => {
    it("returns 0 for empty array", () => {
      expect(median([])).toBe(0);
    });

    it("returns the single value for one-element array", () => {
      expect(median([42])).toBe(42);
    });

    it("returns middle value for odd-length array", () => {
      expect(median([1, 3, 5])).toBe(3);
    });

    it("returns average of two middle values for even-length array", () => {
      expect(median([1, 3, 5, 7])).toBe(4);
    });

    it("handles unsorted input", () => {
      expect(median([5, 1, 3])).toBe(3);
    });

    it("does not mutate the input array", () => {
      const input = [3, 1, 2];
      median(input);
      expect(input).toEqual([3, 1, 2]);
    });
  });

  describe("average", () => {
    it("returns 0 for empty array", () => {
      expect(average([])).toBe(0);
    });

    it("returns the single value for one-element array", () => {
      expect(average([10])).toBe(10);
    });

    it("computes arithmetic mean", () => {
      expect(average([2, 4, 6])).toBe(4);
    });

    it("handles decimal results", () => {
      expect(average([1, 2])).toBe(1.5);
    });
  });

  describe("clamp", () => {
    it("returns value when within range", () => {
      expect(clamp(5, 1, 10)).toBe(5);
    });

    it("clamps to min", () => {
      expect(clamp(-1, 0, 10)).toBe(0);
    });

    it("clamps to max", () => {
      expect(clamp(15, 0, 10)).toBe(10);
    });
  });

  describe("removeOutliers", () => {
    it("UT-MATH-01 | returns input unchanged when fewer than 4 values", () => {
      expect(removeOutliers([1, 2, 3])).toEqual([1, 2, 3]);
    });

    it("UT-MATH-02 | removes extreme outliers from dataset", () => {
      const data = [10, 11, 12, 13, 14, 15, 500];
      const result = removeOutliers(data);
      expect(result).not.toContain(500);
      expect(result.length).toBeLessThan(data.length);
    });

    it("UT-MATH-03 | keeps all values when no outliers exist", () => {
      const data = [10, 11, 12, 13, 14];
      const result = removeOutliers(data);
      expect(result).toEqual([10, 11, 12, 13, 14]);
    });

    it("UT-MATH-04 | respects custom k parameter for wider/narrower fences", () => {
      const data = [10, 11, 12, 13, 14, 15, 100];
      // With k=1.5 (default), 100 should be removed
      expect(removeOutliers(data, 1.5)).not.toContain(100);
      // With k=100 (extremely wide), nothing removed
      expect(removeOutliers(data, 100)).toContain(100);
    });

    it("UT-MATH-05 | handles luxury real estate price outliers", () => {
      // Simulates the $403M outlier bug
      const prices = [10e6, 12e6, 11e6, 13e6, 9e6, 403e6];
      const filtered = removeOutliers(prices, 2.0);
      expect(filtered).not.toContain(403e6);
      expect(filtered.length).toBe(5);
    });
  });

  describe("percentChange", () => {
    it("calculates positive change", () => {
      expect(percentChange(110, 100)).toBeCloseTo(0.10);
    });

    it("calculates negative change", () => {
      expect(percentChange(90, 100)).toBeCloseTo(-0.10);
    });

    it("returns null when prior is zero", () => {
      expect(percentChange(100, 0)).toBeNull();
    });

    it("returns null when either value is null", () => {
      expect(percentChange(null, 100)).toBeNull();
      expect(percentChange(100, null)).toBeNull();
    });
  });
});
