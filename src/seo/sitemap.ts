import type { MetadataRoute } from "next";
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
