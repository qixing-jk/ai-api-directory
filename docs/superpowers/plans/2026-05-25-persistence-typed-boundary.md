# Persistence Typed Boundary Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first persistence and typed-boundary slice for AI API Directory using Supabase Postgres, Drizzle, and Zod without implementing admin UI, public business pages, seed jobs, or projection execution.

**Architecture:** Keep this slice server-only and contract-first. Drizzle schema and repositories stay behind `src/db/**` and `src/server/db/**`; Zod contracts live under `src/contracts/**`; public DTOs come from projection-backed mappers, not editing tables; pure `src/domain/**` continues to avoid DB and framework imports.

**Tech Stack:** TypeScript strict mode, Next.js 16 app repository conventions, Drizzle ORM, drizzle-kit, `postgres`, Zod, Vitest, existing `~/` path alias.

---

## Source Specs

Primary spec:

- `docs/superpowers/specs/2026-05-25-ai-api-directory-persistence-typed-boundary-design.md`

Supporting specs:

- `docs/superpowers/specs/2026-05-24-ai-api-directory-canonical-domain-model-design.md`
- `docs/superpowers/specs/2026-05-24-ai-api-directory-publishing-workflow-design.md`
- `docs/superpowers/specs/2026-05-24-web-runtime-shell-design.md`
- `docs/superpowers/specs/2026-05-23-ai-api-directory-design.md`

If the historical `2026-05-23` design conflicts with the newer specs, prefer the newer specs.

## Current Repository Context

The repository already has:

- `src/domain/**`: pure lifecycle, publishing, projection, privacy, and vocabulary policy modules.
- `src/i18n/locales.ts`: locale registry with `LocaleCode`, `AppLocale`, and public discovery helpers.
- `src/seo/**`: pure helper modules with colocated tests.
- `vitest.config.ts`: includes `src/**/*.test.ts` and `src/**/*.test.tsx`, uses `jsdom`, and configures the `~` alias.
- `eslint.config.mjs`: flat ESLint config using Next core web vitals and TypeScript rules.
- `package.json` scripts:
  - `pnpm lint`
  - `pnpm test:run`
  - `pnpm build`
  - `pnpm validate`
- `.env.example`: already reserves `DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY`.

Do not implement:

- Login/session/auth provider mechanics.
- Admin UI or review queue UI.
- tRPC routers.
- Seed import job execution.
- Projection rebuild runner execution.
- Crawlers, probes, source freshness jobs, or extension contribution.
- Public directory pages.

## File Structure

Create these files:

- `drizzle.config.ts`: Drizzle Kit configuration for the initial Postgres schema and migration output.
- `src/db/schema/*-enums.ts`: feature-local Postgres enum definitions for publishing, directory, evidence, and audit schema ownership.
- `src/db/schema/admin.ts`: admin actor, role, permission, and relationship tables.
- `src/db/schema/directory.ts`: site, endpoint, canonical model, model alias, and model route tables.
- `src/db/schema/evidence.ts`: verification evidence, price snapshot, capability signal, and risk signal tables.
- `src/db/schema/publishing.ts`: publishable version and published projection record tables.
- `src/db/schema/audit.ts`: append-only admin and system audit event table.
- `src/db/schema/index.ts`: schema barrel for Drizzle config and client.
- `src/db/client.ts`: server-only Postgres/Drizzle client factory.
- `src/contracts/shared/ids.ts`: shared ID and timestamp schemas.
- `src/contracts/shared/locale.ts`: locale Zod schema tied to `src/i18n/locales.ts`.
- `src/contracts/shared/pagination.ts`: small public/admin pagination query contract.
- `src/contracts/public/directory.ts`: public projection DTO and evidence summary output schemas.
- `src/contracts/admin/directory.ts`: admin review DTO schemas that remain sanitized.
- `src/contracts/admin/audit.ts`: audit event DTO schemas.
- `src/contracts/import/seed.ts`: candidate seed input schemas.
- `src/contracts/boundary.test.ts`: Zod boundary tests for public, admin, and import contracts.
- `src/server/db/mappers/public-projection.ts`: projection row to public DTO mapper.
- `src/server/db/mappers/admin-directory.ts`: admin row context to admin DTO mapper.
- `src/server/db/mappers/import-candidate.ts`: seed candidate input to canonical import candidate mapper.
- `src/server/db/mappers/boundary.test.ts`: mapper leakage and normalization tests.
- `src/server/db/repositories/projections.ts`: projection read repository skeleton.
- `src/server/db/repositories/evidence.ts`: append-only price and evidence repository skeleton.
- `src/server/db/repositories/audit.ts`: append-only audit repository skeleton.
- `src/server/db/repositories/repository-contract.test.ts`: repository-level contract tests using in-memory fakes, not a live database.
- `src/server/db/transactions.ts`: transaction helper type boundary.
- `src/server/db/import-boundaries.test.ts`: dependency boundary import tests.

