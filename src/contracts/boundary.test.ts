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

describe("typed boundary contracts", () => {
  it("preserves domain literal unions in contract output types", () => {
    expectTypeOf<PublicEvidenceSummaryDto["level"]>().toEqualTypeOf<EvidenceLevel>();
    expectTypeOf<AdminDirectoryReviewDto["lifecycle"]>().toEqualTypeOf<PublishableLifecycle>();
  });

  it("rejects private fields in public projection DTO output", () => {
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

  it("keeps admin DTOs sanitized even though they include review context", () => {
    const result = adminDirectoryReviewDtoSchema.safeParse({
      entityId,
      versionId,
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

  it("normalizes pagination query defaults", () => {
    expect(paginationQuerySchema.parse({})).toEqual({
      page: 1,
      pageSize: 20,
    });
  });
});
