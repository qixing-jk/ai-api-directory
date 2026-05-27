import {
  observationBatchSchema,
  type ObservationBatchInput,
  type ObservationInput,
} from "~/contracts/import/observation";
import {
  computeObservationConfidence,
  deriveObservationEvidenceLevel,
  observationKind,
  type ObservationKind,
  type ObservationSource,
  type ProbeStatus,
} from "~/domain/observation/policy";
import type { EvidenceLevel } from "~/domain/vocabularies";

export type DryRunEvidenceRecord = {
  readonly targetType: string;
  readonly targetKey: string;
  readonly sourceType: ObservationSource;
  readonly evidenceLevel: EvidenceLevel;
  readonly confidence: number;
  readonly observedAt: string;
  readonly publicSourceUrl?: string;
  readonly publicSummary: string;
};

export type SiteCandidateWriteInput = {
  readonly siteKey: string;
  readonly displayName: string;
  readonly origin: string;
  readonly siteType: string;
  readonly category: string;
  readonly evidenceLevel: EvidenceLevel;
  readonly confidence: number;
  readonly observedAt: string;
};

export type EndpointCandidateWriteInput = {
  readonly siteKey: string;
  readonly endpointKey: string;
  readonly origin: string;
  readonly endpointKind: string;
  readonly evidenceLevel: EvidenceLevel;
  readonly confidence: number;
  readonly observedAt: string;
};

export type ModelCandidateWriteInput = {
  readonly canonicalModelKey: string;
  readonly displayName: string;
  readonly family: string;
  readonly creator: string;
  readonly contextWindow?: number;
  readonly aliases: readonly string[];
  readonly capabilities: readonly string[];
  readonly evidenceLevel: EvidenceLevel;
  readonly confidence: number;
  readonly observedAt: string;
};

export type ModelRouteCandidateWriteInput = {
  readonly siteKey: string;
  readonly endpointKey: string;
  readonly canonicalModelKey: string;
  readonly routeModelId: string;
  readonly providerType: string;
  readonly upstreamClaim?: string;
  readonly factLevel: string;
  readonly modelListSource: string;
  readonly evidenceLevel: EvidenceLevel;
  readonly confidence: number;
  readonly observedAt: string;
};

export type PriceCandidateWriteInput = {
  readonly siteKey: string;
  readonly routeModelId: string;
  readonly currency: string;
  readonly billingUnit: string;
  readonly inputPer1M?: number;
  readonly outputPer1M?: number;
  readonly cacheReadPer1M?: number;
  readonly cacheWritePer1M?: number;
  readonly requestFee?: number;
  readonly minimumRecharge?: number;
  readonly discountNote?: string;
  readonly exchangeRateNote?: string;
  readonly effectiveAt?: string;
  readonly expiresAt?: string;
  readonly isComparableTokenPrice: boolean;
  readonly evidenceLevel: EvidenceLevel;
  readonly confidence: number;
  readonly observedAt: string;
};

export type CapabilityCandidateWriteInput = {
  readonly siteKey: string;
  readonly capability: string;
  readonly status: string;
  readonly evidenceLevel: EvidenceLevel;
  readonly confidence: number;
  readonly observedAt: string;
};

export type ProbeEvidenceWriteInput = {
  readonly targetKey: string;
  readonly apiType: string;
  readonly probeId: string;
  readonly status: ProbeStatus;
  readonly modelId?: string;
  readonly durationBucket: string;
  readonly errorCategory: string;
  readonly evidenceLevel: EvidenceLevel;
  readonly confidence: number;
  readonly observedAt: string;
};

export type CliSupportEvidenceWriteInput = {
  readonly targetKey: string;
  readonly tool: string;
  readonly probeId: string;
  readonly status: ProbeStatus;
  readonly modelId?: string;
  readonly durationBucket: string;
  readonly errorCategory: string;
  readonly evidenceLevel: EvidenceLevel;
  readonly confidence: number;
  readonly observedAt: string;
};

export type RiskReviewItemWriteInput = {
  readonly siteKey: string;
  readonly riskType: string;
  readonly severityHint: string;
  readonly evidenceLevel: EvidenceLevel;
  readonly confidence: number;
  readonly observedAt: string;
  readonly publicRiskSignal: false;
};

