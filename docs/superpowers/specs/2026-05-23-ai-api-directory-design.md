# AI API Directory Website Design

## Purpose

Build an independent public website for discovering, comparing, and evaluating AI API relay, aggregation, and model access sites. The public website must stand on its own for search users, while All API Hub acts as a strong integration path and a future source of privacy-safe contribution signals.

The growth loop is:

1. Search users find public model, price, site, and risk pages.
2. The website helps them compare sites, prices, models, and evidence.
3. Some users install or use All API Hub to manage, verify, and monitor their own sites locally.
4. Future consenting extension users contribute privacy-safe aggregate site, model, price, and capability signals.
5. Those signals improve directory quality and create stronger SEO pages.

The site must not be a generic AI tools directory and must not read like All API Hub documentation. It should be an AI API relay and aggregation directory with All API Hub as an integrated workflow.

## Product Positioning

The website targets:

- AI API users comparing relay and aggregation sites.
- Users searching for specific model access and prices.
- Developers choosing OpenAI-compatible, Claude-compatible, Gemini-compatible, One API, New API, or similar routes.
- Users who need risk and reliability guidance before trying a site.
- All API Hub users who want discovery, comparison, and future one-click management.

The public value must remain available without installing the extension. All API Hub calls to action are allowed only as workflow enhancements: local account management, balance tracking, model list checks, availability verification, and future opt-in contribution.

## V1 Scope

V1 delivers a production-ready foundation for a credible public directory and admin-operated data publishing workflow. It should be small enough to ship, but it must include the engineering boundaries needed for trust, SEO, and future contribution.

### Required Public Pages

- Homepage.
- Model pricing comparison page.
- High-value model detail pages.
- Site detail pages.
- Alternatives pages.
- Risk and model authenticity guide pages.
- Lightweight directory/listing page for navigation and filtering.

The primary SEO battlefield for V1 is model pricing and comparison, not broad directory volume.

### Required Admin Capabilities

- Admin authentication.
- Role-based permissions.
- Manual site, endpoint, model, route, price, evidence, capability, and risk editing.
- Seed data import.
- Draft, preview, review, publish, withdraw, and archive workflow.
- Change history and diff for published content.
- Append-only audit log for all admin mutations.
- Published projection generation for public pages and APIs.

### Required Technical Foundation

- Native i18n architecture.
- Dark mode.
- Theme tokens.
- Componentized frontend.
- tRPC for typed internal app APIs.
- Zod for all input and output boundaries.
- Postgres-backed relational data model.
- Public DTOs separated from database rows and admin DTOs.
- SSR/SSG or ISR for SEO-critical public content.
- Canonical URLs, sitemap, hreflang, Open Graph, and structured data.
- Data governance, review status, evidence status, and rollback support.

### Explicitly Out of Scope for V1

- Public user accounts.
- Public anonymous submission forms.
- Site owner claiming.
- Comments.
- Advertising and affiliate placement.
- Complex site scoring.
- Automated large-scale crawling.
- Automated model authenticity judgments.
- Real-time availability monitoring.
- Full extension contribution implementation.
- Multi-reviewer workflow with fine-grained committee approvals.
- External public REST API or SDK.

## SEO And Information Architecture

V1 should produce a small set of high-quality pages with real data, source links, timestamps, and clear internal links. It should not generate hundreds of thin template pages.

### Page Priorities

1. `/directory/pricing/ai-api-models/`
   - Main public comparison asset.
   - Shows model routes, prices, units, source, evidence level, and update time.

2. High-value model pages.
   - Examples: GPT, Claude, Gemini, DeepSeek, Qwen, and other high-query families.
   - Each page answers where the model is available, how much it costs, how evidence was collected, and what risks remain.

3. Site and system detail pages.
   - Start with 8-12 entities that have enough evidence and price/model data.
   - Include both specific commercial/public sites and system/project pages when search intent supports them.

4. Alternatives pages.
   - Examples: OpenRouter alternatives, New API alternatives, One API alternatives.
   - Each page must explain the replacement logic: price, model coverage, protocol compatibility, or lower risk.

