# Web Runtime Shell Design

## Purpose

Define the long-lived web runtime shell for AI API Directory before public
pages, admin workflows, data publishing, and content models are implemented.
This spec keeps the early application foundation stable enough for SEO,
internationalization, theming, and future authenticated areas without pulling
database, API, auth, or business-page work into the first implementation slice.

The runtime shell must make later pages predictable:

- Public routes follow one locale and URL contract.
- SEO metadata, canonical URLs, hreflang, robots, and sitemap generation use
  centralized helpers instead of page-local string assembly.
- Public SEO layouts stay static-friendly by default.
- Theme and component primitives are reusable across public and admin surfaces.
- UI localization and editorial content localization stay separate concerns.

## Scope

This spec covers:

- Next.js application shell conventions.
- Locale URL strategy and locale registry requirements.
- `next-intl` usage boundaries.
- Public, admin, and root route shell behavior.
- Theme token and base component stack decisions.
- UI, shell, and future business-logic dependency direction.
- Rule parsing, constants, registries, and cross-layer transfer-object
  boundaries.
- SEO runtime helper contracts.
- Robots, sitemap, and noindex ownership at the shell level.
- Global error, segment error, loading, and not-found conventions for the shell.
- Validation expectations for the runtime foundation.

This spec does not cover:

- Database schema.
- tRPC routers.
- Zod DTOs for business data.
- Admin authentication implementation.
- RBAC implementation.
- Published projection generation.
- Seed content.
- Business page components such as pricing tables, site cards, model route
  tables, evidence badges, and risk badges.
- Full content editing and publishing workflow.
- Domain service implementation.
- Concrete business rule parser implementation.
- Final business constants, provider taxonomies, pricing units, capability
  taxonomies, risk rules, or normalization rules.
- Final public, admin, ingestion, and persistence DTO schemas.
- Business error taxonomy, retry policy, logging, and observability pipelines.

## Durable Decisions

These decisions are expensive to change after public pages and admin flows are
built, so later specs should treat them as contracts unless there is a strong
architecture reason to revisit them.

### Framework

Use the existing Next.js stack:

- Next.js 16 App Router.
- React 19.
- Tailwind CSS v4.

This repository notes that the installed Next.js version may differ from older
Next.js conventions. Before implementing runtime shell code, read the relevant
local documentation under `node_modules/next/dist/docs/` and follow current
Next.js 16 behavior rather than memory of older APIs.

### Public URL Shape

Public indexable pages use locale-prefixed paths for the lifetime of the
project:

- `/zh-cn/directory/...`
- `/en/directory/...`
- Future examples: `/ja/...`, `/ko/...`, `/zh-tw/...`

URL locale codes are lowercase path codes. Internal locale identities use
standard BCP 47 style keys. The initial registry maps:

- `zh-cn` -> `zh-CN`
- `en` -> `en`

The locale registry must be the source for:

- URL locale code.
- Internal locale key.
- `html lang`.
- Formatting locale.
- Open Graph locale.
- Hreflang value.
- Public display label.
- Whether a locale is active for public discovery.

Public slugs are stable English identifiers and are not localized. Page titles,
headings, summaries, descriptions, and body content can be localized, but paths
remain stable across languages:

- `/zh-cn/directory/models/gpt-4o`
- `/en/directory/models/gpt-4o`

### Root Entry

`/` is the `x-default` language entry page. It must not force first-time users
or crawlers through an unconditional `Accept-Language` redirect.

The root page may improve user experience by:

- Prioritizing the likely language based on browser language.
- Remembering a user-selected locale preference.
- Offering direct links to active public locales.

These enhancements apply to `/` only. Already localized deep links must remain
stable: `/en/...` stays English and `/zh-cn/...` stays Chinese.

### Admin URL Shape

Admin routes use unprefixed paths:

- `/admin/...`

Admin routes are not public SEO pages and do not use locale-prefixed URLs.
Admin UI language defaults to `zh-CN` in V1 and can later follow an admin user
preference. Admin routes must always be excluded from public indexing.

### Canonical URL Policy

The production origin is configurable through a single `siteUrl` source. The
runtime shell must not hard-code the final domain into individual pages.

