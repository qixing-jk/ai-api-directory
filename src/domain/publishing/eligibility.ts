import { getPublicDiscoveryLocales, type AppLocale } from "~/i18n/locales";
import { publishableLifecycle, type ValueOf } from "../vocabularies";
import type {
  CandidateRecord,
  LocalePublication,
  PublishableVersion,
  StableEntity,
} from "./types";

export type {
  CandidateRecord,
  LocalePublication,
  PublishableVersion,
  StableEntity,
} from "./types";

export const eligibilityFailureReason = {
  entityVersionMustBeApproved:
    "Entity version must be approved before publication",
  missingPublicDiscoveryLocale:
    "V1 text-bearing pages require a published active-discovery locale",
} as const;

export type EligibilityFailureReason = ValueOf<
  typeof eligibilityFailureReason
>;

export type EligibilityResult =
  | { ok: true }
  | { ok: false; reason: EligibilityFailureReason };

export type LocaleRenderabilityInput = {
  readonly entityVersion: PublishableVersion;
  readonly localeVersions: readonly LocalePublication[];
  readonly locale: AppLocale;
  readonly textBearing: boolean;
};

export type TextBearingV1PublicationInput = {
  readonly entityVersion: PublishableVersion;
  readonly localeVersions: readonly LocalePublication[];
};

export function getActivePublishedVersion(
  entity: StableEntity,
  versions: readonly PublishableVersion[],
): PublishableVersion | undefined {
  if (!entity.activePublishedVersionId) return undefined;

  return versions.find(
    (version) =>
      version.id === entity.activePublishedVersionId &&
      version.entityId === entity.id &&
      version.lifecycle === publishableLifecycle.published,
  );
}

export function isCandidatePublishable(_candidate: CandidateRecord): false {
  void _candidate;

  return false;
}

export function isEligibleForDefaultPublicProjection(
  version: PublishableVersion,
): boolean {
  return version.lifecycle === publishableLifecycle.published;
}

export function isRenderableForLocale(
  input: LocaleRenderabilityInput,
): boolean {
  if (!isEligibleForDefaultPublicProjection(input.entityVersion)) {
    return false;
  }

  return input.localeVersions.some(
    (localeVersion) =>
      localeVersion.locale === input.locale &&
      localeVersion.lifecycle === publishableLifecycle.published,
  );
}

export function canPublishTextBearingV1Page(
  input: TextBearingV1PublicationInput,
): EligibilityResult {
  if (input.entityVersion.lifecycle !== publishableLifecycle.approved) {
    return {
      ok: false,
      reason: eligibilityFailureReason.entityVersionMustBeApproved,
    };
  }

  const publicDiscoveryAppLocales = new Set(
    getPublicDiscoveryLocales().map((locale) => locale.locale),
  );

  const hasPublishedDiscoveryLocale = input.localeVersions.some(
    (localeVersion) =>
      localeVersion.lifecycle === publishableLifecycle.published &&
      publicDiscoveryAppLocales.has(localeVersion.locale),
  );

  if (!hasPublishedDiscoveryLocale) {
    return {
      ok: false,
      reason: eligibilityFailureReason.missingPublicDiscoveryLocale,
    };
  }

  return { ok: true };
}
