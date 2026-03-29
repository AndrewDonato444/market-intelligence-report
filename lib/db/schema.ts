import {
  pgTable,
  uuid,
  text,
  varchar,
  timestamp,
  jsonb,
  integer,
  numeric,
  boolean,
  index,
  uniqueIndex,
  pgEnum,
} from "drizzle-orm/pg-core";

// --- Enums ---

export const reportStatusEnum = pgEnum("report_status", [
  "queued",
  "generating",
  "completed",
  "failed",
]);

export const reportSectionTypeEnum = pgEnum("report_section_type", [
  // Legacy section types (kept for backward compatibility)
  "market_overview",
  "executive_summary",
  "second_homes",
  "key_drivers",
  "competitive_analysis",
  "trending_insights",
  "forecasts",
  "methodology",
  "strategic_summary",
  // New 9-section report types (v2 architecture)
  "executive_briefing",
  "market_insights_index",
  "luxury_market_dashboard",
  "neighborhood_intelligence",
  "the_narrative",
  "forward_look",
  "comparative_positioning",
  "strategic_benchmark",
  "disclaimer_methodology",
  "persona_intelligence",
]);

export const userRoleEnum = pgEnum("user_role", ["user", "admin"]);

export const luxuryTierEnum = pgEnum("luxury_tier", [
  "luxury",
  "high_luxury",
  "ultra_luxury",
]);

export const userAccountStatusEnum = pgEnum("user_account_status", [
  "active",
  "suspended",
  "deleted",
]);

export const socialMediaKitStatusEnum = pgEnum("social_media_kit_status", [
  "queued",
  "generating",
  "completed",
  "failed",
]);

export const emailCampaignStatusEnum = pgEnum("email_campaign_status", [
  "queued",
  "generating",
  "completed",
  "failed",
]);

export const dealAnalysisStatusEnum = pgEnum("deal_analysis_status", [
  "queued",
  "generating",
  "completed",
  "failed",
]);

// --- Tier Entitlements Type ---

export type TierEntitlements = {
  reports_per_month: number;    // -1 = unlimited
  markets_created: number;      // -1 = unlimited
  social_media_kits: number;    // 0 = not included, 1 = per-report, -1 = unlimited
  email_campaigns: number;      // 0 = not included, 1 = per-report, -1 = unlimited
  personas_per_report: number;  // always numeric (1 or 3)
  transaction_limit: number;    // max transactions per search period (-1 = unlimited)
  deal_analyses_per_month: number; // 0 = not included, N = monthly cap, -1 = unlimited
};

// --- Subscription Tiers Table ---

export const subscriptionTiers = pgTable(
  "subscription_tiers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 100 }).unique().notNull(),
    slug: varchar("slug", { length: 100 }).unique().notNull(),
    description: text("description"),
    entitlements: jsonb("entitlements").notNull().$type<TierEntitlements>(),
    displayPrice: varchar("display_price", { length: 50 }).notNull(),
    monthlyPriceInCents: integer("monthly_price_in_cents"),
    isActive: boolean("is_active").notNull().default(true),
    sortOrder: integer("sort_order").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("subscription_tiers_slug_idx").on(table.slug),
    index("subscription_tiers_sort_order_idx").on(table.sortOrder),
  ]
);

export type SubscriptionTiersTable = typeof subscriptionTiers.$inferSelect;
export type NewSubscriptionTier = typeof subscriptionTiers.$inferInsert;

// --- Tables ---

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  authId: varchar("auth_id", { length: 255 }).unique().notNull(),
  email: varchar("email", { length: 255 }).unique().notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  company: varchar("company", { length: 255 }),
  logoUrl: text("logo_url"),
  brandColors: jsonb("brand_colors").$type<{
    primary?: string;
    secondary?: string;
    accent?: string;
  }>(),
  phone: varchar("phone", { length: 50 }),
  title: varchar("title", { length: 255 }),
  bio: text("bio"),
  role: userRoleEnum("role").notNull().default("user"),
  status: userAccountStatusEnum("status").notNull().default("active"),
  suspendedAt: timestamp("suspended_at", { withTimezone: true }),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
  tosAcceptedAt: timestamp("tos_accepted_at", { withTimezone: true }),
  lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
},
(table) => [
  index("users_status_idx").on(table.status),
]);

