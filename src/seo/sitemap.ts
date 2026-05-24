import type { MetadataRoute } from "next";
import { getPublicDiscoveryLocales } from "~/i18n/locales";
import { buildAbsoluteUrl } from "./url";

export type SitemapSourceRecord = {
  path: string;
  published: boolean;
  indexable: boolean;
  lastModified?: Date;
};

export function buildSitemapEntries(
  records: SitemapSourceRecord[],
): MetadataRoute.Sitemap {
  return records
    .filter((record) => record.published && record.indexable)
    .map((record) => {
      const entry: MetadataRoute.Sitemap[number] = {
        url: buildAbsoluteUrl(record.path),
      };

      if (record.lastModified) {
        entry.lastModified = record.lastModified;
      }

      return entry;
    });
}

export function getPublicDiscoverySitemapRecords(): SitemapSourceRecord[] {
  return [
    { path: "/", published: true, indexable: true },
    ...getPublicDiscoveryLocales().map((locale) => ({
      path: `/${locale.urlCode}`,
      published: true,
      indexable: true,
    })),
  ];
}

export function getRobotsAllowedPaths(): string[] {
  return getPublicDiscoverySitemapRecords().map((record) => record.path);
}
