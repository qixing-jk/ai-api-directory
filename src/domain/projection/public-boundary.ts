import { DomainPolicyError, domainPolicyErrorCode } from "../errors";
import {
  normalizePublicSourceUrl,
  normalizeUrlToOrigin,
} from "../privacy/url-policy";
import type { EvidenceSummary } from "../publishing/types";
import type { PublishableLifecycle } from "../vocabularies";

export type PublicProjection = {
  readonly entityId: string;
  readonly versionId: string;
  readonly slug: string;
  readonly title: string;
  readonly summary: string;
  readonly publicUrl: string;
  readonly evidence: readonly EvidenceSummary[];
  readonly updatedAt: string;
};

export type PublicProjectionInput = PublicProjection & Record<string, unknown>;

export type AdminReviewViewModel = {
  readonly entityId: string;
  readonly versionId: string;
  readonly lifecycle: PublishableLifecycle;
  readonly adminNotes?: string;
  readonly rawEvidenceId?: string;
  readonly reviewerId?: string;
};

export const privateProjectionField = {
  adminNotes: "adminNotes",
  rawEvidence: "rawEvidence",
  rawEvidenceId: "rawEvidenceId",
  reviewerId: "reviewerId",
  internalReviewComments: "internalReviewComments",
  privateSourceMetadata: "privateSourceMetadata",
  sourcePayload: "sourcePayload",
  accountName: "accountName",
  userId: "userId",
  exactBalance: "exactBalance",
  requestBody: "requestBody",
  responseBody: "responseBody",
} as const;

export const privateProjectionFields = Object.values(privateProjectionField);

function assertNoPrivateFields(input: Record<string, unknown>): void {
  for (const field of privateProjectionFields) {
    if (field in input) {
      throw new DomainPolicyError(
        domainPolicyErrorCode.projectionBoundaryViolation,
        `Public projection input contains private field: ${field}`,
      );
    }
  }
}

export function buildPublicProjection(
  input: PublicProjectionInput,
): PublicProjection {
  assertNoPrivateFields(input);

  return {
    entityId: input.entityId,
    versionId: input.versionId,
    slug: input.slug,
    title: input.title,
    summary: input.summary,
    publicUrl: normalizeUrlToOrigin(input.publicUrl),
    evidence: input.evidence.map((evidence) => {
      assertNoPrivateFields(evidence as Record<string, unknown>);

      const publicEvidence: EvidenceSummary = {
        level: evidence.level,
        observedAt: evidence.observedAt,
      };

      if (!evidence.publicSourceUrl) {
        return publicEvidence;
      }

      return {
        ...publicEvidence,
        publicSourceUrl: normalizePublicSourceUrl(evidence.publicSourceUrl),
      };
    }),
    updatedAt: input.updatedAt,
  };
}
