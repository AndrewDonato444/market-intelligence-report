import { getAuthUserId } from "@/lib/supabase/auth";
import { NextResponse } from "next/server";
import {
  getReportWithMarket,
  getReportSections,
} from "@/lib/services/report";
import { renderReportPdf } from "@/lib/pdf/renderer";
import { db, schema } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import type { ReportData } from "@/lib/agents/schema";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getAuthUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  // Load report
  const report = await getReportWithMarket(userId, id);
  if (!report) {
    return NextResponse.json({ error: "Report not found" }, { status: 404 });
  }

  if (report.status !== "completed") {
    return NextResponse.json(
      { error: "Report is not completed yet" },
      { status: 400 }
    );
  }

  // Load sections
  const sections = await getReportSections(userId, id);
  if (!sections || sections.length === 0) {
    return NextResponse.json(
      { error: "No report sections found" },
      { status: 404 }
    );
  }

  // Load user branding (full profile for PDF injection)
  const [user] = await db
    .select({
      name: schema.users.name,
      company: schema.users.company,
      logoUrl: schema.users.logoUrl,
      brandColors: schema.users.brandColors,
      phone: schema.users.phone,
      email: schema.users.email,
      title: schema.users.title,
    })
    .from(schema.users)
    .where(eq(schema.users.authId, userId))
    .limit(1);

  // Extract confidence from disclaimer_methodology section if available
  const disclaimerSection = sections.find(
    (s) => s.sectionType === "disclaimer_methodology"
  );
  const sectionConfidence =
    disclaimerSection?.content &&
    typeof disclaimerSection.content === "object" &&
    "confidence" in (disclaimerSection.content as Record<string, unknown>)
      ? (disclaimerSection.content as Record<string, unknown>).confidence as {
          level: string;
          sampleSize: number;
          staleDataSources: string[];
        }
      : null;

  // Build ReportData
  const reportData: ReportData = {
    sections: sections.map((s) => ({
      sectionType: s.sectionType,
      title: s.title,
      content: s.content,
    })),
    pullQuotes: [],
    metadata: {
      generatedAt:
        report.generationCompletedAt?.toISOString() ??
        new Date().toISOString(),
      totalDurationMs: report.generationCompletedAt && report.generationStartedAt
        ? report.generationCompletedAt.getTime() -
          report.generationStartedAt.getTime()
        : 0,
      agentDurations: {},
      confidence: sectionConfidence ?? {
        level: "unknown",
        sampleSize: 0,
        staleDataSources: [],
      },
    },
  };

  // Render PDF
  const pdfBuffer = await renderReportPdf({
    reportData,
    branding: {
      name: user?.name ?? "Agent",
      company: user?.company ?? undefined,
      logoUrl: user?.logoUrl ?? undefined,
      brandColors: user?.brandColors ?? undefined,
      phone: user?.phone ?? undefined,
      email: user?.email ?? undefined,
      title: user?.title ?? undefined,
    },
    title: report.title,
    marketName: report.marketName,
  });

  // Update pdfUrl on the report (store as data URL for now, S3 in future)
  const [dbUser] = await db
    .select({ id: schema.users.id })
    .from(schema.users)
    .where(eq(schema.users.authId, userId))
    .limit(1);

  if (dbUser) {
    await db
      .update(schema.reports)
      .set({ pdfUrl: `generated:${new Date().toISOString()}` })
      .where(
        and(
          eq(schema.reports.id, id),
          eq(schema.reports.userId, dbUser.id)
        )
      );
  }

  return new NextResponse(new Uint8Array(pdfBuffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${report.title.replace(/[^a-zA-Z0-9 ]/g, "")}.pdf"`,
    },
  });
}
