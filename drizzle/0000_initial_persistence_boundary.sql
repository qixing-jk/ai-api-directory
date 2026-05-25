CREATE TYPE "public"."actor_type" AS ENUM('admin', 'system');--> statement-breakpoint
CREATE TYPE "public"."candidate_disposition" AS ENUM('candidate', 'ready_for_review', 'merged', 'dismissed');--> statement-breakpoint
CREATE TYPE "public"."endpoint_kind" AS ENUM('homepage', 'console', 'api', 'docs', 'pricing', 'recharge', 'status', 'unknown');--> statement-breakpoint
CREATE TYPE "public"."evidence_level" AS ENUM('claimed', 'listed', 'observed', 'tested', 'manually_confirmed');--> statement-breakpoint
CREATE TYPE "public"."fact_level" AS ENUM('claimed', 'listed', 'observed', 'tested', 'disputed');--> statement-breakpoint
CREATE TYPE "public"."publishable_lifecycle" AS ENUM('draft', 'pending_review', 'approved', 'published', 'disputed', 'withdrawn', 'archived', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."projection_family" AS ENUM('entity_page', 'index_list', 'pricing', 'navigation', 'metadata', 'sitemap', 'hreflang');--> statement-breakpoint
CREATE TYPE "public"."signal_disposition" AS ENUM('active', 'superseded', 'dismissed', 'withdrawn');--> statement-breakpoint
CREATE TYPE "public"."site_category" AS ENUM('official', 'aggregator', 'relay', 'charity', 'self_hosted', 'unknown');--> statement-breakpoint
CREATE TYPE "public"."site_type" AS ENUM('one_api', 'new_api', 'one_hub', 'done_hub', 'aihubmix', 'custom', 'unknown');--> statement-breakpoint
CREATE TABLE "admin_permissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" text NOT NULL,
	"label" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "admin_permissions_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "admin_role_permissions" (
	"role_id" uuid NOT NULL,
	"permission_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "admin_role_permissions_role_id_permission_id_pk" PRIMARY KEY("role_id","permission_id")
);
--> statement-breakpoint
CREATE TABLE "admin_roles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" text NOT NULL,
	"label" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "admin_roles_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "admin_user_roles" (
	"user_id" uuid NOT NULL,
	"role_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "admin_user_roles_user_id_role_id_pk" PRIMARY KEY("user_id","role_id")
);
--> statement-breakpoint
CREATE TABLE "admin_users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"external_auth_provider" text,
	"external_auth_id" text,
	"email" text NOT NULL,
	"display_name" text NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "admin_users_external_auth_pair_check" CHECK (("admin_users"."external_auth_provider" is null and "admin_users"."external_auth_id" is null) or ("admin_users"."external_auth_provider" is not null and "admin_users"."external_auth_id" is not null))
);
--> statement-breakpoint
CREATE TABLE "admin_audit_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"actor_type" "actor_type" NOT NULL,
	"actor_id" uuid,
	"command_id" text NOT NULL,
	"object_family" text NOT NULL,
	"object_id" text NOT NULL,
	"action" text NOT NULL,
	"previous_state" jsonb,
	"next_state" jsonb,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "admin_audit_events_actor_consistency_check" CHECK (("admin_audit_events"."actor_type" = 'admin' and "admin_audit_events"."actor_id" is not null) or ("admin_audit_events"."actor_type" = 'system' and "admin_audit_events"."actor_id" is null))
);
--> statement-breakpoint
CREATE TABLE "canonical_models" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"display_name" text NOT NULL,
	"family" text NOT NULL,
	"creator" text,
	"lifecycle" "publishable_lifecycle" DEFAULT 'draft' NOT NULL,
	"context_window" integer,
	"capabilities" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "model_aliases" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"canonical_model_id" uuid NOT NULL,
	"alias" text NOT NULL,
	"source" text DEFAULT 'admin' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "model_routes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"site_id" uuid NOT NULL,
	"endpoint_id" uuid,
	"canonical_model_id" uuid NOT NULL,
	"route_model_id" text NOT NULL,
	"provider_type" text DEFAULT 'unknown' NOT NULL,
	"upstream_claim" text DEFAULT 'unknown' NOT NULL,
	"fact_level" "fact_level" DEFAULT 'claimed' NOT NULL,
	"lifecycle" "publishable_lifecycle" DEFAULT 'draft' NOT NULL,
	"last_observed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "site_endpoints" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"site_id" uuid NOT NULL,
	"origin" text NOT NULL,
	"kind" "endpoint_kind" DEFAULT 'unknown' NOT NULL,
	"registrable_domain" text NOT NULL,
	"normalized_host" text NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"first_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_seen_at" timestamp with time zone,
	CONSTRAINT "site_endpoints_id_site_unique" UNIQUE("id","site_id")
);
--> statement-breakpoint
CREATE TABLE "sites" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"display_name" text NOT NULL,
	"category" "site_category" DEFAULT 'unknown' NOT NULL,
	"site_type" "site_type" DEFAULT 'unknown' NOT NULL,
	"lifecycle" "publishable_lifecycle" DEFAULT 'draft' NOT NULL,
	"active_published_version_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "price_snapshots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"model_route_id" uuid NOT NULL,
	"currency" text NOT NULL,
	"billing_unit" text NOT NULL,
	"input_per_1m" numeric(18, 8),
	"output_per_1m" numeric(18, 8),
	"cache_read_per_1m" numeric(18, 8),
	"cache_write_per_1m" numeric(18, 8),
	"minimum_recharge" numeric(18, 8),
	"source_evidence_id" uuid,
	"confidence" integer DEFAULT 0 NOT NULL,
	"observed_at" timestamp with time zone NOT NULL,
	"effective_at" timestamp with time zone,
	"expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "risk_signals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"site_id" uuid NOT NULL,
	"risk_type" text NOT NULL,
	"severity" text DEFAULT 'info' NOT NULL,
	"disposition" "signal_disposition" DEFAULT 'active' NOT NULL,
	"source_evidence_id" uuid,
	"reviewed_by" uuid,
	"reviewed_at" timestamp with time zone,
	"withdrawn_at" timestamp with time zone,
	"withdraw_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "site_capability_signals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"site_id" uuid NOT NULL,
	"capability" text NOT NULL,
	"disposition" "signal_disposition" DEFAULT 'active' NOT NULL,
	"source_count" integer DEFAULT 1 NOT NULL,
	"confidence" integer DEFAULT 0 NOT NULL,
	"last_observed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "verification_evidence" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"target_type" text NOT NULL,
	"target_id" uuid NOT NULL,
	"source_type" text NOT NULL,
	"public_source_url" text,
	"evidence_level" "evidence_level" NOT NULL,
	"disposition" "candidate_disposition" DEFAULT 'candidate' NOT NULL,
	"public_summary" text,
	"private_review_context" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"observed_at" timestamp with time zone NOT NULL,
	"expires_at" timestamp with time zone,
	"withdrawn_at" timestamp with time zone,
	"withdraw_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "publishable_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entity_family" text NOT NULL,
	"entity_id" uuid NOT NULL,
	"locale" text,
	"lifecycle" "publishable_lifecycle" DEFAULT 'draft' NOT NULL,
	"title" text,
	"summary" text,
	"content" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_by" uuid,
	"reviewed_by" uuid,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "publishable_versions_id_entity_unique" UNIQUE("id","entity_id")
);
--> statement-breakpoint
CREATE TABLE "published_projection_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"projection_key" text NOT NULL,
	"locale" text NOT NULL,
	"family" "projection_family" NOT NULL,
	"payload" jsonb NOT NULL,
	"source_version_id" uuid,
	"source_checkpoint_scope" text NOT NULL,
	"source_checkpoint_version" integer NOT NULL,
	"projection_policy_version" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "admin_role_permissions" ADD CONSTRAINT "admin_role_permissions_role_id_admin_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."admin_roles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admin_role_permissions" ADD CONSTRAINT "admin_role_permissions_permission_id_admin_permissions_id_fk" FOREIGN KEY ("permission_id") REFERENCES "public"."admin_permissions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admin_user_roles" ADD CONSTRAINT "admin_user_roles_user_id_admin_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."admin_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admin_user_roles" ADD CONSTRAINT "admin_user_roles_role_id_admin_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."admin_roles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admin_audit_events" ADD CONSTRAINT "admin_audit_events_actor_id_admin_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."admin_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "model_aliases" ADD CONSTRAINT "model_aliases_canonical_model_id_canonical_models_id_fk" FOREIGN KEY ("canonical_model_id") REFERENCES "public"."canonical_models"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "model_routes" ADD CONSTRAINT "model_routes_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "model_routes" ADD CONSTRAINT "model_routes_canonical_model_id_canonical_models_id_fk" FOREIGN KEY ("canonical_model_id") REFERENCES "public"."canonical_models"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "model_routes" ADD CONSTRAINT "model_routes_endpoint_site_fk" FOREIGN KEY ("endpoint_id","site_id") REFERENCES "public"."site_endpoints"("id","site_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "site_endpoints" ADD CONSTRAINT "site_endpoints_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sites" ADD CONSTRAINT "sites_active_published_version_entity_fk" FOREIGN KEY ("active_published_version_id","id") REFERENCES "public"."publishable_versions"("id","entity_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "price_snapshots" ADD CONSTRAINT "price_snapshots_model_route_id_model_routes_id_fk" FOREIGN KEY ("model_route_id") REFERENCES "public"."model_routes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "price_snapshots" ADD CONSTRAINT "price_snapshots_source_evidence_id_verification_evidence_id_fk" FOREIGN KEY ("source_evidence_id") REFERENCES "public"."verification_evidence"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "risk_signals" ADD CONSTRAINT "risk_signals_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "risk_signals" ADD CONSTRAINT "risk_signals_source_evidence_id_verification_evidence_id_fk" FOREIGN KEY ("source_evidence_id") REFERENCES "public"."verification_evidence"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "risk_signals" ADD CONSTRAINT "risk_signals_reviewed_by_admin_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."admin_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "site_capability_signals" ADD CONSTRAINT "site_capability_signals_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "publishable_versions" ADD CONSTRAINT "publishable_versions_created_by_admin_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."admin_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "publishable_versions" ADD CONSTRAINT "publishable_versions_reviewed_by_admin_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."admin_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "published_projection_records" ADD CONSTRAINT "published_projection_records_source_version_id_publishable_versions_id_fk" FOREIGN KEY ("source_version_id") REFERENCES "public"."publishable_versions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "admin_role_permissions_permission_idx" ON "admin_role_permissions" USING btree ("permission_id");--> statement-breakpoint
CREATE INDEX "admin_user_roles_role_idx" ON "admin_user_roles" USING btree ("role_id");--> statement-breakpoint
CREATE UNIQUE INDEX "admin_users_email_unique" ON "admin_users" USING btree (lower("email"));--> statement-breakpoint
CREATE UNIQUE INDEX "admin_users_external_auth_unique" ON "admin_users" USING btree ("external_auth_provider","external_auth_id") WHERE "admin_users"."external_auth_provider" is not null and "admin_users"."external_auth_id" is not null;--> statement-breakpoint
CREATE INDEX "admin_audit_events_object_idx" ON "admin_audit_events" USING btree ("object_family","object_id");--> statement-breakpoint
CREATE INDEX "admin_audit_events_command_idx" ON "admin_audit_events" USING btree ("command_id");--> statement-breakpoint
CREATE INDEX "admin_audit_events_actor_idx" ON "admin_audit_events" USING btree ("actor_type","actor_id");--> statement-breakpoint
CREATE UNIQUE INDEX "canonical_models_slug_unique" ON "canonical_models" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "model_aliases_alias_unique" ON "model_aliases" USING btree ("alias");--> statement-breakpoint
CREATE INDEX "model_aliases_model_idx" ON "model_aliases" USING btree ("canonical_model_id");--> statement-breakpoint
CREATE UNIQUE INDEX "model_routes_site_model_route_unique" ON "model_routes" USING btree ("site_id","canonical_model_id","route_model_id");--> statement-breakpoint
CREATE INDEX "model_routes_model_idx" ON "model_routes" USING btree ("canonical_model_id");--> statement-breakpoint
CREATE UNIQUE INDEX "site_endpoints_site_origin_kind_unique" ON "site_endpoints" USING btree ("site_id","origin","kind");--> statement-breakpoint
CREATE INDEX "site_endpoints_host_idx" ON "site_endpoints" USING btree ("normalized_host");--> statement-breakpoint
CREATE UNIQUE INDEX "sites_slug_unique" ON "sites" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "price_snapshots_route_observed_idx" ON "price_snapshots" USING btree ("model_route_id","observed_at");--> statement-breakpoint
CREATE INDEX "risk_signals_site_idx" ON "risk_signals" USING btree ("site_id");--> statement-breakpoint
CREATE INDEX "site_capability_signals_site_idx" ON "site_capability_signals" USING btree ("site_id");--> statement-breakpoint
CREATE INDEX "verification_evidence_target_idx" ON "verification_evidence" USING btree ("target_type","target_id");--> statement-breakpoint
CREATE INDEX "verification_evidence_disposition_idx" ON "verification_evidence" USING btree ("disposition");--> statement-breakpoint
CREATE INDEX "publishable_versions_entity_idx" ON "publishable_versions" USING btree ("entity_family","entity_id");--> statement-breakpoint
CREATE INDEX "publishable_versions_lifecycle_idx" ON "publishable_versions" USING btree ("lifecycle");--> statement-breakpoint
CREATE UNIQUE INDEX "published_projection_records_key_locale_unique" ON "published_projection_records" USING btree ("projection_key","locale");--> statement-breakpoint
CREATE INDEX "published_projection_records_family_idx" ON "published_projection_records" USING btree ("family");
