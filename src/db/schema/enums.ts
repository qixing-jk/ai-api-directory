import { pgEnum } from "drizzle-orm/pg-core";

export const lifecyclePgEnum = pgEnum("publishable_lifecycle", [
  "draft",
  "pending_review",
  "approved",
  "published",
  "disputed",
  "withdrawn",
  "archived",
  "rejected",
]);

export const siteCategoryPgEnum = pgEnum("site_category", [
  "official",
  "aggregator",
  "relay",
  "charity",
  "self_hosted",
  "unknown",
]);

export const siteTypePgEnum = pgEnum("site_type", [
  "one_api",
  "new_api",
  "one_hub",
  "done_hub",
  "aihubmix",
  "custom",
  "unknown",
]);

export const endpointKindPgEnum = pgEnum("endpoint_kind", [
  "homepage",
  "console",
  "api",
  "docs",
  "pricing",
  "recharge",
  "status",
  "unknown",
]);

export const evidenceLevelPgEnum = pgEnum("evidence_level", [
  "claimed",
  "listed",
  "observed",
  "tested",
  "manually_confirmed",
]);

export const factLevelPgEnum = pgEnum("fact_level", [
  "claimed",
  "listed",
  "observed",
  "tested",
  "disputed",
]);

export const candidateDispositionPgEnum = pgEnum("candidate_disposition", [
  "candidate",
  "ready_for_review",
  "merged",
  "dismissed",
]);

export const signalDispositionPgEnum = pgEnum("signal_disposition", [
  "active",
  "superseded",
  "dismissed",
  "withdrawn",
]);

export const actorTypePgEnum = pgEnum("actor_type", ["admin", "system"]);

export const projectionFamilyPgEnum = pgEnum("projection_family", [
  "entity_page",
  "index_list",
  "pricing",
  "navigation",
  "metadata",
  "sitemap",
  "hreflang",
]);
