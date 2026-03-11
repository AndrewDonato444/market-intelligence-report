/**
 * Analytics Data Export Tests
 *
 * Tests for:
 *   - CSV conversion utility (toCsv, toMultiSectionCsv)
 *   - JSON export utility (exportJson)
 *   - ExportButton component dropdown behavior
 *
 * Spec: .specs/features/admin/analytics-data-export.feature.md
 *
 * Test IDs:
 *   UT-135-01: toCsv converts array of objects to CSV string
 *   UT-135-02: toCsv handles empty array
 *   UT-135-03: toCsv escapes fields with commas and quotes
 *   UT-135-04: toCsv uses custom headers when provided
 *   UT-135-05: toMultiSectionCsv creates sections with titles
 *   UT-135-06: toMultiSectionCsv skips empty sections
 *   UT-135-07: exportCsv triggers download with correct filename
 *   UT-135-08: exportJson triggers download with correct filename
 *   UT-135-09: exportMultiSectionCsv triggers download with correct filename
 *   CMP-135-01: ExportButton renders with correct text
 *   CMP-135-02: ExportButton opens dropdown on click
 *   CMP-135-03: ExportButton CSV option calls onExportCsv
 *   CMP-135-04: ExportButton JSON option calls onExportJson
 *   CMP-135-05: ExportButton closes dropdown after selection
 *   CMP-135-06: ExportButton is disabled when disabled prop is true
 *
 * @jest-environment jsdom
 */

import { toCsv, toMultiSectionCsv, downloadFile } from "@/lib/utils/analytics-export";

describe("toCsv", () => {
  it("UT-135-01: converts array of objects to CSV string", () => {
    const data = [
      { date: "2026-03-01", total: 8, completed: 7, failed: 1 },
      { date: "2026-03-02", total: 5, completed: 5, failed: 0 },
    ];
    const csv = toCsv(data);
    const lines = csv.split("\n");
    expect(lines[0]).toBe("date,total,completed,failed");
    expect(lines[1]).toBe("2026-03-01,8,7,1");
    expect(lines[2]).toBe("2026-03-02,5,5,0");
  });

  it("UT-135-02: handles empty array", () => {
    expect(toCsv([])).toBe("");
  });

  it("UT-135-03: escapes fields with commas and quotes", () => {
    const data = [
      { name: 'Naples, FL', value: 'He said "hello"' },
    ];
    const csv = toCsv(data);
    const lines = csv.split("\n");
    expect(lines[1]).toBe('"Naples, FL","He said ""hello"""');
  });

  it("UT-135-04: uses custom headers when provided", () => {
    const data = [
      { date: "2026-03-01", total: 8, completed: 7, failed: 1 },
    ];
    const csv = toCsv(data, ["date", "total"]);
    const lines = csv.split("\n");
    expect(lines[0]).toBe("date,total");
    expect(lines[1]).toBe("2026-03-01,8");
  });
});

describe("toMultiSectionCsv", () => {
  it("UT-135-05: creates sections with titles", () => {
    const csv = toMultiSectionCsv([
      {
        title: "Volume Time Series",
        rows: [{ date: "2026-03-01", total: 8 }],
      },
      {
        title: "Summary",
        rows: [{ metric: "Total Reports", value: 100 }],
      },
    ]);
    expect(csv).toContain("Volume Time Series");
    expect(csv).toContain("Summary");
    expect(csv).toContain("date,total");
    expect(csv).toContain("metric,value");
  });

  it("UT-135-06: skips empty sections", () => {
    const csv = toMultiSectionCsv([
      { title: "Empty", rows: [] },
      { title: "Has Data", rows: [{ a: 1 }] },
    ]);
    expect(csv).not.toContain("Empty");
    expect(csv).toContain("Has Data");
  });
});

describe("downloadFile", () => {
  it("UT-135-07: creates blob and triggers download", () => {
    const mockClick = jest.fn();
    const mockAppendChild = jest.spyOn(document.body, "appendChild").mockImplementation(jest.fn() as unknown as typeof document.body.appendChild);
    const mockRemoveChild = jest.spyOn(document.body, "removeChild").mockImplementation(jest.fn() as unknown as typeof document.body.removeChild);
    const mockCreateObjectURL = jest.fn().mockReturnValue("blob:test");
    const mockRevokeObjectURL = jest.fn();

    Object.defineProperty(global, "URL", {
      value: { createObjectURL: mockCreateObjectURL, revokeObjectURL: mockRevokeObjectURL },
      writable: true,
    });

    const mockElement = {
      href: "",
      download: "",
      click: mockClick,
    };
    jest.spyOn(document, "createElement").mockReturnValue(mockElement as unknown as HTMLElement);

    downloadFile("test content", "test.csv", "text/csv");

    expect(mockCreateObjectURL).toHaveBeenCalled();
    expect(mockElement.download).toBe("test.csv");
    expect(mockClick).toHaveBeenCalled();
    expect(mockRevokeObjectURL).toHaveBeenCalledWith("blob:test");

    mockAppendChild.mockRestore();
    mockRemoveChild.mockRestore();
    jest.restoreAllMocks();
  });
});

// ExportButton component tests are in analytics-export-button.test.tsx
