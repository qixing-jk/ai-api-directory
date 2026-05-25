# Domain Publishing Policy Kernel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a pure TypeScript domain and publishing policy kernel that encodes canonical vocabularies, publishable lifecycle rules, privacy-safe public boundaries, publish eligibility, rollback planning, and projection rebuild ordering metadata.

**Architecture:** Keep this slice below UI, routes, storage, API, jobs, auth, and admin workflow implementation. The kernel is a set of focused TypeScript modules under `src/domain` with colocated Vitest tests, using existing `~/` path aliases only where cross-module imports need them. Public projection assembly is represented as an in-memory boundary and validation contract, not persisted storage or real rebuild execution.

**Tech Stack:** TypeScript strict mode, Vitest, existing Next.js app repository conventions, existing locale registry in `src/i18n/locales.ts`.

---

## Source Specs

Primary specs:

- `docs/superpowers/specs/2026-05-24-ai-api-directory-canonical-domain-model-design.md`
- `docs/superpowers/specs/2026-05-24-ai-api-directory-publishing-workflow-design.md`

Supporting context:

- `docs/superpowers/specs/2026-05-24-web-runtime-shell-design.md`
- `docs/superpowers/specs/2026-05-23-ai-api-directory-design.md`

If the historical `2026-05-23` design conflicts with either `2026-05-24` spec, prefer the newer specs.

## Current Repository Context

The repository already has:

- `src/i18n/locales.ts`: locale registry with route locales, app locales, and `publicDiscovery`.
- `src/seo/*`: pure helper modules with colocated `*.test.ts` files.
- `vitest.config.ts`: includes `src/**/*.test.ts` and `src/**/*.test.tsx`, uses `jsdom`, and configures the `~` alias.
- `package.json` scripts:
  - `pnpm test:run`
  - `pnpm lint`
  - `pnpm build`
  - `pnpm validate`

Follow the existing helper style:

- Pure functions with explicit exported types.
- Colocated tests next to source files.
- Errors use clear message strings.
- No database, network, route, React, or browser APIs in pure policy modules.
- Use `~/i18n/locales` when policy needs locale registry data.

## Scope Boundary

This plan implements only the testable policy/domain layer.

This plan must not implement:

- Database schema or migrations.
- Admin UI.
- Auth or RBAC.
- tRPC routers or public APIs.
- Job runners.
- Persisted projection storage.
- Sitemap generation from database records.
- Real admin workflows.
- Real ingestion, crawler, extension upload, or source parser modules.
- Business page components.

The kernel may define in-memory input/output types that later DB/API/UI specs can map to.

## Maintainability Rule: Registry-Owned String Values

Do not scatter domain string literals across policy modules. Each stable
vocabulary must have one owner module that exports:

- a named `as const` object for individual values, such as
  `publishableLifecycle.published`;
- an array derived from that object with `Object.values(...)` when iteration is
  needed;
- a union type derived from the object values;
- predicate helpers that read from the derived array.

Policy modules and tests should import these registries instead of repeating
lifecycle states, error codes, projection reasons, projection families, private
field names, or policy failure messages. String literals are acceptable only in
the registry owner and in a focused registry test that proves the external
contract matches the spec.

## File Structure

Create these files:

- `src/domain/errors.ts`: shared domain error type and helpers.
- `src/domain/vocabularies.ts`: constrained lifecycle, fact-level, evidence-level, candidate disposition, and signal disposition vocabularies.
- `src/domain/vocabularies.test.ts`: vocabulary guard tests.
- `src/domain/lifecycle.ts`: publishable lifecycle transition graph and transition helpers.
- `src/domain/lifecycle.test.ts`: transition policy tests.
- `src/domain/privacy/url-policy.ts`: public source URL normalization and privacy policy.
- `src/domain/privacy/url-policy.test.ts`: URL privacy tests.
- `src/domain/publishing/types.ts`: stable entity, publishable version, locale version, command, publication event, and projection planning types.
- `src/domain/publishing/eligibility.ts`: publish eligibility and public visibility rules.
- `src/domain/publishing/eligibility.test.ts`: publication gate tests.
- `src/domain/projection/public-boundary.ts`: public projection DTO boundary and admin/private field rejection.
- `src/domain/projection/public-boundary.test.ts`: projection privacy boundary tests.
- `src/domain/publishing/rollback.ts`: rollback planning as a special publication command.
- `src/domain/publishing/rollback.test.ts`: rollback policy tests.
- `src/domain/publishing/projection-plan.ts`: projection rebuild planning metadata and ordering policy.
- `src/domain/publishing/projection-plan.test.ts`: rebuild planning and stale ordering tests.

Do not modify existing UI, route, SEO, or i18n files except if TypeScript imports later require type-only export cleanup. This plan should not require such changes.

## Task 1: Canonical Vocabularies And Domain Errors

**Files:**

- Create: `src/domain/errors.ts`
- Create: `src/domain/vocabularies.ts`
- Create: `src/domain/vocabularies.test.ts`

- [ ] **Step 1: Write failing vocabulary and error tests**

Create `src/domain/vocabularies.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { DomainPolicyError, domainPolicyErrorCode } from "./errors";
import {
  candidateDisposition,
  candidateDispositions,
  evidenceLevel,
  evidenceLevels,
  factLevel,
  factLevels,
  isCandidateDisposition,
  isEvidenceLevel,
  isFactLevel,
  isPublishableLifecycle,
  isSignalDisposition,
  publishableLifecycle,
  publishableLifecycles,
  signalDisposition,
  signalDispositions,
} from "./vocabularies";

describe("domain vocabularies", () => {
  it("exposes the constrained publishable lifecycle vocabulary", () => {
    expect(publishableLifecycles).toEqual([
      "draft",
      "pending_review",
      "approved",
      "published",
      "disputed",
      "withdrawn",
      "archived",
      "rejected",
    ]);

    expect(isPublishableLifecycle(publishableLifecycle.published)).toBe(true);
    expect(isPublishableLifecycle(candidateDisposition.candidate)).toBe(false);
  });

  it("keeps model route fact levels separate from evidence provenance", () => {
    expect(factLevels).toEqual([
      "claimed",
      "listed",
      "observed",
      "tested",
      "disputed",
    ]);
    expect(evidenceLevels).toEqual([
      "claimed",
      "listed",
      "observed",
      "tested",
      "manually_confirmed",
    ]);

    expect(isFactLevel(factLevel.tested)).toBe(true);
    expect(isFactLevel(evidenceLevel.manuallyConfirmed)).toBe(false);
    expect(isEvidenceLevel(evidenceLevel.manuallyConfirmed)).toBe(true);
  });

  it("keeps candidate and signal dispositions out of publishable lifecycle", () => {
    expect(candidateDispositions).toEqual([
      "candidate",
      "ready_for_review",
      "merged",
      "dismissed",
    ]);
    expect(signalDispositions).toEqual([
      "active",
      "superseded",
      "dismissed",
      "withdrawn",
    ]);

    expect(isCandidateDisposition(candidateDisposition.candidate)).toBe(true);
    expect(isPublishableLifecycle(candidateDisposition.candidate)).toBe(false);
    expect(isSignalDisposition(signalDisposition.dismissed)).toBe(true);
    expect(isPublishableLifecycle(signalDisposition.dismissed)).toBe(false);
  });

  it("uses a typed domain policy error for illegal policy operations", () => {
    const error = new DomainPolicyError(
      domainPolicyErrorCode.illegalTransition,
      "Cannot publish",
    );

    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe("DomainPolicyError");
    expect(error.code).toBe(domainPolicyErrorCode.illegalTransition);
    expect(error.message).toBe("Cannot publish");
  });
});
```

- [ ] **Step 2: Run tests and verify they fail**

Run:

```powershell
pnpm vitest run src/domain/vocabularies.test.ts
```

Expected:

- Exit code is non-zero.
- Failure mentions that `src/domain/errors.ts` or `src/domain/vocabularies.ts` cannot be resolved.

- [ ] **Step 3: Add domain error implementation**

Create `src/domain/errors.ts`:

```ts
export const domainPolicyErrorCode = {
  illegalTransition: "illegal_transition",
  privacyViolation: "privacy_violation",
  publicationNotAllowed: "publication_not_allowed",
  projectionBoundaryViolation: "projection_boundary_violation",
  projectionConflict: "projection_conflict",
  rollbackNotAllowed: "rollback_not_allowed",
} as const;

export const domainPolicyErrorCodes = Object.values(domainPolicyErrorCode);

export type DomainPolicyErrorCode =
  (typeof domainPolicyErrorCode)[keyof typeof domainPolicyErrorCode];

export class DomainPolicyError extends Error {
  readonly code: DomainPolicyErrorCode;

  constructor(code: DomainPolicyErrorCode, message: string) {
    super(message);
    this.name = "DomainPolicyError";
    this.code = code;
  }
}
```

- [ ] **Step 4: Add vocabulary implementation**

Create `src/domain/vocabularies.ts`:

```ts
export type ValueOf<T> = T[keyof T];

export const publishableLifecycle = {
  draft: "draft",
  pendingReview: "pending_review",
  approved: "approved",
  published: "published",
  disputed: "disputed",
  withdrawn: "withdrawn",
  archived: "archived",
  rejected: "rejected",
} as const;

export type PublishableLifecycle = ValueOf<typeof publishableLifecycle>;
export const publishableLifecycles = Object.values(publishableLifecycle);

export const factLevel = {
  claimed: "claimed",
  listed: "listed",
  observed: "observed",
  tested: "tested",
  disputed: "disputed",
} as const;

export type FactLevel = ValueOf<typeof factLevel>;
export const factLevels = Object.values(factLevel);

export const evidenceLevel = {
  claimed: "claimed",
  listed: "listed",
  observed: "observed",
  tested: "tested",
  manuallyConfirmed: "manually_confirmed",
} as const;

export type EvidenceLevel = ValueOf<typeof evidenceLevel>;
export const evidenceLevels = Object.values(evidenceLevel);

export const candidateDisposition = {
  candidate: "candidate",
  readyForReview: "ready_for_review",
  merged: "merged",
  dismissed: "dismissed",
} as const;

export type CandidateDisposition = ValueOf<typeof candidateDisposition>;
export const candidateDispositions = Object.values(candidateDisposition);

export const signalDisposition = {
  active: "active",
  superseded: "superseded",
  dismissed: "dismissed",
  withdrawn: "withdrawn",
} as const;

export type SignalDisposition = ValueOf<typeof signalDisposition>;
export const signalDispositions = Object.values(signalDisposition);

function includesValue<T extends readonly string[]>(
  values: T,
  value: string,
): value is T[number] {
  return values.includes(value as T[number]);
}

export function isPublishableLifecycle(
  value: string,
): value is PublishableLifecycle {
  return includesValue(publishableLifecycles, value);
}

export function isFactLevel(value: string): value is FactLevel {
  return includesValue(factLevels, value);
}

export function isEvidenceLevel(value: string): value is EvidenceLevel {
  return includesValue(evidenceLevels, value);
}

export function isCandidateDisposition(
  value: string,
): value is CandidateDisposition {
  return includesValue(candidateDispositions, value);
}

export function isSignalDisposition(value: string): value is SignalDisposition {
  return includesValue(signalDispositions, value);
}
```

- [ ] **Step 5: Run vocabulary tests**

Run:

```powershell
pnpm vitest run src/domain/vocabularies.test.ts
```

Expected:

- Exit code `0`.
- All tests in `src/domain/vocabularies.test.ts` pass.

- [ ] **Step 6: Run focused validation**

Run:

```powershell
pnpm lint
pnpm test:run
```

Expected:

- Both commands exit `0`.

- [ ] **Step 7: Commit**

Run:

```powershell
git add src/domain/errors.ts src/domain/vocabularies.ts src/domain/vocabularies.test.ts
git commit -m "feat(domain): add canonical vocabularies"
```

## Task 2: Publishable Lifecycle Transition Policy

**Files:**

- Create: `src/domain/lifecycle.ts`
- Create: `src/domain/lifecycle.test.ts`

- [ ] **Step 1: Write failing lifecycle tests**

Create `src/domain/lifecycle.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { DomainPolicyError } from "./errors";
import {
  assertCanTransition,
  canTransition,
  getAllowedNextLifecycles,
} from "./lifecycle";
import { publishableLifecycle } from "./vocabularies";

describe("publishable lifecycle policy", () => {
  it("allows only the transition graph defined by the publishing spec", () => {
    expect(
      canTransition(
        publishableLifecycle.draft,
        publishableLifecycle.pendingReview,
      ),
    ).toBe(true);
    expect(
      canTransition(
        publishableLifecycle.pendingReview,
        publishableLifecycle.approved,
      ),
    ).toBe(true);
    expect(
      canTransition(
        publishableLifecycle.approved,
        publishableLifecycle.published,
      ),
    ).toBe(true);
    expect(
      canTransition(
        publishableLifecycle.published,
        publishableLifecycle.disputed,
      ),
    ).toBe(true);
    expect(
      canTransition(
        publishableLifecycle.published,
        publishableLifecycle.withdrawn,
      ),
    ).toBe(true);
    expect(
      canTransition(
        publishableLifecycle.published,
        publishableLifecycle.archived,
      ),
    ).toBe(true);
    expect(
      canTransition(
        publishableLifecycle.disputed,
        publishableLifecycle.published,
      ),
    ).toBe(true);
    expect(
      canTransition(
        publishableLifecycle.withdrawn,
        publishableLifecycle.pendingReview,
      ),
    ).toBe(true);
    expect(
      canTransition(
        publishableLifecycle.rejected,
        publishableLifecycle.draft,
      ),
    ).toBe(true);
    expect(
      canTransition(
        publishableLifecycle.archived,
        publishableLifecycle.draft,
      ),
    ).toBe(true);
  });

  it("rejects illegal lifecycle shortcuts", () => {
    expect(
      canTransition(
        publishableLifecycle.draft,
        publishableLifecycle.published,
      ),
    ).toBe(false);
    expect(
      canTransition(
        publishableLifecycle.rejected,
        publishableLifecycle.published,
      ),
    ).toBe(false);
    expect(
      canTransition(
        publishableLifecycle.withdrawn,
        publishableLifecycle.published,
      ),
    ).toBe(false);
    expect(
      canTransition(
        publishableLifecycle.archived,
        publishableLifecycle.published,
      ),
    ).toBe(false);
  });

  it("throws a domain policy error for illegal transitions", () => {
    expect(() =>
      assertCanTransition(
        publishableLifecycle.draft,
        publishableLifecycle.published,
      ),
    ).toThrow(DomainPolicyError);
    expect(() =>
      assertCanTransition(
        publishableLifecycle.draft,
        publishableLifecycle.published,
      ),
    ).toThrow(
      `Illegal lifecycle transition: ${publishableLifecycle.draft} -> ${publishableLifecycle.published}`,
    );
  });

  it("returns allowed next states without sharing mutable arrays", () => {
    const first = getAllowedNextLifecycles(publishableLifecycle.published);
    const second = getAllowedNextLifecycles(publishableLifecycle.published);

    expect(first).toEqual([
      publishableLifecycle.disputed,
      publishableLifecycle.withdrawn,
      publishableLifecycle.archived,
    ]);
    expect(first).not.toBe(second);
  });
});
```

- [ ] **Step 2: Run tests and verify they fail**

Run:

```powershell
pnpm vitest run src/domain/lifecycle.test.ts
```

Expected:

- Exit code is non-zero.
- Failure mentions that `src/domain/lifecycle.ts` cannot be resolved.

- [ ] **Step 3: Implement lifecycle transition policy**

Create `src/domain/lifecycle.ts`:

```ts
import { DomainPolicyError, domainPolicyErrorCode } from "./errors";
import {
  publishableLifecycle,
  type PublishableLifecycle,
} from "./vocabularies";

const transitionGraph = {
  [publishableLifecycle.draft]: [
    publishableLifecycle.pendingReview,
    publishableLifecycle.archived,
  ],
  [publishableLifecycle.pendingReview]: [
    publishableLifecycle.approved,
    publishableLifecycle.draft,
    publishableLifecycle.rejected,
  ],
  [publishableLifecycle.approved]: [
    publishableLifecycle.draft,
    publishableLifecycle.published,
  ],
  [publishableLifecycle.published]: [
    publishableLifecycle.disputed,
    publishableLifecycle.withdrawn,
    publishableLifecycle.archived,
  ],
  [publishableLifecycle.disputed]: [
    publishableLifecycle.published,
    publishableLifecycle.withdrawn,
    publishableLifecycle.archived,
  ],
  [publishableLifecycle.withdrawn]: [
    publishableLifecycle.pendingReview,
    publishableLifecycle.archived,
  ],
  [publishableLifecycle.rejected]: [publishableLifecycle.draft],
  [publishableLifecycle.archived]: [publishableLifecycle.draft],
} as const satisfies Record<
  PublishableLifecycle,
  readonly PublishableLifecycle[]
>;

export function getAllowedNextLifecycles(
  from: PublishableLifecycle,
): PublishableLifecycle[] {
  return [...transitionGraph[from]];
}

export function canTransition(
  from: PublishableLifecycle,
  to: PublishableLifecycle,
): boolean {
  return transitionGraph[from].includes(to);
}

export function assertCanTransition(
  from: PublishableLifecycle,
  to: PublishableLifecycle,
): void {
  if (!canTransition(from, to)) {
    throw new DomainPolicyError(
      domainPolicyErrorCode.illegalTransition,
      `Illegal lifecycle transition: ${from} -> ${to}`,
    );
  }
}
```

- [ ] **Step 4: Run lifecycle tests**

Run:

```powershell
pnpm vitest run src/domain/lifecycle.test.ts
```

Expected:

- Exit code `0`.
- All lifecycle transition tests pass.

- [ ] **Step 5: Run focused validation**

Run:

```powershell
pnpm lint
pnpm test:run
```

Expected:

- Both commands exit `0`.

- [ ] **Step 6: Commit**

Run:

```powershell
git add src/domain/lifecycle.ts src/domain/lifecycle.test.ts
git commit -m "feat(domain): add lifecycle transition policy"
```

## Task 3: Privacy-Safe Public Source URL Policy

**Files:**

- Create: `src/domain/privacy/url-policy.ts`
- Create: `src/domain/privacy/url-policy.test.ts`

- [ ] **Step 1: Write failing URL privacy tests**

Create `src/domain/privacy/url-policy.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { DomainPolicyError } from "../errors";
import {
  normalizePublicSourceUrl,
  normalizeUrlToOrigin,
  validatePublicSourceUrl,
} from "./url-policy";

describe("public source URL policy", () => {
  it("normalizes user-observed URLs to origin only", () => {
    expect(
      normalizeUrlToOrigin(
        "https://api.example.com/account/123?token=secret#private",
      ),
    ).toBe("https://api.example.com");
  });

  it("keeps reviewed public paths while removing query strings and hashes", () => {
    expect(
      normalizePublicSourceUrl(
        "https://docs.example.com/pricing/openai?utm=ad#table",
      ),
    ).toBe("https://docs.example.com/pricing/openai");
  });

  it("removes trailing slashes from public source paths except origin", () => {
    expect(normalizePublicSourceUrl("https://docs.example.com/pricing/")).toBe(
      "https://docs.example.com/pricing",
    );
    expect(normalizePublicSourceUrl("https://docs.example.com/")).toBe(
      "https://docs.example.com",
    );
  });

  it("rejects unsupported protocols and credential-bearing URLs", () => {
    expect(() => normalizePublicSourceUrl("ftp://example.com/pricing")).toThrow(
      DomainPolicyError,
    );
    expect(() =>
      normalizePublicSourceUrl("https://user:pass@example.com/pricing"),
    ).toThrow("Public source URL must not include credentials");
  });

  it("rejects credential-like and user-specific public paths", () => {
    expect(() =>
      normalizePublicSourceUrl("https://docs.example.com/users/123/pricing"),
    ).toThrow("Public source URL path is not public-safe");

    expect(() =>
      normalizePublicSourceUrl("https://docs.example.com/api/sk-abc123"),
    ).toThrow("Public source URL path is not public-safe");
  });

  it("returns a validation result instead of throwing when requested", () => {
    expect(validatePublicSourceUrl("https://docs.example.com/pricing")).toEqual({
      ok: true,
      value: "https://docs.example.com/pricing",
    });
    expect(validatePublicSourceUrl("https://docs.example.com/user/42")).toEqual({
      ok: false,
      reason: "Public source URL path is not public-safe",
    });
  });
});
```

- [ ] **Step 2: Run tests and verify they fail**

Run:

```powershell
pnpm vitest run src/domain/privacy/url-policy.test.ts
```

Expected:

- Exit code is non-zero.
- Failure mentions that `src/domain/privacy/url-policy.ts` cannot be resolved.

- [ ] **Step 3: Implement URL privacy policy**

Create `src/domain/privacy/url-policy.ts`:

```ts
import { DomainPolicyError, domainPolicyErrorCode } from "../errors";

export type UrlPolicyResult =
  | { ok: true; value: string }
  | { ok: false; reason: string };

export const urlPolicyViolationReason = {
  absoluteUrlRequired: "Public source URL must be an absolute URL",
  unsupportedProtocol: "Public source URL must use http or https",
  credentialsForbidden: "Public source URL must not include credentials",
  unsafePublicPath: "Public source URL path is not public-safe",
} as const;

const unsafePathPatterns = [
  /(^|\/)(user|users|account|accounts|profile|profiles|dashboard|admin)(\/|$)/i,
  /(^|\/)(token|tokens|key|keys|secret|secrets)(\/|$)/i,
  /(^|\/)(sk-[a-z0-9_-]+)/i,
  /(^|\/)(Bearer%20|Bearer-)/i,
];

function parseHttpUrl(rawUrl: string): URL {
  let url: URL;

  try {
    url = new URL(rawUrl);
  } catch {
    throw new DomainPolicyError(
      domainPolicyErrorCode.privacyViolation,
      urlPolicyViolationReason.absoluteUrlRequired,
    );
  }

  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new DomainPolicyError(
      domainPolicyErrorCode.privacyViolation,
      urlPolicyViolationReason.unsupportedProtocol,
    );
  }

  if (url.username || url.password) {
    throw new DomainPolicyError(
      domainPolicyErrorCode.privacyViolation,
      urlPolicyViolationReason.credentialsForbidden,
    );
  }

  return url;
}

function stripTrailingSlash(pathname: string): string {
  if (pathname === "/" || pathname === "") return "";
  return pathname.replace(/\/+$/, "");
}

function assertPublicSafePath(pathname: string): void {
  const normalizedPath = stripTrailingSlash(pathname);
  if (!normalizedPath) return;

  if (unsafePathPatterns.some((pattern) => pattern.test(normalizedPath))) {
    throw new DomainPolicyError(
      domainPolicyErrorCode.privacyViolation,
      urlPolicyViolationReason.unsafePublicPath,
    );
  }
}

export function normalizeUrlToOrigin(rawUrl: string): string {
  const url = parseHttpUrl(rawUrl);
  return url.origin;
}

export function normalizePublicSourceUrl(rawUrl: string): string {
  const url = parseHttpUrl(rawUrl);
  assertPublicSafePath(url.pathname);

  return `${url.origin}${stripTrailingSlash(url.pathname)}`;
}

export function validatePublicSourceUrl(rawUrl: string): UrlPolicyResult {
  try {
    return { ok: true, value: normalizePublicSourceUrl(rawUrl) };
  } catch (error) {
    if (error instanceof DomainPolicyError) {
      return { ok: false, reason: error.message };
    }

    throw error;
  }
}
```

- [ ] **Step 4: Run URL privacy tests**

Run:

```powershell
pnpm vitest run src/domain/privacy/url-policy.test.ts
```

Expected:

- Exit code `0`.
- URL privacy tests pass.

- [ ] **Step 5: Run focused validation**

Run:

```powershell
pnpm lint
pnpm test:run
```

Expected:

- Both commands exit `0`.

- [ ] **Step 6: Commit**

Run:

```powershell
git add src/domain/privacy/url-policy.ts src/domain/privacy/url-policy.test.ts
git commit -m "feat(domain): add public URL privacy policy"
```

## Task 4: Version-Scoped Publishing Types And Candidate Separation

**Files:**

- Create: `src/domain/publishing/types.ts`
- Create: `src/domain/publishing/eligibility.ts`
- Create: `src/domain/publishing/eligibility.test.ts`