5. Risk and authenticity guides.
   - Explain how to judge relay risk.
   - Explain price units, model route evidence, and why cheap does not imply better.

### URL Strategy

Use stable, short, readable English slugs. Do not place Chinese titles in paths.

Recommended structure:

- `/{locale}/directory/`
- `/{locale}/directory/sites/`
- `/{locale}/directory/sites/{siteSlug}/`
- `/{locale}/directory/models/`
- `/{locale}/directory/models/{modelSlug}/`
- `/{locale}/directory/pricing/ai-api-models/`
- `/{locale}/directory/alternatives/{targetSlug}/`
- `/{locale}/guides/ai-api-relay-risk/`
- `/{locale}/guides/model-price-authenticity/`

The default locale strategy must be chosen before implementation. The system must support hreflang and localized metadata from V1.

### Indexing Rules

- SEO-critical pages use fixed paths.
- Sort and filter parameters on list pages are canonicalized to their base route unless a specific landing page is intentionally created.
- Faceted navigation must not create uncontrolled indexable combinations.
- Sitemaps are split by page family: sites, models, pricing, alternatives, guides.
- Only canonical, public, HTTP 200 pages appear in sitemaps.

### Structured Data

Use conservative schema:

- `BreadcrumbList` across public pages.
- `ItemList` for list pages when appropriate.
- `WebPage`, `FAQPage`, or conservative `SoftwareApplication` style metadata for detail pages.
- `Product`, `Offer`, `Review`, or `AggregateRating` only when the visible page content truly supports them and the data is first-party and compliant.

Do not add rating schema for external or inferred reputation.

## Public Page Design

### Homepage

The homepage is a utility entrypoint, not a marketing landing page. It should show:

- Search.
- Entry to the model pricing table.
- Popular or recently updated models.
- Recently updated sites.
- Risk and authenticity guides.
- A restrained All API Hub CTA for users managing multiple sites.

### Model Pricing Comparison

The pricing table is the highest-priority public page.

Default columns:

- Canonical model.
- Site or route provider.
- Route model ID.
- Provider or route type.
- Input price.
- Output price.
- Cache price where applicable.
- Context window.
- Capability badges.
- Verification status.
- Price source.
- Checked or observed time.
- Risk or caution badges.

Price units must be explicit. If two rows have incompatible units, they should not be ranked as one comparable lowest price.

### Model Detail Page

Each model page should show:

- What the model is.
- Known capabilities and limits.
- Official or well-known reference pricing where available.
- Sites and routes that claim, list, observe, or test support.
- Price snapshots by route.
- Evidence level and source.
- Similar or alternative models.
- A CTA to use All API Hub for local route management and ongoing checks.

### Site Detail Page

Site detail pages answer whether a site is worth trying and how to evaluate it.

The first viewport should include:

- Site name and known domains.
- Site or system type.
- Model coverage summary.
- Price update status.
- Evidence level.
- Important cautions.
- Last verified or updated timestamp.

The page should include:

- Endpoints grouped by purpose: homepage, console, API, docs, pricing, recharge, status.
- Model routes and prices.
- Protocol compatibility.
- All API Hub compatibility and supported workflows.
- Capability signals such as model list, balance refresh, sign-in, announcements, key management.
- Sources and evidence.
- Alternatives and related models.

Do not show a single site score. Show separate dimensions: price completeness, model evidence, availability signal, operational transparency, and risk signals.

### Alternatives Pages

Alternatives pages must not be thin SEO templates. They should explain:

- Why users search for alternatives.
- Which candidates are comparable.
- Replacement logic: price, model coverage, protocol compatibility, risk, or tooling.
- Tradeoffs and migration notes.
- Links to site, model, and pricing pages.

### Risk And Authenticity Guides

V1 includes two guides:

- How to evaluate AI API relay site risk.
- How to read model pricing and authenticity evidence.

Guides should teach users:

