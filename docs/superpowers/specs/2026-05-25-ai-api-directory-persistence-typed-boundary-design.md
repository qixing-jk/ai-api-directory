# AI API Directory Persistence And Typed Boundary Design

## Purpose

Define the persistence and typed data boundary for AI API Directory after the
runtime shell, canonical domain vocabulary, and publishing policy kernel are
in place. This spec turns the large V1 product design into a concrete storage
and contract slice without pulling admin UI, public business pages, seed jobs,
or projection execution into the same implementation plan.

The goal is a thin but hard boundary:

- Thin enough to avoid heavy enterprise layering before the product exists.
- Hard enough that draft, candidate, private, admin-only, and raw evidence
  data cannot accidentally reach public pages, public APIs, sitemap records,
  hreflang records, or SEO metadata.

## Scope

This spec covers:

- Database platform and ORM choice.
- Persistent table family boundaries.
- Minimal admin actor and RBAC persistence needed by later audit and workflow
  specs.
- DB row, domain input, public DTO, admin DTO, import candidate, and
  projection record separation.
- Zod usage at real input and output boundaries.
- Repository and mapper ownership rules.
- Migration and local development expectations.
- Cross-layer dependency direction.
- Validation expectations for implementation.

This spec does not cover:

- Login, session, or auth provider mechanics.
- Admin UI, review queue UI, or public page UI.
- tRPC router implementation.
- Seed import job implementation.
- Projection rebuild runner implementation.
- Crawlers, probes, extension contribution, or source freshness jobs.
- Production deployment operations, backups, or observability pipelines.
- Full field-level schemas for every future admin mutation or public query.

## Prerequisites

This spec depends on:

- `2026-05-24-web-runtime-shell-design.md`
- `2026-05-24-ai-api-directory-canonical-domain-model-design.md`
- `2026-05-24-ai-api-directory-publishing-workflow-design.md`

The runtime shell owns route, locale, theme, sitemap, robots, and SEO helper
contracts. The canonical domain spec owns vocabulary and public/private object
family boundaries. The publishing workflow spec owns lifecycle, publication,
rollback, and projection policy. This spec must not redefine those layers.

## Durable Decisions

### Use Supabase Postgres With Drizzle And Zod

The default persistence stack is:

- Supabase-managed Postgres.
- Drizzle ORM and drizzle-kit for TypeScript schema and SQL migrations.
- Zod for real input and output boundaries.

Supabase is used as the Postgres, auth, and RLS platform. Drizzle is the
server-side database access layer for application data. Public and admin code
must not treat Supabase table payloads or Drizzle inferred row types as
public, admin, or domain objects.

This choice favors explicit SQL-shaped persistence and clear DTO mapping over
generated model convenience. Prisma remains an acceptable future fallback only
if the team chooses ecosystem familiarity over stricter SQL and projection
boundary control. If Prisma is adopted later, this spec's row, repository,
mapper, and DTO boundaries still apply.

### Keep Boundaries Thin But Hard

The product does not need heavy domain-driven architecture or a generic CRUD
framework for this slice. It does need public/private/published isolation as a
product safety requirement.

Hard boundaries:

- DB rows do not cross into UI components or public contracts.
- Public DTOs and admin DTOs are separate named shapes.
- Raw evidence, private source metadata, admin notes, candidate data, and
  internal review context do not enter public DTOs.
- Public readers use published projection records or projection-backed DTOs,
  not editing tables.
- `src/components/**` and route shell code do not import DB clients, Drizzle
  schema, repositories, or persistence modules.
- `src/domain/**` stays pure and does not import DB, Drizzle, Supabase,
  request context, repositories, or framework objects.

Thin boundaries:

- Use focused repository functions rather than generic services.
- Add mappers only where data crosses a layer boundary.
- Use Zod at API, import, query, and output boundaries, not around every
  internal pure helper.
- Define table families and stable contracts first, then add fields as later
  specs need them.

### Persistent Table Families

The first persistence implementation should define table families rather than
trying to fully model every later workflow at once.

#### Admin Actor And RBAC

This family stores enough identity and authorization context for later audit
and admin workflow specs:

- Admin users or admin identities.
- Roles.
- Permissions.
- Role and permission assignments.
- Optional external auth provider identifiers.

This spec does not implement login, sessions, permission UI, or auth provider
flows. It only ensures later audit events, publishing commands, and admin
mutations can reference a stable actor and authorization model.

#### Canonical Directory Data

This family stores stable directory entities:

- Sites.
- Site endpoints.
- Canonical models.
- Model aliases.
- Model routes.

