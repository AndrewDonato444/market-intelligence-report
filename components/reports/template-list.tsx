"use client";

interface Template {
  id: string;
  name: string;
  marketName: string;
  createdAt: string;
}

interface TemplateListProps {
  templates: Template[];
  onUse?: (templateId: string) => void;
  onDelete?: (templateId: string) => void;
}

export function TemplateList({ templates, onUse, onDelete }: TemplateListProps) {
  if (templates.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-white p-6 text-center text-sm text-muted-foreground">
        No templates saved yet. Generate a report and save it as a template to get started.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {templates.map((tpl) => {
        const date = new Date(tpl.createdAt).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        });

        return (
          <div
            key={tpl.id}
            className="flex items-center justify-between rounded-lg border border-border bg-white p-4"
          >
            <div>
              <p className="font-medium">{tpl.name}</p>
              <p className="text-sm text-muted-foreground">
                {tpl.marketName} &middot; {date}
              </p>
            </div>
            <div className="flex gap-2">
              {onUse && (
                <button
                  onClick={() => onUse(tpl.id)}
                  className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-white hover:bg-primary/90"
                >
                  Use Template
                </button>
              )}
              {onDelete && (
                <button
                  onClick={() => onDelete(tpl.id)}
                  className="rounded-md border border-red-300 px-3 py-1.5 text-xs text-red-600 hover:bg-red-50"
                >
                  Delete
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