export const subscriptions = pgTable("subscriptions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: "cascade" }),
  stripeCustomerId: varchar("stripe_customer_id", { length: 255 }),
  stripeSubscriptionId: varchar("stripe_subscription_id", { length: 255 }),
  plan: varchar("plan", { length: 50 }).notNull().default("free"),
  status: varchar("status", { length: 50 }).notNull().default("inactive"),
  tierId: uuid("tier_id").references(() => subscriptionTiers.id, {
    onDelete: "set null",
  }),
  currentPeriodStart: timestamp("current_period_start", {
    withTimezone: true,
  }),
  currentPeriodEnd: timestamp("current_period_end", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const markets = pgTable(
  "markets",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 255 }).notNull(),
    geography: jsonb("geography")
      .notNull()
      .$type<{
        city: string;
        state: string;
        county?: string;
        region?: string;
        zipCodes?: string[];
      }>(),
    luxuryTier: luxuryTierEnum("luxury_tier").notNull().default("luxury"),
    priceFloor: integer("price_floor").notNull().default(1000000),
    priceCeiling: integer("price_ceiling"),
    segments: jsonb("segments").$type<string[]>(),
    propertyTypes: jsonb("property_types").$type<string[]>(),
    peerMarkets: jsonb("peer_markets").$type<
      Array<{
        name: string;
        geography: { city: string; state: string };
      }>
    >(),
    isDefault: integer("is_default").notNull().default(0),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("markets_user_id_idx").on(table.userId),
  ]
);

export const reports = pgTable(
  "reports",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    marketId: uuid("market_id")
      .notNull()
      .references(() => markets.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 500 }).notNull(),
    status: reportStatusEnum("status").notNull().default("queued"),
    config: jsonb("config").$type<{
      sections?: string[];
      dateRange?: { start: string; end: string };
      customPrompts?: Record<string, string>;
      computedAnalytics?: Record<string, unknown>;
    }>(),
    outputUrl: text("output_url"),
    pdfUrl: text("pdf_url"),
    version: integer("version").notNull().default(1),
    parentReportId: uuid("parent_report_id"),
    generationStartedAt: timestamp("generation_started_at", {
      withTimezone: true,
    }),
    generationCompletedAt: timestamp("generation_completed_at", {
      withTimezone: true,
    }),
    errorMessage: text("error_message"), // Deprecated: use errorDetails for structured error data
    errorDetails: jsonb("error_details").$type<{
      agent: string;
      message: string;
      stack?: string;
      inputSnapshot?: Record<string, unknown>;
      occurredAt: string;
      stageIndex?: number;
      totalStages?: number;
      previousErrors?: Array<{
        agent: string;
        message: string;
        occurredAt: string;
      }>;
    }>(),
    retriedAt: timestamp("retried_at", { withTimezone: true }),
    retriedBy: text("retried_by"),
    shareToken: varchar("share_token", { length: 64 }).unique(),
    shareTokenExpiresAt: timestamp("share_token_expires_at", {
      withTimezone: true,
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("reports_user_id_idx").on(table.userId),
    index("reports_market_id_idx").on(table.marketId),
    index("reports_status_idx").on(table.status),
    index("reports_share_token_idx").on(table.shareToken),
  ]
);

export const reportSections = pgTable(
  "report_sections",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    reportId: uuid("report_id")
      .notNull()
      .references(() => reports.id, { onDelete: "cascade" }),
    sectionType: reportSectionTypeEnum("section_type").notNull(),
    title: varchar("title", { length: 500 }).notNull(),
    content: jsonb("content").notNull(),
    agentName: varchar("agent_name", { length: 100 }),
    sortOrder: integer("sort_order").notNull().default(0),
    generatedAt: timestamp("generated_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("report_sections_report_id_idx").on(table.reportId),
  ]
);

export const reportTemplates = pgTable(
  "report_templates",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 255 }).notNull(),
    marketId: uuid("market_id")
      .notNull()
      .references(() => markets.id, { onDelete: "cascade" }),
    config: jsonb("config").$type<{
      sections?: string[];
      dateRange?: { start: string; end: string };
      customPrompts?: Record<string, string>;
    }>(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("report_templates_user_id_idx").on(table.userId),
  ]
);

export const reportEditHistory = pgTable(
  "report_edit_history",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    reportId: uuid("report_id")
      .notNull()
      .references(() => reports.id, { onDelete: "cascade" }),
    sectionId: uuid("section_id")
      .notNull()
      .references(() => reportSections.id, { onDelete: "cascade" }),
    sectionTitle: varchar("section_title", { length: 500 }),
    sectionType: varchar("section_type", { length: 100 }),
    previousContent: jsonb("previous_content"),
    editedAt: timestamp("edited_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("report_edit_history_report_id_idx").on(table.reportId),
  ]
);

