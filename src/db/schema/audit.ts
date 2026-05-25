import { sql } from "drizzle-orm";
import { check, index, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { adminUsers } from "./admin";
import { actorTypePgEnum } from "./audit-enums";

export const adminAuditEvents = pgTable(
  "admin_audit_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    actorType: actorTypePgEnum("actor_type").notNull(),
    actorId: uuid("actor_id").references(() => adminUsers.id),
    commandId: text("command_id").notNull(),
    objectFamily: text("object_family").notNull(),
    objectId: text("object_id").notNull(),
    action: text("action").notNull(),
    previousState: jsonb("previous_state").$type<Record<string, unknown>>(),
    nextState: jsonb("next_state").$type<Record<string, unknown>>(),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    check(
      "admin_audit_events_actor_consistency_check",
      sql`(${table.actorType} = 'admin' and ${table.actorId} is not null) or (${table.actorType} = 'system' and ${table.actorId} is null)`,
    ),
    index("admin_audit_events_object_idx").on(table.objectFamily, table.objectId),
    index("admin_audit_events_command_idx").on(table.commandId),
    index("admin_audit_events_actor_idx").on(table.actorType, table.actorId),
  ],
);
