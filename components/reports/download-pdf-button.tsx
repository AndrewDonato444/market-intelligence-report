"use client";

import { useState } from "react";

interface DownloadPdfButtonProps {
  reportId: string;
  reportTitle: string;
}

export function DownloadPdfButton({
  reportId,
  reportTitle,
}: DownloadPdfButtonProps) {
  const [downloading, setDownloading] = useState(false);

  async function handleDownload(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDownloading(true);
    try {
      const res = await fetch(`/api/reports/${reportId}/pdf`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("PDF generation failed");

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${reportTitle.replace(/[^a-zA-Z0-9 ]/g, "")}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // Could show toast
    } finally {
      setDownloading(false);
    }
  }

  return (
    <button
      onClick={handleDownload}
      disabled={downloading}
      className="font-[family-name:var(--font-sans)] text-xs font-medium px-3 py-1 rounded-[var(--radius-sm)] bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary)]/90 disabled:opacity-50 transition-colors whitespace-nowrap"
    >
      {downloading ? "Generating..." : "Download PDF"}
    </button>
  );
}
