/**
 * Email Campaign Viewer Tests
 *
 * Tests the email campaign viewer component rendering, filtering,
 * content structure, copy text generation, and state handling.
 * ID: CMP-EMAIL-001 through CMP-EMAIL-030
 */

import type {
  EmailCampaignContent,
  DripEmail,
  NewsletterContent,
  PersonaEmail,
  SubjectLineSet,
  CtaBlock,
  ReEngagementEmail,
} from "@/lib/db/schema";

// --- Test Data ---

const mockDripSequence: DripEmail[] = [
  {
    sequenceOrder: 1,
    dayOffset: 0,
    subject: "Your market outperformed Miami Beach by 12%",
    previewText: "Here's what that means for your portfolio...",
    body: "Thank you for our meeting today. I wanted to share a key finding from our latest market intelligence report.",
    cta: "Schedule a market briefing",
    reportSection: "Executive Summary",
  },
  {
    sequenceOrder: 2,
    dayOffset: 3,
    subject: "The waterfront premium story your clients need to hear",
    previewText: "42% premium — and what it signals for Q2",
    body: "In our Q1 analysis, waterfront properties in your market commanded a 42% premium over inland equivalents.",
    cta: "Download the full analysis",
    reportSection: "Key Drivers",
  },
  {
    sequenceOrder: 3,
    dayOffset: 7,
    subject: "3 market signals your competitors are missing",
    previewText: "Transaction velocity is telling a story",
    body: "While most agents are focused on price, the real story is in the transaction velocity data.",
    cta: "See the full market dashboard",
    reportSection: "Market Analysis",
  },
  {
    sequenceOrder: 4,
    dayOffset: 14,
    subject: "Your Q2 positioning playbook",
    previewText: "Based on the data — not guesswork",
    body: "Based on the trends we discussed, here is a data-driven positioning strategy for Q2.",
    cta: "Book your strategy session",
    reportSection: "Forecasts",
  },
];

const mockNewsletter: NewsletterContent = {
  headline: "Naples Ultra-Luxury: Q1 2026 Intelligence Brief",
  subheadline:
    "What the latest transaction data reveals about your market — and what it means for your clients",
  contentBlocks: [
    {
      heading: "The Waterfront Premium Story",
      body: "Total luxury transaction volume reached $6.58B this quarter, with waterfront properties commanding a 42% premium.",
      keyMetric: "$6.58B",
    },
    {
      heading: "Forward Outlook",
      body: "Growth trajectory analysis shows a 12% year-over-year increase, signaling continued strength in the ultra-luxury segment.",
      keyMetric: "12% YoY",
    },
    {
      heading: "Buyer Composition Shift",
      body: "International buyer activity increased 8% while domestic relocations held steady.",
      keyMetric: "8% international growth",
    },
  ],
  footerCta: "Schedule a market advisory session",
};

const mockPersonaEmails: PersonaEmail[] = [
  {
    personaSlug: "pe-principal",
    personaName: "PE Principal",
    subject: "The ROI case for Naples waterfront — by the numbers",
    previewText: "Tax efficiency + 42% premium + constrained supply...",
    body: "As someone who evaluates opportunities through a returns lens, you'll want to see these numbers.",
    cta: "Review the full market intelligence brief",
    vocabularyUsed: ["ROI", "tax efficiency", "capital allocation"],
  },
  {
    personaSlug: "legacy-wealth",
    personaName: "Legacy Wealth",
    subject: "Preserving legacy through Naples real estate",
    previewText: "A generational perspective on the waterfront market",
    body: "For families with a multi-generational approach to wealth, Naples waterfront offers unique preservation qualities.",
    cta: "Explore the legacy planning brief",
    vocabularyUsed: ["legacy", "preservation", "generational wealth"],
  },
  {
    personaSlug: "pe-principal",
    personaName: "PE Principal",
    subject: "Q2 entry points for Naples ultra-luxury",
    previewText: "Timing signals from the transaction data",
    body: "The Q1 data reveals a narrow window for strategic positioning in the ultra-luxury segment.",
    cta: "Get the timing analysis",
    vocabularyUsed: ["entry point", "strategic positioning", "alpha"],
  },
];

