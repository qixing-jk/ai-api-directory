# All API Hub Observation Contract Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the AI API Directory-side observation intake contract that curated seed batches and future All API Hub contributions can share without letting private observation data reach public projections.

**Architecture:** Add a small domain policy layer for observation source governance, sensitive-field rejection, URL normalization, evidence derivation, and confidence capping. Add Zod import contracts that make observation batches the primary seed shape, then map validated batches into dry-run candidate/evidence records and repository-shaped append operations. Keep public routes, public DTOs, and All API Hub code untouched.

**Tech Stack:** TypeScript, Vitest, Zod 4, existing domain policy errors, existing URL privacy helpers, existing server DB mapper/repository boundaries.

---

## Source Spec

Implement the next slice from `docs/superpowers/specs/2026-05-26-all-api-hub-observation-contract-design.md`.

This plan intentionally stops at directory-side local intake:

- No All API Hub code changes.
- No upload endpoint.
- No admin UI.
- No public page changes.
- No projection rebuild execution.
- No production curated seed list.

The slice proves that curated seed can use the same privacy-safe observation batch shape expected from future All API Hub integration.

## File Structure

- `src/domain/privacy/url-policy.ts`: shared fail-closed URL normalization. Extend it with public-host checks and strict query/hash rejection for intake.
- `src/domain/privacy/url-policy.test.ts`: focused coverage for private hosts and strict public-source URL behavior.
- `src/domain/observation/policy.ts`: observation source vocabulary, consent gate, sensitive-key rejection, observation URL wrappers, evidence-level derivation, and server confidence calculation.
- `src/domain/observation/policy.test.ts`: policy tests for governance, privacy, URL handling, evidence derivation, and confidence caps.
- `src/contracts/import/observation.ts`: Zod schemas for observation batch envelopes and each observation family.
- `src/contracts/import/seed.ts`: compatibility wrapper that converts the existing seed-site candidate input into a curated observation batch.
- `src/contracts/boundary.test.ts`: contract tests proving seed and observation input validation.
- `src/contracts/import/fixtures/development.ts`: synthetic development observation batch fixture.
- `src/contracts/import/fixtures/seed-environment.ts`: guard that rejects synthetic fixture hosts from production seed batches.
- `src/contracts/import/fixtures/fixtures.test.ts`: fixture validation and production-seed separation tests.
- `src/server/db/mappers/import-candidate.ts`: keep the existing seed mapper, but route it through the observation-batch wrapper.
- `src/server/db/mappers/observation-intake.ts`: dry-run mapper from observation batches to candidate/evidence inputs.
- `src/server/db/mappers/boundary.test.ts`: mapper tests proving candidates/evidence are produced without public projections.
- `src/server/db/repositories/observation-candidates.ts`: repository-shaped append facade for dry-run candidate/evidence plans.
- `src/server/db/repositories/repository-contract.test.ts`: repository contract tests for append-only observation candidate writes.

## Task 1: Shared URL Policy Hardening

**Files:**

- Modify: `src/domain/privacy/url-policy.ts`
- Modify: `src/domain/privacy/url-policy.test.ts`

- [ ] **Step 1: Write failing URL policy tests**

