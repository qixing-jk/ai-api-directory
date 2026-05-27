# All API Hub Observation Contract And Seed Intake Design

## Purpose

Define the privacy-safe observation contract that connects All API Hub to AI
API Directory. This spec makes All API Hub the intended future source of
machine-observed facts while keeping the directory independently useful before
extension contribution exists.

The key decision is that seed data should emulate this observation contract.
Seed is a temporary and curated source, not the product authority. Public pages
still read reviewed published projections, not seed files, extension batches,
or candidate records.

## Scope

This spec covers:

- The safe data All API Hub can eventually produce.
- The curated seed batch shape that should mirror those future observations.
- Privacy and redaction rules for observation intake.
- Candidate and evidence mapping into the existing directory model.
- Which facts can be machine-observed and which require editorial review.
- Validation expectations for the next implementation slice.

This spec does not cover:

- Implementing upload, sync, consent UI, or background contribution in All API
  Hub.
- Public page UI.
- Admin review UI.
- Full tRPC router implementation.
- Projection rebuild execution.
- Production moderation, anti-abuse, or aggregation threshold jobs.

## Prerequisites

This spec depends on:

- `2026-05-23-ai-api-directory-design.md`
- `2026-05-24-ai-api-directory-canonical-domain-model-design.md`
- `2026-05-24-ai-api-directory-publishing-workflow-design.md`
- `2026-05-25-ai-api-directory-persistence-typed-boundary-design.md`

The persistence and publishing specs own storage, DTO, lifecycle, and public
projection boundaries. This spec only defines the input contract for machine
observations and curated seed batches.

## Current All API Hub Capability Evidence

All API Hub does not currently implement directory contribution upload, and it
does not have one stable external observation format. It has feature-local
internal shapes that can inform a future adapter:

- Account and API credential flows can fetch model lists.
- Pricing flows expose `PricingResponse` and `ModelPricing` shapes with
  ratio-style, per-call, and direct token-price fields. These are not already
  normalized for public ranking.
- `model_list_source` exists as optional pricing metadata, but current source
  metadata is effectively provider-specific rather than universal.
- API credential verification can run probes for model listing, text
  generation, structured output, tool calling, and web search. Runtime probe
  results and persisted verification summaries are not export-safe evidence
  as-is and require a future adapter.
- CLI compatibility is a separate simulation path built on verification
  probes. It should not be collapsed into generic API probe evidence.
- Account flows can observe site capabilities such as balance refresh, usage
  refresh, check-in, key management, and model management.
- Account setup and sponsor metadata already contain site type, base URL, auth
  type, and prefill-style metadata. Sponsor prefill is product/conversion
  metadata, not neutral directory seed data.

The current privacy policy also matters as a product constraint. The directory
contract must not require API keys, access tokens, cookies, authorization
headers, full URLs, account names, token names, exact balances, precise usage,
request or response bodies, prompts, model outputs, raw error stacks, or user
notes. Existing All API Hub sanitization is feature-specific and does not
already provide the unified reject-by-default observation boundary defined by
this spec.

## Current Versus Future Integration Posture

All API Hub currently has multiple feature-local internal shapes. It does not
have one stable external observation format that AI API Directory can consume
directly today.

This spec is therefore not a claim that All API Hub can already emit the batch
format described below. It is the directory-side target contract that future
All API Hub integration should consider and implement when contribution,
export, or sync is added.

Near-term implementation should stay entirely inside AI API Directory:

- Define the observation batch contract in `src/contracts/import`.
- Validate curated seed batches against that contract.
- Map validated batches into candidate and evidence inputs.
- Keep All API Hub code unchanged.

All API Hub implementation should happen later, after the directory has proven
that the contract is useful with curated seed and dry-run import. At that
point, All API Hub should add an adapter/export layer that converts its
feature-local data into this external observation contract rather than exposing
its current internal account, pricing, verification, or sponsor shapes.

## Contribution Governance Gates

Future All API Hub contribution is a new data channel. It is not covered by
the current anonymous analytics posture, and it must not be treated as a small
extension of existing product telemetry.

AI API Directory should reject `source=all_api_hub_extension` batches until a
later spec defines and the implementation enforces:

- Updated privacy policy wording for contribution data.
- Separate opt-in consent copy and consent versioning.
- Endpoint authentication, rate limits, replay protection, deduplication, and
  abuse controls.
- Quarantine and audit records for every accepted batch.
- Aggregation thresholds by fact family.
- A shared fail-closed URL policy for intake and projection.

