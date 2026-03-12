"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import type { SocialMediaKitContent } from "@/lib/db/schema";

const PLATFORMS = ["All", "LinkedIn", "Instagram", "X", "Facebook"] as const;

interface KitViewerProps {
  reportId: string;
  content: SocialMediaKitContent;
  generatedAt: string | null;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for non-secure contexts
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

function PlatformBadge({ platform }: { platform: string }) {
  return (
    <span className="font-[family-name:var(--font-sans)] text-[10px] font-medium px-1.5 py-0.5 rounded-[var(--radius-sm)] bg-[var(--color-muted)] text-[var(--color-text-secondary)]">
      {platform}
    </span>
  );
}

function SectionHeading({ title, count }: { title: string; count: number }) {
  return (
    <h2 className="font-[family-name:var(--font-sans)] text-sm font-semibold text-[var(--color-text)] uppercase tracking-wide">
      {title}{" "}
      <span className="font-normal text-[var(--color-text-secondary)]">
        ({count})
      </span>
    </h2>
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
    <div className="flex items-start justify-between gap-3 p-3 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)]">
      <div className="flex-1 min-w-0 space-y-1.5">{children}</div>
      <CopyButton text={copyText} />
    </div>
  );
}

export function KitViewer({ reportId, content, generatedAt }: KitViewerProps) {
  const [platformFilter, setPlatformFilter] = useState<string>("All");
  const [personaFilter, setPersonaFilter] = useState<string>("All");
  const [regenerating, setRegenerating] = useState(false);

  // Extract unique personas
  const personas = new Map<string, string>();
  content.personaPosts.forEach((p) =>
    personas.set(p.personaSlug, p.personaName)
  );

  // Filter helpers
  const matchesPlatform = (platforms: string | string[]) => {
    if (platformFilter === "All") return true;
    if (Array.isArray(platforms)) return platforms.includes(platformFilter);
    return platforms === platformFilter;
  };

  // Filtered content
  const filteredPostIdeas = content.postIdeas.filter((p) =>
    matchesPlatform(p.platforms)
  );
  const filteredCaptions = content.captions.filter((c) =>
    matchesPlatform(c.platform)
  );
  const filteredPersonaPosts = content.personaPosts.filter(
    (p) =>
      matchesPlatform(p.platform) &&
      (personaFilter === "All" || p.personaSlug === personaFilter)
  );
  const filteredPolls = content.polls.filter((p) =>
    matchesPlatform(p.platform)
  );
  const filteredStatCallouts = content.statCallouts;
  // Conversation starters and calendar have no platform field — always show
  const filteredStarters = content.conversationStarters;
  const filteredCalendar = content.calendarSuggestions;

  async function handleRegenerate() {
    setRegenerating(true);
    try {
      const res = await fetch(`/api/reports/${reportId}/kit/generate`, {
        method: "POST",
      });
      if (res.ok) {
        // Redirect to report page where polling happens
        window.location.href = `/reports/${reportId}`;
      }
    } catch {
      // Ignore — user can retry
    } finally {
      setRegenerating(false);
    }
  }

  const formattedDate = generatedAt
    ? new Date(generatedAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link
          href={`/reports/${reportId}`}
          className="font-[family-name:var(--font-sans)] text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors"
        >
          &larr; Back to Report
        </Link>
        <button
          onClick={handleRegenerate}
          disabled={regenerating}
          className="font-[family-name:var(--font-sans)] text-xs px-3 py-1.5 rounded-[var(--radius-sm)] border border-[var(--color-border)] hover:bg-[var(--color-muted)] disabled:opacity-50 transition-colors"
        >
          {regenerating ? "Regenerating..." : "Regenerate Kit"}
        </button>
      </div>

      {/* Title */}
      <div>
        <h1 className="font-[family-name:var(--font-sans)] text-xl font-bold text-[var(--color-text)]">
          Social Media Kit
        </h1>
        {formattedDate && (
          <p className="font-[family-name:var(--font-sans)] text-xs text-[var(--color-text-secondary)] mt-0.5">
            Generated {formattedDate}
          </p>
        )}
      </div>

      {/* Platform filter */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="font-[family-name:var(--font-sans)] text-xs text-[var(--color-text-secondary)] mr-1">
          Platform:
        </span>
        {PLATFORMS.map((p) => (
          <button
            key={p}
            onClick={() => setPlatformFilter(p)}
            className={`font-[family-name:var(--font-sans)] text-xs px-2.5 py-1 rounded-[var(--radius-sm)] border transition-colors ${
              platformFilter === p
                ? "bg-[var(--color-primary)] text-white border-[var(--color-primary)]"
                : "border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-muted)]"
            }`}
          >
            {p}
          </button>
        ))}
      </div>

      {/* Post Ideas */}
      {filteredPostIdeas.length > 0 && (
        <section className="space-y-3">
          <SectionHeading
            title="Post Ideas"
            count={filteredPostIdeas.length}
          />
          {filteredPostIdeas.map((post, i) => (
            <Card
              key={i}
              copyText={`${post.title}\n\n${post.body}`}
            >
              <p className="font-[family-name:var(--font-sans)] text-sm font-semibold text-[var(--color-text)]">
                {post.title}
              </p>
              <p className="font-[family-name:var(--font-sans)] text-sm text-[var(--color-text-secondary)]">
                {post.body}
              </p>
              <div className="flex gap-1 flex-wrap">
                {post.platforms.map((pl) => (
                  <PlatformBadge key={pl} platform={pl} />
                ))}
              </div>
            </Card>
          ))}
        </section>
      )}

      {/* Platform Captions */}
      {filteredCaptions.length > 0 && (
        <section className="space-y-3">
          <SectionHeading
            title="Platform Captions"
            count={filteredCaptions.length}
          />
          {filteredCaptions.map((caption, i) => (
            <Card
              key={i}
              copyText={`${caption.caption}\n\n${caption.hashtags.join(" ")}`}
            >
              <div className="flex items-center gap-2">
                <PlatformBadge platform={caption.platform} />
                <span className="font-[family-name:var(--font-sans)] text-[10px] text-[var(--color-text-secondary)]">
                  {caption.characterCount} chars
                </span>
              </div>
              <p className="font-[family-name:var(--font-sans)] text-sm text-[var(--color-text)]">
                {caption.caption}
              </p>
              <p className="font-[family-name:var(--font-sans)] text-xs text-[var(--color-text-secondary)]">
                {caption.hashtags.join(" ")}
              </p>
            </Card>
          ))}
        </section>
      )}

      {/* Persona-Targeted Posts */}
      <section className="space-y-3">
        <SectionHeading
          title="Persona-Targeted Posts"
          count={filteredPersonaPosts.length}
        />
        {personas.size > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-[family-name:var(--font-sans)] text-xs text-[var(--color-text-secondary)] mr-1">
              Persona:
            </span>
            <button
              onClick={() => setPersonaFilter("All")}
              className={`font-[family-name:var(--font-sans)] text-xs px-2.5 py-1 rounded-[var(--radius-sm)] border transition-colors ${
                personaFilter === "All"
                  ? "bg-[var(--color-primary)] text-white border-[var(--color-primary)]"
                  : "border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-muted)]"
              }`}
            >
              All
            </button>
            {Array.from(personas).map(([slug, name]) => (
              <button
                key={slug}
                onClick={() => setPersonaFilter(slug)}
                className={`font-[family-name:var(--font-sans)] text-xs px-2.5 py-1 rounded-[var(--radius-sm)] border transition-colors ${
                  personaFilter === slug
                    ? "bg-[var(--color-primary)] text-white border-[var(--color-primary)]"
                    : "border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-muted)]"
                }`}
              >
                {name}
              </button>
            ))}
          </div>
        )}
        {filteredPersonaPosts.length > 0 ? (
          filteredPersonaPosts.map((post, i) => (
            <Card key={i} copyText={post.post}>
              <div className="flex items-center gap-2">
                <span className="font-[family-name:var(--font-sans)] text-xs font-medium text-[var(--color-primary)]">
                  {post.personaName}
                </span>
                <PlatformBadge platform={post.platform} />
              </div>
              <p className="font-[family-name:var(--font-sans)] text-sm text-[var(--color-text)]">
                {post.post}
              </p>
            </Card>
          ))
        ) : (
          <p className="font-[family-name:var(--font-sans)] text-sm text-[var(--color-text-secondary)] italic">
            {personas.size === 0
              ? "No personas were selected for this report"
              : "No posts match the current filters"}
          </p>
        )}
      </section>

      {/* Polls */}
      {filteredPolls.length > 0 && (
        <section className="space-y-3">
          <SectionHeading title="Polls" count={filteredPolls.length} />
          {filteredPolls.map((poll, i) => (
            <Card
              key={i}
              copyText={`${poll.question}\n\n${poll.options.map((o) => `- ${o}`).join("\n")}\n\nContext: ${poll.dataContext}`}
            >
              <p className="font-[family-name:var(--font-sans)] text-sm font-semibold text-[var(--color-text)]">
                {poll.question}
              </p>
              <ul className="space-y-0.5">
                {poll.options.map((opt, j) => (
                  <li
                    key={j}
                    className="font-[family-name:var(--font-sans)] text-sm text-[var(--color-text-secondary)] pl-3"
                  >
                    &bull; {opt}
                  </li>
                ))}
              </ul>
              <p className="font-[family-name:var(--font-sans)] text-xs text-[var(--color-text-secondary)]">
                Context: {poll.dataContext}
              </p>
              <PlatformBadge platform={poll.platform} />
            </Card>
          ))}
        </section>
      )}

      {/* Conversation Starters */}
      {filteredStarters.length > 0 && (
        <section className="space-y-3">
          <SectionHeading
            title="Conversation Starters"
            count={filteredStarters.length}
          />
          {filteredStarters.map((starter, i) => (
            <Card key={i} copyText={starter.template}>
              <p className="font-[family-name:var(--font-sans)] text-xs font-medium text-[var(--color-primary)]">
                {starter.context}
              </p>
              <p className="font-[family-name:var(--font-sans)] text-sm text-[var(--color-text)]">
                {starter.template}
              </p>
            </Card>
          ))}
        </section>
      )}

      {/* Stat Callouts */}
      {filteredStatCallouts.length > 0 && (
        <section className="space-y-3">
          <SectionHeading
            title="Stat Callouts"
            count={filteredStatCallouts.length}
          />
          {filteredStatCallouts.map((stat, i) => (
            <Card
              key={i}
              copyText={`${stat.stat}\n\n${stat.context}\n\nSource: ${stat.source}\n\n${stat.suggestedCaption}`}
            >
              <p className="font-[family-name:var(--font-sans)] text-sm font-bold text-[var(--color-text)]">
                {stat.stat}
              </p>
              <p className="font-[family-name:var(--font-sans)] text-sm text-[var(--color-text-secondary)]">
                {stat.context}
              </p>
              <p className="font-[family-name:var(--font-sans)] text-xs text-[var(--color-text-secondary)]">
                Source: {stat.source}
              </p>
              <p className="font-[family-name:var(--font-sans)] text-xs italic text-[var(--color-text-secondary)]">
                &ldquo;{stat.suggestedCaption}&rdquo;
              </p>
            </Card>
          ))}
        </section>
      )}

      {/* Content Calendar */}
      {filteredCalendar.length > 0 && (
        <section className="space-y-3">
          <SectionHeading
            title="Content Calendar"
            count={filteredCalendar.length}
          />
          {filteredCalendar.map((week, i) => (
            <div
              key={i}
              className="p-3 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] space-y-1.5"
            >
              <p className="font-[family-name:var(--font-sans)] text-sm font-semibold text-[var(--color-text)]">
                Week {week.week}: {week.theme}
              </p>
              <p className="font-[family-name:var(--font-sans)] text-sm text-[var(--color-text-secondary)]">
                Posts: {week.postIdeas.join(", ")}
              </p>
              <div className="flex gap-1 flex-wrap">
                {week.platforms.map((pl) => (
                  <PlatformBadge key={pl} platform={pl} />
                ))}
              </div>
            </div>
          ))}
        </section>
      )}
    </div>
  );
}
