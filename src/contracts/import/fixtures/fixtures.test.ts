import { describe, expect, it } from "vitest";
import { DomainPolicyError, domainPolicyErrorCode } from "~/domain/errors";
import { observationBatchSchema } from "../observation";
import { developmentObservationBatches } from "./development";
import { assertProductionSeedBatchHasNoSyntheticSites } from "./seed-environment";

const batchWithSiteOrigin = (origin: string) =>
  observationBatchSchema.parse({
    schemaVersion: "2026-05-26",
    source: "curated_seed",
    batchId: "77777777-7777-4777-8777-777777777777",
    generatedAt: "2026-05-26T00:00:00.000Z",
    producer: {
      productName: "ai-api-directory-test-fixture",
      productVersion: "0.1.0",
      contractVersion: "2026-05-26",
    },
    consent: { state: "not_applicable" },
    observations: [
      {
        kind: "site",
        siteKey: "synthetic-origin-test",
        displayName: "Synthetic Origin Test",
        origin,
        siteType: "unknown",
        category: "unknown",
        observedAt: "2026-05-26T00:00:00.000Z",
      },
    ],
  });

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

  it("uses neutral synthetic model and provider identifiers", () => {
    const parsed = observationBatchSchema.parse(developmentObservationBatches[0]);

    expect(parsed.observations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "model",
          canonicalModelKey: "synthetic-text-model",
          displayName: "Synthetic Text Model",
          family: "synthetic-family",
          creator: "Synthetic Provider",
          routeModelId: "synthetic-text-model",
          aliases: ["synthetic-text-model"],
        }),
        expect.objectContaining({
          kind: "model_route",
          canonicalModelKey: "synthetic-text-model",
          routeModelId: "synthetic-text-model",
          upstreamClaim: "synthetic-upstream",
        }),
        expect.objectContaining({
          kind: "price",
          routeModelId: "synthetic-text-model",
        }),
        expect.objectContaining({
          kind: "verification_probe",
          target: {
            siteKey: "synthetic-relay",
            routeModelId: "synthetic-text-model",
          },
          modelId: "synthetic-text-model",
        }),
        expect.objectContaining({
          kind: "cli_support",
          target: {
            siteKey: "synthetic-relay",
            routeModelId: "synthetic-text-model",
          },
          modelId: "synthetic-text-model",
        }),
      ]),
    );
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

  it.each([
    "https://synthetic-relay.example.org/account",
    "https://synthetic-relay.example.net/account",
    "https://synthetic-relay.test/account",
    "https://synthetic-relay.invalid/account",
  ])("rejects synthetic production seed origin %s", (origin) => {
    expect(() =>
      assertProductionSeedBatchHasNoSyntheticSites(batchWithSiteOrigin(origin)),
    ).toThrow(DomainPolicyError);
  });

  it("allows non-synthetic public production seed origins", () => {
    expect(() =>
      assertProductionSeedBatchHasNoSyntheticSites(
        batchWithSiteOrigin("https://public-provider.dev/docs"),
      ),
    ).not.toThrow();
  });
});
