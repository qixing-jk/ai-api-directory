import {
  adminDirectoryReviewDtoSchema,
  type AdminDirectoryReviewDto,
} from "~/contracts/admin/directory";

export type AdminDirectoryReviewRow = {
  readonly entityId: string;
  readonly versionId: string;
  readonly lifecycle: string;
  readonly title: string;
  readonly reviewSummary: string;
  readonly evidenceCount: number;
  readonly updatedAt: string;
  readonly rawEvidence?: unknown;
  readonly privateReviewContext?: unknown;
};

export function mapAdminDirectoryReviewToDto(
  row: AdminDirectoryReviewRow,
): AdminDirectoryReviewDto {
  return adminDirectoryReviewDtoSchema.parse({
    entityId: row.entityId,
    versionId: row.versionId,
    lifecycle: row.lifecycle,
    title: row.title,
    reviewSummary: row.reviewSummary,
    evidenceCount: row.evidenceCount,
    updatedAt: row.updatedAt,
  });
}
