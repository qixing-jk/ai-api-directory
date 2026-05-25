import { DomainPolicyError, domainPolicyErrorCode } from "../errors";
import {
  publishableLifecycle,
  type PublishableLifecycle,
  type ValueOf,
} from "../vocabularies";

export const publicationEventType = {
  rollback: "rollback",
} as const;

export type PublicationEventType = ValueOf<typeof publicationEventType>;

export type RollbackCommand = {
  readonly commandId: string;
  readonly entityId: string;
  readonly initiatedBy: string;
  readonly reason: string;
  readonly expectedCurrentVersionId: string;
};

export type RollbackTarget = {
  readonly versionId: string;
  readonly lifecycle: PublishableLifecycle;
  readonly privacyValidated: boolean;
  readonly publicationGatesPassed: boolean;
};

export type RollbackEvent = {
  readonly type: typeof publicationEventType.rollback;
  readonly commandId: string;
  readonly entityId: string;
  readonly previousVersionId: string;
  readonly restoredVersionId: string;
  readonly initiatedBy: string;
  readonly reason: string;
};

export const rollbackAllowedLifecycles = [
  publishableLifecycle.published,
  publishableLifecycle.disputed,
  publishableLifecycle.withdrawn,
  publishableLifecycle.archived,
] satisfies readonly PublishableLifecycle[];

const rollbackAllowedLifecycleSet: ReadonlySet<PublishableLifecycle> = new Set(
  rollbackAllowedLifecycles,
);

export const rollbackFailureReason = {
  currentPrivacyValidationFailed:
    "Rollback target fails current privacy validation",
  currentPublicationGatesFailed:
    "Rollback target fails current publication gates",
} as const;

export function planRollback(
  command: RollbackCommand,
  target: RollbackTarget,
): RollbackEvent {
  if (!rollbackAllowedLifecycleSet.has(target.lifecycle)) {
    throw new DomainPolicyError(
      domainPolicyErrorCode.rollbackNotAllowed,
      `Rollback is not allowed from lifecycle: ${target.lifecycle}`,
    );
  }

  if (!target.privacyValidated) {
    throw new DomainPolicyError(
      domainPolicyErrorCode.rollbackNotAllowed,
      rollbackFailureReason.currentPrivacyValidationFailed,
    );
  }

  if (!target.publicationGatesPassed) {
    throw new DomainPolicyError(
      domainPolicyErrorCode.rollbackNotAllowed,
      rollbackFailureReason.currentPublicationGatesFailed,
    );
  }

  return {
    type: publicationEventType.rollback,
    commandId: command.commandId,
    entityId: command.entityId,
    previousVersionId: command.expectedCurrentVersionId,
    restoredVersionId: target.versionId,
    initiatedBy: command.initiatedBy,
    reason: command.reason,
  };
}