Canonical URLs, Open Graph URLs, sitemap URLs, and hreflang alternates must be
generated through one URL helper. The helper owns:

- Joining `siteUrl` and pathnames.
- Normalizing locale path codes.
- Removing trailing slashes except for root `/`.
- Excluding query parameters from canonical URLs by default.
- Allowing future page specs to opt into canonical query parameters only when a
  real landing page requires it.

`/` canonicalizes to `/`. Locale pages canonicalize to their own locale path,
not to `/`.

## Internationalization And Content Languages

### UI Internationalization

Use `next-intl` for runtime UI internationalization:

- UI messages.
- Locale-aware navigation.
- Locale routing helpers where appropriate.
- Date, number, currency, and price unit formatting.
- Metadata translation templates.

`next-intl` must share the same locale registry as the rest of the shell. The
application must not maintain one locale list for routing and another for
messages or metadata.

### Editorial Content Localization

Editorial content localization is separate from UI messages. `next-intl` does
not decide whether a site page, model page, guide, risk explanation, or
alternatives page is publicly available in a locale.

The content system later owns locale-versioned editorial fields such as:

- Page title.
- SEO title and description.
- Site summary.
- Model explanation.
- Risk explanation.
- Alternatives copy.
- Guide body content.

`zh-CN` is the V1 canonical editorial locale. `en` is the first expansion
locale. Future locales must be added through the locale registry and content
version model, not by changing the route shape.

Each locale version has independent visibility. Only a published locale version
can render as an indexable public content page, appear in sitemap output, or be
listed as a hreflang alternate.

Missing editorial content must not fall back across locales. If a model page is
published in `zh-CN` but not in `en`, the application must not render the
Chinese editorial content at `/en/...`.

### Locale Launch Policy

Route support can exist before every locale is publicly discoverable. A locale
is active for public discovery only when its UI shell and at least one
meaningful published content entry are ready.

Inactive or incomplete locales must not appear in:

- Root language entry links.
- Public navigation.
- Sitemap output.
- Hreflang alternates.

If a user explicitly reaches an incomplete locale shell during development or
preview, it must be non-indexable or return not found.

### Locale Switcher

The locale switcher must not route users to fallback editorial content.

When the equivalent page is published in the target locale, switch to that
equivalent page. When it is not published, switch to the nearest useful parent
or index page in the target locale and show a transient UI message that the
specific content is not yet available in that language. This must not create an
indexable placeholder URL for the missing translation.

## Route And Layout Architecture

Use separate root layouts where Next.js needs different `<html>` semantics.
The public locale root must be able to read `[locale]` at the root layout
boundary so server-rendered HTML can emit the correct `html lang` value for
`/zh-cn/...`, `/en/...`, and future locale paths.

Recommended route shape:

```text
src/app/(entry)/layout.tsx
src/app/(entry)/page.tsx
src/app/(entry)/admin/...
src/app/(public)/[locale]/layout.tsx
src/app/(public)/[locale]/...
```

`src/app/(entry)/layout.tsx` owns the non-localized root surfaces:

- `/` language entry.
- `/admin/...` shell.
- Default `<html>` and `<body>` for non-public-locale routes.
- Global styles, font setup, theme bootstrap, and metadata base.

`src/app/(public)/[locale]/layout.tsx` owns the public locale root:

- `<html lang>` derived from the locale registry.
- `<body>` for public locale pages.
- Locale validation.
- Public locale message provider.
- Public navigation shell.
- Theme bootstrap and shared global shell primitives.

Both root layouts must stay provider-light and static-safe. They must not read
request-bound dynamic state such as session, cookies, headers, or uncached
data. Shared concerns such as fonts, theme bootstrap markup, and shell classes
should be implemented in importable helpers so the two root layouts do not
drift.

Navigating between root layouts can cause a full page load in Next.js. This is
acceptable for transitions between public locale pages and `/admin` or `/`,
because those are cross-area transitions. Navigation within public locale pages
should remain inside the public root layout.

The admin layout under `(entry)` renders the admin shell, marks admin pages as
noindex, and reserves future auth and permission surfaces. Future user account
areas must use their own route segment and layout so authenticated user state
does not make public SEO pages dynamic.

