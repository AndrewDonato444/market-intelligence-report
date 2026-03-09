/**
 * PDF document root — assembles cover page + section pages into a Document.
 */

import React from "react";
import { Document } from "@react-pdf/renderer";
import { CoverPage } from "./templates/cover-page";
import { TableOfContents } from "./templates/table-of-contents";
import { InsightsIndex } from "./templates/insights-index";
import { SectionPage } from "./templates/section-page";
import { MetadataPage } from "./templates/metadata-page";
import type { ReportData } from "@/lib/agents/schema";

export interface BrandColors {
  primary?: string;
  secondary?: string;
  accent?: string;
}

export interface AgentBranding {
  name: string;
  company?: string;
  logoUrl?: string;
  brandColors?: BrandColors;
  phone?: string;
  email?: string;
  title?: string;
  disclaimer?: string;
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
        logoUrl={branding.logoUrl}
        phone={branding.phone}
        email={branding.email}
        agentTitle={branding.title}
        brandColors={branding.brandColors}
      />
      <TableOfContents sections={reportData.sections} />
      <InsightsIndex
        metadata={reportData.metadata}
        sections={reportData.sections}
      />
      {reportData.sections.map((section) => (
        <SectionPage
          key={section.sectionType}
          section={section}
          reportTitle={title}
          companyName={branding.company}
        />
      ))}
      <MetadataPage
        metadata={reportData.metadata}
        pullQuotes={reportData.pullQuotes}
        reportTitle={title}
        disclaimer={branding.disclaimer}
      />
    </Document>
  );
}
