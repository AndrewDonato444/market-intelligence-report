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
        src: `${GOOGLE_FONTS_BASE}/playfairdisplay/v40/nuFvD-vYSZviVYUb_rj3ij__anPXJzDwcbmjWBN2PKdFvUDQ.ttf`,
        fontWeight: 400,
      },
      {
        src: `${GOOGLE_FONTS_BASE}/playfairdisplay/v40/nuFRD-vYSZviVYUb_rj3ij__anPXDTnCjmHKM4nYO7KN_qiTbtY.ttf`,
        fontWeight: 400,
        fontStyle: "italic" as const,
      },
      {
        src: `${GOOGLE_FONTS_BASE}/playfairdisplay/v40/nuFvD-vYSZviVYUb_rj3ij__anPXJzDwcbmjWBN2PKeiukDQ.ttf`,
        fontWeight: 700,
      },
    ],
  });

  // Disable hyphenation so titles don't break mid-word (e.g. "Intel-ligence")
  Font.registerHyphenationCallback((word) => [word]);

  Font.register({
    family: "Inter",
    fonts: [
      {
        src: `${GOOGLE_FONTS_BASE}/inter/v20/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuLyfMZg.ttf`,
        fontWeight: 400,
      },
      {
        src: `${GOOGLE_FONTS_BASE}/inter/v20/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuLyfMZg.ttf`,
        fontWeight: 400,
        fontStyle: "italic" as const,
      },
      {
        src: `${GOOGLE_FONTS_BASE}/inter/v20/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuI6fMZg.ttf`,
        fontWeight: 500,
      },
      {
        src: `${GOOGLE_FONTS_BASE}/inter/v20/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuFuYMZg.ttf`,
        fontWeight: 700,
      },
    ],
  });
}
