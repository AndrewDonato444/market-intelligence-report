"use client";

import { useState, useRef, useEffect } from "react";

interface ExportButtonProps {
  onExportCsv: () => void;
  onExportJson: () => void;
  disabled?: boolean;
}

export function ExportButton({ onExportCsv, onExportJson, disabled }: ExportButtonProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        disabled={disabled}
        data-testid="export-button"
        className="px-[var(--spacing-4)] py-[var(--spacing-2)] rounded-[var(--radius-sm)] text-sm font-medium border border-[var(--color-app-border)] text-[var(--color-app-text-secondary)] hover:bg-[var(--color-app-active-bg)] hover:text-[var(--color-app-text)] disabled:opacity-50 transition-colors"
      >
        Export
      </button>

      {open && (
        <div
          className="absolute right-0 mt-1 w-36 bg-[var(--color-app-surface)] border border-[var(--color-app-border)] rounded-[var(--radius-sm)] shadow-[var(--shadow-md)] z-10"
          data-testid="export-dropdown"
        >
          <button
            onClick={() => { onExportCsv(); setOpen(false); }}
            data-testid="export-csv"
            className="w-full text-left px-[var(--spacing-3)] py-[var(--spacing-2)] text-sm text-[var(--color-app-text)] hover:bg-[var(--color-app-active-bg)] transition-colors"
          >
            Export CSV
          </button>
          <button
            onClick={() => { onExportJson(); setOpen(false); }}
            data-testid="export-json"
            className="w-full text-left px-[var(--spacing-3)] py-[var(--spacing-2)] text-sm text-[var(--color-app-text)] hover:bg-[var(--color-app-active-bg)] transition-colors"
          >
            Export JSON
          </button>
        </div>
      )}
    </div>
  );
}