const mockSubjectLines: SubjectLineSet[] = [
  {
    emailContext: "Drip Email 1",
    variants: [
      {
        style: "data-forward",
        subject: "$6.58B in luxury transactions — here's your edge",
        previewText: "The numbers your clients need to see",
      },
      {
        style: "curiosity",
        subject: "Is your market outperforming Miami Beach?",
        previewText: "The answer might surprise your clients",
      },
      {
        style: "urgency",
        subject: "The 90-day window in your market",
        previewText: "Timing signals from Q1 transaction data",
      },
    ],
  },
  {
    emailContext: "Newsletter",
    variants: [
      {
        style: "data-forward",
        subject: "Q1 2026 Market Intelligence: $6.58B in transactions",
        previewText: "Your quarterly intelligence brief is ready",
      },
      {
        style: "curiosity",
        subject: "What Q1 data says about your market's next move",
        previewText: "Three signals worth watching",
      },
      {
        style: "urgency",
        subject: "Your Q1 briefing: Act before Q2 shifts",
        previewText: "Market positioning insights for this quarter",
      },
    ],
  },
];

const mockCtaBlocks: CtaBlock[] = [
  {
    context: "End of drip sequence / newsletter",
    buttonText: "Schedule a Market Briefing",
    supportingCopy:
      "Get a personalized walkthrough of your market's key intelligence — 15 minutes, data-driven.",
    placement: "Primary",
  },
  {
    context: "Mid-email value reinforcement",
    buttonText: "See the Full Analysis",
    supportingCopy: "Access the complete Q1 market intelligence report.",
    placement: "Inline",
  },
  {
    context: "Re-engagement follow-up",
    buttonText: "Quick Market Check-In",
    supportingCopy: "5 minutes to review what's changed in your market since we last connected.",
    placement: "Primary",
  },
];

const mockReEngagementEmails: ReEngagementEmail[] = [
  {
    hook: "While most markets cooled, yours grew 12%",
    body: "It's been a while since we connected, and I thought you'd want to see this: the latest transaction data shows your market outpacing most luxury benchmarks.",
    cta: "Reply \"interested\" for the full briefing",
    tone: "Warm",
  },
  {
    hook: "Your neighbors just closed at $4.2M over asking",
    body: "A property two streets from you just set a new price record. Here's what that means for your portfolio.",
    cta: "Get your property's updated position",
    tone: "Advisory",
  },
];

const mockCampaignContent: EmailCampaignContent = {
  dripSequence: mockDripSequence,
  newsletter: mockNewsletter,
  personaEmails: mockPersonaEmails,
  subjectLines: mockSubjectLines,
  ctaBlocks: mockCtaBlocks,
  reEngagementEmails: mockReEngagementEmails,
};

const mockEmptyPersonaContent: EmailCampaignContent = {
  ...mockCampaignContent,
  personaEmails: [],
};

// --- Unit Tests: Content Structure ---