- [ ] **Step 1: Write failing version and candidate separation tests**

Create `src/domain/publishing/eligibility.test.ts` with the first test group:

```ts
import { describe, expect, it } from "vitest";
import {
  candidateDisposition,
  publishableLifecycle,
} from "../vocabularies";
import {
  getActivePublishedVersion,
  isCandidatePublishable,
  type PublishableVersion,
  type StableEntity,
} from "./eligibility";

describe("publishing eligibility policy", () => {
  it("resolves the active published version from stable entity state", () => {
    const versions: PublishableVersion[] = [
      {
        id: "version-draft",
        lifecycle: publishableLifecycle.draft,
        entityId: "site-1",
      },
      {
        id: "version-published",
        lifecycle: publishableLifecycle.published,
        entityId: "site-1",
      },
    ];
    const entity: StableEntity = {
      id: "site-1",
      activePublishedVersionId: "version-published",
    };

    expect(getActivePublishedVersion(entity, versions)).toEqual({
      id: "version-published",
      lifecycle: publishableLifecycle.published,
      entityId: "site-1",
    });
  });

  it("does not treat candidate disposition as publishable lifecycle", () => {
    expect(
      isCandidatePublishable({
        disposition: candidateDisposition.readyForReview,
      }),
    ).toBe(false);
    expect(
      isCandidatePublishable({ disposition: candidateDisposition.merged }),
    ).toBe(false);
  });

  it("ignores active published version IDs that do not point at published versions", () => {
    const versions: PublishableVersion[] = [
      {
        id: "version-approved",
        lifecycle: publishableLifecycle.approved,
        entityId: "site-1",
      },
    ];
    const entity: StableEntity = {
      id: "site-1",
      activePublishedVersionId: "version-approved",
    };

    expect(getActivePublishedVersion(entity, versions)).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run tests and verify they fail**

Run:

```powershell
pnpm vitest run src/domain/publishing/eligibility.test.ts
```

Expected:

- Exit code is non-zero.
- Failure mentions missing `src/domain/publishing/eligibility.ts`.

- [ ] **Step 3: Add version-scoped publishing types**

Create `src/domain/publishing/types.ts`:

```ts
import type { AppLocale } from "~/i18n/locales";
import type {
  CandidateDisposition,
  EvidenceLevel,
  PublishableLifecycle,
  SignalDisposition,
  ValueOf,
} from "../vocabularies";

export type StableEntity = {
  readonly id: string;
  readonly activePublishedVersionId?: string;
};

export type PublishableVersion = {
  readonly id: string;
  readonly entityId: string;
  readonly lifecycle: PublishableLifecycle;
};

export type CandidateRecord = {
  readonly disposition: CandidateDisposition;
};

export type SignalRecord = {
  readonly disposition: SignalDisposition;
};

export type LocalePublication = {
  readonly locale: AppLocale;
  readonly lifecycle: PublishableLifecycle;
};

export type EvidenceSummary = {
  readonly level: EvidenceLevel;
  readonly observedAt: string;
  readonly publicSourceUrl?: string;
};

export type ProjectionPolicyVersion = string;

export type ProjectionCheckpoint = {
  readonly scope: string;
  readonly version: number;
};

export const projectionRebuildReason = {
  publish: "publish",
  withdraw: "withdraw",
  archive: "archive",
  disputeResolution: "dispute_resolution",
  rollback: "rollback",
  policyRebuild: "policy_rebuild",
} as const;

export type ProjectionRebuildReason = ValueOf<typeof projectionRebuildReason>;

export type ProjectionRebuildPlan = {
  readonly commandId: string;
  readonly entityId: string;
  readonly reason: ProjectionRebuildReason;
  readonly policyVersion: ProjectionPolicyVersion;
  readonly baseCheckpoint: ProjectionCheckpoint;
  readonly nextCheckpoint: ProjectionCheckpoint;
  readonly affectedFamilies: readonly ProjectionFamily[];
};

export const projectionFamily = {
  entityPage: "entity_page",
  indexList: "index_list",
  pricing: "pricing",
  navigation: "navigation",
  metadata: "metadata",
  sitemap: "sitemap",
  hreflang: "hreflang",
} as const;

export type ProjectionFamily = ValueOf<typeof projectionFamily>;
```

- [ ] **Step 4: Add initial eligibility helpers**

Create `src/domain/publishing/eligibility.ts`:

```ts
import { publishableLifecycle } from "../vocabularies";
import type {
  CandidateRecord,
  PublishableVersion,
  StableEntity,
} from "./types";

export type { CandidateRecord, PublishableVersion, StableEntity } from "./types";

export function getActivePublishedVersion(
  entity: StableEntity,
  versions: readonly PublishableVersion[],
): PublishableVersion | undefined {
  if (!entity.activePublishedVersionId) return undefined;

  return versions.find(
    (version) =>
      version.id === entity.activePublishedVersionId &&
      version.entityId === entity.id &&
      version.lifecycle === publishableLifecycle.published,
  );
}

export function isCandidatePublishable(_candidate: CandidateRecord): false {
  return false;
}
```

- [ ] **Step 5: Run eligibility tests**

Run:

```powershell
pnpm vitest run src/domain/publishing/eligibility.test.ts
```

Expected:

- Exit code `0`.
- Version-scoped entity and candidate separation tests pass.

- [ ] **Step 6: Run focused validation**

Run:

```powershell
pnpm lint
pnpm test:run
```

Expected:

- Both commands exit `0`.

- [ ] **Step 7: Commit**

Run:

```powershell
git add src/domain/publishing/types.ts src/domain/publishing/eligibility.ts src/domain/publishing/eligibility.test.ts
git commit -m "feat(domain): add version-scoped publishing model"
```

## Task 5: Public Projection DTO Boundary

**Files:**

- Create: `src/domain/projection/public-boundary.ts`
- Create: `src/domain/projection/public-boundary.test.ts`

- [ ] **Step 1: Write failing public projection boundary tests**

Create `src/domain/projection/public-boundary.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { DomainPolicyError } from "../errors";
import { evidenceLevel, publishableLifecycle } from "../vocabularies";
import {
  buildPublicProjection,
  privateProjectionField,
  type AdminReviewViewModel,
  type PublicProjectionInput,
} from "./public-boundary";

describe("public projection boundary", () => {
  it("builds a public-safe projection from explicit public fields", () => {
    const input: PublicProjectionInput = {
      entityId: "site-1",
      versionId: "version-1",
      slug: "example-api",
      title: "Example API",
      summary: "Public summary",
      publicUrl: "https://example.com",
      evidence: [
        {
          level: evidenceLevel.tested,
          observedAt: "2026-05-24T00:00:00.000Z",
          publicSourceUrl: "https://docs.example.com/pricing",
        },
      ],
      updatedAt: "2026-05-24T00:00:00.000Z",
    };

    expect(buildPublicProjection(input)).toEqual({
      entityId: "site-1",
      versionId: "version-1",
      slug: "example-api",
      title: "Example API",
      summary: "Public summary",
      publicUrl: "https://example.com",
      evidence: [
        {
          level: evidenceLevel.tested,
          observedAt: "2026-05-24T00:00:00.000Z",
          publicSourceUrl: "https://docs.example.com/pricing",
        },
      ],
      updatedAt: "2026-05-24T00:00:00.000Z",
    });
  });

  it("rejects unsafe public source evidence URLs before projection output exists", () => {
    expect(() =>
      buildPublicProjection({
        entityId: "site-1",
        versionId: "version-1",
        slug: "example-api",
        title: "Example API",
        summary: "Public summary",
        publicUrl: "https://example.com",
        evidence: [
          {
            level: evidenceLevel.listed,
            observedAt: "2026-05-24T00:00:00.000Z",
            publicSourceUrl: "https://docs.example.com/account/123",
          },
        ],
        updatedAt: "2026-05-24T00:00:00.000Z",
      }),
    ).toThrow(DomainPolicyError);
  });

  it("keeps admin view models outside the public projection", () => {
    const adminViewModel: AdminReviewViewModel = {
      entityId: "site-1",
      versionId: "version-1",
      lifecycle: publishableLifecycle.pendingReview,
      adminNotes: "Internal note",
      rawEvidenceId: "raw-1",
      reviewerId: "admin-1",
    };

    expect(adminViewModel).toMatchObject({
      adminNotes: "Internal note",
      rawEvidenceId: "raw-1",
    });

    expect(() =>
      buildPublicProjection({
        entityId: "site-1",
        versionId: "version-1",
        slug: "example-api",
        title: "Example API",
        summary: "Public summary",
        publicUrl: "https://example.com",
        evidence: [],
        updatedAt: "2026-05-24T00:00:00.000Z",
        [privateProjectionField.adminNotes]: "Internal note",
      }),
    ).toThrow(
      `Public projection input contains private field: ${privateProjectionField.adminNotes}`,
    );
  });

  it("rejects raw evidence and private metadata fields", () => {
    expect(() =>
      buildPublicProjection({
        entityId: "site-1",
        versionId: "version-1",
        slug: "example-api",
        title: "Example API",
        summary: "Public summary",
        publicUrl: "https://example.com",
        evidence: [],
        updatedAt: "2026-05-24T00:00:00.000Z",
        [privateProjectionField.rawEvidence]: { requestBody: "private" },
      }),
    ).toThrow(
      `Public projection input contains private field: ${privateProjectionField.rawEvidence}`,
    );
  });
});
```

- [ ] **Step 2: Run tests and verify they fail**

Run:

```powershell
pnpm vitest run src/domain/projection/public-boundary.test.ts
```

Expected:

- Exit code is non-zero.
- Failure mentions missing `src/domain/projection/public-boundary.ts`.

- [ ] **Step 3: Implement public projection boundary**

Create `src/domain/projection/public-boundary.ts`:

```ts
import { DomainPolicyError, domainPolicyErrorCode } from "../errors";
import { normalizeUrlToOrigin, normalizePublicSourceUrl } from "../privacy/url-policy";
import type { EvidenceSummary } from "../publishing/types";
import type { PublishableLifecycle } from "../vocabularies";

