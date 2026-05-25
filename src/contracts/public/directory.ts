import { z } from "zod";
import { evidenceLevels, type EvidenceLevel } from "~/domain/vocabularies";
import {
  entityIdSchema,
  isoDateTimeSchema,
  slugSchema,
  versionIdSchema,
} from "../shared/ids";

const evidenceLevelValues = evidenceLevels as [EvidenceLevel, ...EvidenceLevel[]];

export const publicEvidenceSummaryDtoSchema = z
  .object({
    level: z.enum(evidenceLevelValues),
    observedAt: isoDateTimeSchema,
    publicSourceUrl: z.string().url().optional(),
  })
  .strict();

export const publicProjectionDtoSchema = z
  .object({
    entityId: entityIdSchema,
    versionId: versionIdSchema,
    slug: slugSchema,
    title: z.string().min(1),
    summary: z.string().min(1),
    publicUrl: z.string().url(),
    evidence: z.array(publicEvidenceSummaryDtoSchema),
    updatedAt: isoDateTimeSchema,
  })
  .strict();

export type PublicEvidenceSummaryDto = z.infer<
  typeof publicEvidenceSummaryDtoSchema
>;
export type PublicProjectionDto = z.infer<typeof publicProjectionDtoSchema>;