export const cache = pgTable(
  "cache",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    key: varchar("key", { length: 500 }).unique().notNull(),
    source: varchar("source", { length: 100 }).notNull(),
    data: jsonb("data").notNull(),
    ttlSeconds: integer("ttl_seconds").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("cache_key_idx").on(table.key),
    index("cache_expires_at_idx").on(table.expiresAt),
    index("cache_source_idx").on(table.source),
  ]
);

export const apiUsage = pgTable(
  "api_usage",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    reportId: uuid("report_id").references(() => reports.id, {
      onDelete: "set null",
    }),
    provider: varchar("provider", { length: 100 }).notNull(),
    endpoint: varchar("endpoint", { length: 500 }).notNull(),
    cost: numeric("cost", { precision: 10, scale: 6 }).notNull().default("0"),
    tokensUsed: integer("tokens_used"),
    responseTimeMs: integer("response_time_ms"),
    statusCode: integer("status_code"),
    cached: integer("cached").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("api_usage_user_id_idx").on(table.userId),
    index("api_usage_report_id_idx").on(table.reportId),
    index("api_usage_provider_idx").on(table.provider),
    index("api_usage_created_at_idx").on(table.createdAt),
  ]
);

// --- Buyer Persona Types ---

export type BuyerPersonaDemographics = {
  ageRange: string;
  netWorth: string;
  primaryResidence: string;
  purchaseType: string;
  transactionSpeed: string;
  financing: string;
  informationStyle: string;
  trustSignals: string;
};

export type DecisionDriver = {
  factor: string;
  weight: "critical" | "high" | "moderate";
  description: string;
};

export type NarrativeFraming = {
  languageTone: string;
  keyVocabulary: string[];
  avoid: string[];
};

export type PropertyFilters = {
  priceRange: string;
  propertyType: string;
  communityType?: string;
  yearBuilt?: string;
  waterfront?: string;
  lotSize?: string;
  furnishedStatus?: string;
  rentalAllowed?: string;
  security?: string;
  livingArea?: string;
  privatePool?: string;
  windows?: string;
  keyDevelopmentsExample: string;
};

export type SampleBenchmark = {
  metric: string;
  value: string;
};

// --- Buyer Personas Table ---

export const buyerPersonas = pgTable(
  "buyer_personas",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 255 }).notNull(),
    slug: varchar("slug", { length: 100 }).notNull(),
    tagline: text("tagline").notNull(),
    displayOrder: integer("display_order").notNull(),
    profileOverview: text("profile_overview").notNull(),
    primaryMotivation: varchar("primary_motivation", { length: 255 }).notNull(),
    buyingLens: varchar("buying_lens", { length: 255 }).notNull(),
    whatWinsThem: varchar("what_wins_them", { length: 500 }).notNull(),
    biggestFear: varchar("biggest_fear", { length: 255 }).notNull(),
    demographics: jsonb("demographics")
      .notNull()
      .$type<BuyerPersonaDemographics>(),
    decisionDrivers: jsonb("decision_drivers")
      .notNull()
      .$type<DecisionDriver[]>(),
    reportMetrics: jsonb("report_metrics")
      .notNull()
      .$type<string[]>(),
    propertyFilters: jsonb("property_filters")
      .notNull()
      .$type<PropertyFilters>(),
    narrativeFraming: jsonb("narrative_framing")
      .notNull()
      .$type<NarrativeFraming>(),
    talkingPointTemplates: jsonb("talking_point_templates")
      .notNull()
      .$type<string[]>(),
    sampleBenchmarks: jsonb("sample_benchmarks")
      .notNull()
      .$type<SampleBenchmark[]>(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("buyer_personas_slug_idx").on(table.slug),
    index("buyer_personas_display_order_idx").on(table.displayOrder),
  ]
);

// --- User Activity Table ---

export const userActivity = pgTable(
  "user_activity",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    action: varchar("action", { length: 100 }).notNull(),
    entityType: varchar("entity_type", { length: 50 }).notNull(),
    entityId: uuid("entity_id"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("user_activity_user_id_idx").on(table.userId),
    index("user_activity_created_at_idx").on(table.createdAt),
    index("user_activity_user_created_idx").on(table.userId, table.createdAt),
  ]
);

// --- Report Eval Results Table ---

