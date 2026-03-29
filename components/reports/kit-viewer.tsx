"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import type { SocialMediaKitContent } from "@/lib/db/schema";


// ---------------------------------------------------------------------------
// Platform brand config
// ---------------------------------------------------------------------------

const PLATFORM_CONFIG: Record<
  string,
  {
    label: string;
    colorVar: string;
    lightVar: string;
    icon: (size: number) => React.ReactNode;
  }
> = {
  LinkedIn: {
    label: "LinkedIn",
    colorVar: "--color-platform-linkedin",
    lightVar: "--color-platform-linkedin-light",
    icon: (s) => (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
      </svg>
    ),
  },
  Instagram: {
    label: "Instagram",
    colorVar: "--color-platform-instagram",
    lightVar: "--color-platform-instagram-light",
    icon: (s) => (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
      </svg>
    ),
  },
  X: {
    label: "X",
    colorVar: "--color-platform-x",
    lightVar: "--color-platform-x-light",
    icon: (s) => (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
  },
  Facebook: {
    label: "Facebook",
    colorVar: "--color-platform-facebook",
    lightVar: "--color-platform-facebook-light",
    icon: (s) => (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    ),
  },
};

const PLATFORMS = ["All", "LinkedIn", "Instagram", "X", "Facebook"] as const;

// Normalize DB platform values (lowercase) to PLATFORM_CONFIG keys (Title Case)
function normalizePlatform(platform: string): string {
  const map: Record<string, string> = {
    linkedin: "LinkedIn",
    instagram: "Instagram",
    x: "X",
    facebook: "Facebook",
  };
  return map[platform.toLowerCase()] ?? platform;
}

// ---------------------------------------------------------------------------
// Section icons (inline SVGs)
// ---------------------------------------------------------------------------

function IconLightbulb() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18h6M10 22h4M12 2v1M4.22 4.22l.71.71M1 12h1M21 12h1M18.36 4.64l.71-.71" />
      <path d="M18 12a6 6 0 0 0-9.33-5A5.93 5.93 0 0 0 6 12c0 1.66.68 3.16 1.76 4.24l.71.71A2 2 0 0 1 9 18h6a2 2 0 0 1 .53-1.05l.71-.71A5.93 5.93 0 0 0 18 12z" />
    </svg>
  );
}

function IconQuote() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V21z" />
      <path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3z" />
    </svg>
  );
}

function IconUsers() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function IconBarChart() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  );
}

function IconMessageCircle() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </svg>
  );
}

function IconTrendingUp() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <polyline points="17 6 23 6 23 12" />
    </svg>
  );
}

function IconCalendar() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function IconRefresh() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Animation variants
// ---------------------------------------------------------------------------

const EASE_STANDARD = [0.4, 0, 0.2, 1] as [number, number, number, number];

const cardVariant = {
  initial: { opacity: 0, y: 12 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.25, ease: EASE_STANDARD },
  },
};

const sectionVariant = {
  initial: {},
  animate: {
    transition: { staggerChildren: 0.06, delayChildren: 0.05 },
  },
};

const slideDownVariant = {
  initial: { opacity: 0, height: 0 },
  animate: {
    opacity: 1,
    height: "auto",
    transition: { duration: 0.25, ease: EASE_STANDARD },
  },
  exit: {
    opacity: 0,
    height: 0,
    transition: { duration: 0.18, ease: EASE_STANDARD },
  },
};

// ---------------------------------------------------------------------------
// Platform Post Preview constants
// ---------------------------------------------------------------------------

const X_CHAR_LIMIT = 280;
const IG_TRUNCATE = 125;

// ---------------------------------------------------------------------------
// Platform Post Preview components
// ---------------------------------------------------------------------------

function LinkedInPreview({
  caption,
  hashtags,
}: {
  caption: string;
  hashtags: string[];
}) {
  const hashtagSet = new Set(hashtags);
  const words = caption.split(/(\s+)/);

  return (
    <div
      className="rounded-[var(--radius-lg)] overflow-hidden bg-white shadow-[var(--shadow-md)]"
      style={{ borderTop: "3px solid #0A66C2", border: "1px solid #e0e0e0", borderTopWidth: "3px", borderTopColor: "#0A66C2" }}
    >
      {/* Card header */}
      <div className="p-4 pb-2 flex items-start justify-between">
        <div className="flex items-center gap-2.5">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
            style={{ backgroundColor: "#0A66C2" }}
          >
            YN
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900 leading-tight">Your Name</p>
            <p className="text-xs text-gray-500 leading-tight">Luxury Real Estate Advisor · 1st</p>
            <p className="text-xs text-gray-400 mt-0.5">Just now</p>
          </div>
        </div>
        {/* LinkedIn logo mark */}
        <svg width="18" height="18" viewBox="0 0 24 24" fill="#0A66C2">
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
        </svg>
      </div>

      {/* Caption body */}
      <div className="px-4 pb-3">
        <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
          {words.map((word, i) =>
            hashtagSet.has(word.trim()) ? (
              <span key={i} style={{ color: "#0A66C2" }}>{word}</span>
            ) : (
              <span key={i}>{word}</span>
            )
          )}
        </p>
      </div>

      {/* Reaction bar */}
      <div className="px-4 py-2 border-t border-gray-200 flex items-center gap-4">
        {["👍 Like", "💬 Comment", "🔁 Repost", "✉️ Send"].map((r) => (
          <span key={r} className="text-xs text-gray-500 cursor-default select-none">{r}</span>
        ))}
      </div>
    </div>
  );
}