export type PublicProjection = {
  readonly entityId: string;
  readonly versionId: string;
  readonly slug: string;
  readonly title: string;
  readonly summary: string;
  readonly publicUrl: string;
  readonly evidence: readonly EvidenceSummary[];
  readonly updatedAt: string;
};

export type PublicProjectionInput = PublicProjection & Record<string, unknown>;

export type AdminReviewViewModel = {
  readonly entityId: string;
  readonly versionId: string;
  readonly lifecycle: PublishableLifecycle;
  readonly adminNotes?: string;
  readonly rawEvidenceId?: string;
  readonly reviewerId?: string;
};

export const privateProjectionField = {
  adminNotes: "adminNotes",
  rawEvidence: "rawEvidence",
  rawEvidenceId: "rawEvidenceId",
  reviewerId: "reviewerId",
  internalReviewComments: "internalReviewComments",
  privateSourceMetadata: "privateSourceMetadata",
  sourcePayload: "sourcePayload",
  accountName: "accountName",
  userId: "userId",
  exactBalance: "exactBalance",
  requestBody: "requestBody",
  responseBody: "responseBody",
} as const;

export const privateProjectionFields = Object.values(privateProjectionField);

function assertNoPrivateFields(input: Record<string, unknown>): void {
  for (const field of privateProjectionFields) {
    if (field in input) {
      throw new DomainPolicyError(
        domainPolicyErrorCode.projectionBoundaryViolation,
        `Public projection input contains private field: ${field}`,
      );
    }
  }
}

export function buildPublicProjection(
  input: PublicProjectionInput,
): PublicProjection {
  assertNoPrivateFields(input);

  return {
    entityId: input.entityId,
    versionId: input.versionId,
    slug: input.slug,
    title: input.title,
    summary: input.summary,
    publicUrl: normalizeUrlToOrigin(input.publicUrl),
    evidence: input.evidence.map((evidence) => ({
      ...evidence,
      publicSourceUrl: evidence.publicSourceUrl
        ? normalizePublicSourceUrl(evidence.publicSourceUrl)
        : undefined,
    })),
    updatedAt: input.updatedAt,
  };
}
```

- [ ] **Step 4: Run public projection boundary tests**

Run:

```powershell
pnpm vitest run src/domain/projection/public-boundary.test.ts
```

Expected:

- Exit code `0`.
- Public projection boundary tests pass.

- [ ] **Step 5: Run focused validation**

Run:

```powershell
pnpm lint
pnpm test:run
```

Expected:

- Both commands exit `0`.

- [ ] **Step 6: Commit**

Run:

```powershell
git add src/domain/projection/public-boundary.ts src/domain/projection/public-boundary.test.ts
git commit -m "feat(domain): add public projection boundary"
```

## Task 6: Publish Eligibility And Locale Publication Gates

**Files:**

- Modify: `src/domain/publishing/eligibility.ts`
- Modify: `src/domain/publishing/eligibility.test.ts`

- [ ] **Step 1: Extend failing eligibility tests**

Append these tests inside the existing `describe("publishing eligibility policy", ...)` block in `src/domain/publishing/eligibility.test.ts`:

```ts
  it("allows renderable projections only for published entity and locale versions", () => {
    const englishLocale = "en";

    expect(
      isRenderableForLocale({
        entityVersion: {
          id: "version-1",
          entityId: "site-1",
          lifecycle: publishableLifecycle.published,
        },
        localeVersions: [
          {
            locale: DEFAULT_APP_LOCALE,
            lifecycle: publishableLifecycle.published,
          },
        ],
        locale: DEFAULT_APP_LOCALE,
        textBearing: true,
      }),
    ).toBe(true);

    expect(
      isRenderableForLocale({
        entityVersion: {
          id: "version-1",
          entityId: "site-1",
          lifecycle: publishableLifecycle.published,
        },
        localeVersions: [
          { locale: englishLocale, lifecycle: publishableLifecycle.draft },
        ],
        locale: englishLocale,
        textBearing: true,
      }),
    ).toBe(false);
  });

  it("requires at least one published active-discovery locale for V1 text-bearing publication", () => {
    const englishLocale = "en";

    expect(
      canPublishTextBearingV1Page({
        entityVersion: {
          id: "version-1",
          entityId: "site-1",
          lifecycle: publishableLifecycle.approved,
        },
        localeVersions: [
          {
            locale: englishLocale,
            lifecycle: publishableLifecycle.published,
          },
        ],
      }),
    ).toEqual({
      ok: false,
      reason: eligibilityFailureReason.missingPublicDiscoveryLocale,
    });

    expect(
      canPublishTextBearingV1Page({
        entityVersion: {
          id: "version-1",
          entityId: "site-1",
          lifecycle: publishableLifecycle.approved,
        },
        localeVersions: [
          {
            locale: DEFAULT_APP_LOCALE,
            lifecycle: publishableLifecycle.published,
          },
        ],
      }),
    ).toEqual({ ok: true });
  });

  it("does not allow approved-only entity versions into public projections", () => {
    expect(
      isRenderableForLocale({
        entityVersion: {
          id: "version-1",
          entityId: "site-1",
          lifecycle: publishableLifecycle.approved,
        },
        localeVersions: [
          {
            locale: DEFAULT_APP_LOCALE,
            lifecycle: publishableLifecycle.published,
          },
        ],
        locale: DEFAULT_APP_LOCALE,
        textBearing: true,
      }),
    ).toBe(false);
  });

  it("excludes rejected withdrawn archived and disputed content from default projection eligibility", () => {
    for (const lifecycle of [
      publishableLifecycle.rejected,
      publishableLifecycle.withdrawn,
      publishableLifecycle.archived,
      publishableLifecycle.disputed,
    ] as const) {
      expect(
        isEligibleForDefaultPublicProjection({
          id: `version-${lifecycle}`,
          entityId: "site-1",
          lifecycle,
        }),
      ).toBe(false);
    }

    expect(
      isEligibleForDefaultPublicProjection({
        id: "version-published",
        entityId: "site-1",
        lifecycle: publishableLifecycle.published,
      }),
    ).toBe(true);
  });
