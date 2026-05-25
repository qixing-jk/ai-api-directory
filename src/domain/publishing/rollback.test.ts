import { describe, expect, it } from "vitest";

import { DomainPolicyError } from "../errors";
import { publishableLifecycle } from "../vocabularies";
import {
  publicationEventType,
  planRollback,
  rollbackAllowedLifecycles,
  rollbackFailureReason,
  type RollbackCommand,
  type RollbackTarget,
} from "./rollback";

describe("rollback publication policy", () => {
  const command: RollbackCommand = {
    commandId: "cmd-1",
    entityId: "site-1",
    initiatedBy: "admin-1",
    reason: "restore last safe published version",
    expectedCurrentVersionId: "version-current",
  };

  const target: RollbackTarget = {
    versionId: "version-old",
    lifecycle: publishableLifecycle.published,
    privacyValidated: true,
    publicationGatesPassed: true,
  };

  it("creates a rollback event without mutating the historical target", () => {
    const targetBeforeRollback = { ...target };

    expect(planRollback(command, target)).toEqual({
      type: publicationEventType.rollback,
      commandId: "cmd-1",
      entityId: "site-1",
      previousVersionId: "version-current",
      restoredVersionId: "version-old",
      initiatedBy: "admin-1",
      reason: "restore last safe published version",
    });
    expect(target).toEqual(targetBeforeRollback);
  });

  it("allows rollback from public states defined by the spec", () => {
    for (const lifecycle of rollbackAllowedLifecycles) {
      expect(
        planRollback(command, {
          ...target,
          lifecycle,
        }).restoredVersionId,
      ).toBe("version-old");
    }
  });

  it("rejects rollback targets that fail current privacy validation", () => {
    expect(() =>
      planRollback(command, {
        ...target,
        privacyValidated: false,
      }),
    ).toThrow(rollbackFailureReason.currentPrivacyValidationFailed);
  });

  it("rejects rollback targets that do not pass current publication gates", () => {
    expect(() =>
      planRollback(command, {
        ...target,
        publicationGatesPassed: false,
      }),
    ).toThrow(rollbackFailureReason.currentPublicationGatesFailed);
  });

  it("rejects rollback from non-public lifecycle states", () => {
    expect(() =>
      planRollback(command, {
        ...target,
        lifecycle: publishableLifecycle.approved,
      }),
    ).toThrow(DomainPolicyError);
  });
});
