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