- Start with small trial amounts.
- Do not store large balances on untrusted sites.
- Low price can mean discount, routing difference, degradation, or risk.
- Model list presence is weaker evidence than tested calls.
- Public information does not replace a user’s own local verification.

## Data Model

The model must separate public brands, endpoints, canonical models, route claims, price observations, evidence, and risk findings. This avoids mixing official models, relay routes, aliases, and unverified claims.

### Site

Represents a public service, brand, system, or project.

Key fields:

- `id`
- `slug`
- `displayName`
- `summary`
- `category`: `official`, `aggregator`, `relay`, `charity`, `self_hosted`, `unknown`
- `siteType`: `one_api`, `new_api`, `one_hub`, `done_hub`, `aihubmix`, `custom`, `unknown`
- `registrationStatus`: `open`, `invite`, `closed`, `unknown`
- `status`: `draft`, `pending_review`, `approved`, `published`, `disputed`, `withdrawn`, `archived`, `rejected`
- `riskLevel`: `unknown`, `low`, `caution`, `high`
- `lastVerifiedAt`
- `createdAt`
- `updatedAt`

### SiteEndpoint

Represents a normalized origin for a specific purpose.

Key fields:

- `siteId`
- `origin`: scheme, hostname, optional port only
- `kind`: `homepage`, `console`, `api`, `docs`, `pricing`, `recharge`, `status`, `unknown`
- `registrableDomain`
- `normalizedHost`
- `status`
- `sourceType`
- `firstSeenAt`
- `lastSeenAt`

Path, query, hash, account IDs, token names, and user-specific URLs are not stored.

### CanonicalModel

Represents a normalized model identity used for model pages and comparison.

Key fields:

- `slug`
- `displayName`
- `family`
- `creator`
- `releaseDate`
- `status`
- `knowledgeCutoff`
- `openWeights`
- `contextWindow`
- `maxOutputTokens`
- `inputModalities`
- `outputModalities`
- `capabilities`
- `description`

Model aliases must map to canonical models, but matching names alone must not imply the same upstream or quality.

### ModelRoute

Represents one site route that claims, lists, observes, or tests support for a canonical model.

Key fields:

- `siteId`
- `endpointId`
- `canonicalModelId`
- `routeModelId`
- `providerType`: `official`, `marketplace`, `reseller`, `self_hosted`, `unknown`
- `upstreamClaim`: `official`, `third_party`, `unknown`
- `factLevel`: `claimed`, `listed`, `observed`, `tested`, `disputed`
- `verificationStatus`: `unverified`, `source_listed`, `observed`, `tested`, `inconsistent`, `disputed`
- `lastObservedAt`
- `status`

Fact levels are semantic constraints, not just UI badges:

- `claimed`: a source or editor says the route exists.
- `listed`: a public or authenticated model list returned the route.
- `observed`: privacy-safe aggregate or system observation saw the route.
- `tested`: a controlled test succeeded.
- `disputed`: conflicting evidence exists or a claim is under review.

### PriceSnapshot

Represents one immutable price observation.

Key fields:

- `modelRouteId`
- `currency`
- `billingUnit`: `per_1m_tokens`, `multiplier`, `request`, `image`, `audio`, `subscription`, `unknown`
- `inputPer1M`
- `outputPer1M`
- `cacheReadPer1M`
- `cacheWritePer1M`
- `reasoningPer1M`
- `requestFee`
- `imageFee`
- `audioFee`
- `webSearchFee`
- `minimumRecharge`
- `freeCredit`
- `discountNote`
- `exchangeRateNote`
- `sourceId`
- `observedAt`
- `effectiveAt`
- `expiresAt`
- `confidence`
- `reviewStatus`

Price snapshots are append-only. Corrections create new snapshots or withdrawal records, not silent edits.

### VerificationEvidence

Represents a source or observation supporting a public fact.

Key fields:

