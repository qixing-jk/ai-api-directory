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

export const projectionFamilyPgEnum = pgEnum("projection_family", [
  "entity_page",
  "index_list",
  "pricing",
  "navigation",
  "metadata",
  "sitemap",
  "hreflang",
]);
