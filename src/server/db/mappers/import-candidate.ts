import {
  seedSiteCandidateInputSchema,
  type SeedSiteCandidateInput,
} from "~/contracts/import/seed";

export type SiteCandidateInput = SeedSiteCandidateInput & {
  readonly disposition: "candidate";
};

export function mapSeedSiteCandidateToCandidateInput(
  input: SeedSiteCandidateInput,
): SiteCandidateInput {
  const parsed = seedSiteCandidateInputSchema.parse(input);
  return {
    ...parsed,
    disposition: "candidate",
  };
}
