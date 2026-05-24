import type { MetadataRoute } from "next";
import { buildSitemapEntries } from "~/seo/sitemap";

export default function sitemap(): MetadataRoute.Sitemap {
  return buildSitemapEntries([
    { path: "/", published: true, indexable: true },
    { path: "/zh-cn", published: true, indexable: true },
    { path: "/en", published: false, indexable: true },
    { path: "/admin", published: true, indexable: false },
  ]);
}
