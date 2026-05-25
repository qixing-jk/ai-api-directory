import {
  boolean,
  check,
  index,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const adminUsers = pgTable(
  "admin_users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    externalAuthProvider: text("external_auth_provider"),
    externalAuthId: text("external_auth_id"),
    email: text("email").notNull(),
    displayName: text("display_name").notNull(),
    active: boolean("active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("admin_users_email_unique").on(sql`lower(${table.email})`),
    uniqueIndex("admin_users_external_auth_unique").on(
      table.externalAuthProvider,
      table.externalAuthId,
    ).where(
      sql`${table.externalAuthProvider} is not null and ${table.externalAuthId} is not null`,
    ),
    check(
      "admin_users_external_auth_pair_check",
      sql`(${table.externalAuthProvider} is null and ${table.externalAuthId} is null) or (${table.externalAuthProvider} is not null and ${table.externalAuthId} is not null)`,
    ),
  ],
);

export const adminRoles = pgTable("admin_roles", {
  id: uuid("id").primaryKey().defaultRandom(),
  key: text("key").notNull().unique(),
  label: text("label").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const adminPermissions = pgTable("admin_permissions", {
  id: uuid("id").primaryKey().defaultRandom(),
  key: text("key").notNull().unique(),
  label: text("label").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const adminUserRoles = pgTable(
  "admin_user_roles",
  {
    userId: uuid("user_id").notNull().references(() => adminUsers.id),
    roleId: uuid("role_id").notNull().references(() => adminRoles.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.roleId] }),
    index("admin_user_roles_role_idx").on(table.roleId),
  ],
);

export const adminRolePermissions = pgTable(
  "admin_role_permissions",
  {
    roleId: uuid("role_id").notNull().references(() => adminRoles.id),
    permissionId: uuid("permission_id").notNull().references(() => adminPermissions.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.roleId, table.permissionId] }),
    index("admin_role_permissions_permission_idx").on(table.permissionId),
  ],
);
