import { describe, expect, it } from "vitest";
import { DomainPolicyError, domainPolicyErrorCode } from "../errors";
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
      publicUrl: "https://example.com/dashboard?token=x#y",
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
        [privateProjectionField.privateSourceMetadata]: {
          scrapedFromAccount: "private-account",
        },
      }),
    ).toThrow(
      `Public projection input contains private field: ${privateProjectionField.privateSourceMetadata}`,
    );
  });

  it("rejects private fields nested inside evidence", () => {
    let thrownError: unknown;

    try {
      buildPublicProjection({
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
            [privateProjectionField.rawEvidence]: { requestBody: "private" },
          } as PublicProjectionInput["evidence"][number] &
            Record<string, unknown>,
        ],
        updatedAt: "2026-05-24T00:00:00.000Z",
      });
    } catch (error) {
      thrownError = error;
    }

    expect(thrownError).toBeInstanceOf(DomainPolicyError);
    expect((thrownError as DomainPolicyError).code).toBe(
      domainPolicyErrorCode.projectionBoundaryViolation,
    );
    expect(thrownError).toHaveProperty(
      "message",
      `Public projection input contains private field: ${privateProjectionField.rawEvidence}`,
    );
  });
});