export type ObservationDryRunImportPlan = {
  readonly batchId: string;
  readonly source: ObservationSource;
  readonly siteCandidates: readonly SiteCandidateWriteInput[];
  readonly endpointCandidates: readonly EndpointCandidateWriteInput[];
  readonly modelCandidates: readonly ModelCandidateWriteInput[];
  readonly modelRouteCandidates: readonly ModelRouteCandidateWriteInput[];
  readonly priceCandidates: readonly PriceCandidateWriteInput[];
  readonly capabilityCandidates: readonly CapabilityCandidateWriteInput[];
  readonly verificationProbeEvidence: readonly ProbeEvidenceWriteInput[];
  readonly cliSupportEvidence: readonly CliSupportEvidenceWriteInput[];
  readonly riskReviewItems: readonly RiskReviewItemWriteInput[];
  readonly evidenceRecords: readonly DryRunEvidenceRecord[];
  readonly publicProjectionRecords: readonly never[];
};

function probeStatusForObservation(
  observation: ObservationInput,
): ProbeStatus | undefined {
  if (
    observation.kind === observationKind.verificationProbe ||
    observation.kind === observationKind.cliSupport
  ) {
    return observation.status;
  }

  return undefined;
}

function reviewStateForObservation(observation: ObservationInput) {
  if ("publicSourceUrl" in observation && observation.publicSourceUrl) {
    return "reviewed_public_source" as const;
  }

  return "unreviewed" as const;
}

function evidenceLevelForObservation(
  source: ObservationSource,
  observation: ObservationInput,
): EvidenceLevel {
  return deriveObservationEvidenceLevel({
    source,
    kind: observation.kind as ObservationKind,
    reviewState: reviewStateForObservation(observation),
    probeStatus: probeStatusForObservation(observation),
  });
}

function confidenceForObservation(
  source: ObservationSource,
  observation: ObservationInput,
  evidenceLevel: EvidenceLevel,
): number {
  return computeObservationConfidence({
    source,
    evidenceLevel,
    producerConfidenceHint: observation.producerConfidenceHint,
  });
}

function evidenceRecordForObservation(
  source: ObservationSource,
  observation: ObservationInput,
  targetType: string,
  targetKey: string,
  publicSummary: string,
): DryRunEvidenceRecord {
  const level = evidenceLevelForObservation(source, observation);
  const publicSourceUrl =
    "publicSourceUrl" in observation ? observation.publicSourceUrl : undefined;

  return {
    targetType,
    targetKey,
    sourceType: source,
    evidenceLevel: level,
    confidence: confidenceForObservation(source, observation, level),
    observedAt: observation.observedAt,
    publicSourceUrl,
    publicSummary,
  };
}

