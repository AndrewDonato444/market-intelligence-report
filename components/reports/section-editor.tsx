"use client";

import { useState } from "react";

interface SectionData {
  id: string;
  sectionType: string;
  title: string;
  content: Record<string, unknown>;
}

interface SectionEditorProps {
  section: SectionData;
  onSave: (sectionId: string, data: { title: string; content: Record<string, unknown> }) => void;
  onCancel: () => void;
}

export function SectionEditor({ section, onSave, onCancel }: SectionEditorProps) {
  const [title, setTitle] = useState(section.title);
  const [narrative, setNarrative] = useState(
    (section.content.narrative as string) ?? ""
  );
  const [highlights, setHighlights] = useState<string[]>(
    (section.content.highlights as string[]) ?? []
  );

  function handleSave() {
    const updatedContent = { ...section.content };
    if ("narrative" in section.content || narrative) {
      updatedContent.narrative = narrative;
    }
    if ("highlights" in section.content || highlights.length > 0) {
      updatedContent.highlights = highlights.filter((h) => h.trim() !== "");
    }
    onSave(section.id, { title, content: updatedContent });
  }

  function updateHighlight(index: number, value: string) {
    const updated = [...highlights];
    updated[index] = value;
    setHighlights(updated);
  }

  function addHighlight() {
    setHighlights([...highlights, ""]);
  }

  function removeHighlight(index: number) {
    setHighlights(highlights.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-4 rounded-lg border border-border bg-muted/30 p-4">
      <div>
        <label className="block text-sm font-medium mb-1">Section Title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
        />
      </div>

      {(section.content.narrative !== undefined || narrative) && (
        <div>
          <label className="block text-sm font-medium mb-1">Narrative</label>
          <textarea
            value={narrative}
            onChange={(e) => setNarrative(e.target.value)}
            rows={6}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          />
        </div>
      )}

      {(section.content.highlights !== undefined || highlights.length > 0) && (
        <div>
          <label className="block text-sm font-medium mb-1">Highlights</label>
          <div className="space-y-2">
            {highlights.map((h, i) => (
              <div key={i} className="flex gap-2">
                <input
                  type="text"
                  value={h}
                  onChange={(e) => updateHighlight(i, e.target.value)}
                  className="flex-1 rounded-md border border-border bg-background px-3 py-1.5 text-sm"
                />
                <button
                  onClick={() => removeHighlight(i)}
                  className="rounded-md border border-red-300 px-2 py-1 text-xs text-red-600 hover:bg-red-50"
                >
                  Remove
                </button>
              </div>
            ))}
            <button
              onClick={addHighlight}
              className="text-sm text-primary hover:underline"
            >
              + Add highlight
            </button>
          </div>
        </div>
      )}

      <div className="flex gap-2 pt-2">
        <button
          onClick={handleSave}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90"
        >
          Save
        </button>
        <button
          onClick={onCancel}
          className="rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