Unsupported locale path codes return not found at the `[locale]` boundary.
Do not rely on global automatic language redirects for localized deep links.

## Rendering And Client Boundaries

Public shell routes should be static and prerender-friendly by default.

Public layouts must avoid:

- Reading `cookies()`.
- Reading `headers()`.
- Reading session data.
- Fetching uncached user-specific data.
- Mounting broad client providers that force page content into the client
  bundle.

Client components are allowed for focused interactivity:

- Theme toggle.
- Locale switcher interaction.
- Mobile navigation.
- Radix or shadcn interactive primitives.

The default posture is Server Components for layout and content shell, with
small client islands for controls that require browser state.

## UI And Business Logic Boundaries

The runtime shell sets dependency direction before business features exist.
UI components, shell components, and route presentation must not become the
home for business rules.

Allowed dependencies:

- `src/components/ui/*` depends only on React, local styling utilities,
  accessible primitives, and tokenized CSS.
- `src/components/shell/*` depends on routing, locale metadata, message
  rendering, theme controls, and UI primitives.
- Route segments compose shell components, metadata helpers, and later
  server-side loaders or actions.
- Future business use cases, service logic, validation, persistence,
  publishing, crawling, pricing rules, and admin workflows live outside the UI
  component layer.

Presentation components should receive props or view models that are already
safe to render. They should not directly call the database, ORM, crawler,
publishing pipeline, provider APIs, or future tRPC/server-action business
entrypoints. Later specs may add server-side loaders, domain services, or
application use-case modules, but those modules must remain upstream of UI.

This spec may define placeholder shell pages and basic view-state surfaces. It
must not define the final domain model, persistence model, admin workflow, or
business error taxonomy.

## Rules, Constants, And Transfer Objects

Future specs will need rule parsing for pricing, model availability,
capabilities, evidence, risk labels, provider compatibility, and content
publication state. Those rules must not be embedded inside UI components,
route files, database access code, or ad hoc string checks.

The long-term dependency direction is:

1. Constants and registries define stable vocabularies.
2. Parsing and normalization code converts raw source data into canonical
   internal shapes.
3. Domain or application services apply business rules to canonical data.
4. Public/admin loaders create explicit DTOs or view models for the UI.
5. UI components render those DTOs without re-parsing business semantics.

Constants should be centralized at the smallest stable ownership boundary. Use
feature-local constants when a vocabulary belongs to one feature, and shared
registries only when multiple layers or features depend on the same terms. Do
not create broad catch-all global enum files.

Cross-layer data transfer must use named object shapes rather than passing raw
database rows, source payloads, or loosely typed dictionaries across layers.
Later specs should distinguish at least these object families:

- Source payloads from crawlers, imports, manual admin input, or provider
  observations.
- Parsed canonical inputs used by rule parsers.
- Domain entities or value objects used by business services.
- Public DTOs safe for indexable pages and public APIs.
- Admin DTOs that may include review, audit, draft, and permission metadata.
- UI view models shaped for a specific page or component.

Public DTOs must not expose admin-only fields, source secrets, unpublished
editorial content, raw provider responses, or persistence-only implementation
details. UI view models can be denormalized for display, but they must be
created at a loader or presenter boundary rather than inside low-level UI
components.

This runtime shell spec may define only the boundary policy and, where useful,
lightweight folder or naming conventions. Concrete parser modules, constants,
DTO fields, validation schemas, and rule behavior belong to later business
data, publishing, admin, and page specs.

## Theme System

V1 supports:

- Light theme.
- Dark theme.
- System theme.

Themes are implemented with centralized CSS variables and Tailwind v4 token
integration. Colors must be editable in one place without rewriting component
code.

Use layered tokens:

1. Raw theme variables in `:root` and dark selectors.
2. Tailwind `@theme` or equivalent Tailwind v4 mappings.
3. Semantic tokens consumed by components.
4. shadcn-compatible component variables where needed.

Recommended semantic token categories:

