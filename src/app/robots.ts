import type { MetadataRoute } from "next";
import { getRobotsAllowedPaths } from "~/seo/sitemap";
import { getSiteUrl } from "~/seo/url";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: getRobotsAllowedPaths(),
        disallow: ["/admin", "/api"],
      },
    ],
    sitemap: `${getSiteUrl()}/sitemap.xml`,
    host: getSiteUrl(),
  };
}
