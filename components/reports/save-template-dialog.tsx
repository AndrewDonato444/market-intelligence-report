"use client";

import { useState } from "react";

interface SaveTemplateDialogProps {
  reportId: string;
  onSave: (name: string) => void;
  onClose: () => void;
}

export function SaveTemplateDialog({
  reportId: _reportId,
  onSave,
  onClose,
}: SaveTemplateDialogProps) {
  const [name, setName] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (name.trim()) {
      onSave(name.trim());
    }
  }

  return (
    <div className="rounded-lg border border-border bg-white p-6 shadow-lg">
      <h3 className="text-lg font-semibold mb-4">Save as Template</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">
            Template Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Naples Monthly template name"
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          />
        </div>
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={!name.trim()}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50"
          >
            Save Template
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
