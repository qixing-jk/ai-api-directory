import type { AppLocale } from "~/i18n/locales";
import type {
  CandidateDisposition,
  EvidenceLevel,
  PublishableLifecycle,
  SignalDisposition,
  ValueOf,
} from "../vocabularies";

export type StableEntity = {
  readonly id: string;
  readonly activePublishedVersionId?: string;
};

export type PublishableVersion = {
  readonly id: string;
  readonly entityId: string;
  readonly lifecycle: PublishableLifecycle;
};

export type CandidateRecord = {
  readonly disposition: CandidateDisposition;
};

export type SignalRecord = {
  readonly disposition: SignalDisposition;
};

export type LocalePublication = {
  readonly locale: AppLocale;
  readonly lifecycle: PublishableLifecycle;
};

export type EvidenceSummary = {
  readonly level: EvidenceLevel;
  readonly observedAt: string;
  readonly publicSourceUrl?: string;
};

export type ProjectionPolicyVersion = string;

export type ProjectionCheckpoint = {
  readonly scope: string;
  readonly version: number;
};

export const projectionRebuildReason = {
  publish: "publish",
  withdraw: "withdraw",
  archive: "archive",
  disputeResolution: "dispute_resolution",
  rollback: "rollback",
  policyRebuild: "policy_rebuild",
} as const;

export type ProjectionRebuildReason = ValueOf<typeof projectionRebuildReason>;

export type ProjectionRebuildPlan = {
  readonly commandId: string;
  readonly entityId: string;
  readonly reason: ProjectionRebuildReason;
  readonly policyVersion: ProjectionPolicyVersion;
  readonly baseCheckpoint: ProjectionCheckpoint;
  readonly nextCheckpoint: ProjectionCheckpoint;
  readonly affectedFamilies: readonly ProjectionFamily[];
};

export const projectionFamily = {
  entityPage: "entity_page",
  indexList: "index_list",
  pricing: "pricing",
  navigation: "navigation",
  metadata: "metadata",
  sitemap: "sitemap",
  hreflang: "hreflang",
} as const;

export type ProjectionFamily = ValueOf<typeof projectionFamily>;