```

Also update the import from `./eligibility`:

```ts
import {
  canPublishTextBearingV1Page,
  eligibilityFailureReason,
  getActivePublishedVersion,
  isCandidatePublishable,
  isEligibleForDefaultPublicProjection,
  isRenderableForLocale,
  type PublishableVersion,
  type StableEntity,
} from "./eligibility";
```

Also add or keep these supporting imports at the top of
`src/domain/publishing/eligibility.test.ts`:

```ts
import { DEFAULT_APP_LOCALE } from "~/i18n/locales";
import { publishableLifecycle } from "../vocabularies";
```

- [ ] **Step 2: Run tests and verify they fail**

Run:

```powershell
pnpm vitest run src/domain/publishing/eligibility.test.ts
```

Expected:

- Exit code is non-zero.
- Failure mentions missing exports such as `isRenderableForLocale`.

- [ ] **Step 3: Implement publish eligibility and locale gates**

Replace `src/domain/publishing/eligibility.ts` with:

```ts
import {
  getPublicDiscoveryLocales,
  type AppLocale,
} from "~/i18n/locales";
import { publishableLifecycle } from "../vocabularies";
import type {
  CandidateRecord,
  LocalePublication,
  PublishableVersion,
  StableEntity,
} from "./types";

export type {
  CandidateRecord,
  LocalePublication,
  PublishableVersion,
  StableEntity,
} from "./types";

export type EligibilityResult =
  | { ok: true }
  | { ok: false; reason: string };

export const eligibilityFailureReason = {
  entityVersionMustBeApproved:
    "Entity version must be approved before publication",
  missingPublicDiscoveryLocale:
    "V1 text-bearing pages require a published active-discovery locale",
} as const;

export type LocaleRenderabilityInput = {
  readonly entityVersion: PublishableVersion;
  readonly localeVersions: readonly LocalePublication[];
  readonly locale: AppLocale;
  readonly textBearing: boolean;
};

export type TextBearingV1PublicationInput = {
  readonly entityVersion: PublishableVersion;
  readonly localeVersions: readonly LocalePublication[];
};

export function getActivePublishedVersion(
  entity: StableEntity,
  versions: readonly PublishableVersion[],
): PublishableVersion | undefined {
  if (!entity.activePublishedVersionId) return undefined;

  return versions.find(
    (version) =>
      version.id === entity.activePublishedVersionId &&
      version.entityId === entity.id &&
      version.lifecycle === publishableLifecycle.published,
  );
}

export function isCandidatePublishable(_candidate: CandidateRecord): false {
  return false;
}

export function isEligibleForDefaultPublicProjection(
  version: PublishableVersion,
): boolean {
  return version.lifecycle === publishableLifecycle.published;
}

export function isRenderableForLocale(
  input: LocaleRenderabilityInput,
): boolean {
  if (!isEligibleForDefaultPublicProjection(input.entityVersion)) {
    return false;
  }

  if (!input.textBearing) {
    return true;
  }

  return input.localeVersions.some(
    (localeVersion) =>
      localeVersion.locale === input.locale &&
      localeVersion.lifecycle === publishableLifecycle.published,
  );
}

export function canPublishTextBearingV1Page(
  input: TextBearingV1PublicationInput,
): EligibilityResult {
  if (input.entityVersion.lifecycle !== publishableLifecycle.approved) {
    return {
      ok: false,
      reason: eligibilityFailureReason.entityVersionMustBeApproved,
    };
  }

  const publicDiscoveryAppLocales = new Set(
    getPublicDiscoveryLocales().map((locale) => locale.locale),
  );

  const hasPublishedDiscoveryLocale = input.localeVersions.some(
    (localeVersion) =>
      localeVersion.lifecycle === publishableLifecycle.published &&
      publicDiscoveryAppLocales.has(localeVersion.locale),
  );

  if (!hasPublishedDiscoveryLocale) {
    return {
      ok: false,
      reason: eligibilityFailureReason.missingPublicDiscoveryLocale,
    };
  }

  return { ok: true };
}
```

- [ ] **Step 4: Run eligibility tests**

Run:

```powershell
pnpm vitest run src/domain/publishing/eligibility.test.ts
```

Expected:

- Exit code `0`.
- Eligibility and locale publication tests pass.

- [ ] **Step 5: Run focused validation**

Run:

```powershell
pnpm lint
pnpm test:run
```

Expected:

- Both commands exit `0`.

- [ ] **Step 6: Commit**

Run:

```powershell
git add src/domain/publishing/eligibility.ts src/domain/publishing/eligibility.test.ts
git commit -m "feat(domain): add publish eligibility gates"
```

## Task 7: Rollback As A Special Publication Command

**Files:**

- Create: `src/domain/publishing/rollback.ts`
- Create: `src/domain/publishing/rollback.test.ts`

- [ ] **Step 1: Write failing rollback tests**

Create `src/domain/publishing/rollback.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { DomainPolicyError } from "../errors";
import { publishableLifecycle } from "../vocabularies";
import {
  publicationEventType,
  planRollback,
  rollbackAllowedLifecycles,
  rollbackFailureReason,
  type RollbackCommand,
  type RollbackTarget,
} from "./rollback";

describe("rollback publication policy", () => {
  const command: RollbackCommand = {
    commandId: "cmd-1",
    entityId: "site-1",
    initiatedBy: "admin-1",
    reason: "restore last safe published version",
    expectedCurrentVersionId: "version-current",
  };

  const target: RollbackTarget = {
    versionId: "version-old",
    lifecycle: publishableLifecycle.published,
    privacyValidated: true,
    publicationGatesPassed: true,
  };

  it("creates a rollback event without mutating the historical target", () => {
    expect(planRollback(command, target)).toEqual({
      type: publicationEventType.rollback,
      commandId: "cmd-1",
      entityId: "site-1",
      previousVersionId: "version-current",
      restoredVersionId: "version-old",
      initiatedBy: "admin-1",
      reason: "restore last safe published version",
    });
  });

  it("allows rollback from public states defined by the spec", () => {
    for (const lifecycle of rollbackAllowedLifecycles) {
      expect(
        planRollback(command, {
          ...target,
          lifecycle,
        }).restoredVersionId,
      ).toBe("version-old");
    }
  });

  it("rejects rollback targets that fail current privacy validation", () => {
    expect(() =>
      planRollback(command, {
        ...target,
        privacyValidated: false,
      }),
    ).toThrow(rollbackFailureReason.currentPrivacyValidationFailed);
  });

  it("rejects rollback targets that do not pass current publication gates", () => {
    expect(() =>
      planRollback(command, {
        ...target,
        publicationGatesPassed: false,
      }),
    ).toThrow(rollbackFailureReason.currentPublicationGatesFailed);
  });

  it("rejects rollback from non-public lifecycle states", () => {
    expect(() =>
      planRollback(command, {
        ...target,
        lifecycle: publishableLifecycle.approved,
      }),
    ).toThrow(DomainPolicyError);
  });
});
```

- [ ] **Step 2: Run tests and verify they fail**

Run:

```powershell
pnpm vitest run src/domain/publishing/rollback.test.ts
```

Expected:

- Exit code is non-zero.
- Failure mentions missing `src/domain/publishing/rollback.ts`.

- [ ] **Step 3: Implement rollback planning**

Create `src/domain/publishing/rollback.ts`:

```ts
import { DomainPolicyError, domainPolicyErrorCode } from "../errors";
import {
  publishableLifecycle,
  type PublishableLifecycle,
  type ValueOf,
} from "../vocabularies";

export const publicationEventType = {
  rollback: "rollback",
} as const;

export type PublicationEventType = ValueOf<typeof publicationEventType>;

export type RollbackCommand = {
  readonly commandId: string;
  readonly entityId: string;
  readonly initiatedBy: string;
  readonly reason: string;
  readonly expectedCurrentVersionId: string;
};

export type RollbackTarget = {
  readonly versionId: string;
  readonly lifecycle: PublishableLifecycle;
  readonly privacyValidated: boolean;
  readonly publicationGatesPassed: boolean;
};

export type RollbackEvent = {
  readonly type: typeof publicationEventType.rollback;
  readonly commandId: string;
  readonly entityId: string;
  readonly previousVersionId: string;
  readonly restoredVersionId: string;
  readonly initiatedBy: string;
  readonly reason: string;
};

export const rollbackAllowedLifecycles = [
  publishableLifecycle.published,
  publishableLifecycle.disputed,
  publishableLifecycle.withdrawn,
  publishableLifecycle.archived,
] satisfies readonly PublishableLifecycle[];

