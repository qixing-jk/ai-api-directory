import {
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
import { adminUsers } from "./admin";
import { lifecyclePgEnum, projectionFamilyPgEnum } from "./enums";

export const publishableVersions = pgTable(
  "publishable_versions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    entityFamily: text("entity_family").notNull(),
    entityId: uuid("entity_id").notNull(),
    locale: text("locale"),
    lifecycle: lifecyclePgEnum("lifecycle").notNull().default("draft"),
    title: text("title"),
    summary: text("summary"),
    content: jsonb("content").$type<Record<string, unknown>>().notNull().default({}),
    createdBy: uuid("created_by").references(() => adminUsers.id),
    reviewedBy: uuid("reviewed_by").references(() => adminUsers.id),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    unique("publishable_versions_id_entity_unique").on(table.id, table.entityId),
    index("publishable_versions_entity_idx").on(table.entityFamily, table.entityId),
    index("publishable_versions_lifecycle_idx").on(table.lifecycle),
  ],
);

export const publishedProjectionRecords = pgTable(
  "published_projection_records",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    projectionKey: text("projection_key").notNull(),
    locale: text("locale").notNull(),
    family: projectionFamilyPgEnum("family").notNull(),
    payload: jsonb("payload").$type<Record<string, unknown>>().notNull(),
    sourceVersionId: uuid("source_version_id").references(() => publishableVersions.id),
    sourceCheckpointScope: text("source_checkpoint_scope").notNull(),
    sourceCheckpointVersion: integer("source_checkpoint_version").notNull(),
    projectionPolicyVersion: text("projection_policy_version").notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("published_projection_records_key_locale_unique").on(
      table.projectionKey,
      table.locale,
    ),
    index("published_projection_records_family_idx").on(table.family),
  ],
);