- `targetType`: `site`, `endpoint`, `model_route`, `price`, `capability`, `risk`
- `targetId`
- `sourceType`: `admin`, `seed`, `official_doc`, `public_page`, `public_api`, `extension_observation`, `probe`, `report`
- `sourceUrl`
- `evidenceLevel`: `claimed`, `listed`, `observed`, `tested`, `manually_confirmed`
- `observedAt`
- `expiresAt`
- `reviewStatus`
- `withdrawnAt`
- `withdrawReason`
- `isPublic`

Evidence content uses a strict whitelist. Raw response bodies, request IDs, headers, screenshots with sensitive data, full URLs with paths or queries, token names, account names, balances, and arbitrary logs are rejected or must be manually sanitized before storage.

### SiteCapabilitySignal

Represents support for a feature or workflow.

Key fields:

- `siteId` or `endpointId`
- `capability`: `balance_refresh`, `model_list`, `checkin`, `announcement`, `key_management`, `all_api_hub_add`, `all_api_hub_manage`
- `status`: `supported`, `unsupported`, `unknown`, `inconsistent`
- `sourceCount`
- `lastObservedAt`
- `confidence`
- `reviewStatus`

### RiskSignal

Represents a neutral, evidence-backed risk finding.

Key fields:

- `siteId`
- `riskType`: `low_sample`, `price_missing`, `price_too_low`, `recently_unreachable`, `model_authenticity_unverified`, `claim_observation_mismatch`, `unstable`, `privacy_unknown`, `payment_risk`, `user_report_pending`
- `severity`: `info`, `caution`, `high`
- `status`: `candidate`, `published`, `disputed`, `dismissed`, `archived`
- `sourceId`
- `reviewedBy`
- `reviewedAt`
- `withdrawnAt`
- `withdrawReason`

Risk language must stay neutral unless reviewed evidence supports a stronger statement.

### Published Projection

Public pages and public APIs read from published projections, not editing tables.

The published projection contains only:

- Published public content.
- Public-safe DTO fields.
- Public evidence summaries.
- Public URLs after normalization.
- Public timestamps.

It excludes:

- Candidate data not approved for publication.
- Admin notes.
- Raw evidence.
- Internal review comments.
- Private source metadata.
- Rejected or withdrawn facts unless intentionally shown as public history.

Published projections must be rebuildable from source data.

## Review And Publishing Workflow

All publishable entities follow a constrained lifecycle:

`draft -> pending_review -> approved -> published -> disputed -> archived`

Alternative exits:

- `pending_review -> rejected`
- `published -> withdrawn`
- `disputed -> published`
- `disputed -> withdrawn`

Illegal transitions are rejected by domain logic and database or application constraints.

### Automatic Candidate Layer

Seed imports, admin imports, future extension observations, and public source jobs can create candidate records. Candidate data may include:

- Domain or origin.
- Model routes.
- Price snapshots.
- Protocol compatibility.
- Capability signals.

Candidate data does not create public recommendations, descriptions, risk conclusions, or owner statements.

### Machine-Public Layer

Structured facts may be publicly shown when they pass:

- Schema validation.
- URL normalization.
- Privacy validation.
- Source completeness.
- Review status and publication policy.

Even then, the UI must show evidence level, source category, confidence, and observation time.

### Manual Review Layer

Manual review is required for:

- Site summaries.
- Recommendations.
- Alternatives explanations.
- Owner or maintainer claims.
- External links beyond normalized official endpoints.
- Negative or risk content.
- Any statement that reads like an editorial judgment.

Each admin write creates an append-only audit record.

## Privacy And Data Safety

The site must preserve the current All API Hub privacy posture and avoid creating a new sensitive-data channel.

### Never Store Or Upload

- API keys.
- Access tokens.
- Cookies.
- Authorization headers.
- Account names.
- User IDs.
- Exact account balances.
- Full URLs with paths, query strings, or hashes.
- User notes.
- Request or response bodies.
- Prompt content or model output.
- Raw error stacks.
- Precise per-user site ownership data.

### Future Extension Contribution Constraints

V1 only reserves the data model and API contract. When implemented later, contribution requires:

- Explicit user consent.
- Consent version stored with the contribution.
- Local minimization and redaction before upload.
- Time bucketing or fuzzing.
- No exact user counts.
- Public display only above aggregation thresholds.
- No raw request or response content.
- API version and extension version in the contribution payload.
- Server-side schema rejection for sensitive-looking fields.

## API And Type System

### tRPC

Use tRPC for internal typed APIs:

- `publicRouter` for public published queries.
- `adminRouter` for authenticated and authorized mutations.
- `jobRouter` or service-layer functions for internal jobs.
- Future `contributionRouter` for extension submissions.

Public queries return published DTOs only. Admin mutations must enforce server-side authorization and never rely on hidden UI controls.

### Zod

Every input and output boundary uses Zod:

- URL and origin input.
- Slugs.
- Locale.
- Pagination.
- Sort.
- Status transitions.
- Model route payloads.
- Price snapshots.
- Evidence payloads.
- Risk signals.
- Import files.
- Future extension contribution payloads.
- Public output DTOs.

Zod output schemas are used to prevent accidental database row leakage.

### Error Contract

Use consistent typed errors across routers:

- `BAD_REQUEST`
- `UNAUTHORIZED`
- `FORBIDDEN`
- `NOT_FOUND`
- `CONFLICT`
- `RATE_LIMITED`
- `VALIDATION_FAILED`
- `INTERNAL_ERROR`

Admin-facing errors may include actionable context. Public errors avoid exposing internals.

## Security

V1 security requirements:

- RBAC roles: `viewer`, `editor`, `reviewer`, `admin`.
- Action-level authorization for publish, withdraw, delete, risk changes, and role changes.
- Supabase RLS enabled when Supabase is used.
- Public anon key can read only published views or tables.
- Service role keys never enter browser bundles.
- CSRF/CORS policy for admin and mutation endpoints.
- Rate limiting for public APIs, admin auth, import, and future contribution endpoints.
- Security headers on public and admin routes.
- Admin destructive actions require confirmation.
- Soft-delete and archival for public content and evidence records.
- Audit logs are append-only and not editable by regular admins.

## Frontend Architecture

### i18n

V1 includes native i18n architecture.

- At least `zh-CN` content is shipped.
- `en` is structurally supported from V1.
- Locale-aware URLs, metadata, structured data, sitemap, and hreflang are supported.
- Structured values remain locale-independent.
- Display labels, guide content, summaries, alternatives explanations, and risk explanations are localized.
- Date, number, currency, and price units use locale-aware formatting.
- Layout must tolerate longer translated text.

### Theme

V1 supports light, dark, and system theme.

- Theme preference is stored locally.
- Public and admin surfaces use shared design tokens.
- Colors are not hard-coded inside components.
- Risk, success, warning, neutral, link, text, background, border, and focus tokens are defined.
- Risk indicators are not color-only.

### Component System

Reusable components:

- `SeoPageLayout`
- `PriceTable`
- `ModelRouteTable`
- `EvidenceBadge`
- `RiskBadge`
- `CapabilityBadge`
- `SourceLink`
- `LastObservedTime`
- `SiteCard`
- `EndpointList`
- `AdminReviewQueue`
- `AuditLogTable`
- `StatusTransitionControl`

Data-heavy tables support:

- Server-side filtering and sorting.
- Stable pagination.
- Keyboard-accessible controls.
- Clear price units.
- Mobile responsive card fallback or controlled horizontal scrolling.

### Accessibility

V1 must meet a practical WCAG-minded baseline:

- Keyboard navigable filters and tables.
- Visible focus states.
- Sort state announced in table headers.
- Form controls have labels.
- Badges include text, not color only.
- Dark mode contrast is checked.
- External links are distinguishable.
- CTA hierarchy does not obscure core content.

## Performance And SEO Engineering

SEO-critical public pages must render core content on the server or at build time. They must not rely on client fetches for their main content.

Requirements:

- SSR, SSG, or ISR for public pages.
- CDN caching for published pages.
- On-demand revalidation after publishing.
- Admin routes are not indexed.
- Pricing table uses server-side filtering and sorting.
- Large tables use virtualization or pagination where needed.
- Define Core Web Vitals targets for LCP, INP, and CLS.
- Avoid dark-mode flash.
- Optimize fonts, icons, and table rendering.
- Track 404s, page generation failures, sitemap generation, and metadata correctness.

## Jobs And Data Operations

Jobs must be idempotent and observable.

V1 job categories:

- Seed import.
- Published projection rebuild.
- Sitemap generation.
- Metadata generation checks.
- Optional simple source freshness checks.

Future job categories:

- Public source crawling.
- Extension signal aggregation.
- Availability checks.
- Controlled model route probes.
- Price anomaly detection.

Each job needs:

- Idempotency key.
- Timeout.
- Retry policy.
- Failure status.
- Request or run ID.
- Observable logs.
- Ability to pause a source.

## Observability, Backup, And Rollback

### Observability

Track:

- Web Vitals.
- Public 404 and 500 rates.
- tRPC error rates.
- Zod validation failures.
- Auth failures.
- Rate-limit hits.
- Slow queries.
- Job failures.
- Published projection rebuild failures.
- Evidence nearing expiration.
- Disputed item count.
- Review queue age.
- Admin publish, withdraw, and risk changes.

### Backup

Requirements:

- Daily Postgres backups.
- Point-in-time recovery where available.
- Regular restore drill requirement.
- Evidence, audit logs, and published versions are not physically deleted in normal flows.
- If file storage is used for evidence attachments later, it must have backup and permission audit coverage.

### Rollback

Rollback categories are separate:

- Code rollback.
- Migration rollback or forward-compatible migration.
- Content rollback.
- Published projection rollback.
- Job/source rollback.

Content versioning must support restoring a previous published version of an individual page or entity.

## Testing And Validation

V1 validation should include:

- Type check.
- Lint.
- Unit tests for Zod schemas.
- URL normalization tests.
- Price unit and comparability tests.
- Status transition tests.
- Published projection tests.
- Public API privacy tests.
- Admin RBAC tests.
- Audit log tests for admin mutations.
- Migration from empty database.
- Seed smoke test.
- SEO metadata smoke test.
- Sitemap generation test.
- i18n fallback test.
- Theme token usage check where practical.
- Accessibility checks for key pages and tables.

Key acceptance tests:

- Draft, rejected, archived, and candidate data never appears in public API, sitemap, or SEO pages.
- Every admin mutation writes an audit log.
- Price snapshots are immutable.
- Published pages can be rolled back.
- Public pages still provide core value without All API Hub installed.

## Seed Content Plan

V1 starts with curated data, not broad automation.

Minimum content:

- 10 high-value canonical models.
- 8-12 site or system detail pages with real sources.
- One AI API model pricing comparison page.
- 3 alternatives pages.
- 2 guides.

Seed data must include source URL or source description, observed or updated time, review status, and confidence.

Development seed data and production seed data are separate. Production seed must not ship fake sites or test admins.

## Open Questions Before Implementation Planning

The implementation plan should resolve:

- Exact repository location for the independent project.
- Framework choice confirmation: Next.js plus Postgres/Supabase, or another stack.
- ORM or query layer choice.
- Locale URL strategy.
- Admin authentication provider.
- Deployment target.
- Initial model and site seed list.
- Whether public pages are under a new domain or subdomain.

## Acceptance Summary

The V1 design is acceptable only if it ships as a trusted data publishing system, not just a directory UI.

The system must prove:

- Public pages are independently useful for search users.
- Price and model facts are traceable and timestamped.
- Claims, observations, tests, and disputes are visibly distinct.
- Risk information is neutral, evidence-backed, reviewable, and withdrawable.
- Sensitive user data is never collected.
- All API Hub integration is a useful workflow CTA, not a content gate.
- Engineering boundaries prevent accidental leakage of draft, candidate, private, or admin data.
