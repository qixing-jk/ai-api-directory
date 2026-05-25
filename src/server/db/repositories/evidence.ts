export type AppendPriceSnapshotInput = {
  readonly modelRouteId: string;
  readonly currency: string;
  readonly billingUnit: string;
  readonly observedAt: string;
};

export type EvidenceWriteSource = {
  readonly appendPriceSnapshot: (
    input: AppendPriceSnapshotInput,
  ) => Promise<{ readonly id: string }>;
};

export function createEvidenceAppender(source: EvidenceWriteSource) {
  return {
    appendPriceSnapshot(input: AppendPriceSnapshotInput) {
      return source.appendPriceSnapshot(input);
    },
  };
}
