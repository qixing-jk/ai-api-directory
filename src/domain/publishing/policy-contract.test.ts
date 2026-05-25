import { DEFAULT_APP_LOCALE } from "~/i18n/locales";
import { describe, expect, it } from "vitest";
import { assertCanTransition } from "../lifecycle";
import {
  buildPublicProjection,
  privateProjectionField,
  type PublicProjectionInput,
} from "../projection/public-boundary";
import { publishableLifecycle } from "../vocabularies";
import {
  canPublishTextBearingV1Page,
  isEligibleForDefaultPublicProjection,
} from "./eligibility";
import { createProjectionRebuildPlan } from "./projection-plan";
import { planRollback, publicationEventType } from "./rollback";
import { projectionFamily, projectionRebuildReason } from "./types";

describe("domain publishing policy contract", () => {
  it("keeps approval separate from publication and projection rebuild", () => {
    expect(() =>
      assertCanTransition(
        publishableLifecycle.pendingReview,
        publishableLifecycle.approved,
      ),
    ).not.toThrow();

    expect(
      canPublishTextBearingV1Page({
        entityVersion: {
          id: "version-1",
          entityId: "site-1",
          lifecycle: publishableLifecycle.approved,
        },
        localeVersions: [
          {
            locale: DEFAULT_APP_LOCALE,
            lifecycle: publishableLifecycle.published,
          },
        ],
      }),
    ).toEqual({ ok: true });

    expect(
      isEligibleForDefaultPublicProjection({
        id: "version-1",
        entityId: "site-1",
        lifecycle: publishableLifecycle.approved,
      }),
    ).toBe(false);

    expect(
      createProjectionRebuildPlan({
        commandId: "cmd-1",
        entityId: "site-1",
        reason: projectionRebuildReason.publish,
        policyVersion: "policy-2026-05-25",
        baseCheckpoint: { scope: "site-1", version: 0 },
      }).affectedFamilies,
    ).toContain(projectionFamily.sitemap);
  });

  it("builds public projections only from public-safe fields after publication", () => {
    expect(
      buildPublicProjection({
        entityId: "site-1",
        versionId: "version-1",
        slug: "example-api",
        title: "Example API",
        summary: "Public summary",
        publicUrl: "https://example.com/dashboard",
        evidence: [],
        updatedAt: "2026-05-24T00:00:00.000Z",
      }),
    ).toEqual({
      entityId: "site-1",
      versionId: "version-1",
      slug: "example-api",
      title: "Example API",
      summary: "Public summary",
      publicUrl: "https://example.com",
      evidence: [],
      updatedAt: "2026-05-24T00:00:00.000Z",
    });

    const unsafeInput = {
      entityId: "site-1",
      versionId: "version-1",
      slug: "example-api",
      title: "Example API",
      summary: "Public summary",
      publicUrl: "https://example.com/dashboard",
      evidence: [],
      updatedAt: "2026-05-24T00:00:00.000Z",
      [privateProjectionField.adminNotes]: "internal-only",
    } as PublicProjectionInput & Record<string, unknown>;

    expect(() => buildPublicProjection(unsafeInput)).toThrow(
      `Public projection input contains private field: ${privateProjectionField.adminNotes}`,
    );
  });

  it("plans rollback as a new publication event and rebuild plan", () => {
    const rollbackEvent = planRollback(
      {
        commandId: "cmd-rollback",
        entityId: "site-1",
        initiatedBy: "admin-1",
        reason: "restore safe version",
        expectedCurrentVersionId: "version-current",
      },
      {
        versionId: "version-old",
        lifecycle: publishableLifecycle.published,
        privacyValidated: true,
        publicationGatesPassed: true,
      },
    );

    expect(rollbackEvent).toMatchObject({
      type: publicationEventType.rollback,
      previousVersionId: "version-current",
      restoredVersionId: "version-old",
    });

    expect(
      createProjectionRebuildPlan({
        commandId: rollbackEvent.commandId,
        entityId: rollbackEvent.entityId,
        reason: projectionRebuildReason.rollback,
        policyVersion: "policy-2026-05-25",
        baseCheckpoint: { scope: "site-1", version: 4 },
      }),
    ).toMatchObject({
      reason: projectionRebuildReason.rollback,
      nextCheckpoint: { scope: "site-1", version: 5 },
    });
  });
});
