/**
 * Analytics data export utilities.
 *
 * Converts analytics data to CSV or JSON and triggers a browser download.
 * Used by all admin analytics dashboards for data export.
 */

/**
 * Convert an array of objects to CSV string.
 */
export function toCsv(rows: Record<string, unknown>[], headers?: string[]): string {
  if (rows.length === 0) return "";

  const keys = headers ?? Object.keys(rows[0]);
  const headerLine = keys.map(escapeCsvField).join(",");

  const dataLines = rows.map((row) =>
    keys
      .map((key) => {
        const value = row[key];
        return escapeCsvField(value == null ? "" : String(value));
      })
      .join(",")
  );

  return [headerLine, ...dataLines].join("\n");
}

function escapeCsvField(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/**
 * Build a multi-section CSV (e.g., time series + summary tables in one file).
 */
export function toMultiSectionCsv(
  sections: { title: string; rows: Record<string, unknown>[]; headers?: string[] }[]
): string {
  return sections
    .filter((s) => s.rows.length > 0)
    .map((section) => {
      const csv = toCsv(section.rows, section.headers);
      return `${section.title}\n${csv}`;
    })
    .join("\n\n");
}

/**
 * Trigger a file download in the browser.
 */
export function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export data as CSV file download.
 */
export function exportCsv(
  data: Record<string, unknown>[],
  viewName: string,
  headers?: string[]
): void {
  const csv = toCsv(data, headers);
  const date = new Date().toISOString().split("T")[0];
  downloadFile(csv, `${viewName}-${date}.csv`, "text/csv;charset=utf-8");
}

/**
 * Export multi-section data as CSV file download.
 */
export function exportMultiSectionCsv(
  sections: { title: string; rows: Record<string, unknown>[]; headers?: string[] }[],
  viewName: string
): void {
  const csv = toMultiSectionCsv(sections);
  const date = new Date().toISOString().split("T")[0];
  downloadFile(csv, `${viewName}-${date}.csv`, "text/csv;charset=utf-8");
}

/**
 * Export data as JSON file download.
 */
export function exportJson(data: unknown, viewName: string): void {
  const json = JSON.stringify(data, null, 2);
  const date = new Date().toISOString().split("T")[0];
  downloadFile(json, `${viewName}-${date}.json`, "application/json");
}