Extension-derived facts are non-public by default. They may support internal
review, but they must not enter public projections until public-source
confirmation or the later aggregation policy explicitly allows publication.

## Durable Decisions

### Observation Contract Leads Seed Format

The seed format should look like an offline observation batch, not a
page-specific JSON file. Curated seed batches let the directory ship before
All API Hub has contribution features, but they must exercise the same
validation and mapping path expected from future extension observations.

This keeps the implementation path aligned:

```text
All API Hub local capability
  -> privacy-safe observation contract
  -> curated seed observation batch
  -> candidate and evidence intake
  -> review and publish
  -> published projection
  -> public pages
```

### All API Hub Is An Observer, Not A Publisher

All API Hub observations create candidate facts and evidence. They do not
publish public content directly.

Machine observations can support:

- Site origin existence.
- Site type or compatibility hints.
- Model route listing.
- Price observations when the source payload is already structured and safe.
- Capability support signals.
- Verification probe success, failure, or unsupported status.
- Freshness timestamps.

Machine observations must not create:

- Site summaries.
- Recommendations.
- Alternatives explanations.
- Owner or maintainer claims.
- Negative risk conclusions.
- SEO titles or editorial descriptions.
- Public statements that imply quality, trust, or authenticity beyond the
  observed fact.

Those outputs require admin or editorial review before publication.

### Public Pages Still Read Published Projections

No public page, sitemap, metadata generator, or public API should read
observation batches, seed files, or candidate rows directly.

Observation batches and seed files feed the candidate and evidence layer. The
publishing workflow decides what becomes public. Projection builders then emit
public-safe DTOs.

### Production Seed Is Curated Evidence, Not Fake Data

Development fixtures may use synthetic data for tests. Production seed must
contain only curated real-world entries with source descriptions or public
source URLs, observation timestamps, producer confidence hints, server-side
confidence, and review status.

Production seed should start small and credible:

- 10 high-value canonical models.
- 8-12 sites or systems.
- Enough model routes and price observations to make the pricing comparison
  page useful.
- Capability observations for All API Hub workflows where they are known.
- Editorial stubs only when clearly marked as draft and never published
  without review.

### Privacy Rules Are Reject-By-Default

Observation intake uses a whitelist. Fields outside the contract are rejected,
not ignored silently, because silent acceptance can hide sensitive data leaks.

The intake boundary rejects:

- API keys, access tokens, refresh tokens, cookies, and auth headers.
- Full URLs with private paths, query strings, hashes, account ids, token ids,
  or credential-looking path segments.
- Account names, token names, user ids, emails, or user-specific labels.
- Exact balances, precise quota, precise usage, precise request counts, or
  exact latency samples.
- Request bodies, response bodies, prompts, model outputs, screenshots, raw
  logs, and raw error stacks.
- Arbitrary dictionaries that are not tied to a named contract version.
- Localhost, private IPs, internal TLDs, and unreviewed tenant-like or
  user-specific origins.
- User-supplied names or keys derived from local account profiles, token
  labels, stable extension installs, or user-defined display labels.

Safe public-source URLs may keep public paths only when they point to
documentation, pricing, model lists, or other reviewed public references.
User-observed URLs are reduced to normalized origins and quarantined for review
unless already tied to a reviewed public directory identity.

URL validation should be implemented as one shared fail-closed policy rather
than repeated ad hoc checks. Intake and projection should use the same
canonical URL rules for credentials, IDN/punycode, private hosts, query and
hash stripping, encoded sensitive path bypasses, user/account/token path
segments, and unsafe redirects.

## Contract Shape

### Batch Envelope

Each import file or future contribution payload is an observation batch:

- `schemaVersion`
- `source`
- `batchId`
- `generatedAt`
- `producer`
- `consent`
- `observations`

`source` distinguishes curated seed, admin import, All API Hub extension,
public source job, and probe job. Curated seed can set consent to
`not_applicable`. Future extension batches require explicit consent metadata
before they are accepted.

`producer` can include product name, product version, extension version, and
contract version. It must not include user identifiers, stable install ids, or
local account identifiers. `batchId` is for idempotency and audit only; it
must not be user-stable or exposed in public projections.

### Site Observation

Site observations identify a public service or system:

- `siteKey`
- `displayName`
- `origin`
- `siteType`
- `category`
- `observedAt`
- `source`
- `producerConfidenceHint`

`origin` is scheme, host, and optional port only. Paths, query strings, and
hashes are rejected unless the URL is explicitly declared as a reviewed public
source URL outside the origin field.