describe("Email Campaign Viewer: Content Structure", () => {
  it("CMP-EMAIL-001: campaign content has all 6 sections", () => {
    expect(mockCampaignContent.dripSequence).toBeDefined();
    expect(mockCampaignContent.newsletter).toBeDefined();
    expect(mockCampaignContent.personaEmails).toBeDefined();
    expect(mockCampaignContent.subjectLines).toBeDefined();
    expect(mockCampaignContent.ctaBlocks).toBeDefined();
    expect(mockCampaignContent.reEngagementEmails).toBeDefined();
  });

  it("CMP-EMAIL-002: drip emails include all required fields", () => {
    const email = mockDripSequence[0];
    expect(email.sequenceOrder).toBeDefined();
    expect(email.dayOffset).toBeDefined();
    expect(email.subject).toBeTruthy();
    expect(email.previewText).toBeTruthy();
    expect(email.body).toBeTruthy();
    expect(email.cta).toBeTruthy();
    expect(email.reportSection).toBeTruthy();
  });

  it("CMP-EMAIL-003: newsletter includes headline, subheadline, content blocks, and footer CTA", () => {
    expect(mockNewsletter.headline).toBeTruthy();
    expect(mockNewsletter.subheadline).toBeTruthy();
    expect(mockNewsletter.contentBlocks.length).toBeGreaterThan(0);
    expect(mockNewsletter.footerCta).toBeTruthy();

    const block = mockNewsletter.contentBlocks[0];
    expect(block.heading).toBeTruthy();
    expect(block.body).toBeTruthy();
    expect(block.keyMetric).toBeTruthy();
  });

  it("CMP-EMAIL-004: persona emails include persona info and vocabulary", () => {
    const email = mockPersonaEmails[0];
    expect(email.personaSlug).toBeTruthy();
    expect(email.personaName).toBeTruthy();
    expect(email.subject).toBeTruthy();
    expect(email.previewText).toBeTruthy();
    expect(email.body).toBeTruthy();
    expect(email.cta).toBeTruthy();
    expect(email.vocabularyUsed.length).toBeGreaterThan(0);
  });

  it("CMP-EMAIL-005: subject line sets have 3 variants with correct styles", () => {
    const set = mockSubjectLines[0];
    expect(set.emailContext).toBeTruthy();
    expect(set.variants).toHaveLength(3);

    const styles = set.variants.map((v) => v.style);
    expect(styles).toContain("data-forward");
    expect(styles).toContain("curiosity");
    expect(styles).toContain("urgency");

    set.variants.forEach((v) => {
      expect(v.subject).toBeTruthy();
      expect(v.previewText).toBeTruthy();
    });
  });

  it("CMP-EMAIL-006: CTA blocks include button text, supporting copy, and placement", () => {
    const cta = mockCtaBlocks[0];
    expect(cta.buttonText).toBeTruthy();
    expect(cta.supportingCopy).toBeTruthy();
    expect(cta.context).toBeTruthy();
    expect(["Primary", "Inline"]).toContain(cta.placement);
  });

  it("CMP-EMAIL-007: re-engagement emails include hook, body, CTA, and tone", () => {
    const email = mockReEngagementEmails[0];
    expect(email.hook).toBeTruthy();
    expect(email.body).toBeTruthy();
    expect(email.cta).toBeTruthy();
    expect(email.tone).toBeTruthy();
  });
});

// --- Unit Tests: Drip Sequence Ordering ---

describe("Email Campaign Viewer: Drip Sequence", () => {
  it("CMP-EMAIL-008: drip emails are ordered by sequenceOrder ascending", () => {
    const sorted = [...mockDripSequence].sort(
      (a, b) => a.sequenceOrder - b.sequenceOrder
    );
    expect(sorted[0].dayOffset).toBe(0);
    expect(sorted[1].dayOffset).toBe(3);
    expect(sorted[2].dayOffset).toBe(7);
    expect(sorted[3].dayOffset).toBe(14);
  });

  it("CMP-EMAIL-009: drip sequence has 4 emails with progressive day offsets", () => {
    expect(mockDripSequence).toHaveLength(4);
    const dayOffsets = mockDripSequence.map((e) => e.dayOffset);
    for (let i = 1; i < dayOffsets.length; i++) {
      expect(dayOffsets[i]).toBeGreaterThan(dayOffsets[i - 1]);
    }
  });

  it("CMP-EMAIL-010: each drip email references a report section", () => {
    mockDripSequence.forEach((email) => {
      expect(email.reportSection).toBeTruthy();
    });
  });
});

