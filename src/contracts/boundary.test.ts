import { describe, expect, it } from "vitest";
import {
  adminAuditEventDtoSchema,
  auditActorDtoSchema,
} from "./admin/audit";
import {
  adminDirectoryReviewDtoSchema,
  type AdminDirectoryReviewDto,
} from "./admin/directory";
import type { EvidenceLevel, PublishableLifecycle } from "~/domain/vocabularies";
import { seedSiteCandidateInputSchema } from "./import/seed";
import {
  publicProjectionDtoSchema,
  type PublicEvidenceSummaryDto,
} from "./public/directory";
import { paginationQuerySchema } from "./shared/pagination";

type Equal<Actual, Expected> =
  (<Type>() => Type extends Actual ? 1 : 2) extends <
    Type,
  >() => Type extends Expected ? 1 : 2
    ? true
    : false;
type Expect<Type extends true> = Type;

type _PublicEvidenceLevelPreservesDomainLiteralUnion = Expect<
  Equal<PublicEvidenceSummaryDto["level"], EvidenceLevel>
>;
type _AdminLifecyclePreservesDomainLiteralUnion = Expect<
  Equal<AdminDirectoryReviewDto["lifecycle"], PublishableLifecycle>
>;

describe("typed boundary contracts", () => {
  it("rejects private fields in public projection DTO output", () => {
    const result = publicProjectionDtoSchema.safeParse({
      entityId: "site-1",
      versionId: "version-1",
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

  it("keeps admin DTOs sanitized even though they include review context", () => {
    const result = adminDirectoryReviewDtoSchema.safeParse({
      entityId: "site-1",
      versionId: "version-1",
      lifecycle: "pending_review",
      title: "Example API",
      reviewSummary: "Needs source review",
      evidenceCount: 2,
      updatedAt: "2026-05-24T00:00:00.000Z",
      requestBody: "private prompt",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            code: "unrecognized_keys",
            keys: ["requestBody"],
          }),
        ]),
      );
    }
  });

  it("requires admin audit actors to identify the admin", () => {
    expect(
      auditActorDtoSchema.safeParse({
        type: "admin",
      }).success,
    ).toBe(false);

    expect(
      adminAuditEventDtoSchema.parse({
        id: "audit-1",
        actor: {
          type: "admin",
          id: "admin-1",
        },
        commandId: "command-1",
        objectFamily: "directory",
        objectId: "site-1",
        action: "reviewed",
        createdAt: "2026-05-24T00:00:00.000Z",
      }),
    ).toMatchObject({
      actor: {
        type: "admin",
        id: "admin-1",
      },
    });
  });

  it("forbids system audit actors from carrying an id", () => {
    expect(
      auditActorDtoSchema.safeParse({
        type: "system",
        id: "admin-1",
      }).success,
    ).toBe(false);

    expect(
      adminAuditEventDtoSchema.parse({
        id: "audit-1",
        actor: {
          type: "system",
        },
        commandId: "command-1",
        objectFamily: "directory",
        objectId: "site-1",
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

  it("normalizes pagination query defaults", () => {
    expect(paginationQuerySchema.parse({})).toEqual({
      page: 1,
      pageSize: 20,
    });
  });
});