const rollbackAllowedLifecycleSet: ReadonlySet<PublishableLifecycle> = new Set(
  rollbackAllowedLifecycles,
);

export const rollbackFailureReason = {
  currentPrivacyValidationFailed:
    "Rollback target fails current privacy validation",
  currentPublicationGatesFailed:
    "Rollback target fails current publication gates",
} as const;

export function planRollback(
  command: RollbackCommand,
  target: RollbackTarget,
): RollbackEvent {
  if (!rollbackAllowedLifecycleSet.has(target.lifecycle)) {
    throw new DomainPolicyError(
      domainPolicyErrorCode.rollbackNotAllowed,
      `Rollback is not allowed from lifecycle: ${target.lifecycle}`,
    );
  }

  if (!target.privacyValidated) {
    throw new DomainPolicyError(
      domainPolicyErrorCode.rollbackNotAllowed,
      rollbackFailureReason.currentPrivacyValidationFailed,
    );
  }

  if (!target.publicationGatesPassed) {
    throw new DomainPolicyError(
      domainPolicyErrorCode.rollbackNotAllowed,
      rollbackFailureReason.currentPublicationGatesFailed,
    );
  }

  return {
    type: publicationEventType.rollback,
    commandId: command.commandId,
    entityId: command.entityId,
    previousVersionId: command.expectedCurrentVersionId,
    restoredVersionId: target.versionId,
    initiatedBy: command.initiatedBy,
    reason: command.reason,
  };
}
```

- [ ] **Step 4: Run rollback tests**

Run:

```powershell
pnpm vitest run src/domain/publishing/rollback.test.ts
```

Expected:

- Exit code `0`.
- Rollback tests pass.

- [ ] **Step 5: Run focused validation**

Run:

```powershell
pnpm lint
pnpm test:run
```

Expected:

- Both commands exit `0`.

- [ ] **Step 6: Commit**

Run:

```powershell
git add src/domain/publishing/rollback.ts src/domain/publishing/rollback.test.ts
git commit -m "feat(domain): add rollback policy"
```

## Task 8: Projection Rebuild Planning And Ordering Policy

**Files:**

- Create: `src/domain/publishing/projection-plan.ts`
- Create: `src/domain/publishing/projection-plan.test.ts`

- [ ] **Step 1: Write failing projection planning tests**

Create `src/domain/publishing/projection-plan.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { DomainPolicyError } from "../errors";
import {
  assertProjectionCanCommit,
  createProjectionRebuildPlan,
} from "./projection-plan";
import {
  projectionFamily,
  projectionRebuildReason,
} from "./types";

describe("projection rebuild planning policy", () => {
  it("plans the full affected public projection family set", () => {
    expect(
      createProjectionRebuildPlan({
        commandId: "cmd-1",
        entityId: "site-1",
        reason: projectionRebuildReason.publish,
        policyVersion: "policy-2026-05-25",
        baseCheckpoint: { scope: "site-1", version: 7 },
      }),
    ).toEqual({
      commandId: "cmd-1",
      entityId: "site-1",
      reason: projectionRebuildReason.publish,
      policyVersion: "policy-2026-05-25",
      baseCheckpoint: { scope: "site-1", version: 7 },
      nextCheckpoint: { scope: "site-1", version: 8 },
      affectedFamilies: Object.values(projectionFamily),
    });
  });

  it("allows commit only when the current checkpoint matches the planned base", () => {
    const plan = createProjectionRebuildPlan({
      commandId: "cmd-1",
      entityId: "site-1",
      reason: projectionRebuildReason.rollback,
      policyVersion: "policy-2026-05-25",
      baseCheckpoint: { scope: "site-1", version: 7 },
    });

    expect(() =>
      assertProjectionCanCommit(plan, { scope: "site-1", version: 7 }),
    ).not.toThrow();
  });

  it("rejects stale projection rebuild plans", () => {
    const plan = createProjectionRebuildPlan({
      commandId: "cmd-1",
      entityId: "site-1",
      reason: projectionRebuildReason.publish,
      policyVersion: "policy-2026-05-25",
      baseCheckpoint: { scope: "site-1", version: 7 },
    });

    expect(() =>
      assertProjectionCanCommit(plan, { scope: "site-1", version: 8 }),
    ).toThrow(DomainPolicyError);
    expect(() =>
      assertProjectionCanCommit(plan, { scope: "site-1", version: 8 }),
    ).toThrow(
      "Projection checkpoint conflict for site-1: expected 7, received 8",
    );
  });
});
```

- [ ] **Step 2: Run tests and verify they fail**

Run:

```powershell
pnpm vitest run src/domain/publishing/projection-plan.test.ts
```

Expected:

- Exit code is non-zero.
- Failure mentions missing `src/domain/publishing/projection-plan.ts`.

- [ ] **Step 3: Implement projection rebuild planning**

Create `src/domain/publishing/projection-plan.ts`:

```ts
import { DomainPolicyError, domainPolicyErrorCode } from "../errors";
import type {
  ProjectionCheckpoint,
  ProjectionRebuildPlan,
  ProjectionRebuildReason,
} from "./types";
import { projectionFamily } from "./types";

export type CreateProjectionRebuildPlanInput = {
  readonly commandId: string;
  readonly entityId: string;
  readonly reason: ProjectionRebuildReason;
  readonly policyVersion: string;
  readonly baseCheckpoint: ProjectionCheckpoint;
};

export const affectedProjectionFamilies = Object.values(projectionFamily);

export function createProjectionRebuildPlan(
  input: CreateProjectionRebuildPlanInput,
): ProjectionRebuildPlan {
  return {
    commandId: input.commandId,
    entityId: input.entityId,
    reason: input.reason,
    policyVersion: input.policyVersion,
    baseCheckpoint: input.baseCheckpoint,
    nextCheckpoint: {
      scope: input.baseCheckpoint.scope,
      version: input.baseCheckpoint.version + 1,
    },
    affectedFamilies: affectedProjectionFamilies,
  };
}

export function assertProjectionCanCommit(
  plan: ProjectionRebuildPlan,
  currentCheckpoint: ProjectionCheckpoint,
): void {
  if (
    currentCheckpoint.scope !== plan.baseCheckpoint.scope ||
    currentCheckpoint.version !== plan.baseCheckpoint.version
  ) {
    throw new DomainPolicyError(
      domainPolicyErrorCode.projectionConflict,
      `Projection checkpoint conflict for ${plan.baseCheckpoint.scope}: expected ${plan.baseCheckpoint.version}, received ${currentCheckpoint.version}`,
    );
  }
}
```

- [ ] **Step 4: Run projection planning tests**

Run:

```powershell
pnpm vitest run src/domain/publishing/projection-plan.test.ts
```

Expected:

- Exit code `0`.
- Projection rebuild planning tests pass.

- [ ] **Step 5: Run focused validation**

Run:

```powershell
pnpm lint
pnpm test:run
```

Expected:

- Both commands exit `0`.

- [ ] **Step 6: Commit**

Run:

```powershell
git add src/domain/publishing/projection-plan.ts src/domain/publishing/projection-plan.test.ts
git commit -m "feat(domain): add projection rebuild planning"
```

## Task 9: Contract Integration And Architecture Boundary Validation

**Files:**

- Create: `src/domain/publishing/policy-contract.test.ts`

- [ ] **Step 1: Write cross-policy contract tests**

Create `src/domain/publishing/policy-contract.test.ts`:

```ts
import { DEFAULT_APP_LOCALE } from "~/i18n/locales";
import { describe, expect, it } from "vitest";
import { assertCanTransition } from "../lifecycle";
import { buildPublicProjection } from "../projection/public-boundary";
import { publishableLifecycle } from "../vocabularies";
import { canPublishTextBearingV1Page } from "./eligibility";
import { createProjectionRebuildPlan } from "./projection-plan";
import { planRollback, publicationEventType } from "./rollback";
import { projectionFamily, projectionRebuildReason } from "./types";

