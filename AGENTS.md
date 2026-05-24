<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Project Architecture Rules

Keep long-lived architecture rules aligned with
`docs/superpowers/specs/2026-05-24-web-runtime-shell-design.md`.

- Keep UI and shell code presentation-oriented. `src/components` must not
  directly depend on database, service, domain, tRPC, crawler, publishing, or
  rule-parser modules.
- Keep business rule parsing out of UI and route shell code. Pricing,
  capability, risk, provider taxonomy, compatibility, and publishing-state
  rules belong in explicit rule/domain layers defined by later specs.
- Use explicit cross-layer object shapes. Do not pass raw database rows, source
  payloads, or loosely typed dictionaries into UI. Distinguish source payloads,
  parsed canonical inputs, domain objects, public DTOs, admin DTOs, and UI view
  models when those layers are introduced.
- Centralize constants at the smallest stable ownership boundary. Prefer
  feature-local registries/constants unless a vocabulary is genuinely shared
  across layers; do not create broad catch-all global enum files.
- Keep locale, canonical URL, hreflang, sitemap, and robots behavior routed
  through shared helpers and registries. Do not add page-local SEO string
  assembly or cross-locale editorial fallback.
- Error UI must not expose stack traces, digests, provider secrets, internal
  IDs, raw source payloads, or unpublished content.

## UI Copy and Test Selectors

- Route user-facing UI copy through the locale message catalog by default,
  including shell controls, error states, empty states, admin surfaces,
  accessible labels, titles, button labels, and shared component defaults.
  Brand names and protocol/domain constants may remain literal when they are
  not translatable copy.
- Components that call `useTranslations` must be rendered only under a
  matching `NextIntlClientProvider` on every route where they can appear. When
  adding i18n to shared client components, verify both public and entry/admin
  route provider boundaries and keep static routes static when possible.
- Shared UI primitives must not bake in English-only user-facing defaults. If
  they provide default labels such as dialog close text, route those defaults
  through i18n and still allow callers to override the label when needed.
- Workflow-critical tests should avoid mutable visible UI copy for actions and
  selectors. Prefer stable feature-local or component-local `testIds.ts`
  constants for controls such as menus, toggles, and options; assert behavior
  through URL, DOM state, storage, ARIA state, or other stable outcomes.
- Component tests may mock `useTranslations` to return message keys when the
  purpose is to verify i18n wiring. In that case, key-based text assertions are
  acceptable as wiring checks, but do not use real translated copy as the
  primary selector for workflow-critical interactions.
