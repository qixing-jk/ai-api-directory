import {
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { adminUsers } from "./admin";
import { modelRoutes, sites } from "./directory";
import {
  candidateDispositionPgEnum,
  evidenceLevelPgEnum,
  signalDispositionPgEnum,
} from "./enums";

export const verificationEvidence = pgTable(
  "verification_evidence",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    targetType: text("target_type").notNull(),
    targetId: uuid("target_id").notNull(),
    sourceType: text("source_type").notNull(),
    publicSourceUrl: text("public_source_url"),
    evidenceLevel: evidenceLevelPgEnum("evidence_level").notNull(),
    disposition: candidateDispositionPgEnum("disposition").notNull().default("candidate"),
    publicSummary: text("public_summary"),
    privateReviewContext: jsonb("private_review_context")
      .$type<Record<string, unknown>>()
      .notNull()
      .default({}),
    observedAt: timestamp("observed_at", { withTimezone: true }).notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    withdrawnAt: timestamp("withdrawn_at", { withTimezone: true }),
    withdrawReason: text("withdraw_reason"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("verification_evidence_target_idx").on(table.targetType, table.targetId),
    index("verification_evidence_disposition_idx").on(table.disposition),
  ],
);

export const priceSnapshots = pgTable(
  "price_snapshots",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    modelRouteId: uuid("model_route_id")
      .notNull()
      .references(() => modelRoutes.id),
    currency: text("currency").notNull(),
    billingUnit: text("billing_unit").notNull(),
    inputPer1M: numeric("input_per_1m", { precision: 18, scale: 8 }),
    outputPer1M: numeric("output_per_1m", { precision: 18, scale: 8 }),
    cacheReadPer1M: numeric("cache_read_per_1m", { precision: 18, scale: 8 }),
    cacheWritePer1M: numeric("cache_write_per_1m", { precision: 18, scale: 8 }),
    minimumRecharge: numeric("minimum_recharge", { precision: 18, scale: 8 }),
    sourceEvidenceId: uuid("source_evidence_id").references(() => verificationEvidence.id),
    confidence: integer("confidence").notNull().default(0),
    observedAt: timestamp("observed_at", { withTimezone: true }).notNull(),
    effectiveAt: timestamp("effective_at", { withTimezone: true }),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("price_snapshots_route_observed_idx").on(table.modelRouteId, table.observedAt),
  ],
);

export const siteCapabilitySignals = pgTable(
  "site_capability_signals",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    siteId: uuid("site_id").notNull().references(() => sites.id),
    capability: text("capability").notNull(),
    disposition: signalDispositionPgEnum("disposition").notNull().default("active"),
    sourceCount: integer("source_count").notNull().default(1),
    confidence: integer("confidence").notNull().default(0),
    lastObservedAt: timestamp("last_observed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("site_capability_signals_site_idx").on(table.siteId)],
);

export const riskSignals = pgTable(
  "risk_signals",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    siteId: uuid("site_id").notNull().references(() => sites.id),
    riskType: text("risk_type").notNull(),
    severity: text("severity").notNull().default("info"),
    disposition: signalDispositionPgEnum("disposition").notNull().default("active"),
    sourceEvidenceId: uuid("source_evidence_id").references(() => verificationEvidence.id),
    reviewedBy: uuid("reviewed_by").references(() => adminUsers.id),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
    withdrawnAt: timestamp("withdrawn_at", { withTimezone: true }),
    withdrawReason: text("withdraw_reason"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("risk_signals_site_idx").on(table.siteId)],
);
