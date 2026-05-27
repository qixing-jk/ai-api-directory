import { DomainPolicyError, domainPolicyErrorCode } from "../errors";
import {
  normalizePublicSourceUrl,
  normalizeUrlToOrigin,
} from "../privacy/url-policy";
import {
  evidenceLevel,
  type EvidenceLevel,
  type ValueOf,
} from "../vocabularies";

export const observationSource = {
  curatedSeed: "curated_seed",
  adminImport: "admin_import",
  allApiHubExtension: "all_api_hub_extension",
  publicSourceJob: "public_source_job",
  probeJob: "probe_job",
} as const;

export type ObservationSource = ValueOf<typeof observationSource>;
export const observationSources = Object.values(observationSource);

export const observationConsentState = {
  notApplicable: "not_applicable",
  explicit: "explicit",
} as const;

export type ObservationConsentState = ValueOf<typeof observationConsentState>;

export type ObservationConsent =
  | { readonly state: "not_applicable" }
  | {
      readonly state: "explicit";
      readonly version: string;
      readonly acceptedAt: string;
    };

export const observationKind = {
  site: "site",
  endpoint: "endpoint",
  model: "model",
  modelRoute: "model_route",
  price: "price",
  verificationProbe: "verification_probe",
  cliSupport: "cli_support",
  capability: "capability",
  riskCandidate: "risk_candidate",
} as const;

export type ObservationKind = ValueOf<typeof observationKind>;
export const observationKinds = Object.values(observationKind);

export const modelListSource = {
  userScopedModelList: "user_scoped_model_list",
  catalogFallback: "catalog_fallback",
  publicModelList: "public_model_list",
  manualEntry: "manual_entry",
} as const;

export type ModelListSource = ValueOf<typeof modelListSource>;
export const modelListSources = Object.values(modelListSource);

export const probeStatus = {
  pass: "pass",
  fail: "fail",
  unsupported: "unsupported",
} as const;

export type ProbeStatus = ValueOf<typeof probeStatus>;
export const probeStatuses = Object.values(probeStatus);

export type ObservationGovernanceOptions = {
  readonly allowAllApiHubExtension?: boolean;
};

export type ObservationSourcePolicyInput = {
  readonly source: ObservationSource;
  readonly consent: ObservationConsent;
  readonly options?: ObservationGovernanceOptions;
};

const sensitiveObservationKeyFragments = [
  "apikey",
  "accesskey",
  "accesstoken",
  "refreshtoken",
  "authorization",
  "cookie",
  "accountname",
  "tokenname",
  "userid",
  "email",
  "exactbalance",
  "exactquota",
  "preciseusage",
  "requestbody",
  "responsebody",
  "prompt",
  "modeloutput",
  "rawlog",
  "rawlogs",
  "rawerror",
  "rawstack",
  "screenshot",
  "sourcecount",
  "serverconfidence",
];

const evidenceConfidenceBase: Record<EvidenceLevel, number> = {
  [evidenceLevel.claimed]: 25,
  [evidenceLevel.listed]: 55,
  [evidenceLevel.observed]: 45,
  [evidenceLevel.tested]: 75,
  [evidenceLevel.manuallyConfirmed]: 90,
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeKeyForSensitivity(key: string): string {
  return key.replace(/[-_\s]/g, "").toLowerCase();
}

function isSensitiveObservationKey(key: string): boolean {
  const normalized = normalizeKeyForSensitivity(key);
  return sensitiveObservationKeyFragments.some((fragment) =>
    normalized.includes(fragment),
  );
}

function joinPath(path: readonly string[]): string {
  return path.join(".");
}

export function findSensitiveObservationField(
  input: unknown,
  path: readonly string[] = [],
): string | null {
  if (Array.isArray(input)) {
    for (const [index, value] of input.entries()) {
      const result = findSensitiveObservationField(value, [
        ...path,
        String(index),
      ]);
      if (result) return result;
    }
    return null;
  }

  if (!isRecord(input)) {
    return null;
  }

  for (const [key, value] of Object.entries(input)) {
    const currentPath = [...path, key];
    if (isSensitiveObservationKey(key)) {
      return joinPath(currentPath);
    }

    const result = findSensitiveObservationField(value, currentPath);
    if (result) return result;
  }

  return null;
}

export function assertNoSensitiveObservationFields(input: unknown): void {
  const sensitiveFieldPath = findSensitiveObservationField(input);
  if (!sensitiveFieldPath) return;

  throw new DomainPolicyError(
    domainPolicyErrorCode.privacyViolation,
    `Observation payload contains sensitive field: ${sensitiveFieldPath}`,
  );
}

export function assertObservationSourceAllowed(
  input: ObservationSourcePolicyInput,
): void {
  if (input.source !== observationSource.allApiHubExtension) {
    return;
  }

  if (!input.options?.allowAllApiHubExtension) {
    throw new DomainPolicyError(
      domainPolicyErrorCode.publicationNotAllowed,
      "All API Hub extension contribution is not enabled",
    );
  }

  if (input.consent.state !== observationConsentState.explicit) {
    throw new DomainPolicyError(
      domainPolicyErrorCode.privacyViolation,
      "All API Hub extension contribution requires explicit consent",
    );
  }
}

export function normalizeObservationOrigin(rawUrl: string): string {
  return normalizeUrlToOrigin(rawUrl);
}

export function normalizeObservationPublicSourceUrl(rawUrl: string): string {
  return normalizePublicSourceUrl(rawUrl, { rejectQueryAndHash: true });
}

export type ObservationReviewState =
  | "unreviewed"
  | "reviewed_public_source"
  | "manual_review";

export type ObservationEvidenceInput = {
  readonly source: ObservationSource;
  readonly kind: ObservationKind;
  readonly reviewState?: ObservationReviewState;
  readonly probeStatus?: ProbeStatus;
};

export function deriveObservationEvidenceLevel(
  input: ObservationEvidenceInput,
): EvidenceLevel {
  if (input.reviewState === "manual_review") {
    return evidenceLevel.manuallyConfirmed;
  }

  if (
    (input.kind === observationKind.verificationProbe ||
      input.kind === observationKind.cliSupport) &&
    input.probeStatus === probeStatus.pass
  ) {
    return evidenceLevel.tested;
  }

  if (input.source === observationSource.publicSourceJob) {
    return evidenceLevel.listed;
  }

  if (input.reviewState === "reviewed_public_source") {
    return evidenceLevel.listed;
  }

  if (input.source === observationSource.allApiHubExtension) {
    return evidenceLevel.observed;
  }

  if (input.source === observationSource.probeJob) {
    return evidenceLevel.observed;
  }

  return evidenceLevel.claimed;
}

function clampConfidence(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function confidenceHintOrBase(hint: number | undefined, base: number): number {
  return typeof hint === "number" && Number.isFinite(hint)
    ? clampConfidence(hint)
    : base;
}

function confidenceCapForSource(source: ObservationSource): number {
  if (source === observationSource.allApiHubExtension) return 40;
  if (source === observationSource.curatedSeed) return 85;
  if (source === observationSource.adminImport) return 90;
  return 95;
}

export type ObservationConfidenceInput = {
  readonly source: ObservationSource;
  readonly evidenceLevel: EvidenceLevel;
  readonly producerConfidenceHint?: number;
};

export function computeObservationConfidence(
  input: ObservationConfidenceInput,
): number {
  const base = evidenceConfidenceBase[input.evidenceLevel];
  const hint = confidenceHintOrBase(input.producerConfidenceHint, base);
  const combined = Math.round((base + hint) / 2);
  return Math.min(confidenceCapForSource(input.source), combined);
}
