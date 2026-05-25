import { describe, expect, it } from "vitest";
import { DomainPolicyError } from "../errors";
import {
  affectedProjectionFamilies,
  assertProjectionCanCommit,
  createProjectionRebuildPlan,
} from "./projection-plan";
import {
  type ProjectionCheckpoint,
  type ProjectionFamily,
  projectionFamily,
  projectionRebuildReason,
} from "./types";

describe("projection rebuild planning policy", () => {
  it("plans the full affected public projection family set", () => {
    expect(
      createProjectionRebuildPlan({
        commandId: "cmd-1",
        entityId: "site-1",
        reason: projectionRebuildReason.publish,
        policyVersion: "policy-2026-05-25",
        baseCheckpoint: { scope: "site-1", version: 7 },
      }),
    ).toEqual({
      commandId: "cmd-1",
      entityId: "site-1",
      reason: projectionRebuildReason.publish,
      policyVersion: "policy-2026-05-25",
      baseCheckpoint: { scope: "site-1", version: 7 },
      nextCheckpoint: { scope: "site-1", version: 8 },
      affectedFamilies: Object.values(projectionFamily),
    });
  });

  it("allows commit only when the current checkpoint matches the planned base", () => {
    const plan = createProjectionRebuildPlan({
      commandId: "cmd-1",
      entityId: "site-1",
      reason: projectionRebuildReason.rollback,
      policyVersion: "policy-2026-05-25",
      baseCheckpoint: { scope: "site-1", version: 7 },
    });

    expect(() =>
      assertProjectionCanCommit(plan, { scope: "site-1", version: 7 }),
    ).not.toThrow();
  });

  it("rejects stale projection rebuild plans", () => {
    const plan = createProjectionRebuildPlan({
      commandId: "cmd-1",
      entityId: "site-1",
      reason: projectionRebuildReason.publish,
      policyVersion: "policy-2026-05-25",
      baseCheckpoint: { scope: "site-1", version: 7 },
    });

    expect(() =>
      assertProjectionCanCommit(plan, { scope: "site-1", version: 8 }),
    ).toThrow(DomainPolicyError);
    expect(() =>
      assertProjectionCanCommit(plan, { scope: "site-1", version: 8 }),
    ).toThrow(
      "Projection checkpoint conflict: expected (site-1, v7), received (site-1, v8)",
    );
    expect(() =>
      assertProjectionCanCommit(plan, { scope: "site-2", version: 7 }),
    ).toThrow(
      "Projection checkpoint conflict: expected (site-1, v7), received (site-2, v7)",
    );
  });

  it("snapshots checkpoint metadata when planning", () => {
    const baseCheckpoint: ProjectionCheckpoint = { scope: "site-1", version: 7 };
    const plan = createProjectionRebuildPlan({
      commandId: "cmd-1",
      entityId: "site-1",
      reason: projectionRebuildReason.publish,
      policyVersion: "policy-2026-05-25",
      baseCheckpoint,
    });

    (baseCheckpoint as { scope: string; version: number }).scope = "site-2";
    (baseCheckpoint as { scope: string; version: number }).version = 99;

    expect(plan.baseCheckpoint).toEqual({ scope: "site-1", version: 7 });
    expect(plan.nextCheckpoint).toEqual({ scope: "site-1", version: 8 });
  });

  it("snapshots affected projection families per plan", () => {
    const firstPlan = createProjectionRebuildPlan({
      commandId: "cmd-1",
      entityId: "site-1",
      reason: projectionRebuildReason.publish,
      policyVersion: "policy-2026-05-25",
      baseCheckpoint: { scope: "site-1", version: 7 },
    });
    const secondPlan = createProjectionRebuildPlan({
      commandId: "cmd-2",
      entityId: "site-1",
      reason: projectionRebuildReason.rollback,
      policyVersion: "policy-2026-05-25",
      baseCheckpoint: { scope: "site-1", version: 8 },
    });

    (firstPlan.affectedFamilies as ProjectionFamily[]).pop();

    expect(secondPlan.affectedFamilies).toEqual(Object.values(projectionFamily));
    expect(affectedProjectionFamilies).toEqual(Object.values(projectionFamily));
  });
});