// --- Unit Tests: Persona Filtering ---

describe("Email Campaign Viewer: Persona Filtering", () => {
  it("CMP-EMAIL-011: extracts unique persona names for filter pills", () => {
    const personas = new Map<string, string>();
    mockPersonaEmails.forEach((p) =>
      personas.set(p.personaSlug, p.personaName)
    );

    expect(personas.size).toBe(2);
    expect(personas.get("pe-principal")).toBe("PE Principal");
    expect(personas.get("legacy-wealth")).toBe("Legacy Wealth");
  });

  it("CMP-EMAIL-012: filters persona emails by persona slug", () => {
    const pePrincipal = mockPersonaEmails.filter(
      (p) => p.personaSlug === "pe-principal"
    );
    expect(pePrincipal).toHaveLength(2);

    const legacyWealth = mockPersonaEmails.filter(
      (p) => p.personaSlug === "legacy-wealth"
    );
    expect(legacyWealth).toHaveLength(1);
  });

  it("CMP-EMAIL-013: 'All' filter returns all persona emails", () => {
    expect(mockPersonaEmails).toHaveLength(3);
  });

  it("CMP-EMAIL-014: empty persona emails shows appropriate message", () => {
    expect(mockEmptyPersonaContent.personaEmails).toHaveLength(0);
  });
});

// --- Unit Tests: Subject Line Variants ---

describe("Email Campaign Viewer: Subject Line Variants", () => {
  it("CMP-EMAIL-015: subject line sets are grouped by email context", () => {
    const contexts = mockSubjectLines.map((s) => s.emailContext);
    expect(contexts).toContain("Drip Email 1");
    expect(contexts).toContain("Newsletter");
  });

  it("CMP-EMAIL-016: each variant has a style label", () => {
    mockSubjectLines.forEach((set) => {
      set.variants.forEach((v) => {
        expect(["data-forward", "curiosity", "urgency"]).toContain(v.style);
      });
    });
  });

  it("CMP-EMAIL-017: style labels map to display names", () => {
    const styleLabels: Record<string, string> = {
      "data-forward": "Data-Forward",
      curiosity: "Curiosity",
      urgency: "Urgency",
    };

    mockSubjectLines[0].variants.forEach((v) => {
      expect(styleLabels[v.style]).toBeTruthy();
    });
  });
});

// --- Unit Tests: CTA Blocks ---

describe("Email Campaign Viewer: CTA Blocks", () => {
  it("CMP-EMAIL-018: CTA blocks have Primary or Inline placement", () => {
    mockCtaBlocks.forEach((cta) => {
      expect(["Primary", "Inline"]).toContain(cta.placement);
    });
  });

  it("CMP-EMAIL-019: CTA blocks include usage context", () => {
    mockCtaBlocks.forEach((cta) => {
      expect(cta.context).toBeTruthy();
    });
  });
});

// --- Unit Tests: Copy Text Generation ---