`siteKey` must be directory-assigned or derived only from reviewed public
identity. Extension batches must not use local account names, token names,
user labels, or account profile names as display names or keys.

### Endpoint Observation

Endpoint observations describe safe public origins by purpose:

- `siteKey`
- `origin`
- `kind`
- `observedAt`
- `producerConfidenceHint`

Allowed endpoint kinds should match the existing directory vocabulary:
homepage, console, api, docs, pricing, recharge, status, and unknown.

### Model Observation

Model observations describe canonical models or route aliases:

- `canonicalModelKey`
- `displayName`
- `family`
- `creator`
- `routeModelId`
- `aliases`
- `contextWindow`
- `capabilities`
- `observedAt`
- `source`
- `producerConfidenceHint`

Route model ids from All API Hub are observations, not proof of upstream
authenticity. Matching a model name never proves that a route is official.

### Model Route Observation

Model route observations connect a site and route id to a canonical model:

- `siteKey`
- `endpointKey`
- `canonicalModelKey`
- `routeModelId`
- `providerType`
- `upstreamClaim`
- `factLevel`
- `modelListSource`
- `observedAt`
- `producerConfidenceHint`

All API Hub model lists normally support `listed` evidence. A controlled
verification probe can support `tested` evidence for the tested capability.
Catalog fallback data is weaker than user-scoped model-list data and must keep
its source type visible.

### Price Observation

Price observations store structured pricing facts:

- `siteKey`
- `routeModelId`
- `currency`
- `billingUnit`
- `inputPer1M`
- `outputPer1M`
- `cacheReadPer1M`
- `cacheWritePer1M`
- `requestFee`
- `minimumRecharge`
- `discountNote`
- `exchangeRateNote`
- `source`
- `observedAt`
- `effectiveAt`
- `expiresAt`
- `producerConfidenceHint`

Ratios and multipliers from One API or New API style systems are accepted only
when the billing unit makes the comparability limits explicit. If a price
cannot be compared with token prices, it must stay visible as a non-comparable
fact rather than being ranked as a cheapest route.

Free-text pricing notes from extension or probe batches are not accepted.
`discountNote` and `exchangeRateNote` are curated/admin-source fields and
require review before publication.

### Verification Probe Observation

Verification observations summarize controlled probe outcomes:

- `target`
- `apiType`
- `probeId`
- `status`
- `modelId`
- `observedAt`
- `durationBucket`
- `errorCategory`
- `producerConfidenceHint`

Allowed statuses are pass, fail, and unsupported. Error output must be a
controlled category or sanitized summary. Request and response content must not
be stored.

Runtime All API Hub probe results are source material for a future adapter,
not contribution records. The adapter must drop request/response diagnostics,
model previews, local targets, and any free-text summaries that are not on a
controlled allowlist.

### CLI Support Observation

CLI compatibility is modeled separately from generic API verification:

- `target`
- `tool`
- `probeId`
- `status`
- `modelId`
- `observedAt`
- `durationBucket`
- `errorCategory`
- `producerConfidenceHint`

Allowed tools are controlled values owned by the future adapter contract.
Tool-specific raw command output, prompts, model output, and environment
details are not accepted.

### Capability Observation

Capability observations describe support for workflows:

- `siteKey`
- `capability`
- `status`
- `observedAt`
- `producerConfidenceHint`

Initial capabilities should include model list, balance refresh, usage
refresh, check-in, key management, API credential verification, CLI
compatibility, All API Hub add flow, and All API Hub manage flow.

Clients do not submit trusted source counts. Source count buckets are computed
server-side after deduplication and aggregation policy checks. Exact user
counts or exact account counts are not accepted.

### Risk Candidate Observation

Risk candidates can be imported only as neutral review cues:

- `siteKey`
- `riskType`
- `severityHint`
- `source`
- `observedAt`
- `producerConfidenceHint`

They do not become public risk statements without manual review. Machine
intake may flag missing price data, stale observations, inconsistent model
claims, repeated probe failures, or unknown privacy posture. It must not make
accusatory claims.

## Evidence Mapping

Observation intake maps batches into candidate records and verification
evidence:

- Site and endpoint observations become candidate directory records.
- Model route observations become route candidates with listed or observed
  evidence.
- Verification probe observations become evidence with tested or unsupported
  status, depending on the target and result.
- Price observations become append-only price snapshot candidates.
- Capability observations become candidate capability signals.
- Risk candidates become admin review items, not public risk facts.

