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

  it("allows planned non-sensitive observation vocabulary fields", () => {
    expect(() =>
      assertNoSensitiveObservationFields({
        source: observationSource.publicSourceJob,
        observations: [
          {
            kind: observationKind.modelRoute,
            siteKey: "example-api",
            endpointKey: "openai-compatible",
            modelListSource: "public_model_list",
          },
        ],
      }),
    ).not.toThrow();
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

    expect(
      normalizeObservationPublicSourceUrl("https://docs.example.com/pricing"),
    ).toBe("https://docs.example.com/pricing");
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

  it("treats non-finite producer confidence hints as absent", () => {
    expect(
      computeObservationConfidence({
        source: observationSource.publicSourceJob,
        evidenceLevel: evidenceLevel.tested,
        producerConfidenceHint: Number.NaN,
      }),
    ).toBe(75);

    expect(
      computeObservationConfidence({
        source: observationSource.curatedSeed,
        evidenceLevel: evidenceLevel.manuallyConfirmed,
        producerConfidenceHint: Number.POSITIVE_INFINITY,
      }),
    ).toBe(85);
  });

  it("clamps finite producer confidence hints before applying source caps", () => {
    expect(
      computeObservationConfidence({
        source: observationSource.publicSourceJob,
        evidenceLevel: evidenceLevel.listed,
        producerConfidenceHint: 0,
      }),
    ).toBe(28);

    expect(
      computeObservationConfidence({
        source: observationSource.adminImport,
        evidenceLevel: evidenceLevel.tested,
        producerConfidenceHint: 100,
      }),
    ).toBe(88);
  });
});
