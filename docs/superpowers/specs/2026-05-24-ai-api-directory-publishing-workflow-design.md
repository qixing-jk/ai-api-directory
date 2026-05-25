# AI API Directory Publishing Workflow And Projection Rebuild Design

## Purpose

Define how reviewed domain data becomes public content after the canonical
domain vocabulary is established. This spec owns lifecycle transitions,
publication gates, projection rebuild behavior, rollback semantics, and public
visibility rules. It keeps publishing policy out of UI, route shells, and raw
source ingestion.

## Scope

This spec covers:

- Publishable lifecycle transitions.
- Candidate, review, approval, publish, dispute, withdraw, archive, and reject
  semantics.
- Projection rebuild and rollback boundaries.
- Public visibility after publish, withdrawal, rejection, archive, and dispute.
- Locale-version publication rules.
- Audit and concurrency expectations.
- Validation expectations for implementation.

This spec does not cover:

- Exact database schema or migrations.
- Admin authentication provider.
- Full RBAC implementation.
- Admin UI composition.
- tRPC router field shapes.
- Job runner implementation.
- Public business page design.
- Seed data content.
- Entity-specific DTO fields.

## Prerequisites

This spec depends on:

- `2026-05-24-web-runtime-shell-design.md`
- `2026-05-24-ai-api-directory-canonical-domain-model-design.md`

The runtime shell owns route, SEO helper, sitemap, robots, locale, and theme
contracts. The canonical domain spec owns stable object families and privacy
boundaries. This spec must not redefine either layer.

## Durable Decisions

### PublishedProjection Is Rebuilt, Not Edited By Hand

`PublishedProjection` is generated only from published domain versions,
published locale-versioned editorial content, and public-safe evidence
summaries selected by publishing policy. `approved` is a pre-publication state;
approval alone does not enter the public projection. Admins do not edit
projection records directly.

Stable entities are not published by mutating one record in place. A stable
entity keeps its current published version while new draft, review, and
approved versions are prepared. Publishing atomically swaps the active
published version used by projections.

Projection rebuilds must be deterministic for the same source state and
publishing policy version. A rebuild can be triggered by:

- Publishing approved content.
- Withdrawing published content.
- Archiving published content.
- Resolving a dispute.
- Rolling back to a previous published version.
- Rebuilding after code or projection policy changes.

The projection builder is the only boundary that assembles public-safe read
models. Public pages, public APIs, sitemap records, hreflang records, and
public metadata read from the projection output or from projection-backed DTOs.

Projection rebuilds cover the full affected dependency set. A publish,
withdraw, archive, dispute resolution, rollback, or policy rebuild must update
all affected entity pages, index/list projections, pricing projections,
navigation records, metadata records, sitemap records, and hreflang records.
The storage layout is a later implementation decision.

### Lifecycle Transition Graph

Publishable content and domain versions use this constrained transition graph:

```text
draft -> pending_review -> approved -> published
draft -> archived
pending_review -> draft
pending_review -> rejected
approved -> draft
approved -> published
published -> disputed
published -> withdrawn
published -> archived
disputed -> published
disputed -> withdrawn
disputed -> archived
withdrawn -> pending_review
withdrawn -> archived
rejected -> draft
archived -> draft
```

Illegal transitions are domain errors. UI controls, API handlers, jobs, and
imports must all call the same transition policy instead of duplicating state
checks.

`rejected -> draft` and `archived -> draft` are allowed only for explicit
restoration. They must create a new reviewable draft version and must not
silently republish previously rejected or archived content.

The graph applies to versions, not stable entity identities. A stable entity
may have at most one active published version per relevant publication scope
while another version is in draft, review, or approved state.

### Candidate Data Is Not Public

Imports, probes, future extension observations, and admin-created drafts may
create candidate records. Candidate data can support review, but it cannot
enter public projections until it passes the relevant publication gates.

Candidate data must not create public recommendations, site summaries,
alternatives explanations, owner claims, risk conclusions, or SEO metadata.

Structured candidate facts may become publishable only after:

- Schema validation passes.
- URL and origin normalization passes.
- Privacy validation passes.
- Required evidence fields are present.
- Review status allows publication.
- The target locale version is approved when editorial text is involved.

Candidate is an ingestion and review-layer disposition, not a publishable
lifecycle state. Signal-specific terms such as `dismissed`, if introduced by a
later risk or capability spec, are separate from the publishable lifecycle
unless that spec explicitly maps them to `rejected`.

### Manual Review Gates Editorial And Risk Content

Manual review is required before publishing:

- Site summaries.
- Model explanations.
- Alternatives explanations.
- Risk explanations.
- Negative or cautionary claims.
- Owner, maintainer, or official-status statements.
- External links beyond normalized public source URLs.
- Any statement that reads like editorial judgment.

Machine-generated or imported structured facts can reduce admin work, but they
do not bypass review for editorial or risk content.

### Locale Versions Publish Independently

Each public locale version has independent status and visibility. Publishing a
`zh-CN` locale version does not publish `en`, and missing locale content must
not fall back across locales.

Approval is a precondition for a publish command. Only published locale
versions enter renderable projections.

The projection builder may emit a renderable page projection for a locale only
when:

- The entity is published.
- The locale version is published.
- The page family allows public rendering under current publishing policy.

Discovery and indexing are separate from renderability. A rendered locale page
appears in public navigation, sitemap output, hreflang alternates, and
indexable metadata only when:

- The locale is active for public discovery.
- The page family is indexable under current publishing policy.

Hreflang alternates include only published locale versions for the same stable
entity or slug. Missing, draft, rejected, withdrawn, archived, and fallback
locale versions do not create alternates.

