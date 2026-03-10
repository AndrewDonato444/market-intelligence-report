import {
  pgTable,
  uuid,
  text,
  varchar,
  timestamp,
  jsonb,
  integer,
  numeric,
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
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const subscriptions = pgTable("subscriptions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: "cascade" }),
  stripeCustomerId: varchar("stripe_customer_id", { length: 255 }).notNull(),
  stripeSubscriptionId: varchar("stripe_subscription_id", { length: 255 }),
  plan: varchar("plan", { length: 50 }).notNull().default("free"),
  status: varchar("status", { length: 50 }).notNull().default("inactive"),
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
    focusAreas: jsonb("focus_areas").$type<string[]>(),
    peerMarkets: jsonb("peer_markets").$type<
      Array<{
        name: string;
        geography: { city: string; state: string };
      }>
    >(),
    isDefault: integer("is_default").notNull().default(0),
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
    errorMessage: text("error_message"),
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