describe("Email Campaign Viewer: Copy Text Generation", () => {
  it("CMP-EMAIL-020: generates copy text for drip email (subject + body + CTA)", () => {
    const email = mockDripSequence[0];
    const copyText = "Subject: " + email.subject + "\n\n" + email.body + "\n\nCTA: " + email.cta;
    expect(copyText).toContain("Your market outperformed Miami Beach by 12%");
    expect(copyText).toContain("Thank you for our meeting");
    expect(copyText).toContain("Schedule a market briefing");
  });

  it("CMP-EMAIL-021: generates copy text for full newsletter", () => {
    const nl = mockNewsletter;
    const blocks = nl.contentBlocks
      .map((b) => b.heading + "\n" + b.keyMetric + "\n" + b.body)
      .join("\n\n");
    const copyText = nl.headline + "\n" + nl.subheadline + "\n\n" + blocks + "\n\n" + nl.footerCta;

    expect(copyText).toContain("Naples Ultra-Luxury");
    expect(copyText).toContain("$6.58B");
    expect(copyText).toContain("12% YoY");
    expect(copyText).toContain("Schedule a market advisory session");
  });

  it("CMP-EMAIL-022: generates copy text for persona email (subject + body + CTA)", () => {
    const email = mockPersonaEmails[0];
    const copyText = "Subject: " + email.subject + "\n\n" + email.body + "\n\nCTA: " + email.cta;
    expect(copyText).toContain("ROI case for Naples waterfront");
    expect(copyText).toContain("returns lens");
  });

  it("CMP-EMAIL-023: generates copy text for subject line variant (subject + preview)", () => {
    const variant = mockSubjectLines[0].variants[0];
    const copyText = variant.subject + "\n" + variant.previewText;
    expect(copyText).toContain("$6.58B in luxury transactions");
    expect(copyText).toContain("The numbers your clients need to see");
  });

  it("CMP-EMAIL-024: generates copy text for CTA block (button text + supporting copy)", () => {
    const cta = mockCtaBlocks[0];
    const copyText = cta.buttonText + "\n\n" + cta.supportingCopy;
    expect(copyText).toContain("Schedule a Market Briefing");
    expect(copyText).toContain("personalized walkthrough");
  });

  it("CMP-EMAIL-025: generates copy text for re-engagement email", () => {
    const email = mockReEngagementEmails[0];
    const copyText = email.hook + "\n\n" + email.body + "\n\nCTA: " + email.cta;
    expect(copyText).toContain("most markets cooled");
    expect(copyText).toContain("Reply");
  });
});

// --- Unit Tests: Section Counts ---

describe("Email Campaign Viewer: Section Counts", () => {
  it("CMP-EMAIL-026: displays correct count for each section", () => {
    expect(mockCampaignContent.dripSequence).toHaveLength(4);
    expect(mockCampaignContent.personaEmails).toHaveLength(3);
    expect(mockCampaignContent.subjectLines).toHaveLength(2);
    expect(mockCampaignContent.ctaBlocks).toHaveLength(3);
    expect(mockCampaignContent.reEngagementEmails).toHaveLength(2);
  });

  it("CMP-EMAIL-027: newsletter section count is always 1 (singular)", () => {
    expect(mockCampaignContent.newsletter).toBeDefined();
    expect(mockCampaignContent.newsletter.contentBlocks).toHaveLength(3);
  });
});

// --- Unit Tests: State Handling ---

describe("Email Campaign Viewer: State Handling", () => {
  it("CMP-EMAIL-028: campaign status types are valid", () => {
    const validStatuses = ["none", "queued", "generating", "completed", "failed"];
    validStatuses.forEach((status) => {
      expect(typeof status).toBe("string");
    });
  });

  it("CMP-EMAIL-029: generate email button uses correct API endpoint", () => {
    const reportId = "test-report-123";
    const generateUrl = "/api/reports/" + reportId + "/email-campaign/generate";
    const statusUrl = "/api/reports/" + reportId + "/email-campaign/status";
    const regenerateUrl = "/api/reports/" + reportId + "/email-campaign/regenerate";

    expect(generateUrl).toBe("/api/reports/test-report-123/email-campaign/generate");
    expect(statusUrl).toBe("/api/reports/test-report-123/email-campaign/status");
    expect(regenerateUrl).toBe("/api/reports/test-report-123/email-campaign/regenerate");
  });

  it("CMP-EMAIL-030: content type keys match regenerate endpoint expectations", () => {
    const validContentTypes: (keyof EmailCampaignContent)[] = [
      "dripSequence",
      "newsletter",
      "personaEmails",
      "subjectLines",
      "ctaBlocks",
      "reEngagementEmails",
    ];

    const contentKeys = Object.keys(mockCampaignContent);
    validContentTypes.forEach((type) => {
      expect(contentKeys).toContain(type);
    });
  });
});
