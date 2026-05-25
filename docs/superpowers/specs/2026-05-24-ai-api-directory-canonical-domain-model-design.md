# AI API Directory Canonical Domain Model And Projection Boundary Design

## Purpose

Define the stable domain vocabulary and cross-layer boundaries that sit under
the completed runtime shell. This spec keeps raw source data, canonical
inputs, domain objects, public projections, admin views, and UI view models
separate so later specs can be implemented without guessing shape or
ownership.

## Scope

This spec covers:

- Object family boundaries.
- Lifecycle and evidence vocabularies.
- Public vs admin visibility.
- The published projection contract.
- Dependency direction.
- Validation expectations for the boundary.
- Recommended downstream spec order.

This spec does not cover:

- Database schema or migrations.
- Auth or RBAC implementation.
- tRPC or API endpoints.
- Publishing workflow mechanics.
- Jobs, queues, or observability pipelines.
- Public business pages.
- Seed data.
- UI composition.
- Concrete parser implementation.

## Prerequisite

The runtime shell spec is already complete:
`2026-05-24-web-runtime-shell-design.md`.

That spec owns route/layout/SEO/theme shell contracts. This spec must not
reopen shell decisions.

## Durable Decisions

### Public Projection Is The Only Public Read Surface

Public pages, public APIs, sitemap records, hreflang records, and public
metadata read from `PublishedProjection` or projection-backed DTOs, not from
editing tables or raw source payloads.

`PublishedProjection` contains only:

- Published public content.
- Public-safe DTO fields.
- Evidence summaries.
- Normalized public URLs.
- Public timestamps.

It excludes:

- Candidate data.
- Admin notes.
- Raw evidence.
- Internal review comments.
- Private source metadata.
- Rejected or withdrawn facts, unless a later history spec explicitly decides
  to show them.

The projection is a contract, not a storage mechanism. Later specs may choose
how to rebuild it, but they must not change its public/private boundary.

### Object Families Stay Distinct

The domain must keep these families separate:

- Source payloads: raw or minimally sanitized inputs from imports, extension
  observations, manual admin input, or probes. These are never rendered
  directly.
- Canonical inputs: normalized inputs used for identity matching and rule
  parsing. These are not UI shapes.
- Domain objects: business-meaningful entities and value objects. These own
  lifecycle and fact semantics.
- Public DTOs: public-safe shapes for indexable pages and public APIs.
- Admin DTOs: review, audit, draft, and permission-aware shapes.
- UI view models: page-specific presentation shapes built at loader or
  presenter boundaries.
- Content and publication versions: locale-versioned editorial content and
  published domain versions owned by later publishing and content specs. These
  are not UI messages and not raw domain objects.

Later specs may denormalize data for display, but they must not move business
semantics into components or route shells.

### Core Domain Objects

The first domain vocabulary is:

- `Site`: public service identity, category, site type, status, risk posture,
  and timestamps.
- `SiteEndpoint`: normalized origin and purpose for a site.
- `CanonicalModel`: normalized model identity and capability envelope.
- `ModelRoute`: one site route that claims, lists, observes, or tests support
  for a canonical model.
- `PriceSnapshot`: an append-only price observation.
- `VerificationEvidence`: a redacted source or observation record.
- `SiteCapabilitySignal`: a feature or workflow support signal.
- `RiskSignal`: a neutral, evidence-backed risk finding.
- `PublishedProjection`: the synthesized public read model.

These names are stable vocabulary. Later specs may define more detail, but
they should not rename the families or collapse them into a single loose
record shape.

### Lifecycle And Fact Vocabulary

The lifecycle vocabulary is constrained:

- `draft`
- `pending_review`
- `approved`
- `published`
- `disputed`
- `withdrawn`
- `archived`
- `rejected`

This spec reserves the lifecycle vocabulary for publishable content and domain
versions only. The exact transition graph belongs to the publishing workflow
spec, but any illegal transition is a domain error rather than a UI state.
Candidate, ingestion, observation, and signal-specific dispositions are
separate later-domain vocabularies and must not be mixed into the publishable
lifecycle by default.

`ModelRoute.factLevel` vocabulary is also constrained:

- `claimed`
- `listed`
- `observed`
- `tested`
- `disputed`

Fact levels are semantic constraints, not badge text.

Evidence vocabulary must stay separate from lifecycle vocabulary:

- Evidence can be `claimed`, `listed`, `observed`, `tested`, or
  `manually_confirmed`.
- Risk findings stay neutral and withdrawable.
- Public display of structured facts must always show evidence level and
  observation time when the fact is public.

`manually_confirmed` is evidence provenance, not a `ModelRoute` fact level.

### Privacy And Redaction Boundary

The product must preserve the current privacy posture and avoid introducing a
new sensitive-data channel.

Never store or upload the following in public-facing or projection-facing
shapes:

- API keys.
- Access tokens.
- Cookies.
- Authorization headers.
- Account names.
- User IDs.
- Exact account balances.
- User-observed or private URLs beyond normalized origins.
- User notes.
- Request or response bodies.
- Prompt content or model output.
- Raw error stacks.
- Precise per-user site ownership data.

Evidence content uses a strict whitelist. User-observed or private URL
material must be rejected or minimized to a normalized origin before storage.
Reviewed public source URLs may include safe public paths, but they must not
include query strings, hashes, credential-like path segments, or user-specific
path segments. Public-source raw inputs that need review may stay in
source/admin layers, but only when they do not contain private or
user-specific material.

### Dependency Direction

The dependency direction for later specs is:

1. Constants and registries define stable vocabularies.
2. Normalization and parsing convert raw source payloads to canonical inputs.
3. Domain services apply business rules to canonical data.
4. Public projection builders create public-safe projection DTOs.
5. Admin loaders or presenters create admin DTOs and admin view models outside
   the public projection contract.
6. UI renders DTOs and view models without re-parsing business semantics.

Hard boundaries:

- `src/components` stays presentation-only.
- Route files and shell code do not become the home of business parsing.
- Shell-local locale and SEO helpers are allowed.
- Business constants, taxonomies, and state logic stay out of UI code.

## Recommended Downstream Spec Order

Use this spec as the shared vocabulary for the rest of the product. The
recommended order after this one is:

1. Publishing workflow and projection rebuild / rollback.
2. Admin auth / RBAC and review queue workflow.
3. Public business pages and SEO / content information architecture.
4. API / tRPC, jobs, observability, seed data, and validation hardening.

This order minimizes rework because each later spec can consume the shared
domain vocabulary instead of inventing its own.

## Validation Expectations

Implementation work that follows this spec should prove:

- Illegal lifecycle transitions are rejected.
- Price snapshots remain append-only.
- Published projections do not leak private or admin-only fields.
- Public DTOs stay separate from admin DTOs.
- UI and route code do not import raw source payloads or domain persistence
  layers.
- Projection builders remain the only place where public-safe shapes are
  assembled.

## Explicitly Out Of Scope

Later specs still need to define:

- Exact table schema.
- Auth provider and session mechanics.
- Permission checks and admin guards.
- tRPC router shapes.
- Job execution strategy.
- Seed content and production readiness rules.
- Entity-specific structured data.
- Final field-level DTO schemas.

## Acceptance Summary

This spec is acceptable when later specs can name the canonical objects and
public read model without redefining them, and when public-facing code never
needs to read raw source data.
