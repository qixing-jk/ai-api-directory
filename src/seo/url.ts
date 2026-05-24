const DEFAULT_SITE_URL = "http://localhost:3000";

export function getSiteUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL ?? process.env.SITE_URL;
  if (!configured) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("Missing NEXT_PUBLIC_SITE_URL or SITE_URL in production");
    }

    return DEFAULT_SITE_URL;
  }

  return configured.replace(/\/+$/, "");
}

export function normalizePathname(pathname: string): string {
  const withoutQuery = pathname.split("?")[0]?.split("#")[0] ?? "/";
  const withLeadingSlash = withoutQuery.startsWith("/")
    ? withoutQuery
    : `/${withoutQuery}`;
  const collapsed = withLeadingSlash.replace(/\/+/g, "/");

  if (collapsed === "/") return "/";
  return collapsed.replace(/\/+$/, "");
}

export function buildCanonicalPath(pathname: string): string {
  return normalizePathname(pathname);
}

export function buildAbsoluteUrl(pathname: string): string {
  return `${getSiteUrl()}${normalizePathname(pathname)}`;
}

export function buildCanonicalUrl(pathname: string): string {
  return buildAbsoluteUrl(buildCanonicalPath(pathname));
}
