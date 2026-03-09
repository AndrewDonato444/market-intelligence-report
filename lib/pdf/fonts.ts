/**
 * PDF font registration — Playfair Display (headings) + Inter (body).
 * Fonts loaded from Google Fonts CDN.
 */

import { Font } from "@react-pdf/renderer";

export const FONT_FAMILIES = {
  heading: "Playfair Display",
  body: "Inter",
};

const GOOGLE_FONTS_BASE =
  "https://fonts.gstatic.com/s";

export function registerFonts() {
  Font.register({
    family: "Playfair Display",
    fonts: [
      {
        src: `${GOOGLE_FONTS_BASE}/playfairdisplay/v37/nuFvD-vYSZviVYUb_rj3ij__anPXJzDwcbmjWBN2PKdFvXDXbtM.ttf`,
        fontWeight: 400,
      },
      {
        src: `${GOOGLE_FONTS_BASE}/playfairdisplay/v37/nuFvD-vYSZviVYUb_rj3ij__anPXJzDwcbmjWBN2PKd7unDXbtM.ttf`,
        fontWeight: 700,
      },
    ],
  });

  Font.register({
    family: "Inter",
    fonts: [
      {
        src: `${GOOGLE_FONTS_BASE}/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuLyfAZ9hiA.ttf`,
        fontWeight: 400,
      },
      {
        src: `${GOOGLE_FONTS_BASE}/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuI6fAZ9hiA.ttf`,
        fontWeight: 500,
      },
      {
        src: `${GOOGLE_FONTS_BASE}/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuGKYAZ9hiA.ttf`,
        fontWeight: 700,
      },
    ],
  });
}
