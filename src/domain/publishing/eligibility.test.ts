import { describe, expect, it } from "vitest";
import { DEFAULT_APP_LOCALE } from "~/i18n/locales";
import {
  candidateDisposition,
  publishableLifecycle,
} from "../vocabularies";
import {
  canPublishTextBearingV1Page,
  eligibilityFailureReason,
  getActivePublishedVersion,
  isCandidatePublishable,
  isEligibleForDefaultPublicProjection,
  isRenderableForLocale,
  type PublishableVersion,
  type StableEntity,
} from "./eligibility";

describe("publishing eligibility policy", () => {
  it("resolves the active published version from stable entity state", () => {
    const versions: PublishableVersion[] = [
      {
        id: "version-draft",
        lifecycle: publishableLifecycle.draft,
        entityId: "site-1",
      },
      {
        id: "version-published",
        lifecycle: publishableLifecycle.published,
        entityId: "site-1",
      },
    ];
    const entity: StableEntity = {
      id: "site-1",
      activePublishedVersionId: "version-published",
    };

    expect(getActivePublishedVersion(entity, versions)).toEqual({
      id: "version-published",
      lifecycle: publishableLifecycle.published,
      entityId: "site-1",
    });
  });

  it("does not treat candidate disposition as publishable lifecycle", () => {
    expect(
      isCandidatePublishable({
        disposition: candidateDisposition.readyForReview,
      }),
    ).toBe(false);
    expect(
      isCandidatePublishable({ disposition: candidateDisposition.merged }),
    ).toBe(false);
  });

  it("ignores active published version IDs that do not point at published versions", () => {
    const versions: PublishableVersion[] = [
      {
        id: "version-approved",
        lifecycle: publishableLifecycle.approved,
        entityId: "site-1",
      },
    ];
    const entity: StableEntity = {
      id: "site-1",
      activePublishedVersionId: "version-approved",
    };

    expect(getActivePublishedVersion(entity, versions)).toBeUndefined();
  });

  it("ignores active published version IDs that belong to another entity", () => {
    const versions: PublishableVersion[] = [
      {
        id: "version-published",
        lifecycle: publishableLifecycle.published,
        entityId: "site-2",
      },
    ];
    const entity: StableEntity = {
      id: "site-1",
      activePublishedVersionId: "version-published",
    };

    expect(getActivePublishedVersion(entity, versions)).toBeUndefined();
  });

  it("allows renderable projections only for published entity and locale versions", () => {
    const englishLocale = "en";

    expect(
      isRenderableForLocale({
        entityVersion: {
          id: "version-1",
          entityId: "site-1",
          lifecycle: publishableLifecycle.published,
        },
        localeVersions: [
          {
            locale: DEFAULT_APP_LOCALE,
            lifecycle: publishableLifecycle.published,
          },
        ],
        locale: DEFAULT_APP_LOCALE,
        textBearing: true,
      }),
    ).toBe(true);

    expect(
      isRenderableForLocale({
        entityVersion: {
          id: "version-1",
          entityId: "site-1",
          lifecycle: publishableLifecycle.published,
        },
        localeVersions: [
          { locale: englishLocale, lifecycle: publishableLifecycle.draft },
        ],
        locale: englishLocale,
        textBearing: true,
      }),
    ).toBe(false);
  });

  it("requires a published locale version even for non-text-bearing renderability", () => {
    expect(
      isRenderableForLocale({
        entityVersion: {
          id: "version-1",
          entityId: "site-1",
          lifecycle: publishableLifecycle.published,
        },
        localeVersions: [],
        locale: DEFAULT_APP_LOCALE,
        textBearing: false,
      }),
    ).toBe(false);

    expect(
      isRenderableForLocale({
        entityVersion: {
          id: "version-1",
          entityId: "site-1",
          lifecycle: publishableLifecycle.approved,
        },
        localeVersions: [],
        locale: DEFAULT_APP_LOCALE,
        textBearing: false,
      }),
    ).toBe(false);

    expect(
      isRenderableForLocale({
        entityVersion: {
          id: "version-1",
          entityId: "site-1",
          lifecycle: publishableLifecycle.published,
        },
        localeVersions: [
          {
            locale: DEFAULT_APP_LOCALE,
            lifecycle: publishableLifecycle.published,
          },
        ],
        locale: DEFAULT_APP_LOCALE,
        textBearing: false,
      }),
    ).toBe(true);
  });

  it("requires at least one published active-discovery locale for V1 text-bearing publication", () => {
    const englishLocale = "en";

    expect(
      canPublishTextBearingV1Page({
        entityVersion: {
          id: "version-1",
          entityId: "site-1",
          lifecycle: publishableLifecycle.approved,
        },
        localeVersions: [
          {
            locale: englishLocale,
            lifecycle: publishableLifecycle.published,
          },
        ],
      }),
    ).toEqual({
      ok: false,
      reason: eligibilityFailureReason.missingPublicDiscoveryLocale,
    });

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
  });

  it("does not allow approved-only entity versions into public projections", () => {
    expect(
      isRenderableForLocale({
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
        locale: DEFAULT_APP_LOCALE,
        textBearing: true,
      }),
    ).toBe(false);
  });

  it("excludes rejected withdrawn archived and disputed content from default projection eligibility", () => {
    for (const lifecycle of [
      publishableLifecycle.rejected,
      publishableLifecycle.withdrawn,
      publishableLifecycle.archived,
      publishableLifecycle.disputed,
    ] as const) {
      expect(
        isEligibleForDefaultPublicProjection({
          id: `version-${lifecycle}`,
          entityId: "site-1",
          lifecycle,
        }),
      ).toBe(false);
    }

    expect(
      isEligibleForDefaultPublicProjection({
        id: "version-published",
        entityId: "site-1",
        lifecycle: publishableLifecycle.published,
      }),
    ).toBe(true);
  });
});
