/**
 * PDF renderer — renders ReportDocument to PDF bytes.
 */

import React from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import { registerFonts } from "./fonts";
import { ReportDocument } from "./document";
import type { AgentBranding, ReportDocumentProps } from "./document";
import type { ReportData } from "@/lib/agents/schema";

export type { AgentBranding };

let fontsRegistered = false;

function ensureFontsRegistered() {
  if (!fontsRegistered) {
    registerFonts();
    fontsRegistered = true;
  }
}

export interface RenderReportPdfInput {
  reportData: ReportData;
  branding: AgentBranding;
  title: string;
  marketName: string;
}

/**
 * Renders a complete report to PDF bytes.
 */
export async function renderReportPdf(
  input: RenderReportPdfInput
): Promise<Buffer> {
  ensureFontsRegistered();

  const element = React.createElement(ReportDocument, {
    reportData: input.reportData,
    branding: input.branding,
    title: input.title,
    marketName: input.marketName,
  } satisfies ReportDocumentProps);

  const buffer = await renderToBuffer(element);
  return Buffer.from(buffer);
}
