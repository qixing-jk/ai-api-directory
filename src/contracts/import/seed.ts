import { z } from "zod";
import { isoDateTimeSchema, slugSchema } from "../shared/ids";

export const seedSiteCandidateInputSchema = z
  .object({
    slug: slugSchema,
    displayName: z.string().min(1),
    homepageUrl: z.string().url(),
    sourceDescription: z.string().min(1),
    observedAt: isoDateTimeSchema,
  })
  .strict();

export type SeedSiteCandidateInput = z.infer<
  typeof seedSiteCandidateInputSchema
>;
