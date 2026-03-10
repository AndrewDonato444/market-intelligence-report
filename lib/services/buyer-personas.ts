import { db, schema } from "@/lib/db";
import { eq, asc } from "drizzle-orm";

/**
 * Get all buyer personas ordered by display_order.
 */
export async function getAllBuyerPersonas() {
  return db
    .select()
    .from(schema.buyerPersonas)
    .orderBy(asc(schema.buyerPersonas.displayOrder));
}

/**
 * Get a single buyer persona by slug.
 */
export async function getBuyerPersonaBySlug(slug: string) {
  const [persona] = await db
    .select()
    .from(schema.buyerPersonas)
    .where(eq(schema.buyerPersonas.slug, slug))
    .limit(1);

  return persona ?? null;
}

/**
 * Get a single buyer persona by ID.
 */
export async function getBuyerPersonaById(id: string) {
  const [persona] = await db
    .select()
    .from(schema.buyerPersonas)
    .where(eq(schema.buyerPersonas.id, id))
    .limit(1);

  return persona ?? null;
}

/**
 * Get personas selected for a specific report.
 */
export async function getReportPersonas(reportId: string) {
  return db
    .select({
      selectionOrder: schema.reportPersonas.selectionOrder,
      persona: schema.buyerPersonas,
    })
    .from(schema.reportPersonas)
    .innerJoin(
      schema.buyerPersonas,
      eq(schema.reportPersonas.buyerPersonaId, schema.buyerPersonas.id)
    )
    .where(eq(schema.reportPersonas.reportId, reportId))
    .orderBy(asc(schema.reportPersonas.selectionOrder));
}

/**
 * Set personas for a report. Replaces any existing selections.
 * Accepts 1-3 persona IDs in order of priority.
 */
export async function setReportPersonas(
  reportId: string,
  personaIds: string[]
) {
  if (personaIds.length === 0 || personaIds.length > 3) {
    throw new Error("Must select between 1 and 3 personas");
  }

  // Delete existing selections
  await db
    .delete(schema.reportPersonas)
    .where(eq(schema.reportPersonas.reportId, reportId));

  // Insert new selections
  const values = personaIds.map((personaId, index) => ({
    reportId,
    buyerPersonaId: personaId,
    selectionOrder: index + 1,
  }));

  await db.insert(schema.reportPersonas).values(values);

  return getReportPersonas(reportId);
}