For V1 text-bearing public pages, publication requires at least one published
locale version in an active public-discovery locale. The default canonical
editorial locale is `zh-CN`. Without that minimum publicable locale, the entity
or page version may be approved but must not become renderable or indexable.

### Dispute, Withdraw, Archive, And Reject Have Different Public Effects

`disputed` means previously public facts need review because evidence changed
or conflicts exist. The default dispute policy removes disputed facts or
content from public projections. A disputed item may remain visible only when
the entity or page family explicitly allows a redacted public caution state and
the projection can present that caution without exposing raw evidence,
internal review notes, or private metadata.

`withdrawn` means the fact or content must leave public projections unless a
later public-history spec explicitly publishes a redacted history view.

`archived` means the record is no longer part of the active public directory.
Archived content must leave sitemap and hreflang output unless a later
public-history spec explicitly decides otherwise.

`rejected` means the candidate or review item did not pass publication. It
must never appear in public projections, sitemap output, hreflang output, or
SEO metadata.

### Rollback Restores A Published Version

Rollback is a special publication command outside the lifecycle transition
graph. It restores a previous published version by creating a new publication
event that points to the restored version. Rollback must not mutate historical
published snapshots in place.

Rollback may be issued from `published`, `disputed`, `withdrawn`, or
`archived` public states when the target historical version still passes
current publication gates. Successful rollback creates a new active published
version and rebuilds the affected projection dependency set.

Rollback must preserve:

- Who initiated it.
- When it happened.
- Which previous version was restored.
- Why rollback was requested.
- Which projection records were rebuilt or removed.

Rollback can restore public content only if the restored version still passes
current privacy validation. If current policy rejects the historical content,
rollback must stop and require manual remediation.

### Audit Is Append-Only

Every state transition, publication event, projection rebuild, rollback,
withdrawal, archive, rejection, and risk-content change creates an append-only
audit event.

Audit events are admin-facing records. They are not public DTOs and do not
enter `PublishedProjection`.

Audit records must be enough to answer:

- Who or what initiated the change.
- What object changed.
- Previous and next lifecycle state.
- Published version before and after the change.
- Publishing policy version.
- Projection batch, version, or hash.
- Projection rebuild base or checkpoint.
- Command ID or idempotency key.
- Code or policy version used by the rebuild.
- Projection rebuild result.
- Validation failures, if any.

### Projection Rebuilds Are Atomic At The Public Boundary

A failed projection rebuild must not partially replace public read models. The
implementation may use transactions, versioned projection batches, or another
mechanism, but public readers must observe either the previous valid projection
or the next complete projection.

Projection publication must also preserve command ordering. Implementations
must use a projection base checkpoint, monotonic batch version,
compare-and-swap, a single-writer lock per projection scope, or an equivalent
idempotent ordering rule so an older rebuild cannot overwrite a newer public
projection.

Projection rebuild failures are operational errors. They must not be hidden as
successful publish actions.

### Concurrency Uses Version Checks

Publishing operations must protect against stale admin edits. A publish,
withdraw, archive, rollback, or dispute resolution command must include the
expected source version or review version. If the source changed after the
admin loaded it, the command fails with a conflict and requires review of the
newer state.

Commands that update public projections must also include or resolve the
expected projection base checkpoint used for ordering.

## Publishing Gates

Before content enters `PublishedProjection`, implementation must verify:

- Lifecycle transition is legal.
- Required source and evidence fields are present.
- Privacy validation passes.
- Public source URLs are normalized and safe.
- Editorial locale version is published for text-bearing pages.
- V1 text-bearing public pages have at least one published active-discovery
  locale, normally `zh-CN`.
- Risk and negative claims have manual review.
- Public DTO output schema accepts the generated projection.
- Sitemap and hreflang eligibility match shell rules.
- The full affected projection dependency set is rebuilt.
- Projection rebuild completes atomically.
- Projection ordering prevents older rebuilds from replacing newer public
  projections.

## Validation Expectations

Implementation work that follows this spec should prove:

- Illegal lifecycle transitions are rejected through shared domain policy.
- Candidate, rejected, withdrawn, and archived content does not enter public
  projections.
- Locale versions publish independently and do not fall back across locales.
- Text-bearing pages cannot become renderable without a minimum publicable
  locale.
- Hreflang output includes only published locale versions.
- Rollback creates a new event and does not mutate historical snapshots.
- Projection rebuild failure leaves the previous public projection intact.
- Projection rebuild ordering prevents stale batches from winning.
- Publishing commands rebuild the full affected projection dependency set.
- Public DTO validation prevents admin notes, raw evidence, private metadata,
  source payloads, and unsafe URLs from leaking.
- Stale publish commands fail with a conflict.
- Audit events are created for state changes and projection rebuilds.

## Recommended Downstream Spec Order

After this spec, the recommended order is:

1. Admin auth / RBAC and review queue workflow.
2. Public business pages and SEO / content information architecture.
3. API / tRPC command and query boundaries.
4. Jobs, observability, seed data, and validation hardening.

## Explicitly Out Of Scope

Later specs still need to define:

- Concrete table layout.
- Version storage format.
- Projection storage format.
- Admin permissions and role names.
- Review queue UI.
- API command names and payload schemas.
- Revalidation job implementation.
- Public page DTO fields.
- Public-history behavior for withdrawn or archived content.

## Acceptance Summary

This spec is acceptable when later implementation can publish, withdraw,
archive, dispute, reject, and roll back content without public readers touching
editing tables or raw source data, and when failed or stale publishing actions
cannot corrupt the active public projection.
