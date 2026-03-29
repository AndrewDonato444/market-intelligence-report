import type { PropertyDetail } from "@/lib/connectors/realestateapi";
import type { MotivatedSellerSignals } from "@/lib/db/schema";

const INHERITANCE_KEYWORDS = [
  "probate",
  "estate",
  "inheritance",
  "executor",
  "personal representative",
];

/**
 * Compute motivated seller signals from a REAPI PropertyDetail response.
 * Pure function — no side effects, fully testable.
 */
export function computeMotivatedSellerSignals(
  detail: PropertyDetail
): MotivatedSellerSignals {
  // 1. Inherited (weight: 20)
  const lastSaleDoc =
    detail.saleHistory?.[0]?.documentType?.toLowerCase() ?? "";
  const inheritedFired = INHERITANCE_KEYWORDS.some((kw) =>
    lastSaleDoc.includes(kw)
  );

  // 2. Non-owner-occupied (weight: 15)
  const nonOwnerOccupiedFired = detail.flags?.ownerOccupied === false;

  // 3. Adjustable rate mortgage (weight: 15)
  const firstMortgageType =
    detail.currentMortgages?.[0]?.interestRateType?.toUpperCase() ?? "";
  const adjustableRateFired = firstMortgageType === "ARM";

  // 4. Long hold period > 10 years (weight: 20)
  const ownershipMonths = detail.ownerInfo?.ownershipLengthMonths ?? 0;
  const yearsHeld = Math.floor(ownershipMonths / 12);
  const longHoldFired = yearsHeld > 10;

  // 5. HELOC pattern: 2+ active mortgages (weight: 15)
  const mortgageCount = detail.currentMortgages?.length ?? 0;
  const helocFired = mortgageCount >= 2;

  // 6. High equity > 60% (weight: 15)
  const equityPct = detail.equityPercent ?? 0;
  const equityAsPercent = equityPct <= 1 ? Math.round(equityPct * 100) : equityPct;
  const highEquityFired = equityAsPercent > 60;

  const signals: MotivatedSellerSignals = {
    inherited: { fired: inheritedFired, weight: 20 },
    nonOwnerOccupied: { fired: nonOwnerOccupiedFired, weight: 15 },
    adjustableRate: { fired: adjustableRateFired, weight: 15 },
    longHoldPeriod: { fired: longHoldFired, weight: 20, yearsHeld },
    helocPattern: { fired: helocFired, weight: 15, mortgageCount },
    highEquity: { fired: highEquityFired, weight: 15, equityPercent: equityAsPercent },
    totalScore: 0,
  };

  // Sum weights of fired signals
  signals.totalScore =
    (inheritedFired ? 20 : 0) +
    (nonOwnerOccupiedFired ? 15 : 0) +
    (adjustableRateFired ? 15 : 0) +
    (longHoldFired ? 20 : 0) +
    (helocFired ? 15 : 0) +
    (highEquityFired ? 15 : 0);

  return signals;
}
