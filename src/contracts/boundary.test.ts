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
  createObservationBatchSchema,
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
    expect(parsed.evidence[0]?.level).toBe("listed");
    expectTypeOf<PublicEvidenceSummaryDto["level"]>().toEqualTypeOf<EvidenceLevel>();
  });

  it("preserves domain literal unions in contract output types", () => {
    expectTypeOf<PublicEvidenceSummaryDto["level"]>().toEqualTypeOf<EvidenceLevel>();
    expectTypeOf<AdminDirectoryReviewDto["lifecycle"]>().toEqualTypeOf<PublishableLifecycle>();
  });

  it("rejects private fields in public DTOs", () => {
    const result = publicProjectionDtoSchema.safeParse({
      entityId,
      versionId,
      slug: "example-api",
      title: "Example API",
      summary: "Public summary",
      publicUrl: "https://example.com",
      evidence: [],
      updatedAt: "2026-05-24T00:00:00.000Z",
      adminNotes: "internal",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            code: "unrecognized_keys",
            keys: ["adminNotes"],
          }),
        ]),
      );
    }
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
    const result = adminDirectoryReviewDtoSchema.safeParse({
      entityId,
      versionId,
      lifecycle: "pending_review",
      title: "Example API",
      reviewSummary: "Needs source review",
      evidenceCount: 2,
      updatedAt: "2026-05-24T00:00:00.000Z",
      rawEvidence: { requestBody: "private" },
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            code: "unrecognized_keys",
            keys: ["rawEvidence"],
          }),
        ]),
      );
    }
  });

  it("accepts audit DTOs with explicit actor context", () => {
    expect(auditActorDtoSchema.parse({ type: "admin", id: adminId })).toEqual({
      type: "admin",
      id: adminId,
    });

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

  it("requires admin audit actors to identify the admin", () => {
    expect(
      auditActorDtoSchema.safeParse({
        type: "admin",
      }).success,
    ).toBe(false);

    expect(
      adminAuditEventDtoSchema.parse({
        id: auditId,
        actor: {
          type: "admin",
          id: adminId,
        },
        commandId: "command-1",
        objectFamily: "directory",
        objectId: entityId,
        action: "reviewed",
        createdAt: "2026-05-24T00:00:00.000Z",
      }),
    ).toMatchObject({
      actor: {
        type: "admin",
        id: adminId,
      },
    });
  });

  it("forbids system audit actors from carrying an id", () => {
    expect(
      auditActorDtoSchema.safeParse({
        type: "system",
        id: adminId,
      }).success,
    ).toBe(false);

    expect(
      adminAuditEventDtoSchema.parse({
        id: auditId,
        actor: {
          type: "system",
        },
        commandId: "command-1",
        objectFamily: "directory",
        objectId: entityId,
        action: "auto_published",
        createdAt: "2026-05-24T00:00:00.000Z",
      }),
    ).toMatchObject({
      actor: {
        type: "system",
      },
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

  it("accepts curated seed observation batches for all observation families", () => {
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
          publicSourceUrl: "https://example.com/pricing/",
          siteType: "relay",
          category: "ai_gateway",
          observedAt: "2026-05-26T00:00:00.000Z",
          producerConfidenceHint: 80,
        },
        {
          kind: "endpoint",
          siteKey: "example-api",
          endpointKey: "example-api-docs",
          origin: "https://example.com/docs/reference",
          endpointKind: "docs",
          publicSourceUrl: "https://example.com/docs/",
          observedAt: "2026-05-26T00:00:00.000Z",
        },
        {
          kind: "model",
          canonicalModelKey: "gpt-4o-mini",
          displayName: "GPT-4o mini",
          family: "gpt-4o",
          creator: "OpenAI",
          routeModelId: "gpt-4o-mini",
          aliases: ["gpt-4o-mini-2024-07-18"],
          contextWindow: 128000,
          capabilities: ["chat", "vision"],
          source: "manual_seed",
          observedAt: "2026-05-26T00:00:00.000Z",
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
        {
          kind: "price",
          siteKey: "example-api",
          routeModelId: "gpt-4o-mini",
          currency: "USD",
          billingUnit: "per_1m_tokens",
          inputPer1M: 0.15,
          outputPer1M: 0.6,
          discountNote: "introductory manual review note",
          source: "manual_seed",
          publicSourceUrl: "https://example.com/pricing/",
          observedAt: "2026-05-26T00:00:00.000Z",
        },
        {
          kind: "verification_probe",
          target: { siteKey: "example-api", routeModelId: "gpt-4o-mini" },
          apiType: "openai_chat_completions",
          probeId: "probe-1",
          status: "pass",
          modelId: "gpt-4o-mini",
          durationBucket: "1s_to_5s",
          errorCategory: "none",
          observedAt: "2026-05-26T00:00:00.000Z",
        },
        {
          kind: "cli_support",
          target: { siteKey: "example-api", routeModelId: "gpt-4o-mini" },
          tool: "codex_cli",
          probeId: "probe-2",
          status: "unsupported",
          modelId: "gpt-4o-mini",
          durationBucket: "unknown",
          errorCategory: "unsupported",
          observedAt: "2026-05-26T00:00:00.000Z",
        },
        {
          kind: "capability",
          siteKey: "example-api",
          capability: "model_list",
          status: "supported",
          observedAt: "2026-05-26T00:00:00.000Z",
        },
        {
          kind: "risk_candidate",
          siteKey: "example-api",
          riskType: "price_missing",
          severityHint: "warning",
          source: "manual_seed",
          observedAt: "2026-05-26T00:00:00.000Z",
        },
      ],
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
    expect(parsed.observations[0]).toMatchObject({
      kind: "site",
      origin: "https://example.com",
      publicSourceUrl: "https://example.com/pricing",
    });
    expect(parsed.observations[1]).toMatchObject({
      kind: "endpoint",
      origin: "https://example.com",
      publicSourceUrl: "https://example.com/docs",
    });
    expect(parsed.observations[3]).toMatchObject({
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

  it("accepts explicitly governed All API Hub extension observations", () => {
    const parsed = createObservationBatchSchema({
      allowAllApiHubExtension: true,
    }).parse({
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
    });

    expect(parsed.source).toBe("all_api_hub_extension");
  });

  it("rejects editorial price notes from non-curated and non-admin batches", () => {
    expect(() =>
      observationBatchSchema.parse({
        schemaVersion: "2026-05-26",
        source: "public_source_job",
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
            source: "public_pricing_page",
            discountNote: "limited time offer",
            observedAt: "2026-05-26T00:00:00.000Z",
          },
        ],
      }),
    ).toThrow(
      "Discount and exchange-rate notes require curated seed or admin import review",
    );
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
    ).toThrow(
      "Observation payload contains sensitive field: observations.0.rawErrorStack",
    );
  });

  it("returns validation issues instead of throwing from safeParse for sensitive fields", () => {
    const result = observationBatchSchema.safeParse({
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
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            code: "custom",
            message:
              "Observation payload contains sensitive field: observations.0.rawErrorStack",
          }),
        ]),
      );
    }
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

  it("returns validation issues for invalid observation origins and public source URLs", () => {
    const originResult = observationBatchSchema.safeParse({
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
          kind: "site",
          siteKey: "example-api",
          displayName: "Example API",
          origin: "/account/private",
          siteType: "relay",
          category: "ai_gateway",
          observedAt: "2026-05-26T00:00:00.000Z",
        },
      ],
    });

    expect(originResult.success).toBe(false);
    if (!originResult.success) {
      expect(originResult.error.issues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            message: "Public source URL must be an absolute URL",
          }),
        ]),
      );
    }

    const sourceUrlResult = observationBatchSchema.safeParse({
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
          source: "public_pricing_page",
          publicSourceUrl: "https://example.com/pricing?account=private",
          observedAt: "2026-05-26T00:00:00.000Z",
        },
      ],
    });

    expect(sourceUrlResult.success).toBe(false);
    if (!sourceUrlResult.success) {
      expect(sourceUrlResult.error.issues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            message:
              "Public source URL must not include query strings or hashes",
          }),
        ]),
      );
    }
  });

  it("normalizes pagination query defaults", () => {
    expect(paginationQuerySchema.parse({})).toEqual({
      page: 1,
      pageSize: 20,
    });
  });
});