Evidence level is derived conservatively:

- Curated public source with manual review: `manually_confirmed`.
- Public model or pricing source parsed from docs or public API: `listed`.
- All API Hub local observation without controlled probe: `observed`.
- Controlled API probe success: `tested`.
- Human-entered statement without source validation: `claimed`.

The importer may lower evidence level when source metadata is weak. It must
not raise evidence level because a field looks plausible.

Producer confidence is only a hint. Server-side confidence is computed from
source class, consent state, review state, freshness, corroboration, URL
policy result, and aggregation policy result. Extension-derived observations
remain capped below manual or public-source evidence unless a later policy
explicitly raises them.

## Seed Strategy

Seed implementation should use two fixture families:

- Synthetic development observation fixtures for tests and local UI examples.
- Curated production seed batches for real initial content.

Development fixtures may use synthetic names and synthetic origins. Production
seed must use real sources and must not include fake production entries.

Curated production seed should be stored as versioned observation batches.
Each batch should be dry-runnable, deterministic, and reviewable in diff form.

The first production seed should prioritize:

- The pricing comparison page.
- High-value canonical model families.
- Sites and systems where source quality is strong enough.
- Evidence that supports public timestamps and source labels.

## Validation Expectations

Implementation work that follows this spec should prove:

- `source=all_api_hub_extension` is rejected until contribution governance is
  implemented.
- Observation batches reject unknown top-level fields and sensitive-looking
  nested fields.
- User-observed URLs are normalized to origins and quarantined unless linked
  to reviewed public identity.
- Public source URLs reject query strings, hashes, credential-looking paths,
  and user-specific paths.
- Model-list catalog fallback and user-scoped observations remain distinct.
- Price observations preserve billing unit and comparability limits.
- Verification probe observations store only safe result summaries.
- CLI support observations are separate from generic API probe observations.
- Extension batches cannot submit trusted source counts, public display names,
  or server confidence.
- Extension-derived facts cannot enter public DTOs until aggregation or public
  source confirmation policy allows them.
- Risk candidate observations cannot enter public DTOs directly.
- Development seed and production seed are separated.
- Production seed cannot use synthetic test sites.
- Candidate and evidence import does not create public projection records
  without a publishing step.

## Recommended Downstream Implementation Order

1. Add AI API Directory domain policy for observation intake: source enum,
   consent gate, sensitive-key rejection, URL normalization, evidence-level
   derivation, and server-side confidence rules.
2. Add Zod contracts for observation batch input and seed import, without
   changing All API Hub.
3. Make observation batch the primary import contract. The current seed-site
   candidate contract should become a compatibility wrapper or source-
   constrained observation batch, not a second intake path.
4. Add contract and policy tests for privacy rejection, source
   classification, URL policy, evidence-level derivation, and governance
   gating.
5. Add synthetic development observation fixtures that mirror the observation
   batch format.
6. Add dry-run import mapping from observation batch to candidate and evidence
   inputs, and update existing seed mapper tests to use the same intake path.
7. Define task-shaped candidate write repositories for site, endpoint, model,
   route, price, capability, risk, and evidence candidates, plus import
   transaction/idempotency using `batchId` or `commandId` and system actor
   audit.
8. Add repository-backed import execution once admin/audit ownership is ready.
9. Add projection rebuild execution only after review gates, publishing gates,
   audit, and atomic projection commit rules are implemented.
10. Add public pages only after projection read APIs return reviewed published
   projection DTOs, not candidate or dry-run DTOs.
11. Design All API Hub's adapter/export layer only after the directory can
   accept and validate the same contract locally.
12. Add All API Hub contribution, export, or sync implementation after
   consent, privacy, aggregation, and abuse controls are specified.

## Explicitly Out Of Scope

Later specs still need to define:

- Extension consent UI and exact opt-in copy.
- Contribution upload endpoint authentication and rate limits.
- Aggregation thresholds for public contribution-derived facts.
- Abuse prevention for public or semi-public submissions.
- Admin review queue UI.
- Public page view models.
- Exact curated seed list.
- All API Hub code changes to produce observation batches.

## Acceptance Summary

This spec is acceptable when the next implementation can define seed import as
a local version of the future All API Hub observation stream, while preserving
the existing privacy posture and the directory's published projection boundary.

The directory should be able to ship useful curated content now without
pretending that extension contribution already exists, and without designing a
seed format that will be thrown away when All API Hub contribution is added.
