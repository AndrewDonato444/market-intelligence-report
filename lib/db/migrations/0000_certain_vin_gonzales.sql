CREATE TYPE "public"."luxury_tier" AS ENUM('luxury', 'high_luxury', 'ultra_luxury');--> statement-breakpoint
CREATE TYPE "public"."report_section_type" AS ENUM('market_overview', 'executive_summary', 'second_homes', 'key_drivers', 'competitive_analysis', 'trending_insights', 'forecasts', 'methodology', 'strategic_summary', 'executive_briefing', 'market_insights_index', 'luxury_market_dashboard', 'neighborhood_intelligence', 'the_narrative', 'forward_look', 'comparative_positioning', 'strategic_benchmark', 'disclaimer_methodology', 'persona_intelligence');--> statement-breakpoint
CREATE TYPE "public"."report_status" AS ENUM('queued', 'generating', 'completed', 'failed');--> statement-breakpoint
CREATE TYPE "public"."user_account_status" AS ENUM('active', 'suspended', 'deleted');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('user', 'admin');--> statement-breakpoint
CREATE TABLE "api_usage" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"report_id" uuid,
	"provider" varchar(100) NOT NULL,
	"endpoint" varchar(500) NOT NULL,
	"cost" numeric(10, 6) DEFAULT '0' NOT NULL,
	"tokens_used" integer,
	"response_time_ms" integer,
	"status_code" integer,
	"cached" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "buyer_personas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"slug" varchar(100) NOT NULL,
	"tagline" text NOT NULL,
	"display_order" integer NOT NULL,
	"profile_overview" text NOT NULL,
	"primary_motivation" varchar(255) NOT NULL,
	"buying_lens" varchar(255) NOT NULL,
	"what_wins_them" varchar(500) NOT NULL,
	"biggest_fear" varchar(255) NOT NULL,
	"demographics" jsonb NOT NULL,
	"decision_drivers" jsonb NOT NULL,
	"report_metrics" jsonb NOT NULL,
	"property_filters" jsonb NOT NULL,
	"narrative_framing" jsonb NOT NULL,
	"talking_point_templates" jsonb NOT NULL,
	"sample_benchmarks" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cache" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" varchar(500) NOT NULL,
	"source" varchar(100) NOT NULL,
	"data" jsonb NOT NULL,
	"ttl_seconds" integer NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "cache_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "markets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"geography" jsonb NOT NULL,
	"luxury_tier" "luxury_tier" DEFAULT 'luxury' NOT NULL,
	"price_floor" integer DEFAULT 1000000 NOT NULL,
	"price_ceiling" integer,
	"segments" jsonb,
	"property_types" jsonb,
	"focus_areas" jsonb,
	"peer_markets" jsonb,
	"is_default" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "report_edit_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"report_id" uuid NOT NULL,
	"section_id" uuid NOT NULL,
	"section_title" varchar(500),
	"section_type" varchar(100),
	"previous_content" jsonb,
	"edited_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "report_personas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"report_id" uuid NOT NULL,
	"buyer_persona_id" uuid NOT NULL,
	"selection_order" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "report_sections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"report_id" uuid NOT NULL,
	"section_type" "report_section_type" NOT NULL,
	"title" varchar(500) NOT NULL,
	"content" jsonb NOT NULL,
	"agent_name" varchar(100),
	"sort_order" integer DEFAULT 0 NOT NULL,
	"generated_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "report_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"market_id" uuid NOT NULL,
	"config" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"market_id" uuid NOT NULL,
	"title" varchar(500) NOT NULL,
	"status" "report_status" DEFAULT 'queued' NOT NULL,
	"config" jsonb,
	"output_url" text,
	"pdf_url" text,
	"version" integer DEFAULT 1 NOT NULL,
	"parent_report_id" uuid,
	"generation_started_at" timestamp with time zone,
	"generation_completed_at" timestamp with time zone,
	"error_message" text,
	"error_details" jsonb,
	"retried_at" timestamp with time zone,
	"retried_by" text,
	"share_token" varchar(64),
	"share_token_expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "reports_share_token_unique" UNIQUE("share_token")
);
--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"stripe_customer_id" varchar(255) NOT NULL,
	"stripe_subscription_id" varchar(255),
	"plan" varchar(50) DEFAULT 'free' NOT NULL,
	"status" varchar(50) DEFAULT 'inactive' NOT NULL,
	"current_period_start" timestamp with time zone,
	"current_period_end" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "subscriptions_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "user_activity" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"action" varchar(100) NOT NULL,
	"entity_type" varchar(50) NOT NULL,
	"entity_id" uuid,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"auth_id" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"company" varchar(255),
	"logo_url" text,
	"brand_colors" jsonb,
	"phone" varchar(50),
	"title" varchar(255),
	"bio" text,
	"role" "user_role" DEFAULT 'user' NOT NULL,
	"status" "user_account_status" DEFAULT 'active' NOT NULL,
	"suspended_at" timestamp with time zone,
	"deleted_at" timestamp with time zone,
	"last_login_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_auth_id_unique" UNIQUE("auth_id"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "api_usage" ADD CONSTRAINT "api_usage_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "api_usage" ADD CONSTRAINT "api_usage_report_id_reports_id_fk" FOREIGN KEY ("report_id") REFERENCES "public"."reports"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "markets" ADD CONSTRAINT "markets_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "report_edit_history" ADD CONSTRAINT "report_edit_history_report_id_reports_id_fk" FOREIGN KEY ("report_id") REFERENCES "public"."reports"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "report_edit_history" ADD CONSTRAINT "report_edit_history_section_id_report_sections_id_fk" FOREIGN KEY ("section_id") REFERENCES "public"."report_sections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "report_personas" ADD CONSTRAINT "report_personas_report_id_reports_id_fk" FOREIGN KEY ("report_id") REFERENCES "public"."reports"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "report_personas" ADD CONSTRAINT "report_personas_buyer_persona_id_buyer_personas_id_fk" FOREIGN KEY ("buyer_persona_id") REFERENCES "public"."buyer_personas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "report_sections" ADD CONSTRAINT "report_sections_report_id_reports_id_fk" FOREIGN KEY ("report_id") REFERENCES "public"."reports"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "report_templates" ADD CONSTRAINT "report_templates_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "report_templates" ADD CONSTRAINT "report_templates_market_id_markets_id_fk" FOREIGN KEY ("market_id") REFERENCES "public"."markets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_market_id_markets_id_fk" FOREIGN KEY ("market_id") REFERENCES "public"."markets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_activity" ADD CONSTRAINT "user_activity_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "api_usage_user_id_idx" ON "api_usage" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "api_usage_report_id_idx" ON "api_usage" USING btree ("report_id");--> statement-breakpoint
CREATE INDEX "api_usage_provider_idx" ON "api_usage" USING btree ("provider");--> statement-breakpoint
CREATE INDEX "api_usage_created_at_idx" ON "api_usage" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "buyer_personas_slug_idx" ON "buyer_personas" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "buyer_personas_display_order_idx" ON "buyer_personas" USING btree ("display_order");--> statement-breakpoint
CREATE INDEX "cache_key_idx" ON "cache" USING btree ("key");--> statement-breakpoint
CREATE INDEX "cache_expires_at_idx" ON "cache" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "cache_source_idx" ON "cache" USING btree ("source");--> statement-breakpoint
CREATE INDEX "markets_user_id_idx" ON "markets" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "report_edit_history_report_id_idx" ON "report_edit_history" USING btree ("report_id");--> statement-breakpoint
CREATE INDEX "report_personas_report_id_idx" ON "report_personas" USING btree ("report_id");--> statement-breakpoint
CREATE INDEX "report_personas_buyer_persona_id_idx" ON "report_personas" USING btree ("buyer_persona_id");--> statement-breakpoint
CREATE INDEX "report_sections_report_id_idx" ON "report_sections" USING btree ("report_id");--> statement-breakpoint
CREATE INDEX "report_templates_user_id_idx" ON "report_templates" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "reports_user_id_idx" ON "reports" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "reports_market_id_idx" ON "reports" USING btree ("market_id");--> statement-breakpoint
CREATE INDEX "reports_status_idx" ON "reports" USING btree ("status");--> statement-breakpoint
CREATE INDEX "reports_share_token_idx" ON "reports" USING btree ("share_token");--> statement-breakpoint
CREATE INDEX "user_activity_user_id_idx" ON "user_activity" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_activity_created_at_idx" ON "user_activity" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "user_activity_user_created_idx" ON "user_activity" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "users_status_idx" ON "users" USING btree ("status");