These tables are source-of-truth editing and domain tables. Public pages do
not read them directly.

#### Evidence And Observations

This family stores reviewed or reviewable factual support:

- Verification evidence.
- Price snapshots.
- Site capability signals.
- Risk signals.

Price snapshots are append-only. Evidence and risk data may include
admin-facing review context, but public output exposes only whitelisted public
evidence summaries. Full request bodies, response bodies, credentials,
private URLs, user-specific data, token-like values, exact account balances,
and arbitrary logs are rejected before storage or confined to later private
evidence storage that public mappers cannot access.

#### Publishable Versions

This family stores versioned public content and domain publication state. It
may use entity-specific version tables or a shared content-version table when
that is clearer in implementation.

The persistence layer must support:

- Draft and reviewable versions.
- Approved versions that are not yet public.
- Published versions.
- Withdrawn, archived, rejected, and disputed states.
- Locale-scoped public editorial versions.
- Stable entity identities with active published version pointers.

This spec defines storage boundaries only. It does not implement review or
publication commands.

#### Published Projection

This family stores public read models generated from published source state.
It may start as a general projection record table and split by page family
later if performance or query shape requires it.

Projection records are the only default source for:

- Public pages.
- Public APIs.
- Sitemap output.
- Hreflang output.
- Public metadata.

Projection records must be rebuildable from source tables, published versions,
and current projection policy. They are not edited directly by admins.

#### Audit Log

This family stores append-only admin and system audit events.

Audit events must be able to reference:

- Actor or system initiator.
- Object family and object id.
- Previous and next lifecycle state when relevant.
- Previous and next published version when relevant.
- Command id or idempotency key.
- Projection checkpoint, batch, or policy version when relevant.
- Validation failure summary when relevant.

Audit events are admin-facing records. They are not public DTOs.

### Separate Data Shapes By Boundary

Implementation must use separate names for separate shapes:

- `*Row`: database row shape. This is local to DB and repository layers.
- `*DomainInput`: input passed to pure domain policy functions.
- `*PublicDto`: public-safe output returned to public pages or public APIs.
- `*AdminDto`: admin-safe output returned to admin surfaces.
- `*CandidateInput`: import, seed, crawler, probe, or future contribution
  candidate input before review.
- `*ProjectionRecord`: stored public projection record shape.
- `*QueryInput`: validated public or admin query input.
- `*MutationInput`: validated admin, import, or job mutation input.

Drizzle inferred row types may help implement repositories, but they must not
appear in component props, public contracts, admin contracts, or domain policy
exports.

### Use Zod At Real Boundaries

Zod schemas are required for:

- Admin mutation input.
- Import and seed input.
- Public query parameters.
- Admin query parameters.
- Public DTO output.
- Admin DTO output.
- Published projection output.
- Candidate input accepted from files, jobs, probes, or future contribution
  routes.

Zod schemas are not required for every internal helper. Pure TypeScript types
are acceptable inside a trusted repository, mapper, or domain-policy unit once
the boundary has already been validated.

Output schemas are as important as input schemas. Public output validation is
the final guard against accidental leakage of DB rows, admin notes, raw
evidence, private metadata, source payloads, and unsafe URLs.

### Use Focused Repositories, Not Generic CRUD

Repositories own database IO, transactions, and row-level persistence
decisions. They should expose task-shaped functions, not a broad generic CRUD
surface.

Examples:

- `createSiteCandidate`
- `appendPriceSnapshot`
- `appendVerificationEvidence`
- `listPublishedProjectionRecords`
- `getAdminReviewContext`
- `writeAdminAuditEvent`
- `withPublishingTransaction`

Write repositories must make actor and audit strategy explicit when the
operation is admin-driven or system-driven. This spec allows some functions to
reserve audit hooks before the admin workflow is implemented, but it should
not allow later admin mutations to bypass audit by design.

Repositories may call pure domain policy functions. Domain policy functions
must not call repositories.

### Keep Mappers At Cross-Layer Boundaries

Mappers own shape conversion:

- DB row to domain input.
- DB row to admin DTO.
- Projection record to public DTO.
- Candidate input to canonical input.
- Published source state to projection record.

Components, route shells, and page-level UI code must not assemble public DTOs
from DB rows. Public DTOs must come from projection-backed mappers or
repository functions that explicitly return public-safe DTOs.

Admin DTOs must not be implemented as public DTOs with extra private fields
attached. They need separate schemas and mappers because admin visibility is
permission-aware and still must exclude raw secrets or unsafe source payloads.