function InstagramPreview({
  caption,
  hashtags,
}: {
  caption: string;
  hashtags: string[];
}) {
  const isTruncated = caption.length > IG_TRUNCATE;
  const displayCaption = isTruncated ? caption.slice(0, IG_TRUNCATE) : caption;
  const hashtagSet = new Set(hashtags);

  return (
    <div className="rounded-[var(--radius-lg)] overflow-hidden bg-white mx-auto" style={{ border: "1px solid #dbdbdb", maxWidth: "320px" }}>
      {/* Header */}
      <div className="px-3 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold"
            style={{ background: "linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)" }}
          >
            YN
          </div>
          <span className="text-xs font-semibold text-gray-900">@yourname</span>
        </div>
        <span className="text-xs font-semibold" style={{ color: "#0095f6" }}>Follow</span>
      </div>

      {/* Image placeholder — branded graphic */}
      <div
        className="w-full relative flex flex-col items-center justify-center"
        style={{
          aspectRatio: "1 / 1",
          background: "linear-gradient(135deg, #0F172A 0%, #1E293B 60%, #0F172A 100%)",
        }}
      >
        {/* Gold accent line */}
        <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: "linear-gradient(90deg, transparent, #CA8A04, transparent)" }} />
        {/* Market label */}
        <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500 mb-3 select-none">
          Market Intelligence
        </p>
        {/* Stat callout extracted from first sentence */}
        <p className="text-slate-100 text-center text-lg font-bold px-8 leading-tight select-none" style={{ fontFamily: "Georgia, serif" }}>
          {hashtags[0]?.replace("#", "") ?? "Luxury Market"}
        </p>
        <div className="w-8 h-0.5 mt-3 mb-3" style={{ backgroundColor: "#CA8A04" }} />
        <p className="text-slate-400 text-[10px] uppercase tracking-widest select-none">
          Quarterly Report
        </p>
        {/* Bottom accent */}
        <div className="absolute bottom-0 left-0 right-0 h-0.5" style={{ background: "linear-gradient(90deg, transparent, #CA8A04, transparent)" }} />
      </div>

      {/* Action bar */}
      <div className="px-3 pt-2.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-lg cursor-default select-none">♡</span>
          <span className="text-lg cursor-default select-none">💬</span>
          <span className="text-lg cursor-default select-none">✈️</span>
        </div>
        <span className="text-lg cursor-default select-none">🔖</span>
      </div>

      {/* Caption */}
      <div className="px-3 pt-1 pb-3">
        <p className="text-sm text-gray-800 leading-relaxed">
          <span className="font-semibold mr-1">yourname</span>
          {displayCaption}
          {isTruncated && (
            <span className="text-gray-400">{"... "}<span className="cursor-pointer">more</span></span>
          )}
        </p>
        <p className="text-xs text-gray-400 mt-1 cursor-default">View all 24 comments</p>
        <p className="text-xs mt-1">
          {hashtags.map((tag, i) => (
            <span key={i} style={{ color: "#E4405F" }}>{tag} </span>
          ))}
        </p>
      </div>
    </div>
  );
}

