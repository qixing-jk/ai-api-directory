import { pgEnum } from "drizzle-orm/pg-core";

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

export const factLevelPgEnum = pgEnum("fact_level", [
  "claimed",
  "listed",
  "observed",
  "tested",
  "disputed",
]);