### Recommended Directory Layout

Use this layout unless implementation discovers a simpler equivalent that
preserves the same boundaries:

```text
src/db/
  schema/
    admin.ts
    directory.ts
    evidence.ts
    publishing.ts
    audit.ts
  client.ts

src/server/db/
  repositories/
    sites.ts
    models.ts
    evidence.ts
    publishing.ts
    audit.ts
  mappers/
    public-projection.ts
    admin-directory.ts
    import-candidate.ts
  transactions.ts

src/contracts/
  public/
    directory.ts
    pricing.ts
  admin/
    directory.ts
    publishing.ts
    audit.ts
  import/
    seed.ts
  shared/
    locale.ts
    pagination.ts
```

Migration output may live in the Drizzle default migration directory or a
project-specific `drizzle/` directory. The chosen path must be documented in
the implementation plan and wired into package scripts.

### Dependency Direction

The intended dependency direction is:

1. `src/db/schema/**` defines storage tables and enums.
2. `src/server/db/**` owns connections, transactions, repositories, and
   mappers.
3. `src/domain/**` owns pure policy and may be called by server code.
4. `src/contracts/**` owns Zod schemas and DTO contract types.
5. API handlers, route loaders, jobs, and future tRPC routers call
   repositories and contracts.
6. UI components render DTOs or view models.

Forbidden dependency directions:

- `src/domain/**` importing `src/db/**`, `src/server/**`, Supabase, Drizzle,
  Next.js, React, or request context.
- `src/components/**` importing `src/db/**` or `src/server/db/**`.
- Route shell code importing repositories to compensate for missing page
  loaders.
- Public contracts importing Drizzle inferred table types.
- DB schema files importing UI, API, or route modules.

### Migration And Environment Expectations

The implementation plan must define:

- Required environment variables.
- Local database startup or connection expectations.
- Drizzle configuration and migration script names.
- A command to generate migrations.
- A command to apply migrations.
- A smoke test or validation step that proves an empty database can receive
  the initial schema.

The first persistence implementation should not require production Supabase
credentials to run unit tests. Tests that need a database must be explicitly
classified as integration tests and isolated from normal pure unit tests when
practical.

### Public Projection Storage Starts General

The first projection storage can be generic if it preserves public safety:

- Stable projection key.
- Locale.
- Page family or projection family.
- Public DTO payload accepted by output schema.
- Source version or source checkpoint.
- Projection policy version.
- Updated timestamp.

Later specs may split projection storage into typed page-family tables for
performance. That split must not allow public readers to bypass projection
output schemas.

## Validation Expectations

Implementation work that follows this spec should prove:

- Drizzle schema and migrations can create the initial database from empty
  state.
- Public DTO output schemas reject admin notes, raw evidence, private
  metadata, source payloads, and unsafe URLs.
- Admin DTO output schemas still reject raw secrets, token-like values,
  private user data, full private URLs, and arbitrary logs.
- Candidate inputs cannot be returned by public repository or mapper
  functions.
- Price snapshots are append-only at the repository or database boundary.
- Audit events are append-only and can reference an admin actor or system
  actor.
- Public projection readers do not read editing tables directly.
- `src/components/**` and shell route code do not import DB or repository
  modules.
- `src/domain/**` remains free of DB and framework imports.
- Zod boundary tests cover representative public, admin, and import shapes.

## Recommended Downstream Spec Order

After this spec, the recommended order is:

1. Seed import and evidence intake.
2. Admin auth, RBAC, review, and publishing workflow.
3. Projection rebuild execution and internal API / tRPC boundaries.
4. Public directory page families.
5. Verification, freshness, and risk operations.
6. Deployment, backup, observability, and documentation hardening.

This order lets later specs consume stable storage and DTO contracts without
requiring UI or jobs to invent temporary data shapes.

## Explicitly Out Of Scope

Later specs still need to define:

- Exact field lists for every table.
- Exact auth provider and session handling.
- Concrete role names and permission matrix beyond the minimum persistence
  model.
- Admin command names and tRPC router layout.
- Seed file format and production seed content.
- Projection rebuild transaction implementation.
- Public page view models and table UI.
- Freshness jobs, probes, crawlers, and future extension contribution
  ingestion.
- Backup, restore, deployment, and operational dashboards.

## Acceptance Summary

This spec is acceptable when implementation can add a database layer without
letting DB rows leak into public or admin contracts, when published projection
records are the default public read source, and when later admin, import, API,
and public-page specs can depend on stable storage and DTO boundaries instead
of redefining them.
