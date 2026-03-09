/**
 * PDF document root — assembles cover page + section pages into a Document.
 */

import React from "react";
import { Document } from "@react-pdf/renderer";
import { CoverPage } from "./templates/cover-page";
import { SectionPage } from "./templates/section-page";
import { MetadataPage } from "./templates/metadata-page";
import type { ReportData } from "@/lib/agents/schema";

export interface AgentBranding {
  name: string;
  company?: string;
  logoUrl?: string;
}

export interface ReportDocumentProps {
  reportData: ReportData;
  branding: AgentBranding;
  title: string;
  marketName: string;
}

export function ReportDocument({
  reportData,
  branding,
  title,
  marketName,
}: ReportDocumentProps) {
  return (
    <Document
      title={title}
      author={branding.name}
      subject={`Market Intelligence Report — ${marketName}`}
    >
      <CoverPage
        title={title}
        marketName={marketName}
        agentName={branding.name}
        company={branding.company}
        generatedAt={reportData.metadata.generatedAt}
      />
      {reportData.sections.map((section) => (
        <SectionPage
          key={section.sectionType}
          section={section}
          reportTitle={title}
        />
      ))}
      <MetadataPage
        metadata={reportData.metadata}
        pullQuotes={reportData.pullQuotes}
        reportTitle={title}
      />
    </Document>
  );
}
