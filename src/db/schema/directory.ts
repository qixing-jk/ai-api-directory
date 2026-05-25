import {
  boolean,
  foreignKey,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import {
  endpointKindPgEnum,
  factLevelPgEnum,
  siteCategoryPgEnum,
  siteTypePgEnum,
} from "./directory-enums";
import {
  lifecyclePgEnum,
} from "./publishing-enums";
import { publishableVersions } from "./publishing";

export const sites = pgTable(
  "sites",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull(),
    displayName: text("display_name").notNull(),
    category: siteCategoryPgEnum("category").notNull().default("unknown"),
    siteType: siteTypePgEnum("site_type").notNull().default("unknown"),
    lifecycle: lifecyclePgEnum("lifecycle").notNull().default("draft"),
    activePublishedVersionId: uuid("active_published_version_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("sites_slug_unique").on(table.slug),
    foreignKey({
      name: "sites_active_published_version_entity_fk",
      columns: [table.activePublishedVersionId, table.id],
      foreignColumns: [publishableVersions.id, publishableVersions.entityId],
    }),
  ],
);

export const siteEndpoints = pgTable(
  "site_endpoints",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    siteId: uuid("site_id").notNull().references(() => sites.id),
    origin: text("origin").notNull(),
    kind: endpointKindPgEnum("kind").notNull().default("unknown"),
    registrableDomain: text("registrable_domain").notNull(),
    normalizedHost: text("normalized_host").notNull(),
    active: boolean("active").notNull().default(true),
    firstSeenAt: timestamp("first_seen_at", { withTimezone: true }).notNull().defaultNow(),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true }),
  },
  (table) => [
    unique("site_endpoints_id_site_unique").on(table.id, table.siteId),
    uniqueIndex("site_endpoints_site_origin_kind_unique").on(
      table.siteId,
      table.origin,
      table.kind,
    ),
    index("site_endpoints_host_idx").on(table.normalizedHost),
  ],
);

export const canonicalModels = pgTable(
  "canonical_models",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull(),
    displayName: text("display_name").notNull(),
    family: text("family").notNull(),
    creator: text("creator"),
    lifecycle: lifecyclePgEnum("lifecycle").notNull().default("draft"),
    contextWindow: integer("context_window"),
    capabilities: jsonb("capabilities").$type<readonly string[]>().notNull().default([]),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("canonical_models_slug_unique").on(table.slug)],
);

export const modelAliases = pgTable(
  "model_aliases",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    canonicalModelId: uuid("canonical_model_id")
      .notNull()
      .references(() => canonicalModels.id),
    alias: text("alias").notNull(),
    source: text("source").notNull().default("admin"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("model_aliases_alias_unique").on(table.alias),
    index("model_aliases_model_idx").on(table.canonicalModelId),
  ],
);

export const modelRoutes = pgTable(
  "model_routes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    siteId: uuid("site_id").notNull().references(() => sites.id),
    endpointId: uuid("endpoint_id"),
    canonicalModelId: uuid("canonical_model_id")
      .notNull()
      .references(() => canonicalModels.id),
    routeModelId: text("route_model_id").notNull(),
    providerType: text("provider_type").notNull().default("unknown"),
    upstreamClaim: text("upstream_claim").notNull().default("unknown"),
    factLevel: factLevelPgEnum("fact_level").notNull().default("claimed"),
    lifecycle: lifecyclePgEnum("lifecycle").notNull().default("draft"),
    lastObservedAt: timestamp("last_observed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    foreignKey({
      name: "model_routes_endpoint_site_fk",
      columns: [table.endpointId, table.siteId],
      foreignColumns: [siteEndpoints.id, siteEndpoints.siteId],
    }),
    uniqueIndex("model_routes_site_model_route_unique").on(
      table.siteId,
      table.canonicalModelId,
      table.routeModelId,
    ),
    index("model_routes_model_idx").on(table.canonicalModelId),
  ],
);
