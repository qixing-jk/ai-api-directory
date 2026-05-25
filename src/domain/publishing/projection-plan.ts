import { DomainPolicyError, domainPolicyErrorCode } from "../errors";
import type {
  ProjectionCheckpoint,
  ProjectionRebuildPlan,
  ProjectionRebuildReason,
} from "./types";
import { projectionFamily } from "./types";

export type CreateProjectionRebuildPlanInput = {
  readonly commandId: string;
  readonly entityId: string;
  readonly reason: ProjectionRebuildReason;
  readonly policyVersion: string;
  readonly baseCheckpoint: ProjectionCheckpoint;
};

export const affectedProjectionFamilies = Object.freeze(
  Object.values(projectionFamily),
);

export function createProjectionRebuildPlan(
  input: CreateProjectionRebuildPlanInput,
): ProjectionRebuildPlan {
  const baseCheckpoint = {
    scope: input.baseCheckpoint.scope,
    version: input.baseCheckpoint.version,
  };

  return {
    commandId: input.commandId,
    entityId: input.entityId,
    reason: input.reason,
    policyVersion: input.policyVersion,
    baseCheckpoint,
    nextCheckpoint: {
      scope: baseCheckpoint.scope,
      version: baseCheckpoint.version + 1,
    },
    affectedFamilies: [...affectedProjectionFamilies],
  };
}

export function assertProjectionCanCommit(
  plan: ProjectionRebuildPlan,
  currentCheckpoint: ProjectionCheckpoint,
): void {
  if (
    currentCheckpoint.scope !== plan.baseCheckpoint.scope ||
    currentCheckpoint.version !== plan.baseCheckpoint.version
  ) {
    throw new DomainPolicyError(
      domainPolicyErrorCode.projectionConflict,
      `Projection checkpoint conflict: expected (${plan.baseCheckpoint.scope}, v${plan.baseCheckpoint.version}), received (${currentCheckpoint.scope}, v${currentCheckpoint.version})`,
    );
  }
}