export function mapObservationBatchToDryRunImportPlan(
  input: ObservationBatchInput,
): ObservationDryRunImportPlan {
  const batch = observationBatchSchema.parse(input);

  const siteCandidates: SiteCandidateWriteInput[] = [];
  const endpointCandidates: EndpointCandidateWriteInput[] = [];
  const modelCandidates: ModelCandidateWriteInput[] = [];
  const modelRouteCandidates: ModelRouteCandidateWriteInput[] = [];
  const priceCandidates: PriceCandidateWriteInput[] = [];
  const capabilityCandidates: CapabilityCandidateWriteInput[] = [];
  const verificationProbeEvidence: ProbeEvidenceWriteInput[] = [];
  const cliSupportEvidence: CliSupportEvidenceWriteInput[] = [];
  const riskReviewItems: RiskReviewItemWriteInput[] = [];
  const evidenceRecords: DryRunEvidenceRecord[] = [];

  for (const observation of batch.observations) {
    const level = evidenceLevelForObservation(batch.source, observation);
    const confidence = confidenceForObservation(batch.source, observation, level);

    switch (observation.kind) {
      case observationKind.site:
        siteCandidates.push({
          siteKey: observation.siteKey,
          displayName: observation.displayName,
          origin: observation.origin,
          siteType: observation.siteType,
          category: observation.category,
          evidenceLevel: level,
          confidence,
          observedAt: observation.observedAt,
        });
        evidenceRecords.push(
          evidenceRecordForObservation(
            batch.source,
            observation,
            "site",
            observation.siteKey,
            `Observed site origin for ${observation.displayName}`,
          ),
        );
        break;

      case observationKind.endpoint:
        endpointCandidates.push({
          siteKey: observation.siteKey,
          endpointKey: observation.endpointKey,
          origin: observation.origin,
          endpointKind: observation.endpointKind,
          evidenceLevel: level,
          confidence,
          observedAt: observation.observedAt,
        });
        evidenceRecords.push(
          evidenceRecordForObservation(
            batch.source,
            observation,
            "endpoint",
            observation.endpointKey,
            `Observed ${observation.endpointKind} endpoint for ${observation.siteKey}`,
          ),
        );
        break;

      case observationKind.model:
        modelCandidates.push({
          canonicalModelKey: observation.canonicalModelKey,
          displayName: observation.displayName,
          family: observation.family,
          creator: observation.creator,
          contextWindow: observation.contextWindow,
          aliases: observation.aliases,
          capabilities: observation.capabilities,
          evidenceLevel: level,
          confidence,
          observedAt: observation.observedAt,
        });
        evidenceRecords.push(
          evidenceRecordForObservation(
            batch.source,
            observation,
            "model",
            observation.canonicalModelKey,
            `Observed model ${observation.displayName}`,
          ),
        );
        break;

      case observationKind.modelRoute:
        modelRouteCandidates.push({
          siteKey: observation.siteKey,
          endpointKey: observation.endpointKey,
          canonicalModelKey: observation.canonicalModelKey,
          routeModelId: observation.routeModelId,
          providerType: observation.providerType,
          upstreamClaim: observation.upstreamClaim,
          factLevel: observation.factLevel,
          modelListSource: observation.modelListSource,
          evidenceLevel: level,
          confidence,
          observedAt: observation.observedAt,
        });
        evidenceRecords.push(
          evidenceRecordForObservation(
            batch.source,
            observation,
            "model_route",
            `${observation.siteKey}:${observation.routeModelId}`,
            `Observed model route ${observation.routeModelId}`,
          ),
        );
        break;

      case observationKind.price:
        priceCandidates.push({
          siteKey: observation.siteKey,
          routeModelId: observation.routeModelId,
          currency: observation.currency,
          billingUnit: observation.billingUnit,
          inputPer1M: observation.inputPer1M,
          outputPer1M: observation.outputPer1M,
          cacheReadPer1M: observation.cacheReadPer1M,
          cacheWritePer1M: observation.cacheWritePer1M,
          requestFee: observation.requestFee,
          minimumRecharge: observation.minimumRecharge,
          discountNote: observation.discountNote,
          exchangeRateNote: observation.exchangeRateNote,
          effectiveAt: observation.effectiveAt,
          expiresAt: observation.expiresAt,
          isComparableTokenPrice: observation.billingUnit === "per_1m_tokens",
          evidenceLevel: level,
          confidence,
          observedAt: observation.observedAt,
        });
        evidenceRecords.push(
          evidenceRecordForObservation(
            batch.source,
            observation,
            "price",
            `${observation.siteKey}:${observation.routeModelId}`,
            `Observed price for ${observation.routeModelId}`,
          ),
        );
        break;

      case observationKind.verificationProbe:
        verificationProbeEvidence.push({
          targetKey: observation.target.routeModelId
            ? `${observation.target.siteKey}:${observation.target.routeModelId}`
            : observation.target.siteKey,
          apiType: observation.apiType,
          probeId: observation.probeId,
          status: observation.status,
          modelId: observation.modelId,
          durationBucket: observation.durationBucket,
          errorCategory: observation.errorCategory,
          evidenceLevel: level,
          confidence,
          observedAt: observation.observedAt,
        });
        break;

      case observationKind.cliSupport:
        cliSupportEvidence.push({
          targetKey: observation.target.routeModelId
            ? `${observation.target.siteKey}:${observation.target.routeModelId}`
            : observation.target.siteKey,
          tool: observation.tool,
          probeId: observation.probeId,
          status: observation.status,
          modelId: observation.modelId,
          durationBucket: observation.durationBucket,
          errorCategory: observation.errorCategory,
          evidenceLevel: level,
          confidence,
          observedAt: observation.observedAt,
        });
        break;

      case observationKind.capability:
        capabilityCandidates.push({
          siteKey: observation.siteKey,
          capability: observation.capability,
          status: observation.status,
          evidenceLevel: level,
          confidence,
          observedAt: observation.observedAt,
        });
        break;

      case observationKind.riskCandidate:
        riskReviewItems.push({
          siteKey: observation.siteKey,
          riskType: observation.riskType,
          severityHint: observation.severityHint,
          evidenceLevel: level,
          confidence,
          observedAt: observation.observedAt,
          publicRiskSignal: false,
        });
        break;
    }
  }

  return {
    batchId: batch.batchId,
    source: batch.source,
    siteCandidates,
    endpointCandidates,
    modelCandidates,
    modelRouteCandidates,
    priceCandidates,
    capabilityCandidates,
    verificationProbeEvidence,
    cliSupportEvidence,
    riskReviewItems,
    evidenceRecords,
    publicProjectionRecords: [],
  };
}