export const reportEvalResults = pgTable(
  "report_eval_results",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    runId: uuid("run_id").notNull(),
    testCaseId: varchar("test_case_id", { length: 100 }).notNull(),
    criterion: varchar("criterion", { length: 50 }).notNull(),
    score: integer("score").notNull(),
    breakdown: jsonb("breakdown")
      .notNull()
      .$type<{
        dataAccuracy: number;
        completeness: number;
        narrativeQuality: number;
        formatting: number;
        actionability: number;
        personaAlignment: number;
      }>(),
    judgeReason: text("judge_reason"),
    durationMs: integer("duration_ms"),
    error: text("error"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("report_eval_results_run_id_idx").on(table.runId),
    index("report_eval_results_test_case_id_idx").on(table.testCaseId),
    index("report_eval_results_created_at_idx").on(table.createdAt),
    index("report_eval_results_criterion_idx").on(table.criterion),
  ]
);

// --- Report Personas Junction Table ---

export const reportPersonas = pgTable(
  "report_personas",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    reportId: uuid("report_id")
      .notNull()
      .references(() => reports.id, { onDelete: "cascade" }),
    buyerPersonaId: uuid("buyer_persona_id")
      .notNull()
      .references(() => buyerPersonas.id, { onDelete: "cascade" }),
    selectionOrder: integer("selection_order").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("report_personas_report_id_idx").on(table.reportId),
    index("report_personas_buyer_persona_id_idx").on(table.buyerPersonaId),
  ]
);

// --- Entitlement Overrides Table ---

export const entitlementOverrides = pgTable(
  "entitlement_overrides",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    entitlementType: varchar("entitlement_type", { length: 100 }).notNull(),
    value: integer("value").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    grantedBy: text("granted_by").notNull(),
    reason: text("reason"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("entitlement_overrides_user_id_idx").on(table.userId),
    index("entitlement_overrides_user_type_idx").on(
      table.userId,
      table.entitlementType
    ),
  ]
);

export type EntitlementOverridesTable =
  typeof entitlementOverrides.$inferSelect;
export type NewEntitlementOverride = typeof entitlementOverrides.$inferInsert;

// --- Social Media Kit Content Types ---

export type PostIdea = {
  title: string;
  body: string;
  platforms: string[];
  reportSection: string;
  insightRef: string;
};

export type PlatformCaption = {
  platform: string;
  caption: string;
  hashtags: string[];
  characterCount: number;
};

export type PersonaPost = {
  personaSlug: string;
  personaName: string;
  post: string;
  platform: string;
  vocabularyUsed: string[];
};

export type PollIdea = {
  question: string;
  options: string[];
  dataContext: string;
  platform: string;
};

export type ConversationStarter = {
  context: string;
  template: string;
};

export type CalendarSuggestion = {
  week: number;
  theme: string;
  postIdeas: string[];
  platforms: string[];
};

export type StatCallout = {
  stat: string;
  context: string;
  source: string;
  suggestedCaption: string;
};

export type SocialMediaKitContent = {
  postIdeas: PostIdea[];
  captions: PlatformCaption[];
  personaPosts: PersonaPost[];
  polls: PollIdea[];
  conversationStarters: ConversationStarter[];
  calendarSuggestions: CalendarSuggestion[];
  statCallouts: StatCallout[];
};

// --- Social Media Kits Table ---

export const socialMediaKits = pgTable(
  "social_media_kits",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    reportId: uuid("report_id")
      .notNull()
      .references(() => reports.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    status: socialMediaKitStatusEnum("status").notNull().default("queued"),
    content: jsonb("content").$type<SocialMediaKitContent>(),
    errorMessage: text("error_message"),
    generatedAt: timestamp("generated_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("social_media_kits_report_id_idx").on(table.reportId),
    index("social_media_kits_user_id_idx").on(table.userId),
    index("social_media_kits_status_idx").on(table.status),
    uniqueIndex("social_media_kits_report_id_unique").on(table.reportId),
  ]
);

// --- Usage Records Table ---

export const usageRecords = pgTable(
  "usage_records",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    entitlementType: varchar("entitlement_type", { length: 100 }).notNull(),
    periodStart: timestamp("period_start", { withTimezone: true }).notNull(),
    periodEnd: timestamp("period_end", { withTimezone: true }),
    count: integer("count").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("usage_records_user_id_idx").on(table.userId),
    uniqueIndex("usage_records_user_type_period_idx").on(
      table.userId,
      table.entitlementType,
      table.periodStart
    ),
  ]
);

export type UsageRecordsTable = typeof usageRecords.$inferSelect;
export type NewUsageRecord = typeof usageRecords.$inferInsert;

