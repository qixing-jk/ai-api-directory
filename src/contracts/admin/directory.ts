import { z } from "zod";
import {
  publishableLifecycles,
  type PublishableLifecycle,
} from "~/domain/vocabularies";
import {
  entityIdSchema,
  isoDateTimeSchema,
  versionIdSchema,
} from "../shared/ids";

const lifecycleValues = publishableLifecycles as [
  PublishableLifecycle,
  ...PublishableLifecycle[],
];

export const adminDirectoryReviewDtoSchema = z
  .object({
    entityId: entityIdSchema,
    versionId: versionIdSchema,
    lifecycle: z.enum(lifecycleValues),
    title: z.string().min(1),
    reviewSummary: z.string().min(1),
    evidenceCount: z.number().int().min(0),
    updatedAt: isoDateTimeSchema,
  })
  .strict();

export type AdminDirectoryReviewDto = z.infer<
  typeof adminDirectoryReviewDtoSchema
>;