Modify these files:

- `package.json`: add Drizzle/Zod/Postgres dependencies and migration/typecheck scripts.
- `pnpm-lock.yaml`: update through `pnpm install`.
- `.env.example`: clarify server-only database and Supabase variables.
- `eslint.config.mjs`: add `no-restricted-imports` boundary rules.

Generated files:

- `drizzle/0000_initial_persistence_boundary.sql`: generated by Drizzle Kit.
- `drizzle/meta/_journal.json`: generated by Drizzle Kit.
- `drizzle/meta/0000_snapshot.json`: generated by Drizzle Kit.

Do not hand-write generated Drizzle migration files. Generate them with the script added in Task 2.

## Task 1: Install Persistence Dependencies And Scripts

**Files:**

- Modify: `package.json`
- Modify: `pnpm-lock.yaml`
- Modify: `.env.example`

- [ ] **Step 1: Install dependencies**

Run:

```powershell
pnpm add drizzle-orm postgres zod
pnpm add -D drizzle-kit
```

Expected:

- Exit code `0`.
- `package.json` includes runtime dependencies `drizzle-orm`, `postgres`, and `zod`.
- `package.json` includes dev dependency `drizzle-kit`.
- `pnpm-lock.yaml` is updated.

- [ ] **Step 2: Add scripts**

Modify `package.json` scripts to include:

```json
{
  "db:generate": "drizzle-kit generate",
  "db:migrate": "drizzle-kit migrate",
  "typecheck": "tsc --noEmit",
  "validate": "pnpm lint && pnpm test:run && pnpm typecheck && pnpm build"
}
```

Keep the existing scripts unchanged unless the keys above already exist.

- [ ] **Step 3: Clarify environment variables**

Modify `.env.example` to this shape:

```dotenv
# Public site URL used by SEO helpers.
SITE_URL=
NEXT_PUBLIC_SITE_URL=

# Server-only Postgres connection used by Drizzle and drizzle-kit.
DATABASE_URL=

# Supabase project settings reserved for auth/RLS/admin work.
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

If `SITE_URL` or `NEXT_PUBLIC_SITE_URL` already exists, preserve the existing key and comment style while keeping the same meaning.

- [ ] **Step 4: Verify package metadata**

Run:

```powershell
pnpm test:run src/domain/vocabularies.test.ts
```

Expected:

- Exit code `0`.
- The existing domain vocabulary tests still pass after dependency changes.

- [ ] **Step 5: Commit dependency setup**

Run:

```powershell
git add package.json pnpm-lock.yaml .env.example
git commit -m "chore: add persistence boundary dependencies"
```

## Task 2: Drizzle Configuration And Schema Foundation

**Files:**

- Create: `drizzle.config.ts`
- Create: `src/db/schema/publishing-enums.ts`
- Create: `src/db/schema/directory-enums.ts`
- Create: `src/db/schema/evidence-enums.ts`
- Create: `src/db/schema/audit-enums.ts`
- Create: `src/db/schema/admin.ts`
- Create: `src/db/schema/directory.ts`
- Create: `src/db/schema/evidence.ts`
- Create: `src/db/schema/publishing.ts`
- Create: `src/db/schema/audit.ts`
- Create: `src/db/schema/index.ts`

- [ ] **Step 1: Create Drizzle config**

Create `drizzle.config.ts`:

```ts
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/db/schema/index.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "",
  },
  strict: true,
  verbose: true,
});
```

- [ ] **Step 2: Create feature-local enum schemas**

Create feature-local enum modules under `src/db/schema`. Keep enum definitions at
the smallest stable ownership boundary: publishing lifecycle/projection enums in
`publishing-enums.ts`, directory site/model-route enums in `directory-enums.ts`,
evidence and signal enums in `evidence-enums.ts`, and audit actor enums in
`audit-enums.ts`.

Ownership map:

- `publishing-enums.ts`: `lifecyclePgEnum`, `projectionFamilyPgEnum`
- `directory-enums.ts`: `siteCategoryPgEnum`, `siteTypePgEnum`, `endpointKindPgEnum`, `factLevelPgEnum`
- `evidence-enums.ts`: `evidenceLevelPgEnum`, `candidateDispositionPgEnum`, `signalDispositionPgEnum`
- `audit-enums.ts`: `actorTypePgEnum`

- [ ] **Step 3: Create admin schema**

Create `src/db/schema/admin.ts`:

```ts
import {
  boolean,
  index,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

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
    uniqueIndex("admin_users_email_unique").on(table.email),
    uniqueIndex("admin_users_external_auth_unique").on(
      table.externalAuthProvider,
      table.externalAuthId,
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
```

- [ ] **Step 4: Create directory schema**

Create `src/db/schema/directory.ts`:

```ts
import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import {
  endpointKindPgEnum,
  factLevelPgEnum,
  siteCategoryPgEnum,
  siteTypePgEnum,
} from "./directory-enums";
import { lifecyclePgEnum } from "./publishing-enums";

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
  (table) => [uniqueIndex("sites_slug_unique").on(table.slug)],
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
    endpointId: uuid("endpoint_id").references(() => siteEndpoints.id),
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
    uniqueIndex("model_routes_site_model_route_unique").on(
      table.siteId,
      table.canonicalModelId,
      table.routeModelId,
    ),
    index("model_routes_model_idx").on(table.canonicalModelId),
  ],
);
```

- [ ] **Step 5: Create evidence schema**

Create `src/db/schema/evidence.ts`:

```ts
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
import { sites } from "./directory";
import {
  candidateDispositionPgEnum,
  evidenceLevelPgEnum,
  signalDispositionPgEnum,
} from "./evidence-enums";

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
    modelRouteId: uuid("model_route_id").notNull(),
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
    reviewedBy: uuid("reviewed_by"),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
    withdrawnAt: timestamp("withdrawn_at", { withTimezone: true }),
    withdrawReason: text("withdraw_reason"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("risk_signals_site_idx").on(table.siteId)],
);
```

- [ ] **Step 6: Create publishing schema**

Create `src/db/schema/publishing.ts`:

```ts
import {
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { lifecyclePgEnum, projectionFamilyPgEnum } from "./publishing-enums";

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
    createdBy: uuid("created_by"),
    reviewedBy: uuid("reviewed_by"),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
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
    sourceVersionId: uuid("source_version_id"),
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
```

- [ ] **Step 7: Create audit schema**

Create `src/db/schema/audit.ts`:

```ts
import { index, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
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
    index("admin_audit_events_object_idx").on(table.objectFamily, table.objectId),
    index("admin_audit_events_command_idx").on(table.commandId),
    index("admin_audit_events_actor_idx").on(table.actorType, table.actorId),
  ],
);
```

- [ ] **Step 8: Create schema barrel**

Create `src/db/schema/index.ts`:

```ts
export * from "./admin";
export * from "./audit";
export * from "./audit-enums";
export * from "./directory";
export * from "./directory-enums";
export * from "./evidence-enums";
export * from "./evidence";
export * from "./publishing-enums";
export * from "./publishing";
```

- [ ] **Step 9: Run type-aware schema check**

Run:

```powershell
pnpm typecheck
```

Expected:

- Exit code `0`.
- If TypeScript reports missing dependencies, confirm Task 1 installed them before changing schema code.

- [ ] **Step 10: Commit schema foundation**

Run:

```powershell
git add drizzle.config.ts src/db/schema package.json pnpm-lock.yaml
git commit -m "feat(db): add persistence schema foundation"
```

## Task 3: Generate Initial Migration

**Files:**

- Create: `drizzle/0000_initial_persistence_boundary.sql`
- Create: `drizzle/meta/_journal.json`
- Create: `drizzle/meta/0000_snapshot.json`

- [ ] **Step 1: Generate migration**

Run:

```powershell
pnpm db:generate -- --name initial_persistence_boundary
```

Expected:

- Exit code `0`.
- Drizzle creates one SQL migration under `drizzle/`.
- Drizzle creates or updates `drizzle/meta/`.

- [ ] **Step 2: Inspect migration for intended table families**

Run:

```powershell
rg -n "CREATE TABLE|CREATE TYPE|published_projection_records|admin_audit_events|price_snapshots" drizzle
```

Expected:

- Output includes Postgres enum creation.
- Output includes `admin_users`, `sites`, `site_endpoints`, `canonical_models`, `model_routes`, `verification_evidence`, `price_snapshots`, `publishable_versions`, `published_projection_records`, and `admin_audit_events`.

- [ ] **Step 3: Commit generated migration**

Run:

```powershell
git add drizzle
git commit -m "feat(db): generate initial persistence migration"
```

## Task 4: Zod Contracts For Public, Admin, Import, And Shared Boundaries

**Files:**

- Create: `src/contracts/shared/ids.ts`
- Create: `src/contracts/shared/locale.ts`
- Create: `src/contracts/shared/pagination.ts`
- Create: `src/contracts/public/directory.ts`
- Create: `src/contracts/admin/directory.ts`
- Create: `src/contracts/admin/audit.ts`
- Create: `src/contracts/import/seed.ts`
- Create: `src/contracts/boundary.test.ts`

- [ ] **Step 1: Write failing contract tests**

Create `src/contracts/boundary.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { publicProjectionDtoSchema } from "./public/directory";
import { adminDirectoryReviewDtoSchema } from "./admin/directory";
import { seedSiteCandidateInputSchema } from "./import/seed";
import { paginationQuerySchema } from "./shared/pagination";

