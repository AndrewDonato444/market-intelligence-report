/**
 * PDF section page — wraps each report section with header, accent line, and footer.
 */

import React from "react";
import { Page, View, Text } from "@react-pdf/renderer";
import { styles } from "../styles";
import { getSectionRenderer, PersonaFramingCallout } from "./renderers";

interface SectionContent {
  sectionType: string;
  title: string;
  content: unknown;
}

interface SectionPageProps {
  section: SectionContent;
  reportTitle: string;
  companyName?: string;
}

export function SectionPage({ section, reportTitle, companyName }: SectionPageProps) {
  const Renderer = getSectionRenderer(section.sectionType);
  const footerLeft = companyName
    ? `${reportTitle} — ${companyName}`
    : reportTitle;

  // Extract personaFraming from section content if present
  const personaFraming =
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
    <Page size="LETTER" style={styles.page}>
      <View>
        <Text style={styles.heading}>{section.title}</Text>
        <View style={styles.accentLine} />
        <Renderer section={section} />
        <PersonaFramingCallout personaFraming={personaFraming} />
      </View>
      <View style={styles.pageFooter} fixed>
        <Text style={styles.pageNumber}>{footerLeft}</Text>
        <Text
          style={styles.pageNumber}
          render={({ pageNumber, totalPages }) =>
            `${pageNumber} / ${totalPages}`
          }
        />
      </View>
    </Page>
  );
}
