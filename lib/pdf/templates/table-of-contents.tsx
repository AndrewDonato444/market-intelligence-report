/**
 * PDF table of contents — lists all report sections.
 */

import React from "react";
import { Page, View, Text } from "@react-pdf/renderer";
import { styles, COLORS } from "../styles";

interface SectionEntry {
  sectionType: string;
  title: string;
  content: unknown;
}

interface TableOfContentsProps {
  sections: SectionEntry[];
}

export function TableOfContents({ sections }: TableOfContentsProps) {
  return (
    <Page size="LETTER" style={styles.page}>
      <View>
        <Text style={styles.heading}>Table of Contents</Text>
        <View style={styles.accentLine} />
        <View style={{ marginTop: 16 }}>
          {sections.map((section, index) => (
            <View
              key={section.sectionType}
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                paddingVertical: 10,
                borderBottomWidth: 1,
                borderBottomColor: COLORS.border,
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Text
                  style={{
                    fontFamily: "Inter",
                    fontSize: 10,
                    color: COLORS.accent,
                    marginRight: 12,
                    width: 20,
                  }}
                >
                  {String(index + 1).padStart(2, "0")}
                </Text>
                <Text
                  style={{
                    fontFamily: "Playfair Display",
                    fontSize: 14,
                    color: COLORS.textPrimary,
                  }}
                >
                  {section.title}
                </Text>
              </View>
              <Text
                style={{
                  fontFamily: "Inter",
                  fontSize: 9,
                  color: COLORS.textSecondary,
                  textTransform: "capitalize",
                }}
              >
                {section.sectionType.replace(/_/g, " ")}
              </Text>
            </View>
          ))}
        </View>
      </View>
      <View style={styles.pageFooter} fixed>
        <Text style={styles.pageNumber}>Table of Contents</Text>
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
