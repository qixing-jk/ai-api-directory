export type ValueOf<T> = T[keyof T];

export const publishableLifecycle = {
  draft: "draft",
  pendingReview: "pending_review",
  approved: "approved",
  published: "published",
  disputed: "disputed",
  withdrawn: "withdrawn",
  archived: "archived",
  rejected: "rejected",
} as const;

export type PublishableLifecycle = ValueOf<typeof publishableLifecycle>;
export const publishableLifecycles = Object.values(publishableLifecycle);

export const factLevel = {
  claimed: "claimed",
  listed: "listed",
  observed: "observed",
  tested: "tested",
  disputed: "disputed",
} as const;

export type FactLevel = ValueOf<typeof factLevel>;
export const factLevels = Object.values(factLevel);

export const evidenceLevel = {
  claimed: "claimed",
  listed: "listed",
  observed: "observed",
  tested: "tested",
  manuallyConfirmed: "manually_confirmed",
} as const;

export type EvidenceLevel = ValueOf<typeof evidenceLevel>;
export const evidenceLevels = Object.values(evidenceLevel);

export const candidateDisposition = {
  candidate: "candidate",
  readyForReview: "ready_for_review",
  merged: "merged",
  dismissed: "dismissed",
} as const;

export type CandidateDisposition = ValueOf<typeof candidateDisposition>;
export const candidateDispositions = Object.values(candidateDisposition);

export const signalDisposition = {
  active: "active",
  superseded: "superseded",
  dismissed: "dismissed",
  withdrawn: "withdrawn",
} as const;

export type SignalDisposition = ValueOf<typeof signalDisposition>;
export const signalDispositions = Object.values(signalDisposition);

function includesValue<T extends readonly string[]>(
  values: T,
  value: string,
): value is T[number] {
  return values.includes(value as T[number]);
}

export function isPublishableLifecycle(
  value: string,
): value is PublishableLifecycle {
  return includesValue(publishableLifecycles, value);
}

export function isFactLevel(value: string): value is FactLevel {
  return includesValue(factLevels, value);
}

export function isEvidenceLevel(value: string): value is EvidenceLevel {
  return includesValue(evidenceLevels, value);
}

export function isCandidateDisposition(
  value: string,
): value is CandidateDisposition {
  return includesValue(candidateDispositions, value);
}

export function isSignalDisposition(value: string): value is SignalDisposition {
  return includesValue(signalDispositions, value);
}
