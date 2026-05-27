import { z } from "zod";
import { isoDateTimeSchema, slugSchema } from "../shared/ids";
import {
  observationBatchSchema,
  type ObservationBatchInput,
} from "./observation";

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

export type SeedObservationBatchOptions = {
  readonly batchId: string;
  readonly generatedAt: string;
};

export function createSeedObservationBatchFromSiteCandidate(
  input: SeedSiteCandidateInput,
  options: SeedObservationBatchOptions,
): ObservationBatchInput {
  const parsed = seedSiteCandidateInputSchema.parse(input);

  return observationBatchSchema.parse({
    schemaVersion: "2026-05-26",
    source: "curated_seed",
    batchId: options.batchId,
    generatedAt: options.generatedAt,
    producer: {
      productName: "ai-api-directory",
      contractVersion: "2026-05-26",
    },
    consent: { state: "not_applicable" },
    observations: [
      {
        kind: "site",
        siteKey: parsed.slug,
        displayName: parsed.displayName,
        origin: parsed.homepageUrl,
        siteType: "unknown",
        category: "unknown",
        observedAt: parsed.observedAt,
        producerConfidenceHint: 60,
      },
    ],
  });
}