- Background.
- Surface.
- Text.
- Muted text.
- Border.
- Focus.
- Link.
- Brand.
- Success.
- Warning.
- Danger.
- Neutral.
- Risk low.
- Risk caution.
- Risk high.

Components must consume semantic tokens rather than hard-coded color values.
Risk, evidence, and status UI must not communicate state with color alone.

Theme preference is stored locally. The public shell must avoid visible
dark-mode flash as much as practical without making public layouts depend on
server-side user state.

## Component Foundation

Use a local shadcn/ui-style component library backed by accessible interaction
primitives, Tailwind v4 tokens, and `lucide-react` icons. Radix is an explicit
accessibility primitive boundary for controls such as dialogs, menus, tabs, and
tooltips, but the exact package names and import style should follow the
current shadcn CLI or registry output instead of being treated as a permanent
architecture contract.

The component foundation is local project code, not an opaque external design
system. Components can be adapted to this site's density, accessibility,
theme, and content needs.

Sub-spec 1 may define or install base primitives such as:

- Button.
- Input.
- Label.
- Select.
- Dialog.
- Dropdown menu.
- Tabs.
- Tooltip.
- Sheet.
- Table shell.
- Form shell.
- Badge shell.

Do not wrap every Next.js built-in preemptively. Project-owned wrappers are
required only where a durable cross-cutting policy exists. Sub-spec 1 should
create navigation wrappers for:

- Internal localized application links, so locale handling, typed routes,
  prefetch policy, future analytics, and canonical route conventions have one
  project boundary.
- External links, so `target`, `rel`, iconography, security behavior, and
  future outbound tracking stay consistent.

Other framework components such as `Image`, `Script`, and form helpers should
remain direct Next.js usage until a concrete project policy emerges for remote
assets, third-party scripts, analytics, upload handling, or form validation.
Avoid empty pass-through wrappers that only hide Next.js behavior.

Business components are out of scope for this spec. Later specs own components
such as:

- `PriceTable`.
- `ModelRouteTable`.
- `EvidenceBadge`.
- `RiskBadge`.
- `CapabilityBadge`.
- `SourceLink`.
- `LastObservedTime`.
- `SiteCard`.
- `EndpointList`.
- `AdminReviewQueue`.
- `AuditLogTable`.
- `StatusTransitionControl`.

## SEO Runtime Contracts

The runtime shell owns helper contracts and route placement, not the final
business data that feeds them.

### Metadata Helper

Create a central metadata helper that returns Next.js `Metadata` objects. The
helper should accept:

- Locale identity.
- Canonical path.
- Available locale alternates.
- Robots policy.
- Title.
- Description.
- Open Graph title, description, image, and URL inputs.
- Optional page-type metadata needed by later specs.

Pages should not manually assemble canonical tags, alternate links, or Open
Graph URLs.

Metadata source precedence for later content pages is:

1. Published editorial metadata for the current locale.
2. `next-intl` UI templates.
3. Deterministic safe defaults.

Missing editorial metadata should not crash runtime rendering, but SEO-critical
publish flows should flag it before publication.

### Hreflang

Hreflang alternates include only published locale versions for the same stable
slug or entity. Do not emit alternates for missing translations, draft pages,
withdrawn pages, archived pages, or fallback content.

`x-default` belongs to the root language entry and other deliberately global
pages only. It must not be blindly emitted for every content page.

### Robots And Sitemap

The runtime shell defines:

- `robots.ts` route ownership.
- Sitemap index route ownership.
- The interface later data specs use to provide sitemap records.
- Default exclusion rules.

The runtime shell does not implement database-backed sitemap generation.

Default noindex or exclusion categories:

- `/admin/**`.
- Protected preview routes.
- Draft content.
- Pending review content.
- Rejected content.
- Withdrawn content unless a later spec intentionally publishes history.
- Archived content unless a later spec intentionally publishes history.
- Shell placeholders.
- Error routes.
- Incomplete locale pages.

Published public content pages are indexable by default unless a later
business spec explicitly marks a page family otherwise.

### Structured Data

Sub-spec 1 may provide safe JSON-LD helper boundaries for shell-level data:

- `WebSite`.
- `BreadcrumbList`.

