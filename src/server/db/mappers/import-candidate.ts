import {
  createSeedObservationBatchFromSiteCandidate,
  seedSiteCandidateInputSchema,
  type SeedObservationBatchOptions,
  type SeedSiteCandidateInput,
} from "~/contracts/import/seed";
import type { ObservationBatchInput } from "~/contracts/import/observation";

export type SiteCandidateInput = {
  readonly slug: string;
  readonly displayName: string;
  readonly homepageUrl: string;
  readonly sourceDescription: string;
  readonly observedAt: string;
  readonly sourceBatch: ObservationBatchInput;
  readonly disposition: "candidate";
};

export function mapSeedSiteCandidateToCandidateInput(
  input: SeedSiteCandidateInput,
  options: SeedObservationBatchOptions,
): SiteCandidateInput {
  const parsed = seedSiteCandidateInputSchema.parse(input);
  const sourceBatch = createSeedObservationBatchFromSiteCandidate(
    parsed,
    options,
  );
  const siteObservation = sourceBatch.observations[0];

  if (siteObservation?.kind !== "site") {
    throw new Error(
      "Seed candidate observation batch must contain a site observation",
    );
  }

  return {
    slug: parsed.slug,
    displayName: parsed.displayName,
    homepageUrl: siteObservation.origin,
    sourceDescription: parsed.sourceDescription,
    observedAt: siteObservation.observedAt,
    sourceBatch,
    disposition: "candidate",
  };
}