describe("domain publishing policy contract", () => {
  it("keeps approval separate from publication and projection rebuild", () => {
    expect(() =>
      assertCanTransition(
        publishableLifecycle.pendingReview,
        publishableLifecycle.approved,
      ),
    ).not.toThrow();

    expect(
      canPublishTextBearingV1Page({
        entityVersion: {
          id: "version-1",
          entityId: "site-1",
          lifecycle: publishableLifecycle.approved,
        },
        localeVersions: [
          {
            locale: DEFAULT_APP_LOCALE,
            lifecycle: publishableLifecycle.published,
          },
        ],
      }),
    ).toEqual({ ok: true });

    expect(
      createProjectionRebuildPlan({
        commandId: "cmd-1",
        entityId: "site-1",
        reason: projectionRebuildReason.publish,
        policyVersion: "policy-2026-05-25",
        baseCheckpoint: { scope: "site-1", version: 0 },
      }).affectedFamilies,
    ).toContain(projectionFamily.sitemap);
  });

  it("builds public projections only from public-safe fields after publication", () => {
    expect(
      buildPublicProjection({
        entityId: "site-1",
        versionId: "version-1",
        slug: "example-api",
        title: "Example API",
        summary: "Public summary",
        publicUrl: "https://example.com/dashboard",
        evidence: [],
        updatedAt: "2026-05-24T00:00:00.000Z",
      }),
    ).toEqual({
      entityId: "site-1",
      versionId: "version-1",
      slug: "example-api",
      title: "Example API",
      summary: "Public summary",
      publicUrl: "https://example.com",
      evidence: [],
      updatedAt: "2026-05-24T00:00:00.000Z",
    });
  });

  it("plans rollback as a new publication event and rebuild plan", () => {
    const rollbackEvent = planRollback(
      {
        commandId: "cmd-rollback",
        entityId: "site-1",
        initiatedBy: "admin-1",
        reason: "restore safe version",
        expectedCurrentVersionId: "version-current",
      },
      {
        versionId: "version-old",
        lifecycle: publishableLifecycle.published,
        privacyValidated: true,
        publicationGatesPassed: true,
      },
    );

    expect(rollbackEvent).toMatchObject({
      type: publicationEventType.rollback,
      previousVersionId: "version-current",
      restoredVersionId: "version-old",
    });

    expect(
      createProjectionRebuildPlan({
        commandId: rollbackEvent.commandId,
        entityId: rollbackEvent.entityId,
        reason: projectionRebuildReason.rollback,
        policyVersion: "policy-2026-05-25",
        baseCheckpoint: { scope: "site-1", version: 4 },
      }),
    ).toMatchObject({
      reason: projectionRebuildReason.rollback,
      nextCheckpoint: { scope: "site-1", version: 5 },
    });
  });
});
```

- [ ] **Step 2: Run contract tests**

Run:

```powershell
pnpm vitest run src/domain/publishing/policy-contract.test.ts
```

Expected:

- Exit code `0`.
- Cross-policy contract tests pass.

- [ ] **Step 3: Verify UI and route layers do not import domain modules**

Run:

```powershell
rg -n "~/domain|../domain|src/domain" src/components src/app
```

Expected:

- Exit code `1` because there are no matches.
- If `rg` returns matches, inspect them manually. For this plan, UI and route files should not import the new policy kernel.

- [ ] **Step 4: Run full validation**

Run:

```powershell
pnpm validate
```

Expected:

- `pnpm lint` exits `0`.
- `pnpm test:run` exits `0`.
- `pnpm build` exits `0`.

- [ ] **Step 5: Inspect final diff**

Run:

```powershell
git diff --stat
git diff --check
git status --porcelain=v1
```

Expected:

- `git diff --check` exits `0`.
- Diff contains only `src/domain/**` files from this plan.
- No UI, route, SEO, i18n, database, API, auth, RBAC, or job-runner files are changed.

- [ ] **Step 6: Commit**

Run:

```powershell
git add src/domain/publishing/policy-contract.test.ts
git commit -m "test(domain): cover publishing policy contract"
```

## Self-Review Checklist

Before handing off the implementation, verify these points against both primary specs.

### Canonical Domain Model Spec Coverage

- Object family separation:
  - `src/domain/publishing/types.ts` defines stable entity, version, candidate, signal, evidence summary, and projection planning shapes.
  - `src/domain/projection/public-boundary.ts` keeps admin view models separate from public projections.
- Lifecycle vocabulary:
  - `src/domain/vocabularies.ts` defines only `draft`, `pending_review`, `approved`, `published`, `disputed`, `withdrawn`, `archived`, and `rejected` as publishable lifecycle states.
- Fact and evidence separation:
  - `src/domain/vocabularies.ts` keeps `manually_confirmed` in evidence levels only.
- Candidate and signal separation:
  - `candidateDispositions` and `signalDispositions` are not publishable lifecycle values.
  - `isCandidatePublishable` always returns `false`.
- Privacy boundary:
  - `src/domain/privacy/url-policy.ts` strips user-observed URLs to origins and rejects unsafe public source paths.
- Published projection boundary:
  - `src/domain/projection/public-boundary.ts` assembles public-safe projection DTOs and rejects admin/private/raw fields.
- Dependency direction:
  - No files under `src/components` or `src/app` import `src/domain`.

### Publishing Workflow Spec Coverage

- Lifecycle transition graph:
  - `src/domain/lifecycle.ts` implements the exact allowed transitions.
- Version-scoped publishing model:
  - `StableEntity.activePublishedVersionId` points at a published `PublishableVersion`.
- Approved is not public:
  - `isEligibleForDefaultPublicProjection` returns `true` only for `published`.
- Candidate data is not public:
  - Candidate records are modeled separately and cannot publish directly.
- Locale versions publish independently:
  - `isRenderableForLocale` requires the entity version and requested locale version to be published.
- V1 text-bearing locale gate:
  - `canPublishTextBearingV1Page` requires at least one published active public-discovery locale from the existing locale registry.
- Disputed, withdrawn, archived, and rejected visibility:
  - Default projection eligibility excludes them.
- Rollback:
  - `planRollback` creates a rollback event without mutating historical versions and requires current privacy and publication gates.
- Audit and projection metadata:
  - `RollbackEvent` and `ProjectionRebuildPlan` carry command IDs, policy versions, checkpoints, reasons, and affected projection families.
- Atomic public boundary and ordering:
  - `assertProjectionCanCommit` rejects stale checkpoint commits.

### Intentionally Deferred Work

- Database schema, migrations, and persistence layout.
- Auth provider, RBAC, permission checks, and admin guards.
- Review queue UI and admin workflows.
- tRPC or API command/query shapes.
- Job runner and real projection rebuild execution.
- Public business pages and page-specific DTO fields.
- Sitemap, hreflang, and metadata generation from stored projections.
- Entity-specific structured data.
- Seed content and production readiness rules.
- Business parser modules for pricing, capabilities, risks, provider taxonomy, and compatibility.
- Full audit storage and observability sinks.

### Draft Marker And Scope Scan

Run:

```powershell
$terms = @(
  @(84, 66, 68),
  @(84, 79, 68, 79),
  @(102, 105, 108, 108, 32, 108, 97, 116, 101, 114),
  @(112, 108, 97, 99, 101, 104, 111, 108, 100, 101, 114),
  @(83, 105, 109, 105, 108, 97, 114, 32, 116, 111),
  @(97, 100, 100, 32, 97, 112, 112, 114, 111, 112, 114, 105, 97, 116, 101),
  @(104, 97, 110, 100, 108, 101, 32, 101, 100, 103, 101, 32, 99, 97, 115, 101, 115),
  @(87, 114, 105, 116, 101, 32, 116, 101, 115, 116, 115, 32, 102, 111, 114, 32, 116, 104, 101, 32, 97, 98, 111, 118, 101)
) | ForEach-Object { -join ($_ | ForEach-Object { [char]$_ }) }
$pattern = $terms -join "|"
rg -n $pattern docs/superpowers/plans/2026-05-25-domain-publishing-policy-kernel.md
```

Expected:

- Exit code `1` because no incomplete-plan marker text is present.

Run:

```powershell
rg -n "database|migration|RBAC|auth|tRPC|router|job runner|admin UI|React|component|route" src/domain
```

Expected:

- Exit code `1` because the implementation did not introduce out-of-scope runtime dependencies into `src/domain`.

### Final Validation Command

Run:

```powershell
pnpm validate
```

Expected:

- Exit code `0`.
- Lint, unit tests, and build all pass.
