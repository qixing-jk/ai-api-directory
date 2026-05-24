import type { MetadataRoute } from "next";
import {
  buildSitemapEntries,
  getPublicDiscoverySitemapRecords,
} from "~/seo/sitemap";

export default function sitemap(): MetadataRoute.Sitemap {
  return buildSitemapEntries(getPublicDiscoverySitemapRecords());
}