Replace `src/domain/privacy/url-policy.test.ts` with:

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

  it("keeps reviewed public paths while removing query strings and hashes by default", () => {
    expect(
      normalizePublicSourceUrl(
        "https://docs.example.com/pricing/openai?utm=ad#table",
      ),
    ).toBe("https://docs.example.com/pricing/openai");
  });

  it("can reject query strings and hashes for observation intake", () => {
    expect(() =>
      normalizePublicSourceUrl("https://docs.example.com/pricing?utm=ad", {
        rejectQueryAndHash: true,
      }),
    ).toThrow("Public source URL must not include query strings or hashes");

    expect(() =>
      normalizePublicSourceUrl("https://docs.example.com/pricing#models", {
        rejectQueryAndHash: true,
      }),
    ).toThrow("Public source URL must not include query strings or hashes");
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

  it("rejects non-absolute URLs", () => {
    expect(() => normalizePublicSourceUrl("/pricing/openai")).toThrow(
      "Public source URL must be an absolute URL",
    );
  });

  it("rejects private and local hosts", () => {
    expect(() => normalizeUrlToOrigin("http://localhost:3000/pricing")).toThrow(
      "Observation URL host must be public",
    );
    expect(() => normalizeUrlToOrigin("https://192.168.1.2/pricing")).toThrow(
      "Observation URL host must be public",
    );
    expect(() =>
      normalizePublicSourceUrl("https://admin.internal/pricing"),
    ).toThrow("Observation URL host must be public");
  });

  it("rejects credential-like and user-specific public paths", () => {
    expect(() =>
      normalizePublicSourceUrl("https://docs.example.com/users/123/pricing"),
    ).toThrow("Public source URL path is not public-safe");

    expect(() =>
      normalizePublicSourceUrl("https://docs.example.com/api/sk-abc123"),
    ).toThrow("Public source URL path is not public-safe");
  });

  it("rejects encoded sensitive path bypasses", () => {
    expect(() =>
      normalizePublicSourceUrl("https://docs.example.com/%75sers/123"),
    ).toThrow("Public source URL path is not public-safe");

    expect(() =>
      normalizePublicSourceUrl("https://docs.example.com/api/%73k-abc123"),
    ).toThrow("Public source URL path is not public-safe");

    expect(() =>
      normalizePublicSourceUrl("https://docs.example.com/user%2F42"),
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
    expect(
      validatePublicSourceUrl("https://docs.example.com/pricing?utm=ad", {
        rejectQueryAndHash: true,
      }),
    ).toEqual({
      ok: false,
      reason: "Public source URL must not include query strings or hashes",
    });
  });
});
```

- [ ] **Step 2: Run URL policy tests to verify they fail**

Run:

```powershell
pnpm test:run src/domain/privacy/url-policy.test.ts
```

Expected:

- Exit code is non-zero.
- Failure mentions `rejectQueryAndHash` does not exist or private hosts are not rejected.

- [ ] **Step 3: Implement shared URL policy hardening**

Replace `src/domain/privacy/url-policy.ts` with:

```ts
import { DomainPolicyError, domainPolicyErrorCode } from "../errors";

export type PublicSourceUrlOptions = {
  readonly rejectQueryAndHash?: boolean;
};

export type UrlPolicyResult =
  | { ok: true; value: string }
  | { ok: false; reason: string };

export const urlPolicyViolationReason = {
  absoluteUrlRequired: "Public source URL must be an absolute URL",
  unsupportedProtocol: "Public source URL must use http or https",
  credentialsForbidden: "Public source URL must not include credentials",
  unsafePublicPath: "Public source URL path is not public-safe",
  queryOrHashForbidden:
    "Public source URL must not include query strings or hashes",
  privateHostForbidden: "Observation URL host must be public",
} as const;

const unsafePathPatterns = [
  /(^|\/)(user|users|account|accounts|profile|profiles|dashboard|admin)(\/|$)/i,
  /(^|\/)(token|tokens|key|keys|secret|secrets)(\/|$)/i,
  /(^|\/)(sk-[a-z0-9_-]+)/i,
  /(^|\/)(Bearer%20|Bearer-)/i,
];

const percentEncodedPathPattern = /%[0-9a-f]{2}/i;

const privateIpv4Patterns = [
  /^0\./,
  /^10\./,
  /^127\./,
  /^169\.254\./,
  /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
  /^192\.168\./,
];

function throwPrivacyViolation(message: string): never {
  throw new DomainPolicyError(domainPolicyErrorCode.privacyViolation, message);
}

function normalizeHostname(hostname: string): string {
  return hostname.toLowerCase().replace(/^\[/, "").replace(/\]$/, "");
}

function isPrivateOrLocalHost(hostname: string): boolean {
  const host = normalizeHostname(hostname);

  if (
    host === "localhost" ||
    host.endsWith(".localhost") ||
    host.endsWith(".local") ||
    host.endsWith(".internal")
  ) {
    return true;
  }

  if (host === "::1" || host.startsWith("fc") || host.startsWith("fd")) {
    return true;
  }

  return privateIpv4Patterns.some((pattern) => pattern.test(host));
}

function parseHttpUrl(rawUrl: string): URL {
  let url: URL;

  try {
    url = new URL(rawUrl);
  } catch {
    throwPrivacyViolation(urlPolicyViolationReason.absoluteUrlRequired);
  }

  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throwPrivacyViolation(urlPolicyViolationReason.unsupportedProtocol);
  }

  if (url.username || url.password) {
    throwPrivacyViolation(urlPolicyViolationReason.credentialsForbidden);
  }

  if (isPrivateOrLocalHost(url.hostname)) {
    throwPrivacyViolation(urlPolicyViolationReason.privateHostForbidden);
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

  if (percentEncodedPathPattern.test(normalizedPath)) {
    throwPrivacyViolation(urlPolicyViolationReason.unsafePublicPath);
  }

  if (unsafePathPatterns.some((pattern) => pattern.test(normalizedPath))) {
    throwPrivacyViolation(urlPolicyViolationReason.unsafePublicPath);
  }
}

function assertNoQueryOrHash(url: URL): void {
  if (url.search || url.hash) {
    throwPrivacyViolation(urlPolicyViolationReason.queryOrHashForbidden);
  }
}

export function normalizeUrlToOrigin(rawUrl: string): string {
  const url = parseHttpUrl(rawUrl);
  return url.origin;
}

export function normalizePublicSourceUrl(
  rawUrl: string,
  options: PublicSourceUrlOptions = {},
): string {
  const url = parseHttpUrl(rawUrl);

  if (options.rejectQueryAndHash) {
    assertNoQueryOrHash(url);
  }

  assertPublicSafePath(url.pathname);

  return `${url.origin}${stripTrailingSlash(url.pathname)}`;
}

export function validatePublicSourceUrl(
  rawUrl: string,
  options: PublicSourceUrlOptions = {},
): UrlPolicyResult {
  try {
    return { ok: true, value: normalizePublicSourceUrl(rawUrl, options) };
  } catch (error) {
    if (error instanceof DomainPolicyError) {
      return { ok: false, reason: error.message };
    }

    throw error;
  }
}
```

- [ ] **Step 4: Run URL policy tests to verify they pass**

Run:

```powershell
pnpm test:run src/domain/privacy/url-policy.test.ts
```

Expected:

- Exit code is `0`.
- All URL policy tests pass.

- [ ] **Step 5: Commit URL policy hardening**

Run:

```powershell
git add src/domain/privacy/url-policy.ts src/domain/privacy/url-policy.test.ts
git commit -m "feat(domain): harden observation URL policy"
```

## Task 2: Observation Intake Domain Policy

**Files:**

- Create: `src/domain/observation/policy.ts`
- Create: `src/domain/observation/policy.test.ts`

- [ ] **Step 1: Write failing observation policy tests**

Create `src/domain/observation/policy.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { DomainPolicyError, domainPolicyErrorCode } from "../errors";
import { evidenceLevel } from "../vocabularies";
import {
  assertNoSensitiveObservationFields,
  assertObservationSourceAllowed,
  computeObservationConfidence,
  deriveObservationEvidenceLevel,
  normalizeObservationOrigin,
  normalizeObservationPublicSourceUrl,
  observationKind,
  observationSource,
} from "./policy";

describe("observation intake policy", () => {
  it("rejects All API Hub extension batches until contribution governance exists", () => {
    expect(() =>
      assertObservationSourceAllowed({
        source: observationSource.allApiHubExtension,
        consent: {
          state: "explicit",
          version: "2026-05-26",
          acceptedAt: "2026-05-26T00:00:00.000Z",
        },
      }),
    ).toThrow("All API Hub extension contribution is not enabled");
  });

  it("requires explicit consent when extension governance is enabled", () => {
    expect(() =>
      assertObservationSourceAllowed({
        source: observationSource.allApiHubExtension,
        consent: { state: "not_applicable" },
        options: { allowAllApiHubExtension: true },
      }),
    ).toThrow("All API Hub extension contribution requires explicit consent");
  });

  it("allows curated seed batches with not-applicable consent", () => {
    expect(() =>
      assertObservationSourceAllowed({
        source: observationSource.curatedSeed,
        consent: { state: "not_applicable" },
      }),
    ).not.toThrow();
  });

  it("rejects sensitive-looking fields anywhere in an observation payload", () => {
    try {
      assertNoSensitiveObservationFields({
        schemaVersion: "2026-05-26",
        observations: [
          {
            kind: "verification_probe",
            target: { siteKey: "example-api" },
            rawResponseBody: { text: "private model output" },
          },
        ],
      });
      throw new Error("Expected sensitive field rejection");
    } catch (error) {
      expect(error).toBeInstanceOf(DomainPolicyError);
      expect((error as DomainPolicyError).code).toBe(
        domainPolicyErrorCode.privacyViolation,
      );
      expect((error as Error).message).toBe(
        "Observation payload contains sensitive field: observations.0.rawResponseBody",
      );
    }
  });

  it("normalizes user-observed URLs to public origins", () => {
    expect(
      normalizeObservationOrigin(
        "https://api.example.com/account/123?token=secret#private",
      ),
    ).toBe("https://api.example.com");
  });

  it("rejects private observation origins", () => {
    expect(() => normalizeObservationOrigin("http://localhost:3000")).toThrow(
      "Observation URL host must be public",
    );
  });

  it("rejects query strings and hashes in observation public source URLs", () => {
    expect(() =>
      normalizeObservationPublicSourceUrl(
        "https://docs.example.com/pricing?utm=campaign",
      ),
    ).toThrow("Public source URL must not include query strings or hashes");

    expect(normalizeObservationPublicSourceUrl("https://docs.example.com/pricing")).toBe(
      "https://docs.example.com/pricing",
    );
  });

  it("derives evidence levels conservatively from source and observation kind", () => {
    expect(
      deriveObservationEvidenceLevel({
        source: observationSource.curatedSeed,
        kind: observationKind.modelRoute,
        reviewState: "manual_review",
      }),
    ).toBe(evidenceLevel.manuallyConfirmed);

    expect(
      deriveObservationEvidenceLevel({
        source: observationSource.publicSourceJob,
        kind: observationKind.modelRoute,
        reviewState: "reviewed_public_source",
      }),
    ).toBe(evidenceLevel.listed);

    expect(
      deriveObservationEvidenceLevel({
        source: observationSource.allApiHubExtension,
        kind: observationKind.modelRoute,
      }),
    ).toBe(evidenceLevel.observed);

    expect(
      deriveObservationEvidenceLevel({
        source: observationSource.probeJob,
        kind: observationKind.verificationProbe,
        probeStatus: "pass",
      }),
    ).toBe(evidenceLevel.tested);
  });

  it("caps server confidence below manual evidence for extension observations", () => {
    expect(
      computeObservationConfidence({
        source: observationSource.allApiHubExtension,
        evidenceLevel: evidenceLevel.tested,
        producerConfidenceHint: 100,
      }),
    ).toBe(40);

    expect(
      computeObservationConfidence({
        source: observationSource.curatedSeed,
        evidenceLevel: evidenceLevel.manuallyConfirmed,
        producerConfidenceHint: 100,
      }),
    ).toBe(85);
  });
});
```

- [ ] **Step 2: Run observation policy tests to verify they fail**

Run:

```powershell
pnpm test:run src/domain/observation/policy.test.ts
```

Expected:

- Exit code is non-zero.
- Failure mentions missing `src/domain/observation/policy.ts`.

- [ ] **Step 3: Implement observation intake policy**

Create `src/domain/observation/policy.ts`:

```ts
import { DomainPolicyError, domainPolicyErrorCode } from "../errors";
import {
  normalizePublicSourceUrl,
  normalizeUrlToOrigin,
} from "../privacy/url-policy";
import {
  evidenceLevel,
  type EvidenceLevel,
  type ValueOf,
} from "../vocabularies";

export const observationSource = {
  curatedSeed: "curated_seed",
  adminImport: "admin_import",
  allApiHubExtension: "all_api_hub_extension",
  publicSourceJob: "public_source_job",
  probeJob: "probe_job",
} as const;

export type ObservationSource = ValueOf<typeof observationSource>;
export const observationSources = Object.values(observationSource);

export const observationConsentState = {
  notApplicable: "not_applicable",
  explicit: "explicit",
} as const;

export type ObservationConsentState = ValueOf<typeof observationConsentState>;

export type ObservationConsent =
  | { readonly state: "not_applicable" }
  | {
      readonly state: "explicit";
      readonly version: string;
      readonly acceptedAt: string;
    };

export const observationKind = {
  site: "site",
  endpoint: "endpoint",
  model: "model",
  modelRoute: "model_route",
  price: "price",
  verificationProbe: "verification_probe",
  cliSupport: "cli_support",
  capability: "capability",
  riskCandidate: "risk_candidate",
} as const;

export type ObservationKind = ValueOf<typeof observationKind>;
export const observationKinds = Object.values(observationKind);

export const modelListSource = {
  userScopedModelList: "user_scoped_model_list",
  catalogFallback: "catalog_fallback",
  publicModelList: "public_model_list",
  manualEntry: "manual_entry",
} as const;

export type ModelListSource = ValueOf<typeof modelListSource>;
export const modelListSources = Object.values(modelListSource);

export const probeStatus = {
  pass: "pass",
  fail: "fail",
  unsupported: "unsupported",
} as const;

export type ProbeStatus = ValueOf<typeof probeStatus>;
export const probeStatuses = Object.values(probeStatus);

export type ObservationGovernanceOptions = {
  readonly allowAllApiHubExtension?: boolean;
};

export type ObservationSourcePolicyInput = {
  readonly source: ObservationSource;
  readonly consent: ObservationConsent;
  readonly options?: ObservationGovernanceOptions;
};

const sensitiveObservationKeyFragments = [
  "apikey",
  "accesskey",
  "accesstoken",
  "refreshtoken",
  "authorization",
  "cookie",
  "accountname",
  "tokenname",
  "userid",
  "email",
  "exactbalance",
  "exactquota",
  "preciseusage",
  "requestbody",
  "responsebody",
  "prompt",
  "modeloutput",
  "rawlog",
  "rawlogs",
  "rawerror",
  "rawstack",
  "screenshot",
  "sourcecount",
  "serverconfidence",
];

const evidenceConfidenceBase: Record<EvidenceLevel, number> = {
  claimed: 25,
  listed: 55,
  observed: 45,
  tested: 75,
  manually_confirmed: 90,
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeKeyForSensitivity(key: string): string {
  return key.replace(/[-_\s]/g, "").toLowerCase();
}

function isSensitiveObservationKey(key: string): boolean {
  const normalized = normalizeKeyForSensitivity(key);
  return sensitiveObservationKeyFragments.some((fragment) =>
    normalized.includes(fragment),
  );
}

function joinPath(path: readonly string[]): string {
  return path.join(".");
}

export function findSensitiveObservationField(
  input: unknown,
  path: readonly string[] = [],
): string | null {
  if (Array.isArray(input)) {
    for (const [index, value] of input.entries()) {
      const result = findSensitiveObservationField(value, [
        ...path,
        String(index),
      ]);
      if (result) return result;
    }
    return null;
  }

  if (!isRecord(input)) {
    return null;
  }

  for (const [key, value] of Object.entries(input)) {
    const currentPath = [...path, key];
    if (isSensitiveObservationKey(key)) {
      return joinPath(currentPath);
    }

    const result = findSensitiveObservationField(value, currentPath);
    if (result) return result;
  }

  return null;
}

export function assertNoSensitiveObservationFields(input: unknown): void {
  const sensitiveFieldPath = findSensitiveObservationField(input);
  if (!sensitiveFieldPath) return;

  throw new DomainPolicyError(
    domainPolicyErrorCode.privacyViolation,
    `Observation payload contains sensitive field: ${sensitiveFieldPath}`,
  );
}

export function assertObservationSourceAllowed(
  input: ObservationSourcePolicyInput,
): void {
  if (input.source !== observationSource.allApiHubExtension) {
    return;
  }

  if (!input.options?.allowAllApiHubExtension) {
    throw new DomainPolicyError(
      domainPolicyErrorCode.publicationNotAllowed,
      "All API Hub extension contribution is not enabled",
    );
  }

  if (input.consent.state !== observationConsentState.explicit) {
    throw new DomainPolicyError(
      domainPolicyErrorCode.privacyViolation,
      "All API Hub extension contribution requires explicit consent",
    );
  }
}

export function normalizeObservationOrigin(rawUrl: string): string {
  return normalizeUrlToOrigin(rawUrl);
}

export function normalizeObservationPublicSourceUrl(rawUrl: string): string {
  return normalizePublicSourceUrl(rawUrl, { rejectQueryAndHash: true });
}

export type ObservationReviewState =
  | "unreviewed"
  | "reviewed_public_source"
  | "manual_review";

export type ObservationEvidenceInput = {
  readonly source: ObservationSource;
  readonly kind: ObservationKind;
  readonly reviewState?: ObservationReviewState;
  readonly probeStatus?: ProbeStatus;
};

export function deriveObservationEvidenceLevel(
  input: ObservationEvidenceInput,
): EvidenceLevel {
  if (input.reviewState === "manual_review") {
    return evidenceLevel.manuallyConfirmed;
  }

  if (
    (input.kind === observationKind.verificationProbe ||
      input.kind === observationKind.cliSupport) &&
    input.probeStatus === probeStatus.pass
  ) {
    return evidenceLevel.tested;
  }

  if (input.source === observationSource.publicSourceJob) {
    return evidenceLevel.listed;
  }

  if (input.reviewState === "reviewed_public_source") {
    return evidenceLevel.listed;
  }

  if (input.source === observationSource.allApiHubExtension) {
    return evidenceLevel.observed;
  }

  if (input.source === observationSource.probeJob) {
    return evidenceLevel.observed;
  }

  return evidenceLevel.claimed;
}

function clampConfidence(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function confidenceCapForSource(source: ObservationSource): number {
  if (source === observationSource.allApiHubExtension) return 40;
  if (source === observationSource.curatedSeed) return 85;
  if (source === observationSource.adminImport) return 90;
  return 95;
}

export type ObservationConfidenceInput = {
  readonly source: ObservationSource;
  readonly evidenceLevel: EvidenceLevel;
  readonly producerConfidenceHint?: number;
};

export function computeObservationConfidence(
  input: ObservationConfidenceInput,
): number {
  const base = evidenceConfidenceBase[input.evidenceLevel];
  const hint = clampConfidence(input.producerConfidenceHint ?? base);
  const combined = Math.round((base + hint) / 2);
  return Math.min(confidenceCapForSource(input.source), combined);
}
```

- [ ] **Step 4: Run observation policy tests to verify they pass**

Run:

```powershell
pnpm test:run src/domain/observation/policy.test.ts
```

Expected:

- Exit code is `0`.
- All observation policy tests pass.

- [ ] **Step 5: Commit observation policy**

Run:

```powershell
git add src/domain/observation/policy.ts src/domain/observation/policy.test.ts
git commit -m "feat(domain): add observation intake policy"
```

## Task 3: Observation Batch Contract

**Files:**

- Create: `src/contracts/import/observation.ts`
- Modify: `src/contracts/boundary.test.ts`

- [ ] **Step 1: Write failing observation contract tests**

Replace `src/contracts/boundary.test.ts` with:

```ts
import { describe, expect, expectTypeOf, it } from "vitest";
import {
  adminAuditEventDtoSchema,
  auditActorDtoSchema,
} from "./admin/audit";
import {
  adminDirectoryReviewDtoSchema,
  type AdminDirectoryReviewDto,
} from "./admin/directory";
import type { EvidenceLevel, PublishableLifecycle } from "~/domain/vocabularies";
import {
  observationBatchSchema,
  type ObservationBatchInput,
} from "./import/observation";
import { seedSiteCandidateInputSchema } from "./import/seed";
import {
  publicProjectionDtoSchema,
  type PublicEvidenceSummaryDto,
} from "./public/directory";
import { paginationQuerySchema } from "./shared/pagination";

const entityId = "11111111-1111-4111-8111-111111111111";
const versionId = "22222222-2222-4222-8222-222222222222";
const auditId = "33333333-3333-4333-8333-333333333333";
const adminId = "44444444-4444-4444-8444-444444444444";
const batchId = "55555555-5555-4555-8555-555555555555";

describe("typed boundary contracts", () => {
  it("accepts public projection DTOs without private fields", () => {
    const parsed = publicProjectionDtoSchema.parse({
      entityId,
      versionId,
      slug: "example-api",
      title: "Example API",
      summary: "Public summary",
      publicUrl: "https://example.com",
      evidence: [
        {
          level: "listed",
          observedAt: "2026-05-24T00:00:00.000Z",
          publicSourceUrl: "https://example.com/pricing",
        },
      ],
      updatedAt: "2026-05-24T00:00:00.000Z",
    });

    expect(parsed.slug).toBe("example-api");
    expectTypeOf(parsed.evidence[0]).toEqualTypeOf<
      PublicEvidenceSummaryDto | undefined
    >();
    expectTypeOf(parsed.evidence[0]?.level).toEqualTypeOf<
      EvidenceLevel | undefined
    >();
  });

  it("rejects private fields in public DTOs", () => {
    expect(() =>
      publicProjectionDtoSchema.parse({
        entityId,
        versionId,
        slug: "example-api",
        title: "Example API",
        summary: "Public summary",
        publicUrl: "https://example.com",
        evidence: [],
        updatedAt: "2026-05-24T00:00:00.000Z",
        adminNotes: "private",
      }),
    ).toThrow();
  });

  it("accepts sanitized admin review DTOs", () => {
    const parsed = adminDirectoryReviewDtoSchema.parse({
      entityId,
      versionId,
      lifecycle: "pending_review",
      title: "Example API",
      reviewSummary: "Needs source review",
      evidenceCount: 2,
      updatedAt: "2026-05-24T00:00:00.000Z",
    });

    expect(parsed.evidenceCount).toBe(2);
    expectTypeOf(parsed).toEqualTypeOf<AdminDirectoryReviewDto>();
    expectTypeOf(parsed.lifecycle).toEqualTypeOf<PublishableLifecycle>();
  });

  it("rejects private fields in admin review DTOs", () => {
    expect(() =>
      adminDirectoryReviewDtoSchema.parse({
        entityId,
        versionId,
        lifecycle: "pending_review",
        title: "Example API",
        reviewSummary: "Needs source review",
        evidenceCount: 2,
        updatedAt: "2026-05-24T00:00:00.000Z",
        rawEvidence: { requestBody: "private" },
      }),
    ).toThrow();
  });

  it("accepts audit DTOs with explicit actor context", () => {
    expect(
      auditActorDtoSchema.parse({ type: "admin", id: adminId }),
    ).toEqual({ type: "admin", id: adminId });

    expect(
      adminAuditEventDtoSchema.parse({
        id: auditId,
        actor: { type: "admin", id: adminId },
        commandId: "cmd-1",
        objectFamily: "site",
        objectId: entityId,
        action: "publish.approved",
        createdAt: "2026-05-24T00:00:00.000Z",
      }),
    ).toMatchObject({
      id: auditId,
      action: "publish.approved",
    });
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

  it("accepts curated seed observation batches and normalizes observation origins", () => {
    const parsed = observationBatchSchema.parse({
      schemaVersion: "2026-05-26",
      source: "curated_seed",
      batchId,
      generatedAt: "2026-05-26T00:00:00.000Z",
      producer: {
        productName: "ai-api-directory",
        productVersion: "0.1.0",
        contractVersion: "2026-05-26",
      },
      consent: { state: "not_applicable" },
      observations: [
        {
          kind: "site",
          siteKey: "example-api",
          displayName: "Example API",
          origin: "https://example.com/account/123?token=secret",
          siteType: "relay",
          category: "ai_gateway",
          observedAt: "2026-05-26T00:00:00.000Z",
          producerConfidenceHint: 80,
        },
        {
          kind: "model_route",
          siteKey: "example-api",
          endpointKey: "example-api-main",
          canonicalModelKey: "gpt-4o-mini",
          routeModelId: "gpt-4o-mini",
          providerType: "openai_compatible",
          upstreamClaim: "openai",
          factLevel: "listed",
          modelListSource: "catalog_fallback",
          observedAt: "2026-05-26T00:00:00.000Z",
          producerConfidenceHint: 60,
        },
      ],
    });

    expect(parsed.observations[0]).toMatchObject({
      kind: "site",
      origin: "https://example.com",
    });
    expect(parsed.observations[1]).toMatchObject({
      kind: "model_route",
      modelListSource: "catalog_fallback",
    });
    expectTypeOf(parsed).toEqualTypeOf<ObservationBatchInput>();
  });

  it("rejects All API Hub extension observations until governance exists", () => {
    expect(() =>
      observationBatchSchema.parse({
        schemaVersion: "2026-05-26",
        source: "all_api_hub_extension",
        batchId,
        generatedAt: "2026-05-26T00:00:00.000Z",
        producer: {
          productName: "All API Hub",
          productVersion: "3.41.0",
          extensionVersion: "3.41.0",
          contractVersion: "2026-05-26",
        },
        consent: {
          state: "explicit",
          version: "2026-05-26",
          acceptedAt: "2026-05-26T00:00:00.000Z",
        },
        observations: [
          {
            kind: "capability",
            siteKey: "example-api",
            capability: "model_list",
            status: "supported",
            observedAt: "2026-05-26T00:00:00.000Z",
          },
        ],
      }),
    ).toThrow("All API Hub extension contribution is not enabled");
  });

  it("rejects unknown observation fields and sensitive-looking nested fields", () => {
    expect(() =>
      observationBatchSchema.parse({
        schemaVersion: "2026-05-26",
        source: "curated_seed",
        batchId,
        generatedAt: "2026-05-26T00:00:00.000Z",
        producer: {
          productName: "ai-api-directory",
          contractVersion: "2026-05-26",
        },
        consent: { state: "not_applicable" },
        observations: [
          {
            kind: "capability",
            siteKey: "example-api",
            capability: "model_list",
            status: "supported",
            observedAt: "2026-05-26T00:00:00.000Z",
            sourceCount: 100,
          },
        ],
      }),
    ).toThrow();

    expect(() =>
      observationBatchSchema.parse({
        schemaVersion: "2026-05-26",
        source: "curated_seed",
        batchId,
        generatedAt: "2026-05-26T00:00:00.000Z",
        producer: {
          productName: "ai-api-directory",
          contractVersion: "2026-05-26",
        },
        consent: { state: "not_applicable" },
        observations: [
          {
            kind: "verification_probe",
            target: { siteKey: "example-api" },
            apiType: "openai_chat_completions",
            probeId: "probe-1",
            status: "pass",
            observedAt: "2026-05-26T00:00:00.000Z",
            durationBucket: "1s_to_5s",
            errorCategory: "none",
            rawErrorStack: "private",
          },
        ],
      }),
    ).toThrow();
  });

  it("rejects query-bearing public source URLs in observations", () => {
    expect(() =>
      observationBatchSchema.parse({
        schemaVersion: "2026-05-26",
        source: "curated_seed",
        batchId,
        generatedAt: "2026-05-26T00:00:00.000Z",
        producer: {
          productName: "ai-api-directory",
          contractVersion: "2026-05-26",
        },
        consent: { state: "not_applicable" },
        observations: [
          {
            kind: "price",
            siteKey: "example-api",
            routeModelId: "gpt-4o-mini",
            currency: "USD",
            billingUnit: "per_1m_tokens",
            inputPer1M: 0.15,
            outputPer1M: 0.6,
            source: "public_pricing_page",
            publicSourceUrl: "https://example.com/pricing?account=private",
            observedAt: "2026-05-26T00:00:00.000Z",
          },
        ],
      }),
    ).toThrow("Public source URL must not include query strings or hashes");
  });

  it("normalizes pagination query defaults", () => {
    expect(paginationQuerySchema.parse({})).toEqual({
      page: 1,
      pageSize: 20,
    });
  });
});
```

- [ ] **Step 2: Run contract tests to verify they fail**

Run:

```powershell
pnpm test:run src/contracts/boundary.test.ts
```

Expected:

- Exit code is non-zero.
- Failure mentions missing `src/contracts/import/observation`.

- [ ] **Step 3: Implement observation batch schemas**

Create `src/contracts/import/observation.ts`:

```ts
import { z } from "zod";
import {
  factLevels,
  type FactLevel,
} from "~/domain/vocabularies";
import {
  assertNoSensitiveObservationFields,
  assertObservationSourceAllowed,
  modelListSources,
  normalizeObservationOrigin,
  normalizeObservationPublicSourceUrl,
  observationKind,
  observationSources,
  probeStatuses,
  type ModelListSource,
  type ObservationKind,
  type ObservationSource,
  type ProbeStatus,
} from "~/domain/observation/policy";
import { isoDateTimeSchema, slugSchema } from "../shared/ids";

const observationSourceValues = observationSources as [
  ObservationSource,
  ...ObservationSource[],
];
const factLevelValues = factLevels as [FactLevel, ...FactLevel[]];
const modelListSourceValues = modelListSources as [
  ModelListSource,
  ...ModelListSource[],
];
const probeStatusValues = probeStatuses as [ProbeStatus, ...ProbeStatus[]];

const confidenceHintSchema = z.number().int().min(0).max(100);

const observationOriginSchema = z.string().transform((value, ctx) => {
  try {
    return normalizeObservationOrigin(value);
  } catch (error) {
    if (error instanceof Error) {
      ctx.addIssue({ code: "custom", message: error.message });
      return z.NEVER;
    }
    throw error;
  }
});

const observationPublicSourceUrlSchema = z.string().transform((value, ctx) => {
  try {
    return normalizeObservationPublicSourceUrl(value);
  } catch (error) {
    if (error instanceof Error) {
      ctx.addIssue({ code: "custom", message: error.message });
      return z.NEVER;
    }
    throw error;
  }
});

const baseObservationFields = {
  observedAt: isoDateTimeSchema,
  producerConfidenceHint: confidenceHintSchema.optional(),
} as const;

export const observationProducerSchema = z
  .object({
    productName: z.string().min(1),
    productVersion: z.string().min(1).optional(),
    extensionVersion: z.string().min(1).optional(),
    contractVersion: z.literal("2026-05-26"),
  })
  .strict();

export const observationConsentSchema = z.discriminatedUnion("state", [
  z.object({ state: z.literal("not_applicable") }).strict(),
  z
    .object({
      state: z.literal("explicit"),
      version: z.string().min(1),
      acceptedAt: isoDateTimeSchema,
    })
    .strict(),
]);

export const siteObservationSchema = z
  .object({
    kind: z.literal(observationKind.site),
    siteKey: slugSchema,
    displayName: z.string().min(1),
    origin: observationOriginSchema,
    publicSourceUrl: observationPublicSourceUrlSchema.optional(),
    siteType: z.enum(["relay", "aggregator", "gateway", "model_provider", "unknown"]),
    category: z.enum(["ai_gateway", "model_access", "developer_tooling", "unknown"]),
    ...baseObservationFields,
  })
  .strict();

export const endpointObservationSchema = z
  .object({
    kind: z.literal(observationKind.endpoint),
    siteKey: slugSchema,
    endpointKey: slugSchema,
    origin: observationOriginSchema,
    endpointKind: z.enum([
      "homepage",
      "console",
      "api",
      "docs",
      "pricing",
      "recharge",
      "status",
      "unknown",
    ]),
    publicSourceUrl: observationPublicSourceUrlSchema.optional(),
    ...baseObservationFields,
  })
  .strict();

export const modelObservationSchema = z
  .object({
    kind: z.literal(observationKind.model),
    canonicalModelKey: slugSchema,
    displayName: z.string().min(1),
    family: z.string().min(1),
    creator: z.string().min(1),
    routeModelId: z.string().min(1).optional(),
    aliases: z.array(z.string().min(1)),
    contextWindow: z.number().int().positive().optional(),
    capabilities: z.array(z.string().min(1)),
    source: z.string().min(1),
    ...baseObservationFields,
  })
  .strict();

export const modelRouteObservationSchema = z
  .object({
    kind: z.literal(observationKind.modelRoute),
    siteKey: slugSchema,
    endpointKey: slugSchema,
    canonicalModelKey: slugSchema,
    routeModelId: z.string().min(1),
    providerType: z.enum([
      "openai_compatible",
      "anthropic_compatible",
      "native",
      "unknown",
    ]),
    upstreamClaim: z.string().min(1).optional(),
    factLevel: z.enum(factLevelValues),
    modelListSource: z.enum(modelListSourceValues),
    publicSourceUrl: observationPublicSourceUrlSchema.optional(),
    ...baseObservationFields,
  })
  .strict();

export const priceObservationSchema = z
  .object({
    kind: z.literal(observationKind.price),
    siteKey: slugSchema,
    routeModelId: z.string().min(1),
    currency: z.string().length(3),
    billingUnit: z.enum([
      "per_1m_tokens",
      "ratio_multiplier",
      "per_request",
      "minimum_recharge",
      "unknown",
    ]),
    inputPer1M: z.number().nonnegative().optional(),
    outputPer1M: z.number().nonnegative().optional(),
    cacheReadPer1M: z.number().nonnegative().optional(),
    cacheWritePer1M: z.number().nonnegative().optional(),
    requestFee: z.number().nonnegative().optional(),
    minimumRecharge: z.number().nonnegative().optional(),
    discountNote: z.string().min(1).optional(),
    exchangeRateNote: z.string().min(1).optional(),
    source: z.string().min(1),
    publicSourceUrl: observationPublicSourceUrlSchema.optional(),
    effectiveAt: isoDateTimeSchema.optional(),
    expiresAt: isoDateTimeSchema.optional(),
    ...baseObservationFields,
  })
  .strict();

export const verificationProbeObservationSchema = z
  .object({
    kind: z.literal(observationKind.verificationProbe),
    target: z
      .object({
        siteKey: slugSchema,
        routeModelId: z.string().min(1).optional(),
      })
      .strict(),
    apiType: z.enum([
      "openai_chat_completions",
      "openai_responses",
      "anthropic_messages",
      "model_list",
      "unknown",
    ]),
    probeId: z.string().min(1),
    status: z.enum(probeStatusValues),
    modelId: z.string().min(1).optional(),
    durationBucket: z.enum(["lt_1s", "1s_to_5s", "gt_5s", "unknown"]),
    errorCategory: z.enum([
      "none",
      "auth_failed",
      "rate_limited",
      "network_error",
      "unsupported",
      "unknown",
    ]),
    ...baseObservationFields,
  })
  .strict();

export const cliSupportObservationSchema = z
  .object({
    kind: z.literal(observationKind.cliSupport),
    target: z
      .object({
        siteKey: slugSchema,
        routeModelId: z.string().min(1).optional(),
      })
      .strict(),
    tool: z.enum(["claude_code", "codex_cli", "gemini_cli", "cursor", "unknown"]),
    probeId: z.string().min(1),
    status: z.enum(probeStatusValues),
    modelId: z.string().min(1).optional(),
    durationBucket: z.enum(["lt_1s", "1s_to_5s", "gt_5s", "unknown"]),
    errorCategory: z.enum([
      "none",
      "auth_failed",
      "rate_limited",
      "network_error",
      "unsupported",
      "unknown",
    ]),
    ...baseObservationFields,
  })
  .strict();

export const capabilityObservationSchema = z
  .object({
    kind: z.literal(observationKind.capability),
    siteKey: slugSchema,
    capability: z.enum([
      "model_list",
      "balance_refresh",
      "usage_refresh",
      "check_in",
      "key_management",
      "api_credential_verification",
      "cli_compatibility",
      "all_api_hub_add_flow",
      "all_api_hub_manage_flow",
    ]),
    status: z.enum(["supported", "unsupported", "unknown"]),
    ...baseObservationFields,
  })
  .strict();

export const riskCandidateObservationSchema = z
  .object({
    kind: z.literal(observationKind.riskCandidate),
    siteKey: slugSchema,
    riskType: z.enum([
      "price_missing",
      "stale_observation",
      "inconsistent_model_claim",
      "repeated_probe_failure",
      "privacy_unknown",
      "unknown",
    ]),
    severityHint: z.enum(["info", "warning", "critical"]),
    source: z.string().min(1),
    ...baseObservationFields,
  })
  .strict();

export const observationSchema = z.discriminatedUnion("kind", [
  siteObservationSchema,
  endpointObservationSchema,
  modelObservationSchema,
  modelRouteObservationSchema,
  priceObservationSchema,
  verificationProbeObservationSchema,
  cliSupportObservationSchema,
  capabilityObservationSchema,
  riskCandidateObservationSchema,
]);

function isEditorialPriceNoteSource(source: ObservationSource): boolean {
  return source === "curated_seed" || source === "admin_import";
}

export const observationBatchSchema = z
  .object({
    schemaVersion: z.literal("2026-05-26"),
    source: z.enum(observationSourceValues),
    batchId: z.string().uuid(),
    generatedAt: isoDateTimeSchema,
    producer: observationProducerSchema,
    consent: observationConsentSchema,
    observations: z.array(observationSchema).min(1),
  })
  .strict()
  .superRefine((batch, ctx) => {
    try {
      assertObservationSourceAllowed({
        source: batch.source,
        consent: batch.consent,
      });
      assertNoSensitiveObservationFields(batch);
    } catch (error) {
      if (error instanceof Error) {
        ctx.addIssue({ code: "custom", message: error.message });
        return;
      }
      throw error;
    }

    for (const [index, observation] of batch.observations.entries()) {
      if (
        observation.kind === observationKind.price &&
        !isEditorialPriceNoteSource(batch.source) &&
        (observation.discountNote || observation.exchangeRateNote)
      ) {
        ctx.addIssue({
          code: "custom",
          path: ["observations", index],
          message:
            "Discount and exchange-rate notes require curated seed or admin import review",
        });
      }
    }
  });

export type ObservationKindValue = ObservationKind;
export type ObservationInput = z.infer<typeof observationSchema>;
export type SiteObservationInput = z.infer<typeof siteObservationSchema>;
export type EndpointObservationInput = z.infer<typeof endpointObservationSchema>;
export type ModelObservationInput = z.infer<typeof modelObservationSchema>;
export type ModelRouteObservationInput = z.infer<
  typeof modelRouteObservationSchema
>;
export type PriceObservationInput = z.infer<typeof priceObservationSchema>;
export type VerificationProbeObservationInput = z.infer<
  typeof verificationProbeObservationSchema
>;
export type CliSupportObservationInput = z.infer<
  typeof cliSupportObservationSchema
>;
export type CapabilityObservationInput = z.infer<
  typeof capabilityObservationSchema
>;
export type RiskCandidateObservationInput = z.infer<
  typeof riskCandidateObservationSchema
>;
export type ObservationBatchInput = z.infer<typeof observationBatchSchema>;
```

- [ ] **Step 4: Run contract tests to verify they pass**

Run:

```powershell
pnpm test:run src/contracts/boundary.test.ts
```

Expected:

- Exit code is `0`.
- Observation batch tests pass.
- Existing public, admin, audit, seed, and pagination tests still pass.

- [ ] **Step 5: Commit observation contracts**

Run:

```powershell
git add src/contracts/import/observation.ts src/contracts/boundary.test.ts
git commit -m "feat(contracts): add observation batch intake contract"
```

## Task 4: Seed Compatibility Wrapper

**Files:**

- Modify: `src/contracts/import/seed.ts`
- Modify: `src/server/db/mappers/import-candidate.ts`
- Modify: `src/server/db/mappers/boundary.test.ts`

- [ ] **Step 1: Write failing mapper tests for seed-as-observation behavior**

Replace `src/server/db/mappers/boundary.test.ts` with:

```ts
import { describe, expect, it } from "vitest";
import { mapAdminDirectoryReviewToDto } from "./admin-directory";
import { mapSeedSiteCandidateToCandidateInput } from "./import-candidate";
import { mapProjectionRecordToPublicDto } from "./public-projection";

const entityId = "11111111-1111-4111-8111-111111111111";
const versionId = "22222222-2222-4222-8222-222222222222";
const batchId = "55555555-5555-4555-8555-555555555555";

describe("server DB mappers", () => {
  it("validates projection payloads before returning public DTOs", () => {
    expect(() =>
      mapProjectionRecordToPublicDto({
        projectionKey: "site/example-api",
        locale: "zh-cn",
        payload: {
          entityId,
          versionId,
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
        entityId,
        versionId,
        lifecycle: "pending_review",
        title: "Example API",
        reviewSummary: "Needs source review",
        evidenceCount: 2,
        updatedAt: "2026-05-24T00:00:00.000Z",
        rawEvidence: { requestBody: "private" },
      }),
    ).toEqual({
      entityId,
      versionId,
      lifecycle: "pending_review",
      title: "Example API",
      reviewSummary: "Needs source review",
      evidenceCount: 2,
      updatedAt: "2026-05-24T00:00:00.000Z",
    });
  });

  it("maps seed candidate input through a curated observation batch", () => {
    expect(
      mapSeedSiteCandidateToCandidateInput(
        {
          slug: "example-api",
          displayName: "Example API",
          homepageUrl: "https://example.com/account/private?token=secret",
          sourceDescription: "manual seed",
          observedAt: "2026-05-24T00:00:00.000Z",
        },
        {
          batchId,
          generatedAt: "2026-05-24T00:00:00.000Z",
        },
      ),
    ).toEqual({
      disposition: "candidate",
      slug: "example-api",
      displayName: "Example API",
      homepageUrl: "https://example.com",
      sourceDescription: "manual seed",
      observedAt: "2026-05-24T00:00:00.000Z",
      sourceBatch: {
        schemaVersion: "2026-05-26",
        source: "curated_seed",
        batchId,
        generatedAt: "2026-05-24T00:00:00.000Z",
        producer: {
          productName: "ai-api-directory",
          contractVersion: "2026-05-26",
        },
        consent: { state: "not_applicable" },
        observations: [
          {
            kind: "site",
            siteKey: "example-api",
            displayName: "Example API",
            origin: "https://example.com",
            siteType: "unknown",
            category: "unknown",
            observedAt: "2026-05-24T00:00:00.000Z",
            producerConfidenceHint: 60,
          },
        ],
      },
    });
  });
});
```

- [ ] **Step 2: Run mapper tests to verify they fail**

Run:

```powershell
pnpm test:run src/server/db/mappers/boundary.test.ts
```

Expected:

- Exit code is non-zero.
- Failure mentions `mapSeedSiteCandidateToCandidateInput` accepts one argument or does not return `sourceBatch`.

- [ ] **Step 3: Implement seed observation wrapper**

Replace `src/contracts/import/seed.ts` with:

```ts
import { z } from "zod";
import { isoDateTimeSchema, slugSchema } from "../shared/ids";
import {
  observationBatchSchema,
  type ObservationBatchInput,
} from "./observation";

export const seedSiteCandidateInputSchema = z
  .object({
    slug: slugSchema,
    displayName: z.string().min(1),
    homepageUrl: z.string().url(),
    sourceDescription: z.string().min(1),
    observedAt: isoDateTimeSchema,
  })
  .strict();

export type SeedSiteCandidateInput = z.infer<
  typeof seedSiteCandidateInputSchema
>;

export type SeedObservationBatchOptions = {
  readonly batchId: string;
  readonly generatedAt: string;
};

export function createSeedObservationBatchFromSiteCandidate(
  input: SeedSiteCandidateInput,
  options: SeedObservationBatchOptions,
): ObservationBatchInput {
  const parsed = seedSiteCandidateInputSchema.parse(input);

  return observationBatchSchema.parse({
    schemaVersion: "2026-05-26",
    source: "curated_seed",
    batchId: options.batchId,
    generatedAt: options.generatedAt,
    producer: {
      productName: "ai-api-directory",
      contractVersion: "2026-05-26",
    },
    consent: { state: "not_applicable" },
    observations: [
      {
        kind: "site",
        siteKey: parsed.slug,
        displayName: parsed.displayName,
        origin: parsed.homepageUrl,
        siteType: "unknown",
        category: "unknown",
        observedAt: parsed.observedAt,
        producerConfidenceHint: 60,
      },
    ],
  });
}
```

- [ ] **Step 4: Route seed mapper through the wrapper**

Replace `src/server/db/mappers/import-candidate.ts` with:

```ts
import {
  createSeedObservationBatchFromSiteCandidate,
  seedSiteCandidateInputSchema,
  type SeedObservationBatchOptions,
  type SeedSiteCandidateInput,
} from "~/contracts/import/seed";
import type { ObservationBatchInput } from "~/contracts/import/observation";

export type SiteCandidateInput = {
  readonly slug: string;
  readonly displayName: string;
  readonly homepageUrl: string;
  readonly sourceDescription: string;
  readonly observedAt: string;
  readonly sourceBatch: ObservationBatchInput;
  readonly disposition: "candidate";
};

export function mapSeedSiteCandidateToCandidateInput(
  input: SeedSiteCandidateInput,
  options: SeedObservationBatchOptions,
): SiteCandidateInput {
  const parsed = seedSiteCandidateInputSchema.parse(input);
  const sourceBatch = createSeedObservationBatchFromSiteCandidate(
    parsed,
    options,
  );
  const siteObservation = sourceBatch.observations[0];

  if (siteObservation.kind !== "site") {
    throw new Error("Seed site candidate wrapper must produce a site observation");
  }

  return {
    ...parsed,
    homepageUrl: siteObservation.origin,
    sourceBatch,
    disposition: "candidate",
  };
}
```

- [ ] **Step 5: Run mapper and contract tests to verify they pass**

Run:

```powershell
pnpm test:run src/server/db/mappers/boundary.test.ts src/contracts/boundary.test.ts
```

Expected:

- Exit code is `0`.
- Mapper test proves seed input produces a curated observation batch.
- Contract test still accepts the legacy seed candidate input shape.

- [ ] **Step 6: Commit seed wrapper**

Run:

```powershell
git add src/contracts/import/seed.ts src/server/db/mappers/import-candidate.ts src/server/db/mappers/boundary.test.ts
git commit -m "feat(import): route seed candidates through observation batches"
```

## Task 5: Development Observation Fixtures And Production Guard

**Files:**

- Create: `src/contracts/import/fixtures/development.ts`
- Create: `src/contracts/import/fixtures/seed-environment.ts`
- Create: `src/contracts/import/fixtures/fixtures.test.ts`

- [ ] **Step 1: Write failing fixture tests**

Create `src/contracts/import/fixtures/fixtures.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { DomainPolicyError, domainPolicyErrorCode } from "~/domain/errors";
import { observationBatchSchema } from "../observation";
import { developmentObservationBatches } from "./development";
import { assertProductionSeedBatchHasNoSyntheticSites } from "./seed-environment";

describe("observation seed fixtures", () => {
  it("keeps development fixtures in the observation batch format", () => {
    expect(developmentObservationBatches).toHaveLength(1);

    const parsed = observationBatchSchema.parse(developmentObservationBatches[0]);
    expect(parsed).toMatchObject({
      schemaVersion: "2026-05-26",
      source: "curated_seed",
      consent: { state: "not_applicable" },
    });
    expect(parsed.observations.map((observation) => observation.kind)).toEqual([
      "site",
      "endpoint",
      "model",
      "model_route",
      "price",
      "verification_probe",
      "cli_support",
      "capability",
      "risk_candidate",
    ]);
  });

  it("rejects synthetic development sites when a batch is promoted as production seed", () => {
    try {
      assertProductionSeedBatchHasNoSyntheticSites(
        developmentObservationBatches[0],
      );
      throw new Error("Expected production seed guard to reject development batch");
    } catch (error) {
      expect(error).toBeInstanceOf(DomainPolicyError);
      expect((error as DomainPolicyError).code).toBe(
        domainPolicyErrorCode.privacyViolation,
      );
      expect((error as Error).message).toBe(
        "Production seed cannot use synthetic fixture origin: https://synthetic-relay.example.com",
      );
    }
  });
});
```

- [ ] **Step 2: Run fixture tests to verify they fail**

Run:

```powershell
pnpm test:run src/contracts/import/fixtures/fixtures.test.ts
```

Expected:

- Exit code is non-zero.
- Failure mentions missing `src/contracts/import/fixtures/development`.

- [ ] **Step 3: Add synthetic development observation batch**

Create `src/contracts/import/fixtures/development.ts`:

```ts
import {
  observationBatchSchema,
  type ObservationBatchInput,
} from "../observation";

export const developmentObservationBatch = observationBatchSchema.parse({
  schemaVersion: "2026-05-26",
  source: "curated_seed",
  batchId: "66666666-6666-4666-8666-666666666666",
  generatedAt: "2026-05-26T00:00:00.000Z",
  producer: {
    productName: "ai-api-directory-dev-fixture",
    productVersion: "0.1.0",
    contractVersion: "2026-05-26",
  },
  consent: { state: "not_applicable" },
  observations: [
    {
      kind: "site",
      siteKey: "synthetic-relay",
      displayName: "Synthetic Relay",
      origin: "https://synthetic-relay.example.com/account/local",
      siteType: "relay",
      category: "ai_gateway",
      observedAt: "2026-05-26T00:00:00.000Z",
      producerConfidenceHint: 70,
    },
    {
      kind: "endpoint",
      siteKey: "synthetic-relay",
      endpointKey: "synthetic-relay-api",
      origin: "https://api.synthetic-relay.example.com/v1",
      endpointKind: "api",
      observedAt: "2026-05-26T00:00:00.000Z",
      producerConfidenceHint: 70,
    },
    {
      kind: "model",
      canonicalModelKey: "gpt-4o-mini",
      displayName: "GPT-4o mini",
      family: "gpt-4o",
      creator: "OpenAI",
      routeModelId: "gpt-4o-mini",
      aliases: ["gpt-4o-mini"],
      contextWindow: 128000,
      capabilities: ["text_generation", "structured_output"],
      source: "synthetic fixture",
      observedAt: "2026-05-26T00:00:00.000Z",
      producerConfidenceHint: 65,
    },
    {
      kind: "model_route",
      siteKey: "synthetic-relay",
      endpointKey: "synthetic-relay-api",
      canonicalModelKey: "gpt-4o-mini",
      routeModelId: "gpt-4o-mini",
      providerType: "openai_compatible",
      upstreamClaim: "openai",
      factLevel: "listed",
      modelListSource: "catalog_fallback",
      observedAt: "2026-05-26T00:00:00.000Z",
      producerConfidenceHint: 55,
    },
    {
      kind: "price",
      siteKey: "synthetic-relay",
      routeModelId: "gpt-4o-mini",
      currency: "USD",
      billingUnit: "ratio_multiplier",
      inputPer1M: 0.15,
      outputPer1M: 0.6,
      source: "synthetic fixture",
      observedAt: "2026-05-26T00:00:00.000Z",
      producerConfidenceHint: 60,
    },
    {
      kind: "verification_probe",
      target: {
        siteKey: "synthetic-relay",
        routeModelId: "gpt-4o-mini",
      },
      apiType: "openai_chat_completions",
      probeId: "synthetic-text-probe",
      status: "pass",
      modelId: "gpt-4o-mini",
      durationBucket: "1s_to_5s",
      errorCategory: "none",
      observedAt: "2026-05-26T00:00:00.000Z",
      producerConfidenceHint: 80,
    },
    {
      kind: "cli_support",
      target: {
        siteKey: "synthetic-relay",
        routeModelId: "gpt-4o-mini",
      },
      tool: "codex_cli",
      probeId: "synthetic-codex-cli-probe",
      status: "unsupported",
      modelId: "gpt-4o-mini",
      durationBucket: "unknown",
      errorCategory: "unsupported",
      observedAt: "2026-05-26T00:00:00.000Z",
      producerConfidenceHint: 50,
    },
    {
      kind: "capability",
      siteKey: "synthetic-relay",
      capability: "model_list",
      status: "supported",
      observedAt: "2026-05-26T00:00:00.000Z",
      producerConfidenceHint: 70,
    },
    {
      kind: "risk_candidate",
      siteKey: "synthetic-relay",
      riskType: "price_missing",
      severityHint: "info",
      source: "synthetic fixture",
      observedAt: "2026-05-26T00:00:00.000Z",
      producerConfidenceHint: 30,
    },
  ],
});

export const developmentObservationBatches: readonly ObservationBatchInput[] = [
  developmentObservationBatch,
];
```

- [ ] **Step 4: Add production seed guard**

Create `src/contracts/import/fixtures/seed-environment.ts`:

```ts
import { DomainPolicyError, domainPolicyErrorCode } from "~/domain/errors";
import type { ObservationBatchInput } from "../observation";

const syntheticHostPatterns = [
  /(^|\.)example\.com$/i,
  /(^|\.)example\.org$/i,
  /(^|\.)example\.net$/i,
  /(^|\.)test$/i,
  /(^|\.)invalid$/i,
  /(^|\.)localhost$/i,
];

function isSyntheticHost(hostname: string): boolean {
  return syntheticHostPatterns.some((pattern) => pattern.test(hostname));
}

function originFromObservation(
  observation: ObservationBatchInput["observations"][number],
): string | null {
  if ("origin" in observation) {
    return observation.origin;
  }
  return null;
}

export function assertProductionSeedBatchHasNoSyntheticSites(
  batch: ObservationBatchInput,
): void {
  for (const observation of batch.observations) {
    const origin = originFromObservation(observation);
    if (!origin) continue;

    const hostname = new URL(origin).hostname;
    if (isSyntheticHost(hostname)) {
      throw new DomainPolicyError(
        domainPolicyErrorCode.privacyViolation,
        `Production seed cannot use synthetic fixture origin: ${origin}`,
      );
    }
  }
}
```

- [ ] **Step 5: Run fixture tests to verify they pass**

Run:

```powershell
pnpm test:run src/contracts/import/fixtures/fixtures.test.ts
```

Expected:

- Exit code is `0`.
- Development fixture validates as an observation batch.
- Production guard rejects the synthetic fixture host.

- [ ] **Step 6: Commit fixture separation**

Run:

```powershell
git add src/contracts/import/fixtures
git commit -m "test(import): add observation seed fixtures"
```

## Task 6: Dry-Run Observation Intake Mapper

**Files:**

- Create: `src/server/db/mappers/observation-intake.ts`
- Modify: `src/server/db/mappers/boundary.test.ts`

- [ ] **Step 1: Write failing dry-run mapper tests**

Replace `src/server/db/mappers/boundary.test.ts` with:

```ts
import { describe, expect, it } from "vitest";
import { developmentObservationBatch } from "~/contracts/import/fixtures/development";
import { mapAdminDirectoryReviewToDto } from "./admin-directory";
import { mapSeedSiteCandidateToCandidateInput } from "./import-candidate";
import { mapObservationBatchToDryRunImportPlan } from "./observation-intake";
import { mapProjectionRecordToPublicDto } from "./public-projection";

const entityId = "11111111-1111-4111-8111-111111111111";
const versionId = "22222222-2222-4222-8222-222222222222";
const batchId = "55555555-5555-4555-8555-555555555555";

describe("server DB mappers", () => {
  it("validates projection payloads before returning public DTOs", () => {
    expect(() =>
      mapProjectionRecordToPublicDto({
        projectionKey: "site/example-api",
        locale: "zh-cn",
        payload: {
          entityId,
          versionId,
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
        entityId,
        versionId,
        lifecycle: "pending_review",
        title: "Example API",
        reviewSummary: "Needs source review",
        evidenceCount: 2,
        updatedAt: "2026-05-24T00:00:00.000Z",
        rawEvidence: { requestBody: "private" },
      }),
    ).toEqual({
      entityId,
      versionId,
      lifecycle: "pending_review",
      title: "Example API",
      reviewSummary: "Needs source review",
      evidenceCount: 2,
      updatedAt: "2026-05-24T00:00:00.000Z",
    });
  });

  it("maps seed candidate input through a curated observation batch", () => {
    expect(
      mapSeedSiteCandidateToCandidateInput(
        {
          slug: "example-api",
          displayName: "Example API",
          homepageUrl: "https://example.com/account/private?token=secret",
          sourceDescription: "manual seed",
          observedAt: "2026-05-24T00:00:00.000Z",
        },
        {
          batchId,
          generatedAt: "2026-05-24T00:00:00.000Z",
        },
      ),
    ).toMatchObject({
      disposition: "candidate",
      slug: "example-api",
      homepageUrl: "https://example.com",
      sourceBatch: {
        source: "curated_seed",
        observations: [{ kind: "site", origin: "https://example.com" }],
      },
    });
  });

  it("maps observation batches to dry-run candidates without public projections", () => {
    const plan = mapObservationBatchToDryRunImportPlan(developmentObservationBatch);

    expect(plan.publicProjectionRecords).toEqual([]);
    expect(plan.siteCandidates).toEqual([
      expect.objectContaining({
        siteKey: "synthetic-relay",
        origin: "https://synthetic-relay.example.com",
        evidenceLevel: "claimed",
      }),
    ]);
    expect(plan.modelRouteCandidates).toEqual([
      expect.objectContaining({
        routeModelId: "gpt-4o-mini",
        modelListSource: "catalog_fallback",
        evidenceLevel: "claimed",
      }),
    ]);
    expect(plan.priceCandidates).toEqual([
      expect.objectContaining({
        billingUnit: "ratio_multiplier",
        isComparableTokenPrice: false,
      }),
    ]);
    expect(plan.verificationProbeEvidence).toEqual([
      expect.objectContaining({
        probeId: "synthetic-text-probe",
        evidenceLevel: "tested",
      }),
    ]);
    expect(plan.cliSupportEvidence).toEqual([
      expect.objectContaining({
        probeId: "synthetic-codex-cli-probe",
        evidenceLevel: "claimed",
      }),
    ]);
    expect(plan.riskReviewItems).toEqual([
      expect.objectContaining({
        riskType: "price_missing",
        publicRiskSignal: false,
      }),
    ]);
  });
});
```

- [ ] **Step 2: Run mapper tests to verify they fail**

Run:

```powershell
pnpm test:run src/server/db/mappers/boundary.test.ts
```

Expected:

- Exit code is non-zero.
- Failure mentions missing `./observation-intake`.

- [ ] **Step 3: Implement dry-run intake mapper**

Create `src/server/db/mappers/observation-intake.ts`:

```ts
import {
  observationBatchSchema,
  type ObservationBatchInput,
  type ObservationInput,
} from "~/contracts/import/observation";
import {
  computeObservationConfidence,
  deriveObservationEvidenceLevel,
  observationKind,
  type ObservationKind,
  type ObservationSource,
  type ProbeStatus,
} from "~/domain/observation/policy";
import type { EvidenceLevel } from "~/domain/vocabularies";

export type DryRunEvidenceRecord = {
  readonly targetType: string;
  readonly targetKey: string;
  readonly sourceType: ObservationSource;
  readonly evidenceLevel: EvidenceLevel;
  readonly confidence: number;
  readonly observedAt: string;
  readonly publicSourceUrl?: string;
  readonly publicSummary: string;
};

export type SiteCandidateWriteInput = {
  readonly siteKey: string;
  readonly displayName: string;
  readonly origin: string;
  readonly siteType: string;
  readonly category: string;
  readonly evidenceLevel: EvidenceLevel;
  readonly confidence: number;
  readonly observedAt: string;
};

export type EndpointCandidateWriteInput = {
  readonly siteKey: string;
  readonly endpointKey: string;
  readonly origin: string;
  readonly endpointKind: string;
  readonly evidenceLevel: EvidenceLevel;
  readonly confidence: number;
  readonly observedAt: string;
};

export type ModelCandidateWriteInput = {
  readonly canonicalModelKey: string;
  readonly displayName: string;
  readonly family: string;
  readonly creator: string;
  readonly aliases: readonly string[];
  readonly capabilities: readonly string[];
  readonly evidenceLevel: EvidenceLevel;
  readonly confidence: number;
  readonly observedAt: string;
};

export type ModelRouteCandidateWriteInput = {
  readonly siteKey: string;
  readonly endpointKey: string;
  readonly canonicalModelKey: string;
  readonly routeModelId: string;
  readonly providerType: string;
  readonly upstreamClaim?: string;
  readonly factLevel: string;
  readonly modelListSource: string;
  readonly evidenceLevel: EvidenceLevel;
  readonly confidence: number;
  readonly observedAt: string;
};

export type PriceCandidateWriteInput = {
  readonly siteKey: string;
  readonly routeModelId: string;
  readonly currency: string;
  readonly billingUnit: string;
  readonly inputPer1M?: number;
  readonly outputPer1M?: number;
  readonly cacheReadPer1M?: number;
  readonly cacheWritePer1M?: number;
  readonly requestFee?: number;
  readonly minimumRecharge?: number;
  readonly isComparableTokenPrice: boolean;
  readonly evidenceLevel: EvidenceLevel;
  readonly confidence: number;
  readonly observedAt: string;
};

export type CapabilityCandidateWriteInput = {
  readonly siteKey: string;
  readonly capability: string;
  readonly status: string;
  readonly evidenceLevel: EvidenceLevel;
  readonly confidence: number;
  readonly observedAt: string;
};

export type ProbeEvidenceWriteInput = {
  readonly targetKey: string;
  readonly probeId: string;
  readonly status: ProbeStatus;
  readonly evidenceLevel: EvidenceLevel;
  readonly confidence: number;
  readonly observedAt: string;
};

export type CliSupportEvidenceWriteInput = ProbeEvidenceWriteInput & {
  readonly tool: string;
};

export type RiskReviewItemWriteInput = {
  readonly siteKey: string;
  readonly riskType: string;
  readonly severityHint: string;
  readonly evidenceLevel: EvidenceLevel;
  readonly confidence: number;
  readonly observedAt: string;
  readonly publicRiskSignal: false;
};

export type ObservationDryRunImportPlan = {
  readonly batchId: string;
  readonly source: ObservationSource;
  readonly siteCandidates: readonly SiteCandidateWriteInput[];
  readonly endpointCandidates: readonly EndpointCandidateWriteInput[];
  readonly modelCandidates: readonly ModelCandidateWriteInput[];
  readonly modelRouteCandidates: readonly ModelRouteCandidateWriteInput[];
  readonly priceCandidates: readonly PriceCandidateWriteInput[];
  readonly capabilityCandidates: readonly CapabilityCandidateWriteInput[];
  readonly verificationProbeEvidence: readonly ProbeEvidenceWriteInput[];
  readonly cliSupportEvidence: readonly CliSupportEvidenceWriteInput[];
  readonly riskReviewItems: readonly RiskReviewItemWriteInput[];
  readonly evidenceRecords: readonly DryRunEvidenceRecord[];
  readonly publicProjectionRecords: readonly never[];
};

function probeStatusForObservation(
  observation: ObservationInput,
): ProbeStatus | undefined {
  if (
    observation.kind === observationKind.verificationProbe ||
    observation.kind === observationKind.cliSupport
  ) {
    return observation.status;
  }

  return undefined;
}

function reviewStateForObservation(observation: ObservationInput) {
  if ("publicSourceUrl" in observation && observation.publicSourceUrl) {
    return "reviewed_public_source" as const;
  }

  return "unreviewed" as const;
}

function evidenceLevelForObservation(
  source: ObservationSource,
  observation: ObservationInput,
): EvidenceLevel {
  return deriveObservationEvidenceLevel({
    source,
    kind: observation.kind as ObservationKind,
    reviewState: reviewStateForObservation(observation),
    probeStatus: probeStatusForObservation(observation),
  });
}

function confidenceForObservation(
  source: ObservationSource,
  observation: ObservationInput,
  evidenceLevel: EvidenceLevel,
): number {
  return computeObservationConfidence({
    source,
    evidenceLevel,
    producerConfidenceHint: observation.producerConfidenceHint,
  });
}

function evidenceRecordForObservation(
  source: ObservationSource,
  observation: ObservationInput,
  targetType: string,
  targetKey: string,
  publicSummary: string,
): DryRunEvidenceRecord {
  const level = evidenceLevelForObservation(source, observation);
  const publicSourceUrl =
    "publicSourceUrl" in observation ? observation.publicSourceUrl : undefined;

  return {
    targetType,
    targetKey,
    sourceType: source,
    evidenceLevel: level,
    confidence: confidenceForObservation(source, observation, level),
    observedAt: observation.observedAt,
    publicSourceUrl,
    publicSummary,
  };
}

export function mapObservationBatchToDryRunImportPlan(
  input: ObservationBatchInput,
): ObservationDryRunImportPlan {
  const batch = observationBatchSchema.parse(input);

  const siteCandidates: SiteCandidateWriteInput[] = [];
  const endpointCandidates: EndpointCandidateWriteInput[] = [];
  const modelCandidates: ModelCandidateWriteInput[] = [];
  const modelRouteCandidates: ModelRouteCandidateWriteInput[] = [];
  const priceCandidates: PriceCandidateWriteInput[] = [];
  const capabilityCandidates: CapabilityCandidateWriteInput[] = [];
  const verificationProbeEvidence: ProbeEvidenceWriteInput[] = [];
  const cliSupportEvidence: CliSupportEvidenceWriteInput[] = [];
  const riskReviewItems: RiskReviewItemWriteInput[] = [];
  const evidenceRecords: DryRunEvidenceRecord[] = [];

  for (const observation of batch.observations) {
    const level = evidenceLevelForObservation(batch.source, observation);
    const confidence = confidenceForObservation(batch.source, observation, level);

    switch (observation.kind) {
      case observationKind.site:
        siteCandidates.push({
          siteKey: observation.siteKey,
          displayName: observation.displayName,
          origin: observation.origin,
          siteType: observation.siteType,
          category: observation.category,
          evidenceLevel: level,
          confidence,
          observedAt: observation.observedAt,
        });
        evidenceRecords.push(
          evidenceRecordForObservation(
            batch.source,
            observation,
            "site",
            observation.siteKey,
            `Observed site origin for ${observation.displayName}`,
          ),
        );
        break;

      case observationKind.endpoint:
        endpointCandidates.push({
          siteKey: observation.siteKey,
          endpointKey: observation.endpointKey,
          origin: observation.origin,
          endpointKind: observation.endpointKind,
          evidenceLevel: level,
          confidence,
          observedAt: observation.observedAt,
        });
        evidenceRecords.push(
          evidenceRecordForObservation(
            batch.source,
            observation,
            "endpoint",
            observation.endpointKey,
            `Observed ${observation.endpointKind} endpoint for ${observation.siteKey}`,
          ),
        );
        break;

      case observationKind.model:
        modelCandidates.push({
          canonicalModelKey: observation.canonicalModelKey,
          displayName: observation.displayName,
          family: observation.family,
          creator: observation.creator,
          aliases: observation.aliases,
          capabilities: observation.capabilities,
          evidenceLevel: level,
          confidence,
          observedAt: observation.observedAt,
        });
        evidenceRecords.push(
          evidenceRecordForObservation(
            batch.source,
            observation,
            "model",
            observation.canonicalModelKey,
            `Observed model ${observation.displayName}`,
          ),
        );
        break;

      case observationKind.modelRoute:
        modelRouteCandidates.push({
          siteKey: observation.siteKey,
          endpointKey: observation.endpointKey,
          canonicalModelKey: observation.canonicalModelKey,
          routeModelId: observation.routeModelId,
          providerType: observation.providerType,
          upstreamClaim: observation.upstreamClaim,
          factLevel: observation.factLevel,
          modelListSource: observation.modelListSource,
          evidenceLevel: level,
          confidence,
          observedAt: observation.observedAt,
        });
        evidenceRecords.push(
          evidenceRecordForObservation(
            batch.source,
            observation,
            "model_route",
            `${observation.siteKey}:${observation.routeModelId}`,
            `Observed model route ${observation.routeModelId}`,
          ),
        );
        break;

      case observationKind.price:
        priceCandidates.push({
          siteKey: observation.siteKey,
          routeModelId: observation.routeModelId,
          currency: observation.currency,
          billingUnit: observation.billingUnit,
          inputPer1M: observation.inputPer1M,
          outputPer1M: observation.outputPer1M,
          cacheReadPer1M: observation.cacheReadPer1M,
          cacheWritePer1M: observation.cacheWritePer1M,
          requestFee: observation.requestFee,
          minimumRecharge: observation.minimumRecharge,
          isComparableTokenPrice: observation.billingUnit === "per_1m_tokens",
          evidenceLevel: level,
          confidence,
          observedAt: observation.observedAt,
        });
        evidenceRecords.push(
          evidenceRecordForObservation(
            batch.source,
            observation,
            "price",
            `${observation.siteKey}:${observation.routeModelId}`,
            `Observed price for ${observation.routeModelId}`,
          ),
        );
        break;

      case observationKind.verificationProbe:
        verificationProbeEvidence.push({
          targetKey: observation.target.routeModelId
            ? `${observation.target.siteKey}:${observation.target.routeModelId}`
            : observation.target.siteKey,
          probeId: observation.probeId,
          status: observation.status,
          evidenceLevel: level,
          confidence,
          observedAt: observation.observedAt,
        });
        break;

      case observationKind.cliSupport:
        cliSupportEvidence.push({
          targetKey: observation.target.routeModelId
            ? `${observation.target.siteKey}:${observation.target.routeModelId}`
            : observation.target.siteKey,
          tool: observation.tool,
          probeId: observation.probeId,
          status: observation.status,
          evidenceLevel: level,
          confidence,
          observedAt: observation.observedAt,
        });
        break;

      case observationKind.capability:
        capabilityCandidates.push({
          siteKey: observation.siteKey,
          capability: observation.capability,
          status: observation.status,
          evidenceLevel: level,
          confidence,
          observedAt: observation.observedAt,
        });
        break;

      case observationKind.riskCandidate:
        riskReviewItems.push({
          siteKey: observation.siteKey,
          riskType: observation.riskType,
          severityHint: observation.severityHint,
          evidenceLevel: level,
          confidence,
          observedAt: observation.observedAt,
          publicRiskSignal: false,
        });
        break;
    }
  }

  return {
    batchId: batch.batchId,
    source: batch.source,
    siteCandidates,
    endpointCandidates,
    modelCandidates,
    modelRouteCandidates,
    priceCandidates,
    capabilityCandidates,
    verificationProbeEvidence,
    cliSupportEvidence,
    riskReviewItems,
    evidenceRecords,
    publicProjectionRecords: [],
  };
}
```

- [ ] **Step 4: Run mapper tests to verify they pass**

Run:

```powershell
pnpm test:run src/server/db/mappers/boundary.test.ts
```

Expected:

- Exit code is `0`.
- Dry-run plan contains candidate/evidence records.
- Dry-run plan contains no public projection records.

- [ ] **Step 5: Commit dry-run mapper**

Run:

```powershell
git add src/server/db/mappers/observation-intake.ts src/server/db/mappers/boundary.test.ts
git commit -m "feat(import): map observation batches to dry-run candidates"
```

## Task 7: Observation Candidate Repository Facade

**Files:**

- Create: `src/server/db/repositories/observation-candidates.ts`
- Modify: `src/server/db/repositories/repository-contract.test.ts`

- [ ] **Step 1: Write failing repository contract tests**

Replace `src/server/db/repositories/repository-contract.test.ts` with:

```ts
import { describe, expect, it } from "vitest";
import { developmentObservationBatch } from "~/contracts/import/fixtures/development";
import { mapObservationBatchToDryRunImportPlan } from "../mappers/observation-intake";
import { createAuditEventAppender } from "./audit";
import { createEvidenceAppender } from "./evidence";
import { createObservationCandidateAppender } from "./observation-candidates";
import { createProjectionReader } from "./projections";

const entityId = "11111111-1111-4111-8111-111111111111";
const versionId = "22222222-2222-4222-8222-222222222222";

describe("repository contracts", () => {
  it("projection readers validate public DTO output", async () => {
    const reader = createProjectionReader({
      async listProjectionRows() {
        return [
          {
            projectionKey: "site/example-api",
            locale: "zh-cn",
            payload: {
              entityId,
              versionId,
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
        entityId,
        versionId,
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

  it("observation candidate appender writes candidates and evidence without projections", async () => {
    const writes: string[] = [];
    const appender = createObservationCandidateAppender({
      async appendSiteCandidate() {
        writes.push("site");
        return { id: "site-candidate-1" };
      },
      async appendEndpointCandidate() {
        writes.push("endpoint");
        return { id: "endpoint-candidate-1" };
      },
      async appendModelCandidate() {
        writes.push("model");
        return { id: "model-candidate-1" };
      },
      async appendModelRouteCandidate() {
        writes.push("model_route");
        return { id: "route-candidate-1" };
      },
      async appendPriceCandidate() {
        writes.push("price");
        return { id: "price-candidate-1" };
      },
      async appendCapabilityCandidate() {
        writes.push("capability");
        return { id: "capability-candidate-1" };
      },
      async appendRiskReviewItem() {
        writes.push("risk_review");
        return { id: "risk-review-1" };
      },
      async appendEvidenceRecord() {
        writes.push("evidence");
        return { id: "evidence-1" };
      },
    });

    const plan = mapObservationBatchToDryRunImportPlan(developmentObservationBatch);

    await expect(appender.appendDryRunPlan(plan)).resolves.toEqual({
      siteCandidates: 1,
      endpointCandidates: 1,
      modelCandidates: 1,
      modelRouteCandidates: 1,
      priceCandidates: 1,
      capabilityCandidates: 1,
      riskReviewItems: 1,
      evidenceRecords: 5,
      publicProjectionRecords: 0,
    });

    expect(writes).toEqual([
      "site",
      "endpoint",
      "model",
      "model_route",
      "price",
      "capability",
      "risk_review",
      "evidence",
      "evidence",
      "evidence",
      "evidence",
      "evidence",
    ]);
  });
});
```

- [ ] **Step 2: Run repository tests to verify they fail**

Run:

```powershell
pnpm test:run src/server/db/repositories/repository-contract.test.ts
```

Expected:

- Exit code is non-zero.
- Failure mentions missing `./observation-candidates`.

- [ ] **Step 3: Implement observation candidate repository facade**

Create `src/server/db/repositories/observation-candidates.ts`:

```ts
import type {
  CapabilityCandidateWriteInput,
  DryRunEvidenceRecord,
  EndpointCandidateWriteInput,
  ModelCandidateWriteInput,
  ModelRouteCandidateWriteInput,
  ObservationDryRunImportPlan,
  PriceCandidateWriteInput,
  RiskReviewItemWriteInput,
  SiteCandidateWriteInput,
} from "../mappers/observation-intake";

export type CandidateWriteResult = {
  readonly id: string;
};

export type ObservationCandidateWriteSource = {
  readonly appendSiteCandidate: (
    input: SiteCandidateWriteInput,
  ) => Promise<CandidateWriteResult>;
  readonly appendEndpointCandidate: (
    input: EndpointCandidateWriteInput,
  ) => Promise<CandidateWriteResult>;
  readonly appendModelCandidate: (
    input: ModelCandidateWriteInput,
  ) => Promise<CandidateWriteResult>;
  readonly appendModelRouteCandidate: (
    input: ModelRouteCandidateWriteInput,
  ) => Promise<CandidateWriteResult>;
  readonly appendPriceCandidate: (
    input: PriceCandidateWriteInput,
  ) => Promise<CandidateWriteResult>;
  readonly appendCapabilityCandidate: (
    input: CapabilityCandidateWriteInput,
  ) => Promise<CandidateWriteResult>;
  readonly appendRiskReviewItem: (
    input: RiskReviewItemWriteInput,
  ) => Promise<CandidateWriteResult>;
  readonly appendEvidenceRecord: (
    input: DryRunEvidenceRecord,
  ) => Promise<CandidateWriteResult>;
};

export type ObservationCandidateAppendSummary = {
  readonly siteCandidates: number;
  readonly endpointCandidates: number;
  readonly modelCandidates: number;
  readonly modelRouteCandidates: number;
  readonly priceCandidates: number;
  readonly capabilityCandidates: number;
  readonly riskReviewItems: number;
  readonly evidenceRecords: number;
  readonly publicProjectionRecords: 0;
};

export function createObservationCandidateAppender(
  source: ObservationCandidateWriteSource,
) {
  return {
    async appendDryRunPlan(
      plan: ObservationDryRunImportPlan,
    ): Promise<ObservationCandidateAppendSummary> {
      for (const candidate of plan.siteCandidates) {
        await source.appendSiteCandidate(candidate);
      }
      for (const candidate of plan.endpointCandidates) {
        await source.appendEndpointCandidate(candidate);
      }
      for (const candidate of plan.modelCandidates) {
        await source.appendModelCandidate(candidate);
      }
      for (const candidate of plan.modelRouteCandidates) {
        await source.appendModelRouteCandidate(candidate);
      }
      for (const candidate of plan.priceCandidates) {
        await source.appendPriceCandidate(candidate);
      }
      for (const candidate of plan.capabilityCandidates) {
        await source.appendCapabilityCandidate(candidate);
      }
      for (const item of plan.riskReviewItems) {
        await source.appendRiskReviewItem(item);
      }
      for (const evidence of plan.evidenceRecords) {
        await source.appendEvidenceRecord(evidence);
      }

      return {
        siteCandidates: plan.siteCandidates.length,
        endpointCandidates: plan.endpointCandidates.length,
        modelCandidates: plan.modelCandidates.length,
        modelRouteCandidates: plan.modelRouteCandidates.length,
        priceCandidates: plan.priceCandidates.length,
        capabilityCandidates: plan.capabilityCandidates.length,
        riskReviewItems: plan.riskReviewItems.length,
        evidenceRecords: plan.evidenceRecords.length,
        publicProjectionRecords: 0,
      };
    },
  };
}
```

- [ ] **Step 4: Run repository tests to verify they pass**

Run:

```powershell
pnpm test:run src/server/db/repositories/repository-contract.test.ts
```

Expected:

- Exit code is `0`.
- Candidate repository appender writes candidates and evidence only.
- Summary reports `publicProjectionRecords: 0`.

- [ ] **Step 5: Commit candidate repository facade**

Run:

```powershell
git add src/server/db/repositories/observation-candidates.ts src/server/db/repositories/repository-contract.test.ts
git commit -m "feat(import): add observation candidate repository facade"
```

## Task 8: Final Validation And Diff Review

**Files:**

- Inspect: all files changed by Tasks 1-7.

- [ ] **Step 1: Run focused observation-intake tests**

Run:

```powershell
pnpm test:run src/domain/privacy/url-policy.test.ts src/domain/observation/policy.test.ts src/contracts/boundary.test.ts src/contracts/import/fixtures/fixtures.test.ts src/server/db/mappers/boundary.test.ts src/server/db/repositories/repository-contract.test.ts
```

Expected:

- Exit code is `0`.
- All focused observation-intake, contract, mapper, fixture, and repository tests pass.

- [ ] **Step 2: Run typecheck**

Run:

```powershell
pnpm typecheck
```

Expected:

- Exit code is `0`.
- No TypeScript errors.

- [ ] **Step 3: Run full validation**

Run:

```powershell
$env:SITE_URL='http://localhost:3000'; pnpm validate
```

Expected:

- Exit code is `0`.
- `pnpm lint` passes.
- `pnpm test:run` passes.
- `pnpm typecheck` passes.
- `pnpm build` passes.

- [ ] **Step 4: Inspect final diff**

Run:

```powershell
git diff --check
git diff --stat
git diff -- src/domain/privacy/url-policy.ts src/domain/privacy/url-policy.test.ts src/domain/observation/policy.ts src/domain/observation/policy.test.ts src/contracts/import/observation.ts src/contracts/import/seed.ts src/contracts/boundary.test.ts src/contracts/import/fixtures/development.ts src/contracts/import/fixtures/seed-environment.ts src/contracts/import/fixtures/fixtures.test.ts src/server/db/mappers/import-candidate.ts src/server/db/mappers/observation-intake.ts src/server/db/mappers/boundary.test.ts src/server/db/repositories/observation-candidates.ts src/server/db/repositories/repository-contract.test.ts
```

Expected:

- `git diff --check` prints no whitespace errors.
- Diff contains no public route, public page, sitemap, metadata, All API Hub, upload endpoint, admin UI, or projection rebuild changes.
- Diff contains no secrets, tokens, private endpoints, raw request bodies, raw response bodies, or local-only environment overrides.

- [ ] **Step 5: Commit final validation fixes when needed**

If Step 1, Step 2, Step 3, or Step 4 required fixes, run:

```powershell
git add src/domain/privacy/url-policy.ts src/domain/privacy/url-policy.test.ts src/domain/observation/policy.ts src/domain/observation/policy.test.ts src/contracts/import/observation.ts src/contracts/import/seed.ts src/contracts/boundary.test.ts src/contracts/import/fixtures/development.ts src/contracts/import/fixtures/seed-environment.ts src/contracts/import/fixtures/fixtures.test.ts src/server/db/mappers/import-candidate.ts src/server/db/mappers/observation-intake.ts src/server/db/mappers/boundary.test.ts src/server/db/repositories/observation-candidates.ts src/server/db/repositories/repository-contract.test.ts
git commit -m "test(import): validate observation intake contract"
```

Expected:

- A commit is created only if validation fixes changed files after Task 7.
- If no files changed after validation, do not create an empty commit.

## Acceptance Checklist

- `source=all_api_hub_extension` batches are rejected by default.
- Extension consent logic exists behind an explicit governance option for later work.
- Unknown observation fields are rejected by strict Zod schemas.
- Sensitive-looking keys are rejected by the domain policy.
- User-observed URLs normalize to origins.
- Observation public-source URLs reject query strings, hashes, private hosts, credentials, sensitive paths, and encoded sensitive path bypasses.
- Catalog fallback and user-scoped model list observations remain distinct through `modelListSource`.
- Price observations preserve `billingUnit` and expose `isComparableTokenPrice`.
- Verification probe observations and CLI support observations map to separate evidence arrays.
- Extension-controlled source counts and server confidence are not accepted in contracts.
- Risk candidates map to review items with `publicRiskSignal: false`.
- Development fixture batches are synthetic and isolated.
- Production seed guard rejects synthetic fixture hosts.
- Dry-run import mapping produces candidate/evidence inputs and no public projection records.
- Candidate repository facade appends candidates/evidence only and reports `publicProjectionRecords: 0`.
- `pnpm validate` passes with `SITE_URL=http://localhost:3000`.

## Self-Review Notes

- Spec coverage: every validation expectation in the spec maps to Task 1, Task 2, Task 3, Task 5, Task 6, or Task 7. Upload, consent UI, production seed list, admin UI, projection rebuild, and All API Hub adapter work stay out of scope as required by the spec.
- Placeholder scan: this plan does not rely on deferred code, unnamed handlers, or unspecified validation.
- Type consistency: observation source, observation kind, probe status, model list source, evidence level, and dry-run mapper types are defined once and reused by later tasks.
