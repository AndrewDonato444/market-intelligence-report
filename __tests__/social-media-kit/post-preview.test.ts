/**
 * Platform Post Preview Mockup Tests
 *
 * Tests the logic for platform-specific post preview mockups:
 * preview config structure, chrome rendering data, character limits,
 * one-at-a-time state behavior, and copy text integrity.
 * ID: CMP-PRV-001 through CMP-PRV-012
 */

// --- Preview Config Shape ---

type PreviewConfig = {
  name: string;
  borderColor: string;
  hashtagColor: string;
  avatarInitials: string;
  avatarSubtitle: string;
  timestamp: string;
  reactions: string[];
};

type PlatformPreviewConfig = Record<string, PreviewConfig>;

const PREVIEW_CONFIG: PlatformPreviewConfig = {
  LinkedIn: {
    name: "LinkedIn",
    borderColor: "#0A66C2",
    hashtagColor: "#0A66C2",
    avatarInitials: "YN",
    avatarSubtitle: "Luxury Real Estate Advisor · 1st",
    timestamp: "Just now",
    reactions: ["👍 Like", "💬 Comment", "🔁 Repost", "✉️ Send"],
  },
  Instagram: {
    name: "Instagram",
    borderColor: "#E4405F",
    hashtagColor: "#E4405F",
    avatarInitials: "YN",
    avatarSubtitle: "@yourname",
    timestamp: "",
    reactions: ["♡", "💬", "✈️", "🔖"],
  },
  X: {
    name: "X",
    borderColor: "#0F1419",
    hashtagColor: "#1D9BF0",
    avatarInitials: "YN",
    avatarSubtitle: "@yourhandle",
    timestamp: "",
    reactions: ["💬", "🔁", "♡", "📊", "↑"],
  },
  Facebook: {
    name: "Facebook",
    borderColor: "#1877F2",
    hashtagColor: "#1877F2",
    avatarInitials: "YN",
    avatarSubtitle: "",
    timestamp: "Just now · 🌐",
    reactions: ["👍 Like", "💬 Comment", "↗️ Share"],
  },
};

const X_CHARACTER_LIMIT = 280;
const INSTAGRAM_CAPTION_TRUNCATE = 125;

// --- Helper functions (mirror what the component will do) ---

function truncateInstagramCaption(caption: string): {
  truncated: string;
  isTruncated: boolean;
} {
  if (caption.length <= INSTAGRAM_CAPTION_TRUNCATE) {
    return { truncated: caption, isTruncated: false };
  }
  return {
    truncated: caption.slice(0, INSTAGRAM_CAPTION_TRUNCATE),
    isTruncated: true,
  };
}

function getXCharacterStatus(caption: string): {
  count: number;
  remaining: number;
  isOverLimit: boolean;
} {
  const count = caption.length;
  return {
    count,
    remaining: X_CHARACTER_LIMIT - count,
    isOverLimit: count > X_CHARACTER_LIMIT,
  };
}

function renderHashtags(
  hashtags: string[],
  platform: string
): { text: string; color: string }[] {
  const color = PREVIEW_CONFIG[platform]?.hashtagColor ?? "#000000";
  return hashtags.map((tag) => ({ text: tag, color }));
}

function getCopyText(caption: string, hashtags: string[]): string {
  return `${caption}\n\n${hashtags.join(" ")}`;
}

// --- State model for one-at-a-time preview ---

type PreviewState = {
  openCardId: string | null;
};

function openPreview(state: PreviewState, cardId: string): PreviewState {
  return { openCardId: cardId };
}

function closePreview(state: PreviewState): PreviewState {
  return { openCardId: null };
}

function isPreviewOpen(state: PreviewState, cardId: string): boolean {
  return state.openCardId === cardId;
}

// --- Test Data ---

const linkedInCaption = {
  platform: "LinkedIn",
  caption:
    "Newport's luxury market recorded a 90.9% volume collapse year-over-year, yet price-per-square-foot rose 10.3%. This paradox reveals the market's true character: radically selective, not broken.",
  hashtags: [
    "#NewportLuxury",
    "#RealEstateMarketIntelligence",
    "#LuxuryRealEstate",
    "#MarketAnalysis",
  ],
  characterCount: 287,
};

const instagramCaption = {
  platform: "Instagram",
  caption:
    "90.9% volume decline. 10.3% per-sqft gain. Newport's luxury market isn't broken—it's become radically selective. The data tells a story most agents are missing. Here's what it means for your clients.",
  hashtags: ["#NewportLuxury", "#RealEstateMarketIntelligence"],
  characterCount: 198,
};

const shortXCaption = {
  platform: "X",
  caption: "Newport luxury: 90.9% volume collapse. 10.3% PSF gain. Selective, not broken.",
  hashtags: ["#RealEstate"],
  characterCount: 83,
};

