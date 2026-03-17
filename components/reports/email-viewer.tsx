"use client";

import { useState, useCallback } from "react";
import type { EmailCampaignContent } from "@/lib/db/schema";

type ContentType = keyof EmailCampaignContent;

const STYLE_LABELS: Record<string, string> = {
  "data-forward": "Data-Forward",
  curiosity: "Curiosity",
  urgency: "Urgency",
};

function humaniseLabel(raw: string): string {
  return raw.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

// ---------------------------------------------------------------------------
// CSV export
// ---------------------------------------------------------------------------

function csvCell(value: string): string {
  const needsQuoting = value.includes(",") || value.includes('"') || value.includes("\n") || value.includes("\r");
  if (needsQuoting) {
    return '"' + value.replace(/"/g, '""') + '"';
  }
  return value;
}

function csvRow(cells: string[]): string {
  return cells.map(csvCell).join(",");
}

function buildCsv(content: EmailCampaignContent): string {
  const header = csvRow(["Section", "Context", "Subject / Headline", "Preview Text", "Body", "CTA Idea"]);
  const rows: string[] = [header];

  // Drip sequence — ordered by sequenceOrder
  const sorted = [...content.dripSequence].sort((a, b) => a.sequenceOrder - b.sequenceOrder);
  for (const e of sorted) {
    rows.push(csvRow(["Drip Sequence", `Day ${e.dayOffset} - ${e.reportSection}`, e.subject, e.previewText, e.body, e.cta]));
  }

  // Newsletter header row + one row per content block
  if (content.newsletter) {
    const nl = content.newsletter;
    rows.push(csvRow(["Newsletter", "Header", nl.headline, nl.subheadline, "", nl.footerCta]));
    for (const block of nl.contentBlocks) {
      rows.push(csvRow(["Newsletter Block", block.heading, block.heading, block.keyMetric, block.body, ""]));
    }
  }

  // Persona emails
  for (const e of content.personaEmails) {
    rows.push(csvRow(["Persona Email", e.personaName, e.subject, e.previewText, e.body, e.cta]));
  }

  // Subject line variants
  for (const set of content.subjectLines) {
    for (const v of set.variants) {
      const label = STYLE_LABELS[v.style] ?? v.style;
      rows.push(csvRow(["Subject Line", `${set.emailContext} - ${label}`, v.subject, v.previewText, "", ""]));
    }
  }

  // CTA blocks
  for (const cta of content.ctaBlocks) {
    rows.push(csvRow(["CTA Block", cta.placement, cta.buttonText, cta.supportingCopy, cta.context, ""]));
  }

  // Re-engagement emails
  for (const e of content.reEngagementEmails) {
    rows.push(csvRow(["Re-Engagement", e.tone, e.hook, "", e.body, e.cta]));
  }

  // UTF-8 BOM so Excel opens correctly
  return "\uFEFF" + rows.join("\r\n");
}

function downloadCsv(csv: string, filename: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface EmailCampaignViewerProps {
  reportId: string;
  content: EmailCampaignContent;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [text]);

  return (
    <button
      onClick={handleCopy}
      className="font-[family-name:var(--font-sans)] text-xs px-2 py-1 rounded-[var(--radius-sm)] border border-[var(--color-border)] hover:bg-[var(--color-muted)] transition-colors whitespace-nowrap shrink-0"
    >
      {copied ? "Copied!" : "Copy"}
    </button>
  );
}

function SectionHeading({
  title,
  count,
  onRefresh,
  refreshing,
  justUpdated,
  action,
}: {
  title: string;
  count?: number;
  onRefresh?: () => void;
  refreshing?: boolean;
  justUpdated?: boolean;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2">
      <h2 className="font-[family-name:var(--font-sans)] text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">
        {title}{" "}
        {count !== undefined && (
          <span className="font-normal">({count})</span>
        )}
      </h2>
      {justUpdated && (
        <span className="font-[family-name:var(--font-sans)] text-xs text-[var(--color-success)] font-medium">
          Updated!
        </span>
      )}
      {action}
      {onRefresh && (
        <button
          onClick={onRefresh}
          disabled={refreshing}
          title="Generate fresh alternatives"
          className={`ml-auto p-1 rounded-[var(--radius-sm)] border border-transparent hover:border-[var(--color-border)] hover:bg-[var(--color-muted)] transition-colors disabled:opacity-50 ${
            refreshing ? "animate-spin" : ""
          }`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-[var(--color-text-secondary)]"
          >
            <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" />
          </svg>
        </button>
      )}
    </div>
  );
}

function Card({
  children,
  copyText,
}: {
  children: React.ReactNode;
  copyText: string;
}) {
  return (
    <div className="flex items-start justify-between gap-3 p-4 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)]">
      <div className="flex-1 min-w-0 space-y-2">{children}</div>
      <CopyButton text={copyText} />
    </div>
  );
}

function CollapsibleBody({ body }: { body: string }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border-t border-[var(--color-border)] pt-2 mt-1">
      <button
        onClick={() => setExpanded(!expanded)}
        className="font-[family-name:var(--font-sans)] text-xs font-medium text-[var(--color-text)] hover:text-[var(--color-accent)] transition-colors"
      >
        {expanded ? "Hide email body ↑" : "Show email body ↓"}
      </button>
      {expanded && (
        <p className="font-[family-name:var(--font-sans)] text-sm text-[var(--color-text)] mt-2 whitespace-pre-line">
          {body}
        </p>
      )}
    </div>
  );
}

function CtaIdea({ text }: { text: string }) {
  return (
    <div className="p-2 rounded-[var(--radius-sm)] bg-[var(--color-muted)] border border-[var(--color-border)] space-y-1">
      <div className="flex items-center justify-between">
        <span className="font-[family-name:var(--font-sans)] text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-secondary)]">
          CTA Idea
        </span>
        <CopyButton text={text} />
      </div>
      <p className="font-[family-name:var(--font-sans)] text-sm text-[var(--color-text)]">
        {text}
      </p>
    </div>
  );
}

function Badge({ children, variant = "default" }: { children: React.ReactNode; variant?: "default" | "accent" | "style" | "lavender" }) {
  const classes =
    variant === "accent"
      ? "bg-[var(--color-accent-light)] text-[var(--color-text-secondary)]"
      : variant === "style"
      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
      : variant === "lavender"
      ? "bg-violet-50 text-violet-700 border border-violet-200"
      : "bg-[var(--color-muted)] text-[var(--color-text-secondary)]";
  return (
    <span className={`font-[family-name:var(--font-sans)] text-[10px] font-medium px-2.5 py-1 rounded-full ${classes}`}>
      {children}
    </span>
  );
}

export function EmailCampaignViewer({
  reportId,
  content: initialContent,
}: EmailCampaignViewerProps) {
  const [personaFilter, setPersonaFilter] = useState<string>("All");
  const [content, setContent] = useState<EmailCampaignContent>(initialContent);
  const [refreshing, setRefreshing] = useState<Record<string, boolean>>({});
  const [justUpdated, setJustUpdated] = useState<Record<string, boolean>>({});

  // Extract unique personas
  const personas = new Map<string, string>();
  content.personaEmails.forEach((p) =>
    personas.set(p.personaSlug, p.personaName)
  );

  // Filtered persona emails
  const filteredPersonaEmails = content.personaEmails.filter(
    (p) => personaFilter === "All" || p.personaSlug === personaFilter
  );

  // Sorted drip sequence
  const sortedDrip = [...content.dripSequence].sort(
    (a, b) => a.sequenceOrder - b.sequenceOrder
  );

  const handleRefreshSection = useCallback(
    async (contentType: ContentType) => {
      setRefreshing((prev) => ({ ...prev, [contentType]: true }));
      setJustUpdated((prev) => ({ ...prev, [contentType]: false }));

      try {
        const res = await fetch(
          `/api/reports/${reportId}/email-campaign/regenerate`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ contentType }),
          }
        );

        if (res.ok) {
          // Poll until status is completed or failed (max 60s)
          const deadline = Date.now() + 60_000;
          let settled = false;
          while (Date.now() < deadline) {
            await new Promise((resolve) => setTimeout(resolve, 3000));
            const statusRes = await fetch(
              `/api/reports/${reportId}/email-campaign/status`
            );
            if (!statusRes.ok) break;
            const data = await statusRes.json();
            const status = data.campaign?.status;
            if (status === "completed") {
              if (data.campaign?.content) {
                setContent(data.campaign.content);
              }
              settled = true;
              break;
            }
            if (status === "failed") break;
          }

          if (settled) {
            setJustUpdated((prev) => ({ ...prev, [contentType]: true }));
            setTimeout(() => {
              setJustUpdated((prev) => ({ ...prev, [contentType]: false }));
            }, 3000);
          }
        }
      } catch {
        // Ignore — user can retry
      } finally {
        setRefreshing((prev) => ({ ...prev, [contentType]: false }));
      }
    },
    [reportId]
  );

  function handleExportCsv() {
    const filename = "email-campaign-" + reportId + ".csv";
    downloadCsv(buildCsv(content), filename);
  }

  function getNewsletterCopyText() {
    const nl = content.newsletter;
    if (!nl) return "";
    const blocks = nl.contentBlocks
      .map((b) => `${b.heading}\n${b.keyMetric}\n${b.body}`)
      .join("\n\n");
    return `${nl.headline}\n${nl.subheadline}\n\n${blocks}\n\n${nl.footerCta}`;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-end">
        <button
          onClick={handleExportCsv}
          className="font-[family-name:var(--font-sans)] text-xs px-3 py-1.5 rounded-[var(--radius-sm)] border border-[var(--color-border)] hover:bg-[var(--color-muted)] transition-colors"
        >
          Export CSV
        </button>
      </div>

      {/* Drip Sequence */}
      {sortedDrip.length > 0 && (
        <section className="space-y-4">
          <SectionHeading
            title="Proposed Email Sequence"
            count={sortedDrip.length}
            onRefresh={() => handleRefreshSection("dripSequence")}
            refreshing={refreshing.dripSequence}
            justUpdated={justUpdated.dripSequence}
          />
          {sortedDrip.map((email, i) => (
            <Card
              key={i}
              copyText={`Subject: ${email.subject}\n\n${email.body}\n\nCTA: ${email.cta}`}
            >
              <div className="flex items-center gap-2">
                <Badge>Day {email.dayOffset}</Badge>
                <Badge variant="lavender">{humaniseLabel(email.reportSection)}</Badge>
              </div>
              <div className="space-y-1">
                <p className="font-[family-name:var(--font-sans)] text-sm font-semibold text-[var(--color-text)]">
                  {email.subject}
                </p>
                <p className="font-[family-name:var(--font-sans)] text-xs text-[var(--color-text-secondary)]">
                  {email.previewText}
                </p>
              </div>
              <CollapsibleBody body={email.body} />
              <CtaIdea text={email.cta} />
            </Card>
          ))}
        </section>
      )}

      {/* Newsletter */}
      {content.newsletter && (
        <section className="space-y-3">
          <SectionHeading
            title="Market Intelligence Newsletter"
            count={1}
            onRefresh={() => handleRefreshSection("newsletter")}
            refreshing={refreshing.newsletter}
            justUpdated={justUpdated.newsletter}
            action={<CopyButton text={getNewsletterCopyText()} />}
          />
          <div className="p-4 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] space-y-4">
            <div>
              <h3 className="font-[family-name:var(--font-serif)] text-xl font-bold text-[var(--color-text)]">
                {content.newsletter.headline}
              </h3>
              <p className="font-[family-name:var(--font-sans)] text-sm text-[var(--color-text-secondary)] mt-1">
                {content.newsletter.subheadline}
              </p>
            </div>
            {content.newsletter.contentBlocks.map((block, i) => (
              <div
                key={i}
                className="p-3 rounded-[var(--radius-sm)] border border-[var(--color-border)] space-y-1.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <p className="font-[family-name:var(--font-sans)] text-sm font-semibold text-[var(--color-text)]">
                      {block.heading}
                    </p>
                    <p className="font-[family-name:var(--font-sans)] text-sm font-bold text-[var(--color-text)]">
                      {block.keyMetric}
                    </p>
                  </div>
                  <CopyButton text={`${block.heading}\n${block.keyMetric}\n${block.body}`} />
                </div>
                <p className="font-[family-name:var(--font-sans)] text-sm text-[var(--color-text-secondary)]">
                  {block.body}
                </p>
              </div>
            ))}
            <div className="pt-2 border-t border-[var(--color-border)]">
              <CtaIdea text={content.newsletter.footerCta} />
            </div>
          </div>
        </section>
      )}

      {/* Persona-Targeted Emails */}
      <section className="space-y-3">
        <SectionHeading
          title="Persona-Targeted Emails"
          count={content.personaEmails.length}
          onRefresh={() => handleRefreshSection("personaEmails")}
          refreshing={refreshing.personaEmails}
          justUpdated={justUpdated.personaEmails}
        />
        {personas.size > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => setPersonaFilter("All")}
              className={`font-[family-name:var(--font-sans)] text-xs px-2.5 py-1 rounded-full border transition-colors ${
                personaFilter === "All"
                  ? "bg-[var(--color-accent-light)] border-[var(--color-accent)] text-[var(--color-text)]"
                  : "border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-muted)]"
              }`}
            >
              All
            </button>
            {Array.from(personas).map(([slug, name]) => (
              <button
                key={slug}
                onClick={() => setPersonaFilter(slug)}
                className={`font-[family-name:var(--font-sans)] text-xs px-2.5 py-1 rounded-full border transition-colors ${
                  personaFilter === slug
                    ? "bg-[var(--color-accent-light)] border-[var(--color-accent)] text-[var(--color-text)]"
                    : "border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-muted)]"
                }`}
              >
                {name}
              </button>
            ))}
          </div>
        )}
        {filteredPersonaEmails.length > 0 ? (
          filteredPersonaEmails.map((email, i) => (
            <Card
              key={i}
              copyText={`Subject: ${email.subject}\n\n${email.body}\n\nCTA: ${email.cta}`}
            >
              <div><Badge variant="accent">{email.personaName}</Badge></div>
              <div className="space-y-1">
                <p className="font-[family-name:var(--font-sans)] text-sm font-semibold text-[var(--color-text)]">
                  {email.subject}
                </p>
                <p className="font-[family-name:var(--font-sans)] text-xs text-[var(--color-text-secondary)]">
                  {email.previewText}
                </p>
              </div>
              <CollapsibleBody body={email.body} />
              <CtaIdea text={email.cta} />
              {email.vocabularyUsed.length > 0 && (
                <div className="border-t border-[var(--color-border)] pt-2 space-y-1.5">
                  <span className="font-[family-name:var(--font-sans)] text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-secondary)]">
                    Persona Keywords
                  </span>
                  <div className="flex gap-1 flex-wrap">
                    {email.vocabularyUsed.map((word) => (
                      <span
                        key={word}
                        className="font-[family-name:var(--font-sans)] text-[10px] px-2 py-0.5 rounded-full bg-[var(--color-muted)] text-[var(--color-text-secondary)]"
                      >
                        {word}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          ))
        ) : (
          <div className="p-4 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)]">
            <p className="font-[family-name:var(--font-sans)] text-sm text-[var(--color-text-secondary)]">
              No buyer personas were selected for this report
            </p>
            <p className="font-[family-name:var(--font-sans)] text-xs text-[var(--color-text-secondary)] mt-1">
              Add personas to your next report for targeted email copy
            </p>
          </div>
        )}
      </section>

      {/* Subject Line Variants */}
      {content.subjectLines.length > 0 && (
        <section className="space-y-3">
          <SectionHeading
            title="Subject Line Variants"
            count={content.subjectLines.length}
            onRefresh={() => handleRefreshSection("subjectLines")}
            refreshing={refreshing.subjectLines}
            justUpdated={justUpdated.subjectLines}
          />
          {content.subjectLines.map((set, i) => (
            <div key={i} className="space-y-1">
              <p className="font-[family-name:var(--font-sans)] text-xs font-medium text-[var(--color-text)]">
                {set.emailContext}
              </p>
              <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] divide-y divide-[var(--color-border)]">
                {set.variants.map((variant, j) => (
                  <div key={j} className="flex items-start justify-between gap-3 p-3">
                    <div className="flex-1 min-w-0 space-y-2">
                      <Badge variant="style">{STYLE_LABELS[variant.style] ?? variant.style}</Badge>
                      <p className="font-[family-name:var(--font-sans)] text-sm text-[var(--color-text)]">
                        {variant.subject}
                      </p>
                      <p className="font-[family-name:var(--font-sans)] text-xs text-[var(--color-text-secondary)]">
                        {variant.previewText}
                      </p>
                    </div>
                    <CopyButton text={`${variant.subject}\n${variant.previewText}`} />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </section>
      )}

      {/* CTA Blocks */}
      {content.ctaBlocks.length > 0 && (
        <section className="space-y-3">
          <SectionHeading
            title="CTA Blocks"
            count={content.ctaBlocks.length}
            onRefresh={() => handleRefreshSection("ctaBlocks")}
            refreshing={refreshing.ctaBlocks}
            justUpdated={justUpdated.ctaBlocks}
          />
          {content.ctaBlocks.map((cta, i) => (
            <Card key={i} copyText={`${cta.buttonText}\n\n${cta.supportingCopy}`}>
              <Badge variant="accent">{cta.placement}</Badge>
              <CtaIdea text={cta.buttonText} />
              <p className="font-[family-name:var(--font-sans)] text-sm text-[var(--color-text-secondary)]">
                {cta.supportingCopy}
              </p>
              <p className="font-[family-name:var(--font-sans)] text-xs text-[var(--color-text-secondary)]">
                Context: {cta.context}
              </p>
            </Card>
          ))}
        </section>
      )}

      {/* Re-Engagement Templates */}
      {content.reEngagementEmails.length > 0 && (
        <section className="space-y-3">
          <SectionHeading
            title="Re-Engagement Templates"
            count={content.reEngagementEmails.length}
            onRefresh={() => handleRefreshSection("reEngagementEmails")}
            refreshing={refreshing.reEngagementEmails}
            justUpdated={justUpdated.reEngagementEmails}
          />
          {content.reEngagementEmails.map((email, i) => (
            <Card key={i} copyText={`${email.hook}\n\n${email.body}\n\nCTA: ${email.cta}`}>
              <Badge variant="lavender">{email.tone}</Badge>
              <p className="font-[family-name:var(--font-sans)] text-sm font-semibold text-[var(--color-text)]">
                {email.hook}
              </p>
              <CollapsibleBody body={email.body} />
              <CtaIdea text={email.cta} />
            </Card>
          ))}
        </section>
      )}
    </div>
  );
}
