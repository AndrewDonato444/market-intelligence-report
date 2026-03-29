/**
 * PDF section page — wraps each report section with header, accent line, and footer.
 *
 * Uses a single <Page wrap> so content flows naturally across multiple PDF pages
 * instead of being squeezed into one page (which causes blank space on short sections
 * and clipping on long ones). The `break` prop on the outer Page forces a new page
 * before each section starts.
 */

import React from "react";
import { Page, View, Text } from "@react-pdf/renderer";
import { styles } from "../styles";
import { getSectionRenderer, PersonaFramingCallout } from "./renderers";
import {
  getCopyrightLine,
  CONFIDENTIALITY_NOTICE,
  DATA_SOURCES_NOTICE,
} from "../copyright";

interface SectionContent {
  sectionType: string;
  title: string;
  content: unknown;
}

interface SectionPageProps {
  section: SectionContent;
  reportTitle: string;
  companyName?: string;
  isLastSection?: boolean;
}

export function SectionPage({ section, reportTitle, companyName, isLastSection }: SectionPageProps) {
  const Renderer = getSectionRenderer(section.sectionType);
  const footerLeft = companyName
    ? `${reportTitle} — ${companyName}`
    : reportTitle;

  // Show persona framing only on executive_briefing to avoid repetition
  const personaFraming =
    section.sectionType === "executive_briefing" &&
    section.content &&
    typeof section.content === "object" &&
    "personaFraming" in (section.content as Record<string, unknown>)
      ? ((section.content as Record<string, unknown>).personaFraming as {
          personaName: string;
          perspective: string;
          emphasis: string[];
          deEmphasis: string[];
          toneGuidance: string;
        } | null)
      : null;

  return (
    <Page size="LETTER" style={styles.page} wrap>
      {/* Section header — minPresenceAhead keeps it with at least some content */}
      <View minPresenceAhead={60}>
        <Text style={styles.heading}>{section.title}</Text>
        <View style={styles.accentLine} />
      </View>
      <Renderer section={section} />
      <PersonaFramingCallout personaFraming={personaFraming} />
      {isLastSection && (
        <View style={styles.confidentialityBlock}>
          <Text style={styles.confidentialityBlockText}>
            {CONFIDENTIALITY_NOTICE}
          </Text>
          <Text style={{ ...styles.confidentialityBlockText, marginTop: 8 }}>
            {DATA_SOURCES_NOTICE}
          </Text>
        </View>
      )}
      <View style={styles.pageFooter} fixed>
        <Text style={styles.pageNumber}>{footerLeft}</Text>
        <Text
          style={styles.pageNumber}
          render={({ pageNumber, totalPages }) =>
            `${pageNumber} / ${totalPages}`
          }
        />
      </View>
      <View style={{ ...styles.pageFooter, ...styles.copyrightFooterRow, bottom: 20, borderTopWidth: 0 }} fixed>
        <Text style={styles.copyrightText}>{getCopyrightLine()}</Text>
      </View>
    </Page>
  );
}
