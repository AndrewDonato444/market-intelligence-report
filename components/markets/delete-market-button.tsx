"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface DeleteMarketButtonProps {
  marketId: string;
  marketName: string;
  reportCount: number;
}

export function DeleteMarketButton({
  marketId,
}: DeleteMarketButtonProps) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/markets/${marketId}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to remove market");
      }
      router.refresh();
    } catch {
      setDeleting(false);
      setConfirming(false);
    }
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-2">
        <span className="font-[family-name:var(--font-body)] text-xs text-[var(--color-app-text-secondary)]">
          Remove this market?
        </span>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="px-3 py-1.5 text-xs font-[family-name:var(--font-body)] font-medium text-white bg-[var(--color-error)] rounded-[var(--radius-sm)] hover:opacity-90 transition-opacity duration-[var(--duration-default)] disabled:opacity-50"
        >
          {deleting ? "Removing..." : "Confirm"}
        </button>
        <button
          onClick={() => setConfirming(false)}
          disabled={deleting}
          className="px-3 py-1.5 text-xs font-[family-name:var(--font-body)] font-medium text-[var(--color-app-text-secondary)] border border-[var(--color-app-border)] rounded-[var(--radius-sm)] hover:border-[var(--color-app-text-secondary)] transition-colors duration-[var(--duration-default)]"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="px-3 py-1.5 text-xs font-[family-name:var(--font-body)] font-medium text-[var(--color-app-text-tertiary)] border border-[var(--color-app-border)] rounded-[var(--radius-sm)] hover:border-[var(--color-error)] hover:text-[var(--color-error)] transition-colors duration-[var(--duration-default)]"
    >
      Remove
    </button>
  );
}
