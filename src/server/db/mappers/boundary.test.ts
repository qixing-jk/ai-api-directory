import { describe, expect, it } from "vitest";
import { mapAdminDirectoryReviewToDto } from "./admin-directory";
import { mapSeedSiteCandidateToCandidateInput } from "./import-candidate";
import { mapProjectionRecordToPublicDto } from "./public-projection";

describe("server DB mappers", () => {
  it("validates projection payloads before returning public DTOs", () => {
    expect(() =>
      mapProjectionRecordToPublicDto({
        projectionKey: "site/example-api",
        locale: "zh-cn",
        payload: {
          entityId: "site-1",
          versionId: "version-1",
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
        entityId: "site-1",
        versionId: "version-1",
        lifecycle: "pending_review",
        title: "Example API",
        reviewSummary: "Needs source review",
        evidenceCount: 2,
        updatedAt: "2026-05-24T00:00:00.000Z",
        rawEvidence: { requestBody: "private" },
      }),
    ).toEqual({
      entityId: "site-1",
      versionId: "version-1",
      lifecycle: "pending_review",
      title: "Example API",
      reviewSummary: "Needs source review",
      evidenceCount: 2,
      updatedAt: "2026-05-24T00:00:00.000Z",
    });
  });

  it("maps seed candidate input without producing a public DTO", () => {
    expect(
      mapSeedSiteCandidateToCandidateInput({
        slug: "example-api",
        displayName: "Example API",
        homepageUrl: "https://example.com",
        sourceDescription: "manual seed",
        observedAt: "2026-05-24T00:00:00.000Z",
      }),
    ).toEqual({
      disposition: "candidate",
      slug: "example-api",
      displayName: "Example API",
      homepageUrl: "https://example.com",
      sourceDescription: "manual seed",
      observedAt: "2026-05-24T00:00:00.000Z",
    });
  });
});
