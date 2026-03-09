import { median, average, clamp, percentChange } from "@/lib/utils/math";

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