// --- Email Campaign Content Types ---

export type DripEmail = {
  sequenceOrder: number;
  dayOffset: number;
  subject: string;
  previewText: string;
  body: string;
  cta: string;
  reportSection: string;
};

export type NewsletterContent = {
  headline: string;
  subheadline: string;
  contentBlocks: Array<{
    heading: string;
    body: string;
    keyMetric: string;
  }>;
  footerCta: string;
};

export type PersonaEmail = {
  personaSlug: string;
  personaName: string;
  subject: string;
  previewText: string;
  body: string;
  cta: string;
  vocabularyUsed: string[];
};

export type SubjectLineSet = {
  emailContext: string;
  variants: Array<{
    style: string;
    subject: string;
    previewText: string;
  }>;
};

export type CtaBlock = {
  context: string;
  buttonText: string;
  supportingCopy: string;
  placement: string;
};

export type ReEngagementEmail = {
  hook: string;
  body: string;
  cta: string;
  tone: string;
};

export type EmailCampaignContent = {
  dripSequence: DripEmail[];
  newsletter: NewsletterContent;
  personaEmails: PersonaEmail[];
  subjectLines: SubjectLineSet[];
  ctaBlocks: CtaBlock[];
  reEngagementEmails: ReEngagementEmail[];
};

// --- Email Campaigns Table ---

export const emailCampaigns = pgTable(
  "email_campaigns",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    reportId: uuid("report_id")
      .notNull()
      .references(() => reports.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    status: emailCampaignStatusEnum("status").notNull().default("queued"),
    content: jsonb("content").$type<EmailCampaignContent>(),
    errorMessage: text("error_message"),
    generatedAt: timestamp("generated_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("email_campaigns_report_id_idx").on(table.reportId),
    index("email_campaigns_user_id_idx").on(table.userId),
    index("email_campaigns_status_idx").on(table.status),
    uniqueIndex("email_campaigns_report_id_unique").on(table.reportId),
  ]
);

export type EmailCampaignsTable = typeof emailCampaigns.$inferSelect;
export type NewEmailCampaign = typeof emailCampaigns.$inferInsert;

// --- Advisor Conversation Types ---

export type AdvisorMessage = {
  role: "user" | "assistant";
  content: string;
  timestamp: string; // ISO 8601
};

// --- Advisor Conversations Table ---

export const advisorConversations = pgTable(
  "advisor_conversations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    reportId: uuid("report_id")
      .notNull()
      .references(() => reports.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    messages: jsonb("messages").notNull().$type<AdvisorMessage[]>().default([]),
    turnCount: integer("turn_count").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("advisor_conversations_report_id_idx").on(table.reportId),
    index("advisor_conversations_user_id_idx").on(table.userId),
  ]
);

export type AdvisorConversationsTable =
  typeof advisorConversations.$inferSelect;
export type NewAdvisorConversation = typeof advisorConversations.$inferInsert;

// --- Deal Analysis Types ---

export type DealPropertyData = {
  id: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  county: string;
  subdivision?: string;
  propertyType: string;
  bedrooms?: number;
  bathrooms?: number;
  squareFeet?: number;
  lotSize?: number;
  yearBuilt?: number;
  estimatedValue?: number;
  lastSaleDate?: string;
  lastSaleAmount?: number;
  pricePerSqFt?: number;
  ownerOccupied?: boolean;
  inherited?: boolean;
  adjustableRate?: boolean;
  saleHistory?: Array<{
    date: string;
    amount: number;
    buyer?: string;
    seller?: string;
  }>;
  mortgageHistory?: Array<{
    amount: number;
    rate?: number;
    lender?: string;
    originationDate?: string;
    dueDate?: string;
    type?: string;
  }>;
  taxAssessment?: number;
  annualTaxes?: number;
  medianIncome?: number;
  floodZone?: string;
};

export type DealBriefContent = {
  summary: string;
  pricingAssessment: {
    narrative: string;
    vsMedian: string;
    vsSegmentComps: string;
    pricePerSqFtContext: string;
  };
  personaMatch: {
    bestFitPersona: string;
    matchRationale: string;
    talkingPoints: string[];
  };
  negotiationPoints: {
    leverageItems: string[];
    dataBackedArguments: string[];
    riskFactors: string[];
  };
  marketTiming: {
    signal: "buy" | "wait" | "neutral";
    rationale: string;
    forecastContext: string;
  };
};

export type MotivatedSellerSignals = {
  inherited: { fired: boolean; weight: number };
  nonOwnerOccupied: { fired: boolean; weight: number };
  adjustableRate: { fired: boolean; weight: number };
  longHoldPeriod: { fired: boolean; weight: number; yearsHeld?: number };
  helocPattern: { fired: boolean; weight: number; mortgageCount?: number };
  highEquity: { fired: boolean; weight: number; equityPercent?: number };
  totalScore: number;
};

// --- Deal Analyses Table ---

export const dealAnalyses = pgTable(
  "deal_analyses",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    marketId: uuid("market_id")
      .notNull()
      .references(() => markets.id, { onDelete: "cascade" }),
    reportId: uuid("report_id")
      .notNull()
      .references(() => reports.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 500 }).notNull(),
    address: varchar("address", { length: 500 }).notNull(),
    propertyData: jsonb("property_data").$type<DealPropertyData>(),
    briefContent: jsonb("brief_content").$type<DealBriefContent>(),
    motivatedSellerScore: integer("motivated_seller_score"),
    motivatedSellerSignals: jsonb("motivated_seller_signals").$type<MotivatedSellerSignals>(),
    status: dealAnalysisStatusEnum("status").notNull().default("queued"),
    errorMessage: text("error_message"),
    generatedAt: timestamp("generated_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("deal_analyses_user_id_idx").on(table.userId),
    index("deal_analyses_market_id_idx").on(table.marketId),
    index("deal_analyses_report_id_idx").on(table.reportId),
    index("deal_analyses_status_idx").on(table.status),
    index("deal_analyses_user_created_idx").on(table.userId, table.createdAt),
  ]
);