describe("typed boundary contracts", () => {
  it("rejects private fields in public projection DTO output", () => {
    const result = publicProjectionDtoSchema.safeParse({
      entityId: "site-1",
      versionId: "version-1",
      slug: "example-api",
      title: "Example API",
      summary: "Public summary",
      publicUrl: "https://example.com",
      evidence: [],
      updatedAt: "2026-05-24T00:00:00.000Z",
      adminNotes: "internal",
    });

    expect(result.success).toBe(false);
  });

  it("keeps admin DTOs sanitized even though they include review context", () => {
    const result = adminDirectoryReviewDtoSchema.safeParse({
      entityId: "site-1",
      versionId: "version-1",
      lifecycle: "pending_review",
      title: "Example API",
      reviewSummary: "Needs source review",
      evidenceCount: 2,
      updatedAt: "2026-05-24T00:00:00.000Z",
      requestBody: "private prompt",
    });

    expect(result.success).toBe(false);
  });

  it("accepts seed candidate input as non-public import data", () => {
    expect(
      seedSiteCandidateInputSchema.parse({
        slug: "example-api",
        displayName: "Example API",
        homepageUrl: "https://example.com",
        sourceDescription: "manual seed",
        observedAt: "2026-05-24T00:00:00.000Z",
      }),
    ).toMatchObject({
      slug: "example-api",
      displayName: "Example API",
    });
  });

  it("normalizes pagination query defaults", () => {
    expect(paginationQuerySchema.parse({})).toEqual({
      page: 1,
      pageSize: 20,
    });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run:

```powershell
pnpm test:run src/contracts/boundary.test.ts
```

Expected:

- Exit code non-zero.
- Failure mentions missing `src/contracts/...` modules.

- [ ] **Step 3: Create shared ID and timestamp schemas**

Create `src/contracts/shared/ids.ts`:

```ts
import { z } from "zod";

export const entityIdSchema = z.string().min(1);
export const versionIdSchema = z.string().min(1);
export const slugSchema = z
  .string()
  .min(1)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
export const isoDateTimeSchema = z.string().datetime({ offset: true });
```

- [ ] **Step 4: Create locale schema**

Create `src/contracts/shared/locale.ts`:

```ts
import { z } from "zod";
import { locales, type LocaleCode } from "~/i18n/locales";

const localeCodes = locales.map((locale) => locale.urlCode) as [
  LocaleCode,
  ...LocaleCode[],
];

export const localeCodeSchema = z.enum(localeCodes);
```

- [ ] **Step 5: Create pagination schema**

Create `src/contracts/shared/pagination.ts`:

```ts
import { z } from "zod";

export const paginationQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20),
  })
  .strict();

export type PaginationQuery = z.infer<typeof paginationQuerySchema>;
```

- [ ] **Step 6: Create public directory DTO schemas**

Create `src/contracts/public/directory.ts`:

```ts
import { z } from "zod";
import { evidenceLevels } from "~/domain/vocabularies";
import { entityIdSchema, isoDateTimeSchema, slugSchema, versionIdSchema } from "../shared/ids";

const evidenceLevelValues = evidenceLevels as [string, ...string[]];

export const publicEvidenceSummaryDtoSchema = z
  .object({
    level: z.enum(evidenceLevelValues),
    observedAt: isoDateTimeSchema,
    publicSourceUrl: z.string().url().optional(),
  })
  .strict();

export const publicProjectionDtoSchema = z
  .object({
    entityId: entityIdSchema,
    versionId: versionIdSchema,
    slug: slugSchema,
    title: z.string().min(1),
    summary: z.string().min(1),
    publicUrl: z.string().url(),
    evidence: z.array(publicEvidenceSummaryDtoSchema),
    updatedAt: isoDateTimeSchema,
  })
  .strict();

export type PublicEvidenceSummaryDto = z.infer<typeof publicEvidenceSummaryDtoSchema>;
export type PublicProjectionDto = z.infer<typeof publicProjectionDtoSchema>;
```

- [ ] **Step 7: Create admin DTO schemas**

Create `src/contracts/admin/directory.ts`:

```ts
import { z } from "zod";
import { publishableLifecycles } from "~/domain/vocabularies";
import { entityIdSchema, isoDateTimeSchema, versionIdSchema } from "../shared/ids";

const lifecycleValues = publishableLifecycles as [string, ...string[]];

export const adminDirectoryReviewDtoSchema = z
  .object({
    entityId: entityIdSchema,
    versionId: versionIdSchema,
    lifecycle: z.enum(lifecycleValues),
    title: z.string().min(1),
    reviewSummary: z.string().min(1),
    evidenceCount: z.number().int().min(0),
    updatedAt: isoDateTimeSchema,
  })
  .strict();

export type AdminDirectoryReviewDto = z.infer<typeof adminDirectoryReviewDtoSchema>;
```

- [ ] **Step 8: Create audit DTO schemas**

Create `src/contracts/admin/audit.ts`:

```ts
import { z } from "zod";
import { isoDateTimeSchema } from "../shared/ids";

export const auditActorDtoSchema = z
  .object({
    type: z.enum(["admin", "system"]),
    id: z.string().min(1).optional(),
  })
  .strict();

export const adminAuditEventDtoSchema = z
  .object({
    id: z.string().min(1),
    actor: auditActorDtoSchema,
    commandId: z.string().min(1),
    objectFamily: z.string().min(1),
    objectId: z.string().min(1),
    action: z.string().min(1),
    createdAt: isoDateTimeSchema,
  })
  .strict();

export type AdminAuditEventDto = z.infer<typeof adminAuditEventDtoSchema>;
```

- [ ] **Step 9: Create seed import schemas**

Create `src/contracts/import/seed.ts`:

```ts
import { z } from "zod";
import { isoDateTimeSchema, slugSchema } from "../shared/ids";

export const seedSiteCandidateInputSchema = z
  .object({
    slug: slugSchema,
    displayName: z.string().min(1),
    homepageUrl: z.string().url(),
    sourceDescription: z.string().min(1),
    observedAt: isoDateTimeSchema,
  })
  .strict();

export type SeedSiteCandidateInput = z.infer<typeof seedSiteCandidateInputSchema>;
```

- [ ] **Step 10: Run contract tests**

Run:

```powershell
pnpm test:run src/contracts/boundary.test.ts
```

Expected:

- Exit code `0`.
- All four contract tests pass.

- [ ] **Step 11: Commit contracts**

Run:

```powershell
git add src/contracts
git commit -m "feat(contracts): add typed persistence boundaries"
```

## Task 5: Server-Only Database Client And Mapper Boundaries

**Files:**

- Create: `src/db/client.ts`
- Create: `src/server/db/mappers/public-projection.ts`
- Create: `src/server/db/mappers/admin-directory.ts`
- Create: `src/server/db/mappers/import-candidate.ts`
- Create: `src/server/db/mappers/boundary.test.ts`

- [ ] **Step 1: Write failing mapper boundary tests**

Create `src/server/db/mappers/boundary.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { mapProjectionRecordToPublicDto } from "./public-projection";
import { mapAdminDirectoryReviewToDto } from "./admin-directory";
import { mapSeedSiteCandidateToCandidateInput } from "./import-candidate";

describe("server DB mappers", () => {
  it("validates projection payloads before returning public DTOs", () => {
    expect(() =>
      mapProjectionRecordToPublicDto({
        projectionKey: "site/example-api",
        locale: "zh-cn",
        payload: {
          entityId: "site-1",
          versionId: "version-1",
          slug: "example-api",
          title: "Example API",
          summary: "Public summary",
          publicUrl: "https://example.com",
          evidence: [],
          updatedAt: "2026-05-24T00:00:00.000Z",
          adminNotes: "internal",
        },
      }),
    ).toThrow();
  });

  it("maps sanitized admin review context to admin DTOs", () => {
    expect(
      mapAdminDirectoryReviewToDto({
        entityId: "site-1",
        versionId: "version-1",
        lifecycle: "pending_review",
        title: "Example API",
        reviewSummary: "Needs source review",
        evidenceCount: 2,
        updatedAt: "2026-05-24T00:00:00.000Z",
        rawEvidence: { requestBody: "private" },
      }),
    ).toEqual({
      entityId: "site-1",
      versionId: "version-1",
      lifecycle: "pending_review",
      title: "Example API",
      reviewSummary: "Needs source review",
      evidenceCount: 2,
      updatedAt: "2026-05-24T00:00:00.000Z",
    });
  });

  it("maps seed candidate input without producing a public DTO", () => {
    expect(
      mapSeedSiteCandidateToCandidateInput({
        slug: "example-api",
        displayName: "Example API",
        homepageUrl: "https://example.com",
        sourceDescription: "manual seed",
        observedAt: "2026-05-24T00:00:00.000Z",
      }),
    ).toEqual({
      disposition: "candidate",
      slug: "example-api",
      displayName: "Example API",
      homepageUrl: "https://example.com",
      sourceDescription: "manual seed",
      observedAt: "2026-05-24T00:00:00.000Z",
    });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run:

```powershell
pnpm test:run src/server/db/mappers/boundary.test.ts
```

Expected:

- Exit code non-zero.
- Failure mentions missing mapper modules.

- [ ] **Step 3: Create server-only DB client**

Create `src/db/client.ts`:

```ts
import "server-only";

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

export type DatabaseClient = ReturnType<typeof createDatabaseClient>;

export function createDatabaseClient(databaseUrl = process.env.DATABASE_URL) {
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required to create the database client");
  }

  const queryClient = postgres(databaseUrl, { prepare: false });
  return drizzle(queryClient, { schema });
}
```

- [ ] **Step 4: Create public projection mapper**

Create `src/server/db/mappers/public-projection.ts`:

```ts
import {
  publicProjectionDtoSchema,
  type PublicProjectionDto,
} from "~/contracts/public/directory";

export type ProjectionRecordRow = {
  readonly projectionKey: string;
  readonly locale: string;
  readonly payload: unknown;
};

export function mapProjectionRecordToPublicDto(
  row: ProjectionRecordRow,
): PublicProjectionDto {
  return publicProjectionDtoSchema.parse(row.payload);
}
```

- [ ] **Step 5: Create admin directory mapper**

Create `src/server/db/mappers/admin-directory.ts`:

```ts
import {
  adminDirectoryReviewDtoSchema,
  type AdminDirectoryReviewDto,
} from "~/contracts/admin/directory";

export type AdminDirectoryReviewRow = {
  readonly entityId: string;
  readonly versionId: string;
  readonly lifecycle: string;
  readonly title: string;
  readonly reviewSummary: string;
  readonly evidenceCount: number;
  readonly updatedAt: string;
  readonly rawEvidence?: unknown;
  readonly privateReviewContext?: unknown;
};

export function mapAdminDirectoryReviewToDto(
  row: AdminDirectoryReviewRow,
): AdminDirectoryReviewDto {
  return adminDirectoryReviewDtoSchema.parse({
    entityId: row.entityId,
    versionId: row.versionId,
    lifecycle: row.lifecycle,
    title: row.title,
    reviewSummary: row.reviewSummary,
    evidenceCount: row.evidenceCount,
    updatedAt: row.updatedAt,
  });
}
```

- [ ] **Step 6: Create import candidate mapper**

Create `src/server/db/mappers/import-candidate.ts`:

```ts
import {
  seedSiteCandidateInputSchema,
  type SeedSiteCandidateInput,
} from "~/contracts/import/seed";

export type SiteCandidateInput = SeedSiteCandidateInput & {
  readonly disposition: "candidate";
};

export function mapSeedSiteCandidateToCandidateInput(
  input: SeedSiteCandidateInput,
): SiteCandidateInput {
  const parsed = seedSiteCandidateInputSchema.parse(input);
  return {
    disposition: "candidate",
    ...parsed,
  };
}
```

- [ ] **Step 7: Run mapper tests**

Run:

```powershell
pnpm test:run src/server/db/mappers/boundary.test.ts
```

Expected:

- Exit code `0`.
- All mapper boundary tests pass.

- [ ] **Step 8: Run typecheck**

Run:

```powershell
pnpm typecheck
```

Expected:

- Exit code `0`.

- [ ] **Step 9: Commit DB client and mappers**

Run:

```powershell
git add src/db/client.ts src/server/db/mappers
git commit -m "feat(db): add server mappers for typed boundaries"
```

## Task 6: Repository Skeletons And Append-Only Contracts

**Files:**

- Create: `src/server/db/repositories/projections.ts`
- Create: `src/server/db/repositories/evidence.ts`
- Create: `src/server/db/repositories/audit.ts`
- Create: `src/server/db/repositories/repository-contract.test.ts`
- Create: `src/server/db/transactions.ts`

- [ ] **Step 1: Write repository contract tests**

Create `src/server/db/repositories/repository-contract.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { createAuditEventAppender } from "./audit";
import { createEvidenceAppender } from "./evidence";
import { createProjectionReader } from "./projections";

describe("repository contracts", () => {
  it("projection readers validate public DTO output", async () => {
    const reader = createProjectionReader({
      async listProjectionRows() {
        return [
          {
            projectionKey: "site/example-api",
            locale: "zh-cn",
            payload: {
              entityId: "site-1",
              versionId: "version-1",
              slug: "example-api",
              title: "Example API",
              summary: "Public summary",
              publicUrl: "https://example.com",
              evidence: [],
              updatedAt: "2026-05-24T00:00:00.000Z",
            },
          },
        ];
      },
    });

    await expect(reader.listPublicProjections()).resolves.toEqual([
      {
        entityId: "site-1",
        versionId: "version-1",
        slug: "example-api",
        title: "Example API",
        summary: "Public summary",
        publicUrl: "https://example.com",
        evidence: [],
        updatedAt: "2026-05-24T00:00:00.000Z",
      },
    ]);
  });

  it("evidence appender exposes append-only operations", async () => {
    const writes: unknown[] = [];
    const appender = createEvidenceAppender({
      async appendPriceSnapshot(input) {
        writes.push(input);
        return { id: "price-1" };
      },
    });

    await expect(
      appender.appendPriceSnapshot({
        modelRouteId: "route-1",
        currency: "USD",
        billingUnit: "per_1m_tokens",
        observedAt: "2026-05-24T00:00:00.000Z",
      }),
    ).resolves.toEqual({ id: "price-1" });
    expect(writes).toHaveLength(1);
  });

  it("audit appender requires actor and command context", async () => {
    const writes: unknown[] = [];
    const appender = createAuditEventAppender({
      async appendAuditEvent(input) {
        writes.push(input);
        return { id: "audit-1" };
      },
    });

    await expect(
      appender.appendAuditEvent({
        actor: { type: "system" },
        commandId: "cmd-1",
        objectFamily: "site",
        objectId: "site-1",
        action: "seed.imported",
      }),
    ).resolves.toEqual({ id: "audit-1" });
    expect(writes).toHaveLength(1);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run:

```powershell
pnpm test:run src/server/db/repositories/repository-contract.test.ts
```

Expected:

- Exit code non-zero.
- Failure mentions missing repository modules.

- [ ] **Step 3: Create projection repository skeleton**

Create `src/server/db/repositories/projections.ts`:

```ts
import {
  mapProjectionRecordToPublicDto,
  type ProjectionRecordRow,
} from "../mappers/public-projection";

export type ProjectionRowSource = {
  readonly listProjectionRows: () => Promise<readonly ProjectionRecordRow[]>;
};

export function createProjectionReader(source: ProjectionRowSource) {
  return {
    async listPublicProjections() {
      const rows = await source.listProjectionRows();
      return rows.map(mapProjectionRecordToPublicDto);
    },
  };
}
```

- [ ] **Step 4: Create evidence repository skeleton**

Create `src/server/db/repositories/evidence.ts`:

```ts
export type AppendPriceSnapshotInput = {
  readonly modelRouteId: string;
  readonly currency: string;
  readonly billingUnit: string;
  readonly observedAt: string;
};

export type EvidenceWriteSource = {
  readonly appendPriceSnapshot: (
    input: AppendPriceSnapshotInput,
  ) => Promise<{ readonly id: string }>;
};

export function createEvidenceAppender(source: EvidenceWriteSource) {
  return {
    appendPriceSnapshot(input: AppendPriceSnapshotInput) {
      return source.appendPriceSnapshot(input);
    },
  };
}
```

- [ ] **Step 5: Create audit repository skeleton**

Create `src/server/db/repositories/audit.ts`:

```ts
export type AuditActorInput =
  | { readonly type: "system" }
  | { readonly type: "admin"; readonly id: string };

export type AppendAuditEventInput = {
  readonly actor: AuditActorInput;
  readonly commandId: string;
  readonly objectFamily: string;
  readonly objectId: string;
  readonly action: string;
};

export type AuditWriteSource = {
  readonly appendAuditEvent: (
    input: AppendAuditEventInput,
  ) => Promise<{ readonly id: string }>;
};

export function createAuditEventAppender(source: AuditWriteSource) {
  return {
    appendAuditEvent(input: AppendAuditEventInput) {
      return source.appendAuditEvent(input);
    },
  };
}
```

- [ ] **Step 6: Create transaction boundary**

Create `src/server/db/transactions.ts`:

```ts
export type TransactionContext<TClient> = {
  readonly db: TClient;
};

export type TransactionRunner<TClient> = <TResult>(
  operation: (context: TransactionContext<TClient>) => Promise<TResult>,
) => Promise<TResult>;
```

- [ ] **Step 7: Run repository contract tests**

Run:

```powershell
pnpm test:run src/server/db/repositories/repository-contract.test.ts
```

Expected:

- Exit code `0`.
- All repository contract tests pass.

- [ ] **Step 8: Commit repository skeletons**

Run:

```powershell
git add src/server/db/repositories src/server/db/transactions.ts
git commit -m "feat(db): add repository boundary skeletons"
```

## Task 7: Enforce Import Boundaries

**Files:**

- Modify: `eslint.config.mjs`
- Create: `src/server/db/import-boundaries.test.ts`

- [ ] **Step 1: Add import boundary test**

Create `src/server/db/import-boundaries.test.ts`:

```ts
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

const repoRoot = process.cwd();

function listSourceFiles(dir: string): string[] {
  const absoluteDir = join(repoRoot, dir);
  const entries = readdirSync(absoluteDir);

  return entries.flatMap((entry) => {
    const absolutePath = join(absoluteDir, entry);
    const stat = statSync(absolutePath);

    if (stat.isDirectory()) {
      return listSourceFiles(relative(repoRoot, absolutePath));
    }

    if (!entry.endsWith(".ts") && !entry.endsWith(".tsx")) {
      return [];
    }

    return [absolutePath];
  });
}

function readImportLines(filePath: string): string[] {
  return readFileSync(filePath, "utf8")
    .split(/\r?\n/)
    .filter((line) => line.startsWith("import "));
}

describe("persistence import boundaries", () => {
  it("keeps components away from DB and repository modules", () => {
    const violations = listSourceFiles("src/components").flatMap((filePath) =>
      readImportLines(filePath)
        .filter((line) => line.includes("~/db") || line.includes("~/server/db"))
        .map((line) => `${relative(repoRoot, filePath)}: ${line}`),
    );

    expect(violations).toEqual([]);
  });

  it("keeps pure domain policy away from DB, server, and framework modules", () => {
    const violations = listSourceFiles("src/domain").flatMap((filePath) =>
      readImportLines(filePath)
        .filter(
          (line) =>
            line.includes("~/db") ||
            line.includes("~/server") ||
            line.includes("drizzle-orm") ||
            line.includes("postgres") ||
            line.includes("next/") ||
            line.includes("react"),
        )
        .map((line) => `${relative(repoRoot, filePath)}: ${line}`),
    );

    expect(violations).toEqual([]);
  });
});
```

- [ ] **Step 2: Run import boundary test**

Run:

```powershell
pnpm test:run src/server/db/import-boundaries.test.ts
```

Expected:

- Exit code `0`.

- [ ] **Step 3: Add ESLint restricted imports**

Modify `eslint.config.mjs` by adding this config object before the closing `]);`:

```js
  {
    files: ["src/components/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: ["~/db/*", "~/server/db/*"],
        },
      ],
    },
  },
  {
    files: ["src/domain/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            "~/db/*",
            "~/server/*",
            "drizzle-orm",
            "drizzle-orm/*",
            "postgres",
            "next/*",
            "react",
          ],
        },
      ],
    },
  },
```

The final file should still export `defineConfig([...])`.

- [ ] **Step 4: Run lint**

Run:

```powershell
pnpm lint
```

Expected:

- Exit code `0`.

- [ ] **Step 5: Commit boundary enforcement**

Run:

```powershell
git add eslint.config.mjs src/server/db/import-boundaries.test.ts
git commit -m "test(db): enforce persistence import boundaries"
```

## Task 8: Final Validation And Database Migration Smoke Gate

**Files:**

- Modify only files needed to fix validation failures discovered in this task.

- [ ] **Step 1: Run full local validation**

Run:

```powershell
pnpm validate
```

Expected:

- Exit code `0`.
- Lint, Vitest, typecheck, and Next build all complete.

- [ ] **Step 2: Run Drizzle migration generation check**

Run:

```powershell
pnpm db:generate -- --name validation_noop
```

Expected:

- If no schema changed since Task 3, Drizzle should report no schema changes or generate no meaningful SQL migration.
- If Drizzle generates a new migration, inspect it. If it reflects a real missed schema change, keep it and commit it. If it is accidental churn, fix the schema/config and remove only the generated validation migration files created in this step.

- [ ] **Step 3: Optional database migration smoke test**

Run this only when a disposable local or development `DATABASE_URL` is available:

```powershell
pnpm db:migrate
```

Expected:

- Exit code `0`.
- Initial migration applies to the empty database.

If `DATABASE_URL` is unavailable, do not fake success. Record that the migration application smoke test was skipped because no database connection was available.

- [ ] **Step 4: Inspect final diff**

Run:

```powershell
git status --short
git diff --check
git diff --stat HEAD
```

Expected:

- Only task-scoped persistence boundary files are changed.
- `git diff --check` exits `0`.

- [ ] **Step 5: Commit any final validation fixes**

If Step 1 or Step 2 required fixes, commit only the files changed by those
fixes. First inspect the exact changed paths:

```powershell
git status --short
```

Then stage only the changed persistence-boundary files from this plan. For
example, if the final fixes touched only contracts and schema files, run:

```powershell
git add src/contracts src/db/schema drizzle.config.ts drizzle
git commit -m "chore(db): validate persistence boundary"
```

If there were no final fixes, do not create an empty commit.

## Completion Criteria

This plan is complete when:

- Drizzle/Zod/Postgres dependencies and scripts are installed.
- Initial schema table families exist under `src/db/schema/**`.
- Initial Drizzle migration is generated and committed.
- Public, admin, import, and shared Zod contracts exist and have focused tests.
- Server-only DB client exists.
- Mapper tests prove public DTOs reject private fields and admin DTOs stay sanitized.
- Repository skeleton tests prove projection reads validate DTOs and audit/evidence writes are append-only shaped.
- Import boundary tests and ESLint rules prevent UI/domain layers from depending on DB/server persistence modules.
- `pnpm validate` passes.
- `pnpm db:migrate` is run against a disposable database, or the lack of `DATABASE_URL` is reported as an environment blocker for only that smoke gate.