const longXCaption = {
  platform: "X",
  caption:
    "Newport's luxury market recorded a 90.9% volume collapse year-over-year, yet price-per-square-foot rose 10.3%. This paradox reveals the market's true character: radically selective, not broken. What most agents are missing is the signal in the noise — and here's exactly why it matters for your clients right now.",
  hashtags: ["#NewportLuxury", "#RealEstate"],
  characterCount: 313,
};

const facebookCaption = {
  platform: "Facebook",
  caption:
    "A 90.9% volume collapse paired with a 10.3% price increase tells you everything about the state of Newport's luxury market right now.",
  hashtags: ["#NewportLuxury"],
  characterCount: 152,
};

// --- Tests ---

describe("Post Preview: Config Structure", () => {
  it("CMP-PRV-001: all four platforms have preview config", () => {
    const platforms = ["LinkedIn", "Instagram", "X", "Facebook"];
    for (const platform of platforms) {
      expect(PREVIEW_CONFIG[platform]).toBeDefined();
      expect(PREVIEW_CONFIG[platform].name).toBe(platform);
      expect(PREVIEW_CONFIG[platform].borderColor).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(PREVIEW_CONFIG[platform].hashtagColor).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(PREVIEW_CONFIG[platform].avatarInitials).toBe("YN");
      expect(PREVIEW_CONFIG[platform].reactions.length).toBeGreaterThan(0);
    }
  });

  it("CMP-PRV-002: LinkedIn config has correct chrome fields", () => {
    const li = PREVIEW_CONFIG.LinkedIn;
    expect(li.borderColor).toBe("#0A66C2");
    expect(li.hashtagColor).toBe("#0A66C2");
    expect(li.avatarSubtitle).toBe("Luxury Real Estate Advisor · 1st");
    expect(li.timestamp).toBe("Just now");
    expect(li.reactions).toContain("👍 Like");
    expect(li.reactions).toContain("💬 Comment");
    expect(li.reactions).toContain("🔁 Repost");
    expect(li.reactions).toContain("✉️ Send");
  });

  it("CMP-PRV-003: Instagram config has correct chrome fields", () => {
    const ig = PREVIEW_CONFIG.Instagram;
    expect(ig.borderColor).toBe("#E4405F");
    expect(ig.hashtagColor).toBe("#E4405F");
    expect(ig.avatarSubtitle).toBe("@yourname");
    // Instagram has action bar icons
    expect(ig.reactions).toContain("♡");
    expect(ig.reactions).toContain("💬");
    expect(ig.reactions).toContain("🔖");
  });

  it("CMP-PRV-004: X config has correct chrome fields", () => {
    const x = PREVIEW_CONFIG.X;
    expect(x.borderColor).toBe("#0F1419");
    // X hashtags use Twitter blue, not the dark border color
    expect(x.hashtagColor).toBe("#1D9BF0");
    expect(x.avatarSubtitle).toBe("@yourhandle");
    expect(x.reactions).toContain("📊");
  });

  it("CMP-PRV-005: Facebook config has correct chrome fields", () => {
    const fb = PREVIEW_CONFIG.Facebook;
    expect(fb.borderColor).toBe("#1877F2");
    expect(fb.timestamp).toBe("Just now · 🌐");
    expect(fb.reactions).toContain("👍 Like");
    expect(fb.reactions).toContain("↗️ Share");
  });
});

describe("Post Preview: Instagram Caption Truncation", () => {
  it("CMP-PRV-006: captions ≤ 125 characters are not truncated", () => {
    const shortCaption = "Newport luxury: 90.9% volume collapse. 10.3% PSF gain.";
    const result = truncateInstagramCaption(shortCaption);
    expect(result.isTruncated).toBe(false);
    expect(result.truncated).toBe(shortCaption);
  });

  it("CMP-PRV-007: captions > 125 characters are truncated with ellipsis flag", () => {
    const result = truncateInstagramCaption(instagramCaption.caption);
    expect(instagramCaption.caption.length).toBeGreaterThan(INSTAGRAM_CAPTION_TRUNCATE);
    expect(result.isTruncated).toBe(true);
    expect(result.truncated.length).toBe(INSTAGRAM_CAPTION_TRUNCATE);
    expect(result.truncated).toBe(instagramCaption.caption.slice(0, INSTAGRAM_CAPTION_TRUNCATE));
  });

  it("CMP-PRV-008: copy text uses full untruncated caption, not truncated preview", () => {
    const fullCaption = instagramCaption.caption;
    const copyText = getCopyText(fullCaption, instagramCaption.hashtags);
    // Copy text must contain the full caption even though preview truncates it
    expect(copyText).toContain(fullCaption);
    expect(copyText.length).toBeGreaterThan(INSTAGRAM_CAPTION_TRUNCATE);
    expect(copyText).toContain("#NewportLuxury");
  });
});

