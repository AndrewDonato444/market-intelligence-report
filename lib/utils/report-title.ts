/**
 * Report title naming convention utility.
 *
 * Generates standardized report titles in the format:
 *   {City} {Tier} Market Intelligence — Q{N} {Year}
 */

/**
 * Returns the fiscal quarter string for a given date, e.g. "Q1 2026".
 */
export function getQuarterLabel(date: Date): string {
  const month = date.getMonth(); // 0-indexed
  const quarter = Math.floor(month / 3) + 1;
  return `Q${quarter} ${date.getFullYear()}`;
}

/**
 * Generates a standardized report title.
 *
 * @param city - Market city name (e.g. "Naples")
 * @param tier - Luxury tier label (e.g. "Luxury", "High Luxury", "Ultra Luxury")
 * @param date - Date of report generation (used for quarter calculation)
 */
export function generateReportTitle(
  city: string,
  tier: string,
  date: Date
): string {
  const tierLabel = tier.trim() || "Luxury";
  const quarter = getQuarterLabel(date);
  return `${city} ${tierLabel} Market Intelligence \u2014 ${quarter}`;
}
