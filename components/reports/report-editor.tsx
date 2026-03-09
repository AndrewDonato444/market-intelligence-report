"use client";

import { useState, useCallback } from "react";
import { SectionEditor } from "./section-editor";

interface EditableSection {
  id: string;
  sectionType: string;
  title: string;
  content: Record<string, unknown>;
  sortOrder: number;
}

interface ReportEditorProps {
  reportId: string;
  sections: EditableSection[];
}

export function ReportEditor({ reportId, sections: initialSections }: ReportEditorProps) {
  const [sections, setSections] = useState(initialSections);
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleSave = useCallback(
    async (sectionId: string, data: { title: string; content: Record<string, unknown> }) => {
      setSaving(true);
      try {
        const res = await fetch(
          `/api/reports/${reportId}/sections/${sectionId}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
          }
        );

        if (res.ok) {
          // Update local state
          setSections((prev) =>
            prev.map((s) =>
              s.id === sectionId
                ? { ...s, title: data.title, content: data.content }
                : s
            )
          );
          setEditingSectionId(null);
        }
      } catch {
        // Error handling — could show toast
      } finally {
        setSaving(false);
      }
    },
    [reportId]
  );

  return (
    <div className="space-y-6">
      {sections.map((section) => (
        <div
          key={section.id}
          className="rounded-lg border border-border bg-white p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">{section.title}</h3>
            {editingSectionId !== section.id && (
              <button
                onClick={() => setEditingSectionId(section.id)}
                className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-muted"
              >
                Edit
              </button>
            )}
          </div>

          {editingSectionId === section.id ? (
            <SectionEditor
              section={section}
              onSave={handleSave}
              onCancel={() => setEditingSectionId(null)}
            />
          ) : (
            <div className="text-sm text-muted-foreground">
              {typeof section.content.narrative === "string" && (
                <p>{section.content.narrative}</p>
              )}
            </div>
          )}
        </div>
      ))}
      {saving && (
        <p className="text-sm text-muted-foreground">Saving...</p>
      )}
    </div>
  );
}