Entity-specific schemas such as product, offer, review, aggregate rating, or
software application metadata are deferred to later business page and data
model specs. They must only be used when visible page content and source data
justify them.

## Error, Loading, And Not Found

The shell must define conventions for:

- A root `global-error` fallback for errors that escape root layouts.
- Public localized not-found pages.
- Public localized error boundaries.
- Public loading states where route segments need them.
- Admin not-found pages.
- Admin error boundaries.
- Admin loading states.

Next.js segment `error` boundaries do not catch errors in the same segment's
layout. Root-layout failures require the root `global-error` file, which must
render its own `<html>` and `<body>` and keep dependencies minimal.

Admin error and not-found surfaces must be noindex. Public not-found pages must
not appear in sitemaps or hreflang alternates. Global and segment error
surfaces should show useful recovery actions without exposing stack traces,
internal IDs, provider secrets, unpublished content, or implementation details.

The shell owns presentation-level error fallbacks only. Later specs own:

- Domain error categories.
- API and server-action error normalization.
- Form-field error mapping.
- Retry/backoff policy.
- Logging, alerting, and observability sinks.

These shell states can use minimal UI in this spec. Detailed copy and business
recovery behavior can be refined in later page specs.

## Deployment Runtime Posture

Assume a Node.js runtime on Vercel-compatible Next.js hosting for the shell.
Do not opt into Edge runtime by default. Future database, auth, admin, and job
work will be easier to integrate with a Node-first posture unless a concrete
Edge requirement appears.

## Validation Expectations

The implementation plan for this spec should include focused validation that
proves the runtime contracts are hard to accidentally bypass.

Validation should cover:

- Locale registry maps URL code, internal locale, `html lang`, formatting
  locale, Open Graph locale, and hreflang consistently.
- Unsupported locale path codes return not found.
- `/` remains a language entry and does not force deep-link redirects.
- `/admin/**` is noindex.
- Public locale pages use locale-prefixed URLs.
- Canonical URL helper normalizes `siteUrl`, trailing slash behavior, and
  query handling.
- Hreflang helper includes only published locale versions.
- Public layouts do not read request-bound user state.
- Public and entry root layouts stay provider-light.
- UI and shell components do not directly depend on database, provider,
  crawler, publishing, or admin workflow modules.
- Rule parsing, constant registries, and DTO/view-model conversion boundaries
  are not bypassed by page or component code.
- Theme tokens are centralized and component styles consume semantic tokens.
- Base UI components integrate with the shadcn-selected accessible primitive
  base, Tailwind tokens, and accessibility expectations.
- Global and segment error fallbacks avoid leaking implementation details and
  remain usable without business data.
- Placeholder, preview, unpublished, and incomplete locale pages cannot enter
  sitemap output.

## Open Items For Later Specs

Later specs must define:

- Exact database tables and locale-versioned content model.
- Published projection rebuild rules.
- Admin authentication and RBAC.
- Content editing and publishing workflow.
- Business page components and page-level information architecture.
- Seed content and production content readiness criteria.
- Entity-specific structured data.
- Deployment domain and final `siteUrl` value.
- Future public user-account route shape if user accounts become part of the
  product.
- Concrete rule parser modules and their test matrix.
- Shared and feature-local constant registries.
- Source, canonical, domain, public DTO, admin DTO, and UI view-model schemas.

## Acceptance Summary

This runtime shell design is acceptable when it gives later implementation
slices a stable contract for URLs, locales, theming, base components, metadata,
and SEO safety without prematurely implementing the data or admin systems.

The shell must make these properties true by design:

- Public pages are locale-explicit.
- Missing translations do not become fallback SEO pages.
- Canonical and alternate URLs come from shared helpers.
- Public layouts remain static-friendly.
- Admin and future authenticated areas cannot accidentally make public SEO
  pages dynamic.
- UI and shell layers remain presentation-oriented and do not absorb business
  rules.
- Constants, rule parsing, and cross-layer transfer objects have explicit
  ownership boundaries.
- Theme colors can be changed centrally.
- Base interactive components share accessible primitives and tokenized
  styling.
- Root-layout and segment failures have bounded, user-facing fallbacks.
