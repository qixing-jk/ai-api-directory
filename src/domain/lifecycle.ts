import { DomainPolicyError, domainPolicyErrorCode } from "./errors";
import {
  publishableLifecycle,
  type PublishableLifecycle,
} from "./vocabularies";

const transitionGraph = {
  [publishableLifecycle.draft]: [
    publishableLifecycle.pendingReview,
    publishableLifecycle.archived,
  ],
  [publishableLifecycle.pendingReview]: [
    publishableLifecycle.approved,
    publishableLifecycle.draft,
    publishableLifecycle.rejected,
  ],
  [publishableLifecycle.approved]: [
    publishableLifecycle.draft,
    publishableLifecycle.published,
  ],
  [publishableLifecycle.published]: [
    publishableLifecycle.disputed,
    publishableLifecycle.withdrawn,
    publishableLifecycle.archived,
  ],
  [publishableLifecycle.disputed]: [
    publishableLifecycle.published,
    publishableLifecycle.withdrawn,
    publishableLifecycle.archived,
  ],
  [publishableLifecycle.withdrawn]: [
    publishableLifecycle.pendingReview,
    publishableLifecycle.archived,
  ],
  [publishableLifecycle.rejected]: [publishableLifecycle.draft],
  [publishableLifecycle.archived]: [publishableLifecycle.draft],
} as const satisfies Record<
  PublishableLifecycle,
  readonly PublishableLifecycle[]
>;

export function getAllowedNextLifecycles(
  from: PublishableLifecycle,
): PublishableLifecycle[] {
  return [...transitionGraph[from]];
}

export function canTransition(
  from: PublishableLifecycle,
  to: PublishableLifecycle,
): boolean {
  const allowedNextLifecycles: readonly PublishableLifecycle[] =
    transitionGraph[from];

  return allowedNextLifecycles.includes(to);
}

export function assertCanTransition(
  from: PublishableLifecycle,
  to: PublishableLifecycle,
): void {
  if (!canTransition(from, to)) {
    throw new DomainPolicyError(
      domainPolicyErrorCode.illegalTransition,
      `Illegal lifecycle transition: ${from} -> ${to}`,
    );
  }
}