function XPreview({
  caption,
  hashtags,
}: {
  caption: string;
  hashtags: string[];
}) {
  const count = caption.length;
  const isOver = count > X_CHAR_LIMIT;
  const displayCaption = isOver ? caption.slice(0, X_CHAR_LIMIT) : caption;
  const hashtagSet = new Set(hashtags);
  const words = displayCaption.split(/(\s+)/);

  return (
    <div
      className="rounded-[var(--radius-lg)] bg-white p-4"
      style={{ border: "1px solid rgba(15,20,25,0.15)" }}
    >
      {/* Header */}
      <div className="flex items-start gap-2.5">
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
          style={{ backgroundColor: "#0F1419" }}
        >
          YN
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-bold text-gray-900">Your Name</span>
            <span className="text-sm text-gray-500">@yourhandle</span>
          </div>
          {/* Post body */}
          <p className="text-sm text-gray-900 leading-relaxed mt-1 whitespace-pre-wrap">
            {words.map((word, i) =>
              hashtagSet.has(word.trim()) ? (
                <span key={i} style={{ color: "#1D9BF0" }}>{word}</span>
              ) : (
                <span key={i}>{word}</span>
              )
            )}
            {isOver && <span className="text-gray-400">…</span>}
          </p>

          {/* Action bar + character count */}
          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center gap-4">
              {["💬", "🔁", "♡", "📊", "↑"].map((r) => (
                <span key={r} className="text-gray-400 text-sm cursor-default select-none">{r}</span>
              ))}
            </div>
            <span
              className="text-xs font-medium"
              style={{ color: isOver ? "#B91C1C" : "#536471" }}
            >
              {count}/{X_CHAR_LIMIT}
              {isOver && " ⚠️"}
            </span>
          </div>

          {isOver && (
            <p className="text-xs mt-2 font-medium" style={{ color: "#B91C1C" }}>
              ⚠ Exceeds X limit — edit before posting
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function FacebookPreview({
  caption,
  hashtags,
}: {
  caption: string;
  hashtags: string[];
}) {
  const hashtagSet = new Set(hashtags);
  const words = caption.split(/(\s+)/);

  return (
    <div
      className="rounded-[var(--radius-lg)] bg-white p-4"
      style={{ border: "1px solid #dddfe2" }}
    >
      {/* Header */}
      <div className="flex items-center gap-2.5 mb-3">
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold"
          style={{ backgroundColor: "#1877F2" }}
        >
          YN
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-900 leading-tight">Your Name</p>
          <p className="text-xs text-gray-500">Just now · 🌐</p>
        </div>
      </div>

      {/* Caption */}
      <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap mb-3">
        {words.map((word, i) =>
          hashtagSet.has(word.trim()) ? (
            <span key={i} style={{ color: "#1877F2" }}>{word}</span>
          ) : (
            <span key={i}>{word}</span>
          )
        )}
      </p>

      {/* Reaction bar */}
      <div className="pt-2 border-t border-gray-200 flex items-center gap-4">
        {["👍 Like", "💬 Comment", "↗️ Share"].map((r) => (
          <span key={r} className="text-xs text-gray-500 cursor-default select-none">{r}</span>
        ))}
      </div>
    </div>
  );
}

function PostPreview({
  platform,
  caption,
  hashtags,
}: {
  platform: string;
  caption: string;
  hashtags: string[];
}) {
  switch (normalizePlatform(platform)) {
    case "LinkedIn":
      return <LinkedInPreview caption={caption} hashtags={hashtags} />;
    case "Instagram":
      return <InstagramPreview caption={caption} hashtags={hashtags} />;
    case "X":
      return <XPreview caption={caption} hashtags={hashtags} />;
    case "Facebook":
      return <FacebookPreview caption={caption} hashtags={hashtags} />;
    default:
      return null;
  }
}

// ---------------------------------------------------------------------------
// Utility components
// ---------------------------------------------------------------------------

type ContentType = keyof SocialMediaKitContent;

interface KitViewerProps {
  reportId: string;
  content: SocialMediaKitContent;
  generatedAt: string | null;
}

function PlatformIcon({
  platform,
  size = 14,
}: {
  platform: string;
  size?: number;
}) {
  const config = PLATFORM_CONFIG[normalizePlatform(platform)];
  if (!config) return null;
  return (
    <span style={{ color: `var(${config.colorVar})` }} className="inline-flex shrink-0">
      {config.icon(size)}
    </span>
  );
}

function PlatformBadge({ platform }: { platform: string }) {
  const config = PLATFORM_CONFIG[normalizePlatform(platform)];
  if (!config) {
    return (
      <span className="font-[family-name:var(--font-sans)] text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-[var(--color-primary-light)] text-[var(--color-text-secondary)] inline-flex items-center gap-1">
        {platform}
      </span>
    );
  }
  return (
    <span
      className="font-[family-name:var(--font-sans)] text-[10px] font-medium px-2 py-0.5 rounded-full inline-flex items-center gap-1"
      style={{
        backgroundColor: `var(${config.lightVar})`,
        color: `var(${config.colorVar})`,
      }}
    >
      <PlatformIcon platform={platform} size={11} />
      {config.label}
    </span>
  );
}

function CopyButton({
  text,
  variant = "light",
}: {
  text: string;
  variant?: "light" | "dark";
}) {
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

  const baseClasses =
    variant === "dark"
      ? "border-slate-600 text-slate-300 hover:bg-slate-700"
      : "border-[var(--color-border)] hover:bg-[var(--color-primary-light)]";

  return (
    <button
      onClick={handleCopy}
      className={`font-[family-name:var(--font-sans)] text-xs px-2 py-1 rounded-[var(--radius-sm)] border transition-all whitespace-nowrap shrink-0 ${baseClasses}`}
    >
      {copied ? (
        <motion.span
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-[var(--color-success)] inline-block"
        >
          ✓
        </motion.span>
      ) : (
        "Copy"
      )}
    </button>
  );
}

function StatBox({ label, value }: { label: string; value: number }) {
  return (
    <div className="text-center py-2.5 rounded-[var(--radius-md)] bg-[var(--color-background)]">
      <p className="font-[family-name:var(--font-serif)] text-xl font-bold text-[var(--color-accent)]">
        {value}
      </p>
      <p className="font-[family-name:var(--font-sans)] text-[10px] text-[var(--color-text-secondary)] uppercase tracking-wider mt-0.5">
        {label}
      </p>
    </div>
  );
}

function SectionHeading({
  title,
  count,
  icon,
  accentColor,
  onRefresh,
  refreshing,
  justUpdated,
}: {
  title: string;
  count: number;
  icon: React.ReactNode;
  accentColor: string;
  onRefresh?: () => void;
  refreshing?: boolean;
  justUpdated?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 pb-2.5 border-b border-[var(--color-border)]">
      <div
        className="w-1 h-6 rounded-full shrink-0"
        style={{ backgroundColor: accentColor }}
      />
      <span className="text-[var(--color-text-secondary)] shrink-0">{icon}</span>
      <h2 className="font-[family-name:var(--font-serif)] text-base font-semibold text-[var(--color-text)]">
        {title}
        <span className="ml-2 font-[family-name:var(--font-sans)] text-xs font-normal text-[var(--color-text-tertiary)]">
          {count}
        </span>
      </h2>
      {justUpdated && (
        <span className="font-[family-name:var(--font-sans)] text-xs text-[var(--color-success)] font-medium">
          Updated!
        </span>
      )}
      {onRefresh && (
        <button
          onClick={onRefresh}
          disabled={refreshing}
          title="Generate fresh alternatives"
          className={`ml-auto p-1.5 rounded-[var(--radius-sm)] border border-transparent hover:border-[var(--color-border)] hover:bg-[var(--color-primary-light)] transition-colors disabled:opacity-50 text-[var(--color-text-secondary)] ${
            refreshing ? "animate-spin" : ""
          }`}
        >
          <IconRefresh />
        </button>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function KitViewer({
  reportId,
  content: initialContent,
  generatedAt,
}: KitViewerProps) {
  const [platformFilter, setPlatformFilter] = useState<string>("All");
  const [personaFilter, setPersonaFilter] = useState<string>("All");
  const [regenerating, setRegenerating] = useState(false);
  const [content, setContent] =
    useState<SocialMediaKitContent>(initialContent);
  const [refreshing, setRefreshing] = useState<Record<string, boolean>>({});
  const [justUpdated, setJustUpdated] = useState<Record<string, boolean>>({});
  const [openPreviewId, setOpenPreviewId] = useState<string | null>(null);

  const togglePreview = useCallback((id: string) => {
    setOpenPreviewId((prev) => (prev === id ? null : id));
  }, []);

  // Extract unique personas
  const personas = new Map<string, string>();
  content.personaPosts.forEach((p) =>
    personas.set(p.personaSlug, p.personaName)
  );

  // Compute summary stats
  const totalCount =
    content.postIdeas.length +
    content.captions.length +
    content.personaPosts.length +
    content.polls.length +
    content.conversationStarters.length +
    content.calendarSuggestions.length +
    content.statCallouts.length;

  const platformsCovered = new Set<string>();
  content.postIdeas.forEach((p) =>
    p.platforms.forEach((pl) => platformsCovered.add(pl))
  );
  content.captions.forEach((c) => platformsCovered.add(c.platform));
  content.personaPosts.forEach((p) => platformsCovered.add(p.platform));
  content.polls.forEach((p) => platformsCovered.add(p.platform));
  content.calendarSuggestions.forEach((w) =>
    w.platforms.forEach((pl) => platformsCovered.add(pl))
  );

  const activeSections = [
    content.postIdeas,
    content.captions,
    content.personaPosts,
    content.polls,
    content.conversationStarters,
    content.calendarSuggestions,
    content.statCallouts,
  ].filter((s) => s.length > 0).length;

  const handleRefreshSection = useCallback(
    async (contentType: ContentType) => {
      setRefreshing((prev) => ({ ...prev, [contentType]: true }));
      setJustUpdated((prev) => ({ ...prev, [contentType]: false }));

      try {
        const res = await fetch(`/api/reports/${reportId}/kit/regenerate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contentType }),
        });

        if (res.ok) {
          const pollForUpdate = async () => {
            const statusRes = await fetch(
              `/api/reports/${reportId}/kit/status`
            );
            if (statusRes.ok) {
              const data = await statusRes.json();
              if (data.kit?.content) {
                setContent(data.kit.content);
              }
            }
          };
          await new Promise((resolve) => setTimeout(resolve, 2000));
          await pollForUpdate();

          setJustUpdated((prev) => ({ ...prev, [contentType]: true }));
          setTimeout(() => {
            setJustUpdated((prev) => ({ ...prev, [contentType]: false }));
          }, 3000);
        }
      } catch {
        // Ignore — user can retry
      } finally {
        setRefreshing((prev) => ({ ...prev, [contentType]: false }));
      }
    },
    [reportId]
  );

  // Filter helpers — normalize both sides since DB stores lowercase platform names
  const matchesPlatform = (platforms: string | string[]) => {
    if (platformFilter === "All") return true;
    if (Array.isArray(platforms))
      return platforms.map(normalizePlatform).includes(platformFilter);
    return normalizePlatform(platforms) === platformFilter;
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
  const filteredStarters = content.conversationStarters;
  const filteredCalendar = content.calendarSuggestions;

  async function handleRegenerate() {
    setRegenerating(true);
    try {
      const res = await fetch(`/api/reports/${reportId}/kit/generate`, {
        method: "POST",
      });
      if (res.ok) {
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
    <div className="space-y-8">
      {/* ─── Header Dashboard ─── */}
      <div className="p-5 rounded-[var(--radius-lg)] bg-[var(--color-surface)] border border-[var(--color-border)] shadow-[var(--shadow-sm)]">
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
            className="font-[family-name:var(--font-sans)] text-xs px-3 py-1.5 rounded-[var(--radius-sm)] border border-[var(--color-border)] hover:bg-[var(--color-primary-light)] disabled:opacity-50 transition-colors"
          >
            {regenerating ? "Regenerating..." : "Regenerate Kit"}
          </button>
        </div>

        <div className="mt-4">
          <h1 className="font-[family-name:var(--font-serif)] text-2xl font-bold text-[var(--color-text)]">
            Content Studio
          </h1>
          <p className="font-[family-name:var(--font-sans)] text-xs text-[var(--color-text-secondary)] mt-0.5">
            Social Media Kit
            {formattedDate && <> &middot; Generated {formattedDate}</>}
          </p>
        </div>

        <div className="grid grid-cols-4 gap-3 mt-4">
          <StatBox label="Content Pieces" value={totalCount} />
          <StatBox label="Platforms" value={platformsCovered.size} />
          <StatBox label="Sections" value={activeSections} />
          <StatBox label="Personas" value={personas.size} />
        </div>
      </div>

      {/* ─── Platform Filter ─── */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="font-[family-name:var(--font-sans)] text-xs text-[var(--color-text-secondary)] mr-1">
          Platform:
        </span>
        {PLATFORMS.map((p) => {
          const isActive = platformFilter === p;
          const config = PLATFORM_CONFIG[p];
          const activeBg = config
            ? `var(${config.colorVar})`
            : "var(--color-primary)";

          return (
            <button
              key={p}
              onClick={() => setPlatformFilter(p)}
              className={`font-[family-name:var(--font-sans)] text-xs px-2.5 py-1 rounded-[var(--radius-sm)] border transition-colors inline-flex items-center gap-1.5 ${
                isActive
                  ? "text-white border-transparent"
                  : "border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-primary-light)]"
              }`}
              style={isActive ? { backgroundColor: activeBg } : undefined}
            >
              {config && <PlatformIcon platform={p} size={13} />}
              {p}
            </button>
          );
        })}
      </div>

      {/* ─── Content Sections ─── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={platformFilter + personaFilter}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="space-y-8"
        >
          {/* ── Post Ideas ── */}
          {filteredPostIdeas.length > 0 && (
            <motion.section
              variants={sectionVariant}
              initial="initial"
              animate="animate"
              className="space-y-3"
            >
              <SectionHeading
                title="Post Ideas"
                count={filteredPostIdeas.length}
                icon={<IconLightbulb />}
                accentColor="var(--color-primary)"
                onRefresh={() => handleRefreshSection("postIdeas")}
                refreshing={refreshing.postIdeas}
                justUpdated={justUpdated.postIdeas}
              />
              {filteredPostIdeas.map((post, i) => (
                <motion.div
                  key={i}
                  variants={cardVariant}
                  className="group p-4 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)] transition-shadow"
                  whileHover={{ y: -2 }}
                  transition={{ duration: 0.15 }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0 space-y-2">
                      <p className="font-[family-name:var(--font-serif)] text-base font-semibold text-[var(--color-text)]">
                        {post.title}
                      </p>
                      <p className="font-[family-name:var(--font-sans)] text-sm text-[var(--color-text-secondary)] leading-relaxed">
                        {post.body}
                      </p>
                      <div className="flex gap-1.5 flex-wrap pt-1">
                        {post.platforms.map((pl) => (
                          <PlatformBadge key={pl} platform={pl} />
                        ))}
                      </div>
                    </div>
                    <CopyButton text={`${post.title}\n\n${post.body}`} />
                  </div>
                </motion.div>
              ))}
            </motion.section>
          )}

          {/* ── Platform Captions ── */}
          {filteredCaptions.length > 0 && (
            <motion.section
              variants={sectionVariant}
              initial="initial"
              animate="animate"
              className="space-y-3"
            >
              <SectionHeading
                title="Platform Captions"
                count={filteredCaptions.length}
                icon={<IconQuote />}
                accentColor="var(--color-platform-linkedin)"
                onRefresh={() => handleRefreshSection("captions")}
                refreshing={refreshing.captions}
                justUpdated={justUpdated.captions}
              />
              {filteredCaptions.map((caption, i) => {
                const platformKey = normalizePlatform(caption.platform);
                const config = PLATFORM_CONFIG[platformKey];
                const previewId = `caption-${i}`;
                const isPreviewOpen = openPreviewId === previewId;
                return (
                  <motion.div
                    key={i}
                    variants={cardVariant}
                    className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)] transition-shadow overflow-hidden"
                    style={{
                      borderLeftWidth: "3px",
                      borderLeftColor: config
                        ? `var(${config.colorVar})`
                        : "var(--color-border)",
                    }}
                    whileHover={{ y: -2 }}
                    transition={{ duration: 0.15 }}
                  >
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0 space-y-2">
                          <div className="flex items-center gap-2">
                            <PlatformBadge platform={caption.platform} />
                            <span className="font-[family-name:var(--font-sans)] text-[10px] text-[var(--color-text-tertiary)]">
                              {caption.characterCount} characters
                            </span>
                          </div>
                          <p className="font-[family-name:var(--font-sans)] text-sm text-[var(--color-text)] leading-relaxed">
                            {caption.caption}
                          </p>
                          <p className="font-[family-name:var(--font-sans)] text-xs text-[var(--color-accent)]">
                            {caption.hashtags.join(" ")}
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => togglePreview(previewId)}
                            className="font-[family-name:var(--font-sans)] text-xs px-2 py-1 rounded-[var(--radius-sm)] border border-[var(--color-border)] hover:bg-[var(--color-primary-light)] transition-colors whitespace-nowrap inline-flex items-center gap-1"
                          >
                            <PlatformIcon platform={caption.platform} size={12} />
                            {isPreviewOpen ? "Close" : "Preview"}
                          </button>
                          <CopyButton
                            text={`${caption.caption}\n\n${caption.hashtags.join(" ")}`}
                          />
                        </div>
                      </div>
                    </div>

                    <AnimatePresence>
                      {isPreviewOpen && (
                        <motion.div
                          key="preview"
                          variants={slideDownVariant}
                          initial="initial"
                          animate="animate"
                          exit="exit"
                          className="overflow-hidden"
                        >
                          <div className="px-4 pb-4 pt-1">
                            <PostPreview
                              platform={caption.platform}
                              caption={caption.caption}
                              hashtags={caption.hashtags}
                            />
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </motion.section>
          )}

          {/* ── Persona-Targeted Posts ── */}
          <motion.section
            variants={sectionVariant}
            initial="initial"
            animate="animate"
            className="space-y-3"
          >
            <SectionHeading
              title="Persona-Targeted Posts"
              count={filteredPersonaPosts.length}
              icon={<IconUsers />}
              accentColor="#7C3AED"
              onRefresh={() => handleRefreshSection("personaPosts")}
              refreshing={refreshing.personaPosts}
              justUpdated={justUpdated.personaPosts}
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
                      : "border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-primary-light)]"
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
                        : "border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-primary-light)]"
                    }`}
                  >
                    {name}
                  </button>
                ))}
              </div>
            )}
            {filteredPersonaPosts.length > 0 ? (
              filteredPersonaPosts.map((post, i) => {
                // Borrow hashtags from the matching platform caption
                const borrowedHashtags = content.captions.find(
                  (c) => normalizePlatform(c.platform) === normalizePlatform(post.platform)
                )?.hashtags ?? [];
                const copyText = borrowedHashtags.length > 0
                  ? `${post.post}\n\n${borrowedHashtags.join(" ")}`
                  : post.post;
                return (
                <motion.div
                  key={i}
                  variants={cardVariant}
                  className="p-4 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)] transition-shadow"
                  whileHover={{ y: -2 }}
                  transition={{ duration: 0.15 }}
                >
                  <div className="flex items-start gap-3">
                    <div className="shrink-0 w-8 h-8 rounded-full bg-[var(--color-accent-light)] flex items-center justify-center">
                      <span className="font-[family-name:var(--font-serif)] text-sm font-bold text-[var(--color-accent)]">
                        {post.personaName.charAt(0)}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="font-[family-name:var(--font-sans)] text-xs font-semibold text-[var(--color-text)]">
                          {post.personaName}
                        </span>
                        <PlatformBadge platform={post.platform} />
                      </div>
                      <p className="font-[family-name:var(--font-sans)] text-sm text-[var(--color-text)] leading-relaxed">
                        {post.post}
                      </p>
                      {borrowedHashtags.length > 0 && (
                        <p className="font-[family-name:var(--font-sans)] text-xs text-[var(--color-accent)]">
                          {borrowedHashtags.join(" ")}
                        </p>
                      )}
                    </div>
                    <CopyButton text={copyText} />
                  </div>
                </motion.div>
                );
              })
            ) : (
              <p className="font-[family-name:var(--font-sans)] text-sm text-[var(--color-text-secondary)] italic">
                {personas.size === 0
                  ? "No personas were selected for this report"
                  : "No posts match the current filters"}
              </p>
            )}
          </motion.section>

          {/* ── Polls ── */}
          {filteredPolls.length > 0 && (
            <motion.section
              variants={sectionVariant}
              initial="initial"
              animate="animate"
              className="space-y-3"
            >
              <SectionHeading
                title="Polls"
                count={filteredPolls.length}
                icon={<IconBarChart />}
                accentColor="var(--color-success)"
                onRefresh={() => handleRefreshSection("polls")}
                refreshing={refreshing.polls}
                justUpdated={justUpdated.polls}
              />
              {filteredPolls.map((poll, i) => (
                <motion.div
                  key={i}
                  variants={cardVariant}
                  className="p-4 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)] transition-shadow"
                  whileHover={{ y: -2 }}
                  transition={{ duration: 0.15 }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0 space-y-3">
                      <p className="font-[family-name:var(--font-serif)] text-base font-semibold text-[var(--color-text)]">
                        {poll.question}
                      </p>
                      <div className="space-y-1.5">
                        {poll.options.map((opt, j) => (
                          <div
                            key={j}
                            className="flex items-center gap-2 px-3 py-2 rounded-[var(--radius-md)] bg-[var(--color-background)] border border-[var(--color-border)] hover:border-[var(--color-accent)] transition-colors cursor-default"
                          >
                            <span className="font-[family-name:var(--font-sans)] text-xs font-semibold text-[var(--color-accent)] w-4 shrink-0">
                              {String.fromCharCode(65 + j)}
                            </span>
                            <span className="font-[family-name:var(--font-sans)] text-sm text-[var(--color-text)]">
                              {opt}
                            </span>
                          </div>
                        ))}
                      </div>
                      <div className="flex items-center gap-2 pt-1">
                        <PlatformBadge platform={poll.platform} />
                        <span className="font-[family-name:var(--font-sans)] text-[10px] text-[var(--color-text-tertiary)] italic">
                          {poll.dataContext}
                        </span>
                      </div>
                    </div>
                    <CopyButton
                      text={`${poll.question}\n\n${poll.options.map((o) => `- ${o}`).join("\n")}\n\nContext: ${poll.dataContext}`}
                    />
                  </div>
                </motion.div>
              ))}
            </motion.section>
          )}

          {/* ── Conversation Starters ── */}
          {filteredStarters.length > 0 && (
            <motion.section
              variants={sectionVariant}
              initial="initial"
              animate="animate"
              className="space-y-3"
            >
              <SectionHeading
                title="Conversation Starters"
                count={filteredStarters.length}
                icon={<IconMessageCircle />}
                accentColor="var(--color-accent)"
                onRefresh={() => handleRefreshSection("conversationStarters")}
                refreshing={refreshing.conversationStarters}
                justUpdated={justUpdated.conversationStarters}
              />
              {filteredStarters.map((starter, i) => (
                <motion.div
                  key={i}
                  variants={cardVariant}
                  className="p-4 rounded-[var(--radius-lg)] bg-[var(--color-accent-light)] border border-[var(--color-border)] hover:shadow-[var(--shadow-md)] transition-shadow"
                  whileHover={{ y: -2 }}
                  transition={{ duration: 0.15 }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <p className="font-[family-name:var(--font-sans)] text-[10px] font-semibold uppercase tracking-wider text-[var(--color-accent)]">
                        {starter.context}
                      </p>
                      <p className="font-[family-name:var(--font-sans)] text-sm text-[var(--color-text)] leading-relaxed">
                        &ldquo;{starter.template}&rdquo;
                      </p>
                    </div>
                    <CopyButton text={starter.template} />
                  </div>
                </motion.div>
              ))}
            </motion.section>
          )}

          {/* ── Stat Callouts ── */}
          {filteredStatCallouts.length > 0 && (
            <motion.section
              variants={sectionVariant}
              initial="initial"
              animate="animate"
              className="space-y-3"
            >
              <SectionHeading
                title="Stat Callouts"
                count={filteredStatCallouts.length}
                icon={<IconTrendingUp />}
                accentColor="var(--color-accent)"
                onRefresh={() => handleRefreshSection("statCallouts")}
                refreshing={refreshing.statCallouts}
                justUpdated={justUpdated.statCallouts}
              />
              {filteredStatCallouts.map((stat, i) => (
                <motion.div
                  key={i}
                  variants={cardVariant}
                  className="p-5 rounded-[var(--radius-lg)] bg-[var(--color-primary)] hover:shadow-[var(--shadow-lg)] transition-shadow"
                  whileHover={{ y: -2 }}
                  transition={{ duration: 0.15 }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0 space-y-2">
                      <p className="font-[family-name:var(--font-serif)] text-xl font-bold text-[var(--color-accent)]">
                        {stat.stat}
                      </p>
                      <p className="font-[family-name:var(--font-sans)] text-sm text-slate-300 leading-relaxed">
                        {stat.context}
                      </p>
                      <p className="font-[family-name:var(--font-sans)] text-[10px] text-slate-400">
                        Source: {stat.source}
                      </p>
                      <div className="pt-2 border-t border-slate-600">
                        <p className="font-[family-name:var(--font-sans)] text-xs italic text-slate-300">
                          &ldquo;{stat.suggestedCaption}&rdquo;
                        </p>
                      </div>
                    </div>
                    <CopyButton
                      text={`${stat.stat}\n\n${stat.context}\n\nSource: ${stat.source}\n\n${stat.suggestedCaption}`}
                      variant="dark"
                    />
                  </div>
                </motion.div>
              ))}
            </motion.section>
          )}

          {/* ── Content Calendar ── */}
          {filteredCalendar.length > 0 && (
            <motion.section
              variants={sectionVariant}
              initial="initial"
              animate="animate"
              className="space-y-3"
            >
              <SectionHeading
                title="Content Calendar"
                count={filteredCalendar.length}
                icon={<IconCalendar />}
                accentColor="var(--color-text-secondary)"
                onRefresh={() => handleRefreshSection("calendarSuggestions")}
                refreshing={refreshing.calendarSuggestions}
                justUpdated={justUpdated.calendarSuggestions}
              />
              {filteredCalendar.map((week, i) => (
                <motion.div
                  key={i}
                  variants={cardVariant}
                  className="p-4 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)] transition-shadow"
                  whileHover={{ y: -2 }}
                  transition={{ duration: 0.15 }}
                >
                  <div className="flex items-start gap-3">
                    <div className="shrink-0 w-8 h-8 rounded-full bg-[var(--color-primary)] flex items-center justify-center">
                      <span className="font-[family-name:var(--font-sans)] text-xs font-bold text-[var(--color-text-inverse)]">
                        {week.week}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0 space-y-2">
                      <p className="font-[family-name:var(--font-serif)] text-base font-semibold text-[var(--color-text)]">
                        {week.theme}
                      </p>
                      <div className="space-y-1">
                        {week.postIdeas.map((idea, j) => (
                          <div key={j} className="flex items-start gap-2">
                            <span className="font-[family-name:var(--font-sans)] text-xs text-[var(--color-accent)] font-medium mt-0.5 shrink-0">
                              {j + 1}.
                            </span>
                            <p className="font-[family-name:var(--font-sans)] text-sm text-[var(--color-text-secondary)]">
                              {idea}
                            </p>
                          </div>
                        ))}
                      </div>
                      <div className="flex gap-1.5 flex-wrap pt-1">
                        {week.platforms.map((pl) => (
                          <PlatformBadge key={pl} platform={pl} />
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.section>
          )}
        </motion.div>
      </AnimatePresence>

    </div>
  );
}
