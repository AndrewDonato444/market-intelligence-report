"use client";

interface EditEntry {
  id: string;
  sectionTitle: string;
  sectionType: string;
  editedAt: string;
}

interface ReportHistoryProps {
  history: EditEntry[];
}

export function ReportHistory({ history }: ReportHistoryProps) {
  if (history.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-white p-6 text-center text-sm text-muted-foreground">
        No edits yet. Edit a section to start building history.
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-white p-6">
      <h3 className="text-lg font-semibold mb-4">Edit History</h3>
      <div className="space-y-3">
        {history.map((entry) => {
          const date = new Date(entry.editedAt);
          const formatted = date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "numeric",
            minute: "2-digit",
          });

          return (
            <div
              key={entry.id}
              className="flex items-center justify-between border-b border-border pb-3 last:border-0"
            >
              <div>
                <p className="text-sm font-medium">{entry.sectionTitle}</p>
                <p className="text-xs text-muted-foreground">
                  {entry.sectionType.replace(/_/g, " ")}
                </p>
              </div>
              <p className="text-xs text-muted-foreground">{formatted}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
