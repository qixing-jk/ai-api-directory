import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  buildAbsoluteUrl,
  buildCanonicalPath,
  buildCanonicalUrl,
  getSiteUrl,
  normalizePathname,
} from "./url";

describe("URL helpers", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", undefined);
    vi.stubEnv("SITE_URL", undefined);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("uses localhost as the development site URL fallback", () => {
    expect(getSiteUrl()).toBe("http://localhost:3000");
  });

  it("fails fast without a configured production site URL", () => {
    vi.stubEnv("NODE_ENV", "production");

    expect(() => getSiteUrl()).toThrow(
      "Missing NEXT_PUBLIC_SITE_URL or SITE_URL in production",
    );
  });

  it("trims trailing slashes from SITE_URL", () => {
    vi.stubEnv("SITE_URL", "https://example.com/");

    expect(getSiteUrl()).toBe("https://example.com");
  });

  it("prefers NEXT_PUBLIC_SITE_URL over SITE_URL", () => {
    vi.stubEnv("SITE_URL", "https://private.example.com");
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://public.example.com/");

    expect(getSiteUrl()).toBe("https://public.example.com");
  });

  it("normalizes pathnames without trailing slashes except root", () => {
    expect(normalizePathname("/")).toBe("/");
    expect(normalizePathname("zh-cn/directory/")).toBe("/zh-cn/directory");
    expect(normalizePathname("/zh-cn//directory///models")).toBe(
      "/zh-cn/directory/models",
    );
  });

  it("removes query strings and hashes from canonical paths", () => {
    expect(buildCanonicalPath("/zh-cn/directory?sort=price#table")).toBe(
      "/zh-cn/directory",
    );
  });

  it("builds absolute URLs through one site URL source", () => {
    expect(buildAbsoluteUrl("/zh-cn/directory")).toBe(
      "http://localhost:3000/zh-cn/directory",
    );
  });

  it("builds canonical URLs with normalized paths", () => {
    expect(buildCanonicalUrl("/zh-cn/directory/?sort=price")).toBe(
      "http://localhost:3000/zh-cn/directory",
    );
  });
});
