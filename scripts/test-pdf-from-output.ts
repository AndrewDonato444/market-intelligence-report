/**
 * Renders a PDF from the layer-1 and layer-2 JSON output files
 * produced by test-pipeline.ts. No database required.
 *
 * Usage: npx tsx scripts/test-pdf-from-output.ts
 */
import path from "path";
import fs from "fs";
import dotenv from "dotenv";
dotenv.config({ path: path.resolve(__dirname, "..", ".env.local"), override: true });

async function main() {
  const { assembleReport } = await import("@/lib/agents/report-assembler");
  const { renderReportPdf } = await import("@/lib/pdf/renderer");

  const outputDir = path.resolve(__dirname, "output");

  // Load layer outputs
  const analytics = JSON.parse(
    fs.readFileSync(path.join(outputDir, "layer-1-computed-analytics.json"), "utf8")
  );
  const layer2 = JSON.parse(
    fs.readFileSync(path.join(outputDir, "layer-2-agent-results.json"), "utf8")
  );

  const agentResults = layer2.agentResults;

  // Run Layer 3: report-assembler
  const assembled = assembleReport(analytics, agentResults, {
    fetchMs: 28000,
    computeMs: 2,
    agentDurations: Object.fromEntries(
      Object.entries(agentResults).map(([name, r]: [string, any]) => [name, r.durationMs])
    ),
  });

  console.log(`Assembled ${assembled.sections.length} sections:`);
  assembled.sections.forEach((s: any) =>
    console.log(`  ${s.sectionNumber}. ${s.sectionType} — ${s.title}`)
  );

  // Build ReportData for PDF renderer
  const reportData = {
    sections: assembled.sections.map((s: any) => ({
      sectionType: s.sectionType,
      title: s.title,
      content: s.content,
    })),
    pullQuotes: agentResults["polish-agent"]?.metadata?.polishOutput?.pullQuotes ?? [],
    metadata: {
      generatedAt: assembled.metadata.generatedAt,
      totalDurationMs: assembled.metadata.totalDurationMs,
      agentDurations: assembled.metadata.agentDurations,
      confidence: assembled.metadata.confidence,
    },
  };

  console.log("\nRendering PDF...");
  const pdfBuffer = await renderReportPdf({
    reportData,
    branding: {
      name: "Andrew Donato",
      company: "Andrew and Associates",
      phone: "6317674639",
      email: "adonatony@gmail.com",
      title: "Chief",
    },
    title: "Palm Beach Luxury Intelligence Brief",
    marketName: "Palm Beach, FL",
  });

  const outPath = path.join(outputDir, "palm-beach-report.pdf");
  fs.writeFileSync(outPath, Buffer.from(pdfBuffer));
  console.log(`PDF generated: ${pdfBuffer.byteLength} bytes → ${outPath}`);
  process.exit(0);
}

main().catch((e: any) => {
  console.error(e);
  process.exit(1);
});