describe("Post Preview: X Character Limit", () => {
  it("CMP-PRV-009: captions within 280 chars show remaining count and no warning", () => {
    const status = getXCharacterStatus(shortXCaption.caption);
    expect(status.count).toBeLessThanOrEqual(X_CHARACTER_LIMIT);
    expect(status.isOverLimit).toBe(false);
    expect(status.remaining).toBeGreaterThan(0);
    expect(status.remaining).toBe(X_CHARACTER_LIMIT - shortXCaption.caption.length);
  });

  it("CMP-PRV-010: captions exceeding 280 chars trigger over-limit warning", () => {
    const status = getXCharacterStatus(longXCaption.caption);
    expect(status.count).toBeGreaterThan(X_CHARACTER_LIMIT);
    expect(status.isOverLimit).toBe(true);
    expect(status.remaining).toBeLessThan(0);
  });

  it("CMP-PRV-011: character count matches actual caption length", () => {
    const status = getXCharacterStatus(longXCaption.caption);
    expect(status.count).toBe(longXCaption.caption.length);
  });
});

describe("Post Preview: Hashtag Rendering", () => {
  it("CMP-PRV-012: hashtags render with platform brand color", () => {
    const linkedInHashtags = renderHashtags(linkedInCaption.hashtags, "LinkedIn");
    expect(linkedInHashtags[0].color).toBe("#0A66C2");
    expect(linkedInHashtags[0].text).toBe("#NewportLuxury");

    const instagramHashtags = renderHashtags(instagramCaption.hashtags, "Instagram");
    expect(instagramHashtags[0].color).toBe("#E4405F");

    const xHashtags = renderHashtags(shortXCaption.hashtags, "X");
    // X uses Twitter blue for hashtags, not the dark border
    expect(xHashtags[0].color).toBe("#1D9BF0");

    const facebookHashtags = renderHashtags(facebookCaption.hashtags, "Facebook");
    expect(facebookHashtags[0].color).toBe("#1877F2");
  });
});

describe("Post Preview: One-At-A-Time State", () => {
  it("CMP-PRV-013: no preview open by default", () => {
    const state: PreviewState = { openCardId: null };
    expect(state.openCardId).toBeNull();
    expect(isPreviewOpen(state, "caption-0")).toBe(false);
  });

  it("CMP-PRV-014: opening a preview sets that card as open", () => {
    let state: PreviewState = { openCardId: null };
    state = openPreview(state, "caption-0");
    expect(isPreviewOpen(state, "caption-0")).toBe(true);
    expect(isPreviewOpen(state, "caption-1")).toBe(false);
  });

  it("CMP-PRV-015: opening a second preview closes the first", () => {
    let state: PreviewState = { openCardId: null };
    state = openPreview(state, "caption-0");
    expect(isPreviewOpen(state, "caption-0")).toBe(true);

    // Opening card B replaces card A
    state = openPreview(state, "caption-1");
    expect(isPreviewOpen(state, "caption-0")).toBe(false);
    expect(isPreviewOpen(state, "caption-1")).toBe(true);
  });

  it("CMP-PRV-016: closing a preview returns to no preview open", () => {
    let state: PreviewState = { openCardId: null };
    state = openPreview(state, "caption-0");
    state = closePreview(state);
    expect(state.openCardId).toBeNull();
    expect(isPreviewOpen(state, "caption-0")).toBe(false);
  });

  it("CMP-PRV-017: clicking open preview again closes it (toggle behavior)", () => {
    let state: PreviewState = { openCardId: null };
    state = openPreview(state, "caption-0");

    // Toggle: if same card is clicked while open, close it
    const toggledState = isPreviewOpen(state, "caption-0")
      ? closePreview(state)
      : openPreview(state, "caption-0");

    expect(toggledState.openCardId).toBeNull();
  });
});

describe("Post Preview: Copy Text Integrity", () => {
  it("CMP-PRV-018: copy text always includes full caption + all hashtags", () => {
    for (const cap of [linkedInCaption, instagramCaption, shortXCaption, facebookCaption]) {
      const copyText = getCopyText(cap.caption, cap.hashtags);
      expect(copyText).toContain(cap.caption);
      for (const tag of cap.hashtags) {
        expect(copyText).toContain(tag);
      }
    }
  });

  it("CMP-PRV-019: copy text format is caption + blank line + space-joined hashtags", () => {
    const copyText = getCopyText(linkedInCaption.caption, linkedInCaption.hashtags);
    const parts = copyText.split("\n\n");
    expect(parts[0]).toBe(linkedInCaption.caption);
    expect(parts[1]).toBe(linkedInCaption.hashtags.join(" "));
  });
});
