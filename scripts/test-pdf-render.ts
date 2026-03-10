import path from "path";
import dotenv from "dotenv";
dotenv.config({ path: path.resolve(__dirname, "..", ".env.local"), override: true });

async function main() {
  const { db, schema } = await import("@/lib/db");
  const { eq } = await import("drizzle-orm");
  const { renderReportPdf } = await import("@/lib/pdf/renderer");
  const fs = await import("fs");

  const reportId = "5382ea30-b299-4cdf-a43d-796179aede5e";
  
  const sections = await db
    .select()
    .from(schema.reportSections)
    .where(eq(schema.reportSections.reportId, reportId))
    .orderBy(schema.reportSections.sortOrder);
  
  console.log(`Found ${sections.length} sections`);
  sections.forEach((s: any) => {
    const c = s.content as Record<string, unknown>;
    const narr = ["narrative","editorial","forecast","guidance","methodology"]
      .filter(k => c[k] != null && c[k] !== "");
    console.log(`  ${s.sectionType}: ${narr.length > 0 ? narr.join(", ") : "(data only)"}`);
  });
  
  const reportData = {
    sections: sections.map((s: any) => ({
      sectionType: s.sectionType,
      title: s.title,
      content: s.content,
    })),
    pullQuotes: [],
    metadata: {
      generatedAt: new Date().toISOString(),
      totalDurationMs: 366000,
      agentDurations: {},
      confidence: { level: "high" as const, sampleSize: 50, staleDataSources: [] },
    },
  };

  console.log("\nRendering PDF...");
  const pdfBuffer = await renderReportPdf({
    reportData,
    branding: { name: "Andrew Donato", company: "Andrew and Associates", phone: "6317674639", email: "adonatony@gmail.com", title: "Chief" },
    title: "Commack Intelligence Report",
    marketName: "Commack, NY",
  });
  
  const outPath = "/tmp/commack-report-v2.pdf";
  fs.writeFileSync(outPath, Buffer.from(pdfBuffer));
  console.log(`PDF generated: ${pdfBuffer.byteLength} bytes → ${outPath}`);
  process.exit(0);
}

main().catch((e: any) => { console.error(e); process.exit(1); });