export type DealAnalysesTable = typeof dealAnalyses.$inferSelect;
export type NewDealAnalysis = typeof dealAnalyses.$inferInsert;

// --- Pipeline Test Suite Tables ---

export const pipelineSnapshots = pgTable(
  "pipeline_snapshots",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    marketName: text("market_name").notNull(),
    geography: jsonb("geography").notNull().$type<{ city: string; state: string; county?: string }>(),
    compiledData: jsonb("compiled_data").notNull(),
    propertyCount: integer("property_count").notNull().default(0),
    hasXSentiment: boolean("has_x_sentiment").notNull().default(false),
    peerMarketCount: integer("peer_market_count").notNull().default(0),
    isGolden: boolean("is_golden").notNull().default(false),
    sourceReportId: uuid("source_report_id").references(() => reports.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("pipeline_snapshots_market_name_idx").on(table.marketName),
  ]
);

export type PipelineSnapshot = typeof pipelineSnapshots.$inferSelect;
export type NewPipelineSnapshot = typeof pipelineSnapshots.$inferInsert;

export const pipelineTestRuns = pgTable(
  "pipeline_test_runs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    snapshotId: uuid("snapshot_id")
      .notNull()
      .references(() => pipelineSnapshots.id, { onDelete: "cascade" }),
    status: text("status").notNull().default("running"),
    layer1Result: jsonb("layer_1_result"),
    layer2Result: jsonb("layer_2_result"),
    layer3Result: jsonb("layer_3_result"),
    layerDurations: jsonb("layer_durations").$type<{ layer1Ms: number; layer2Ms: number; layer3Ms: number }>(),
    error: jsonb("error").$type<{ layer: number; message: string; agent?: string } | null>(),
    isDraft: boolean("is_draft").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("pipeline_test_runs_snapshot_id_idx").on(table.snapshotId),
    index("pipeline_test_runs_status_idx").on(table.status),
  ]
);

export type PipelineTestRun = typeof pipelineTestRuns.$inferSelect;
export type NewPipelineTestRun = typeof pipelineTestRuns.$inferInsert;

// --- Waitlist ---

export const waitlistStatusEnum = pgEnum("waitlist_status", [
  "pending",
  "invited",
  "joined",
]);

export const waitlist = pgTable(
  "waitlist",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    firstName: varchar("first_name", { length: 100 }).notNull(),
    lastName: varchar("last_name", { length: 100 }).notNull(),
    email: varchar("email", { length: 255 }).notNull(),
    phone: varchar("phone", { length: 50 }),
    market: varchar("market", { length: 255 }).notNull(),
    website: text("website"),
    status: waitlistStatusEnum("status").notNull().default("pending"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("waitlist_email_idx").on(table.email),
  ]
);

export type WaitlistEntry = typeof waitlist.$inferSelect;
export type NewWaitlistEntry = typeof waitlist.$inferInsert;
