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
          observedAt: "2026-05-24T00:00:00.001Z",
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
      observedAt: "2026-05-24T00:00:00.001Z",
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
            observedAt: "2026-05-24T00:00:00.001Z",
            producerConfidenceHint: 60,
          },
        ],
      },
    });
  });

  it("maps observation batches to dry-run candidates without public projections", () => {
    const plan = mapObservationBatchToDryRunImportPlan(
      developmentObservationBatch,
    );

    expect(plan.siteCandidates).toHaveLength(1);
    expect(plan.endpointCandidates).toHaveLength(1);
    expect(plan.modelCandidates).toHaveLength(1);
    expect(plan.modelRouteCandidates).toHaveLength(1);
    expect(plan.priceCandidates).toHaveLength(1);
    expect(plan.capabilityCandidates).toHaveLength(1);
    expect(plan.verificationProbeEvidence).toHaveLength(1);
    expect(plan.cliSupportEvidence).toHaveLength(1);
    expect(plan.riskReviewItems).toHaveLength(1);
    expect(plan.evidenceRecords).toHaveLength(5);
    expect(plan.publicProjectionRecords).toHaveLength(0);

    expect(plan.publicProjectionRecords).toEqual([]);
    expect(plan.siteCandidates).toEqual([
      expect.objectContaining({
        siteKey: "synthetic-relay",
        displayName: "Synthetic Relay",
        origin: "https://synthetic-relay.example.com",
        siteType: "relay",
        category: "ai_gateway",
        evidenceLevel: "claimed",
      }),
    ]);
    expect(plan.endpointCandidates).toEqual([
      expect.objectContaining({
        siteKey: "synthetic-relay",
        endpointKey: "synthetic-relay-api",
        origin: "https://api.synthetic-relay.example.com",
        endpointKind: "api",
        evidenceLevel: "claimed",
      }),
    ]);
    expect(plan.modelCandidates).toEqual([
      expect.objectContaining({
        canonicalModelKey: "synthetic-text-model",
        displayName: "Synthetic Text Model",
        family: "synthetic-family",
        creator: "Synthetic Provider",
        aliases: ["synthetic-text-model"],
        contextWindow: 128000,
        capabilities: ["text_generation", "structured_output"],
        evidenceLevel: "claimed",
      }),
    ]);
    expect(plan.modelRouteCandidates).toEqual([
      expect.objectContaining({
        siteKey: "synthetic-relay",
        endpointKey: "synthetic-relay-api",
        canonicalModelKey: "synthetic-text-model",
        routeModelId: "synthetic-text-model",
        providerType: "openai_compatible",
        upstreamClaim: "synthetic-upstream",
        factLevel: "listed",
        modelListSource: "catalog_fallback",
        evidenceLevel: "claimed",
      }),
    ]);
    expect(plan.priceCandidates).toEqual([
      expect.objectContaining({
        siteKey: "synthetic-relay",
        routeModelId: "synthetic-text-model",
        currency: "USD",
        billingUnit: "ratio_multiplier",
        inputPer1M: 0.15,
        outputPer1M: 0.6,
        isComparableTokenPrice: false,
        evidenceLevel: "claimed",
      }),
    ]);
    expect(plan.capabilityCandidates).toEqual([
      expect.objectContaining({
        siteKey: "synthetic-relay",
        capability: "model_list",
        status: "supported",
        evidenceLevel: "claimed",
      }),
    ]);
    expect(plan.verificationProbeEvidence).toEqual([
      expect.objectContaining({
        targetKey: "synthetic-relay:synthetic-text-model",
        apiType: "openai_chat_completions",
        probeId: "synthetic-text-probe",
        status: "pass",
        modelId: "synthetic-text-model",
        durationBucket: "1s_to_5s",
        errorCategory: "none",
        evidenceLevel: "tested",
      }),
    ]);
    expect(plan.cliSupportEvidence).toEqual([
      expect.objectContaining({
        targetKey: "synthetic-relay:synthetic-text-model",
        tool: "codex_cli",
        probeId: "synthetic-codex-cli-probe",
        status: "unsupported",
        modelId: "synthetic-text-model",
        durationBucket: "unknown",
        errorCategory: "unsupported",
        evidenceLevel: "claimed",
      }),
    ]);
    expect(plan.riskReviewItems).toEqual([
      expect.objectContaining({
        siteKey: "synthetic-relay",
        riskType: "price_missing",
        severityHint: "info",
        evidenceLevel: "claimed",
        publicRiskSignal: false,
      }),
    ]);
    expect(plan.evidenceRecords).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          targetType: "site",
          targetKey: "synthetic-relay",
        }),
        expect.objectContaining({
          targetType: "endpoint",
          targetKey: "synthetic-relay-api",
        }),
        expect.objectContaining({
          targetType: "model",
          targetKey: "synthetic-text-model",
        }),
        expect.objectContaining({
          targetType: "model_route",
          targetKey: "synthetic-relay:synthetic-text-model",
        }),
        expect.objectContaining({
          targetType: "price",
          targetKey: "synthetic-relay:synthetic-text-model",
        }),
      ]),
    );
  });

  it("preserves dry-run price metadata for review", () => {
    const plan = mapObservationBatchToDryRunImportPlan({
      schemaVersion: "2026-05-26",
      source: "curated_seed",
      batchId: "77777777-7777-4777-8777-777777777777",
      generatedAt: "2026-05-26T00:00:00.000Z",
      producer: {
        productName: "ai-api-directory-test",
        contractVersion: "2026-05-26",
      },
      consent: { state: "not_applicable" },
      observations: [
        {
          kind: "price",
          siteKey: "synthetic-relay",
          routeModelId: "synthetic-text-model",
          currency: "USD",
          billingUnit: "per_1m_tokens",
          inputPer1M: 0.2,
          outputPer1M: 0.8,
          discountNote: "Introductory discount applies",
          exchangeRateNote: "Converted from USD list price",
          source: "synthetic metadata fixture",
          effectiveAt: "2026-05-26T00:00:00.000Z",
          expiresAt: "2026-06-26T00:00:00.000Z",
          observedAt: "2026-05-26T00:00:00.000Z",
        },
      ],
    });

    expect(plan.priceCandidates).toEqual([
      expect.objectContaining({
        routeModelId: "synthetic-text-model",
        billingUnit: "per_1m_tokens",
        discountNote: "Introductory discount applies",
        exchangeRateNote: "Converted from USD list price",
        effectiveAt: "2026-05-26T00:00:00.000Z",
        expiresAt: "2026-06-26T00:00:00.000Z",
        isComparableTokenPrice: true,
      }),
    ]);
  });

  it("maps public-source evidence and route-less probe targets", () => {
    const plan = mapObservationBatchToDryRunImportPlan({
      schemaVersion: "2026-05-26",
      source: "curated_seed",
      batchId: "88888888-8888-4888-8888-888888888888",
      generatedAt: "2026-05-26T00:00:00.000Z",
      producer: {
        productName: "ai-api-directory-test",
        contractVersion: "2026-05-26",
      },
      consent: { state: "not_applicable" },
      observations: [
        {
          kind: "model_route",
          siteKey: "example-api",
          endpointKey: "example-api-main",
          canonicalModelKey: "gpt-4o-mini",
          routeModelId: "gpt-4o-mini",
          providerType: "openai_compatible",
          factLevel: "listed",
          modelListSource: "public_model_list",
          publicSourceUrl: "https://example.com/models",
          observedAt: "2026-05-26T00:00:00.000Z",
        },
        {
          kind: "verification_probe",
          target: { siteKey: "example-api" },
          apiType: "model_list",
          probeId: "site-model-list",
          status: "fail",
          durationBucket: "unknown",
          errorCategory: "network_error",
          observedAt: "2026-05-26T00:00:00.000Z",
        },
        {
          kind: "cli_support",
          target: { siteKey: "example-api" },
          tool: "codex_cli",
          probeId: "site-cli",
          status: "unsupported",
          durationBucket: "unknown",
          errorCategory: "unsupported",
          observedAt: "2026-05-26T00:00:00.000Z",
        },
      ],
    });

    expect(plan.modelRouteCandidates).toEqual([
      expect.objectContaining({
        evidenceLevel: "listed",
      }),
    ]);
    expect(plan.evidenceRecords).toEqual([
      expect.objectContaining({
        evidenceLevel: "listed",
        publicSourceUrl: "https://example.com/models",
      }),
    ]);
    expect(plan.verificationProbeEvidence).toEqual([
      expect.objectContaining({
        targetKey: "example-api",
        evidenceLevel: "claimed",
      }),
    ]);
    expect(plan.cliSupportEvidence).toEqual([
      expect.objectContaining({
        targetKey: "example-api",
      }),
    ]);
  });

  it("maps minimum recharge prices as non-comparable review facts", () => {
    const plan = mapObservationBatchToDryRunImportPlan({
      schemaVersion: "2026-05-26",
      source: "curated_seed",
      batchId: "99999999-9999-4999-8999-999999999999",
      generatedAt: "2026-05-26T00:00:00.000Z",
      producer: {
        productName: "ai-api-directory-test",
        contractVersion: "2026-05-26",
      },
      consent: { state: "not_applicable" },
      observations: [
        {
          kind: "price",
          siteKey: "example-api",
          routeModelId: "gpt-4o-mini",
          currency: "USD",
          billingUnit: "minimum_recharge",
          minimumRecharge: 5,
          requestFee: 0.01,
          source: "synthetic metadata fixture",
          observedAt: "2026-05-26T00:00:00.000Z",
        },
      ],
    });

    expect(plan.priceCandidates).toEqual([
      expect.objectContaining({
        billingUnit: "minimum_recharge",
        requestFee: 0.01,
        minimumRecharge: 5,
        isComparableTokenPrice: false,
      }),
    ]);
  });

  it("rejects invalid seed candidate URLs before candidate mapping", () => {
    expect(() =>
      mapSeedSiteCandidateToCandidateInput(
        {
          slug: "example-api",
          displayName: "Example API",
          homepageUrl: "/account/private",
          sourceDescription: "manual seed",
          observedAt: "2026-05-24T00:00:00.001Z",
        },
        {
          batchId,
          generatedAt: "2026-05-24T00:00:00.000Z",
        },
      ),
    ).toThrow("Invalid URL");
  });
});
