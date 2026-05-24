import type { Metadata } from "next";
import { getLocaleByCode, type LocaleCode } from "~/i18n/locales";
import { buildAbsoluteUrl, buildCanonicalPath, getSiteUrl } from "./url";

export type PublishedLocalePath = {
  localeCode: LocaleCode;
  path: string;
  published: boolean;
};

export type RobotsPolicy = {
  index: boolean;
  follow: boolean;
};

export type PageMetadataInput = {
  localeCode: LocaleCode;
  canonicalPath: string;
  title: string;
  description: string;
  robots: RobotsPolicy;
  localePaths: PublishedLocalePath[];
  openGraphImage?: string;
  includeXDefault?: boolean;
};

export function buildPublishedLanguageAlternates({
  canonicalPath,
  localePaths,
  includeXDefault = false,
}: {
  canonicalPath: string;
  localePaths: PublishedLocalePath[];
  includeXDefault?: boolean;
}): NonNullable<Metadata["alternates"]> {
  const languages = localePaths.reduce<Record<string, string>>(
    (acc, localePath) => {
      if (!localePath.published) return acc;

      const locale = getLocaleByCode(localePath.localeCode);
      if (!locale) return acc;

      acc[locale.hreflang] = buildCanonicalPath(localePath.path);
      return acc;
    },
    {},
  );

  if (includeXDefault) {
    languages["x-default"] = "/";
  }

  return {
    canonical: buildCanonicalPath(canonicalPath),
    languages,
  };
}

export function buildPageMetadata(input: PageMetadataInput): Metadata {
  const locale = getLocaleByCode(input.localeCode);
  if (!locale) {
    throw new Error(`Unsupported metadata locale: ${input.localeCode}`);
  }

  const canonicalPath = buildCanonicalPath(input.canonicalPath);

  return {
    metadataBase: new URL(getSiteUrl()),
    title: input.title,
    description: input.description,
    alternates: buildPublishedLanguageAlternates({
      canonicalPath,
      localePaths: input.localePaths,
      includeXDefault: input.includeXDefault,
    }),
    openGraph: {
      title: input.title,
      description: input.description,
      url: buildAbsoluteUrl(canonicalPath),
      locale: locale.ogLocale,
      images: input.openGraphImage ? [input.openGraphImage] : undefined,
    },
    robots: input.robots,
  };
}
