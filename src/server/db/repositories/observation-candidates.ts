import type {
  CapabilityCandidateWriteInput,
  CliSupportEvidenceWriteInput,
  DryRunEvidenceRecord,
  EndpointCandidateWriteInput,
  ModelCandidateWriteInput,
  ModelRouteCandidateWriteInput,
  ObservationDryRunImportPlan,
  PriceCandidateWriteInput,
  ProbeEvidenceWriteInput,
  RiskReviewItemWriteInput,
  SiteCandidateWriteInput,
} from "../mappers/observation-intake";

export type CandidateWriteResult = {
  readonly id: string;
};

export type ObservationCandidateWriteSource = {
  readonly appendSiteCandidate: (
    input: SiteCandidateWriteInput,
  ) => Promise<CandidateWriteResult>;
  readonly appendEndpointCandidate: (
    input: EndpointCandidateWriteInput,
  ) => Promise<CandidateWriteResult>;
  readonly appendModelCandidate: (
    input: ModelCandidateWriteInput,
  ) => Promise<CandidateWriteResult>;
  readonly appendModelRouteCandidate: (
    input: ModelRouteCandidateWriteInput,
  ) => Promise<CandidateWriteResult>;
  readonly appendPriceCandidate: (
    input: PriceCandidateWriteInput,
  ) => Promise<CandidateWriteResult>;
  readonly appendCapabilityCandidate: (
    input: CapabilityCandidateWriteInput,
  ) => Promise<CandidateWriteResult>;
  readonly appendRiskReviewItem: (
    input: RiskReviewItemWriteInput,
  ) => Promise<CandidateWriteResult>;
  readonly appendVerificationProbeEvidence: (
    input: ProbeEvidenceWriteInput,
  ) => Promise<CandidateWriteResult>;
  readonly appendCliSupportEvidence: (
    input: CliSupportEvidenceWriteInput,
  ) => Promise<CandidateWriteResult>;
  readonly appendEvidenceRecord: (
    input: DryRunEvidenceRecord,
  ) => Promise<CandidateWriteResult>;
};

export type ObservationCandidateAppendSummary = {
  readonly siteCandidates: number;
  readonly endpointCandidates: number;
  readonly modelCandidates: number;
  readonly modelRouteCandidates: number;
  readonly priceCandidates: number;
  readonly capabilityCandidates: number;
  readonly riskReviewItems: number;
  readonly verificationProbeEvidence: number;
  readonly cliSupportEvidence: number;
  readonly evidenceRecords: number;
  readonly publicProjectionRecords: 0;
};

export function createObservationCandidateAppender(
  source: ObservationCandidateWriteSource,
) {
  return {
    async appendDryRunPlan(
      plan: ObservationDryRunImportPlan,
    ): Promise<ObservationCandidateAppendSummary> {
      for (const candidate of plan.siteCandidates) {
        await source.appendSiteCandidate(candidate);
      }

      for (const candidate of plan.endpointCandidates) {
        await source.appendEndpointCandidate(candidate);
      }

      for (const candidate of plan.modelCandidates) {
        await source.appendModelCandidate(candidate);
      }

      for (const candidate of plan.modelRouteCandidates) {
        await source.appendModelRouteCandidate(candidate);
      }

      for (const candidate of plan.priceCandidates) {
        await source.appendPriceCandidate(candidate);
      }

      for (const candidate of plan.capabilityCandidates) {
        await source.appendCapabilityCandidate(candidate);
      }

      for (const item of plan.riskReviewItems) {
        await source.appendRiskReviewItem(item);
      }

      for (const evidence of plan.verificationProbeEvidence) {
        await source.appendVerificationProbeEvidence(evidence);
      }

      for (const evidence of plan.cliSupportEvidence) {
        await source.appendCliSupportEvidence(evidence);
      }

      for (const record of plan.evidenceRecords) {
        await source.appendEvidenceRecord(record);
      }

      return {
        siteCandidates: plan.siteCandidates.length,
        endpointCandidates: plan.endpointCandidates.length,
        modelCandidates: plan.modelCandidates.length,
        modelRouteCandidates: plan.modelRouteCandidates.length,
        priceCandidates: plan.priceCandidates.length,
        capabilityCandidates: plan.capabilityCandidates.length,
        riskReviewItems: plan.riskReviewItems.length,
        verificationProbeEvidence: plan.verificationProbeEvidence.length,
        cliSupportEvidence: plan.cliSupportEvidence.length,
        evidenceRecords: plan.evidenceRecords.length,
        publicProjectionRecords: 0,
      };
    },
  };
}
